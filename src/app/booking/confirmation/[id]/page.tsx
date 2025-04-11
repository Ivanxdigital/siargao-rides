"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { RatingStars } from "@/components/RatingStars";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";

// Icons
import {
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  Share2,
  Printer,
  User,
  Phone,
  Mail,
  Info,
  Check,
  XCircle,
  Star,
  Bike,
  Car,
  Truck
} from "lucide-react";
import { Vehicle, VehicleType } from "@/lib/types";

export default function BookingConfirmationPage() {
  // Get booking ID from URL using multiple methods
  const params = useParams();
  const router = useRouter();

  // Log what we're getting to debug
  console.log("Full URL:", typeof window !== 'undefined' ? window.location.href : 'Not in browser');
  console.log("Params object:", params);

  // Method 1: From params object
  let bookingId = params?.id;

  // Method 2: Try from URL path if params failed
  if (!bookingId && typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/');
    const idFromPath = pathParts[pathParts.length - 1];
    if (idFromPath && idFromPath !== '[id]') {
      bookingId = idFromPath;
      console.log("Got ID from URL path:", bookingId);
    }
  }

  // Final check
  if (bookingId) {
    // If it's an array, take the first item
    bookingId = Array.isArray(bookingId) ? bookingId[0] : bookingId;
    console.log("Final resolved bookingId:", bookingId);
  } else {
    console.error("Failed to get booking ID from URL");
  }

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const supabase = createClientComponentClient();

  // Check if this is a temporary cash payment from URL query parameter
  const [isTemporaryCashPayment, setIsTemporaryCashPayment] = useState(false);

  useEffect(() => {
    // Check URL for temporary cash payment parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentMethod = urlParams.get('payment_method');
      setIsTemporaryCashPayment(paymentMethod === 'temp_cash');
    }
  }, []);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError("Booking ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // First get basic booking data
        const { data: bookingData, error: bookingError } = await supabase
          .from("rentals")
          .select(`
            id,
            start_date,
            end_date,
            total_price,
            status,
            created_at,
            vehicle_id,
            vehicle_type_id,
            shop_id,
            user_id,
            payment_method_id,
            delivery_option_id,
            payment_status,
            confirmation_code,
            delivery_address,
            deposit_required,
            deposit_amount,
            deposit_paid
          `)
          .eq("id", bookingId)
          .single();

        if (bookingError) {
          console.error("Error fetching booking:", bookingError);
          setError("Booking not found. Please check the booking ID.");
          setLoading(false);
          return;
        }

        // Now fetch booking history
        const { data: historyData, error: historyError } = await supabase
          .from("booking_history")
          .select("*")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: true });

        if (historyError) {
          console.error("Error fetching booking history:", historyError);
        } else {
          setBookingHistory(historyData || []);

          // If no history exists yet, create a default history entry for booking creation
          if (!historyData || historyData.length === 0) {
            // Create default history based on booking creation
            const defaultHistory = [
              {
                id: 'creation',
                booking_id: bookingData.id,
                status: bookingData.status,
                created_at: bookingData.created_at,
                notes: 'Booking created',
                event_type: 'creation'
              }
            ];

            if (bookingData.status !== 'pending') {
              defaultHistory.push({
                id: 'status-change',
                booking_id: bookingData.id,
                status: bookingData.status,
                created_at: bookingData.updated_at || bookingData.created_at,
                notes: `Status changed to ${bookingData.status}`,
                event_type: 'status_change'
              });
            }

            setBookingHistory(defaultHistory);
          }
        }

        // Get vehicle with all possible fields
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", bookingData.vehicle_id)
          .single();

        if (vehicleError) {
          console.error("Error fetching vehicle:", vehicleError);
        }

        // Try multiple possible sources for the vehicle image
        let vehicleImageUrl: string | null = null;

        // Check if we have vehicle images
        const { data: vehicleImages, error: vehicleImagesError } = await supabase
          .from("vehicle_images")
          .select("*")
          .eq("vehicle_id", bookingData.vehicle_id)
          .eq("is_primary", true)
          .limit(1);

        if (!vehicleImagesError && vehicleImages && vehicleImages.length > 0) {
          vehicleImageUrl = vehicleImages[0].image_url;
        }
        // Fallback to other possible image sources
        else if (vehicleData?.image_url) {
          vehicleImageUrl = vehicleData.image_url;
        }
        // Check for images array (structured as objects with image_url)
        else if (vehicleData?.images && Array.isArray(vehicleData.images) && vehicleData.images.length > 0) {
          if (typeof vehicleData.images[0] === 'string') {
            vehicleImageUrl = vehicleData.images[0];
          } else if (vehicleData.images[0]?.image_url) {
            vehicleImageUrl = vehicleData.images[0].image_url;
          }
        }
        // Check for main_image_url field
        else if (vehicleData?.main_image_url) {
          vehicleImageUrl = vehicleData.main_image_url;
        }
        // Check for thumbnail field
        else if (vehicleData?.thumbnail) {
          vehicleImageUrl = vehicleData.thumbnail;
        }

        console.log("Vehicle image URL for confirmation:", vehicleImageUrl);

        // Add imageUrl to vehicle data
        const enhancedVehicleData = {
          ...vehicleData,
          imageUrl: vehicleImageUrl
        };

        // Now fetch remaining related data separately
        const [vehicleTypeResponse, shopResponse, userResponse, paymentMethodResponse, deliveryOptionResponse] = await Promise.all([
          // Get vehicle type
          supabase
            .from("vehicle_types")
            .select("*")
            .eq("id", bookingData.vehicle_type_id)
            .single(),

          // Get shop data
          supabase
            .from("rental_shops")
            .select("*")
            .eq("id", bookingData.shop_id)
            .single(),

          // Get user data if available
          bookingData.user_id ?
            supabase
              .from("users")
              .select("*")
              .eq("id", bookingData.user_id)
              .single() :
            Promise.resolve({ data: null }),

          // Get payment method
          bookingData.payment_method_id ?
            supabase
              .from("payment_methods")
              .select("*")
              .eq("id", bookingData.payment_method_id)
              .single() :
            Promise.resolve({ data: null }),

          // Get delivery option
          bookingData.delivery_option_id ?
            supabase
              .from("delivery_options")
              .select("*")
              .eq("id", bookingData.delivery_option_id)
              .single() :
            Promise.resolve({ data: null })
        ]);

        // Combine all data
        const fullBookingData = {
          ...bookingData,
          vehicle: enhancedVehicleData,
          vehicleType: vehicleTypeResponse.data,
          shop: shopResponse.data,
          user: userResponse.data,
          paymentMethod: paymentMethodResponse.data,
          deliveryOption: deliveryOptionResponse.data
        };

        console.log("Full booking data:", fullBookingData);
        setBooking(fullBookingData);

        // Also fetch any existing review
        const { data: reviewData, error: reviewError } = await supabase
          .from("vehicle_reviews")
          .select("*")
          .eq("booking_id", bookingId)
          .maybeSingle();

        if (!reviewError && reviewData) {
          setExistingReview(reviewData);
          setReviewText(reviewData.comment || "");
          setReviewRating(reviewData.rating || 0);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError("An unexpected error occurred. Please try again later.");
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, supabase]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'text-green-500 bg-green-500/20';
      case 'completed':
        return 'text-blue-500 bg-blue-500/20';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'cancelled':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="text-green-500" />;
      case 'completed':
        return <Check className="text-blue-500" />;
      case 'pending':
        return <Clock className="text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="text-red-500" />;
      default:
        return <Info className="text-gray-500" />;
    }
  };

  const getVehicleTypeIcon = (type?: string) => {
    // Return default icon if type is undefined or null
    if (!type) {
      return <Bike className="text-primary" />;
    }

    switch (type.toLowerCase()) {
      case 'car':
        return <Car className="text-primary" />;
      case 'motorcycle':
        return <Bike className="text-primary" />;
      case 'tuktuk':
        return <Truck className="text-primary" />;
      default:
        return <Bike className="text-primary" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Booking Confirmation',
          text: `Booking confirmation for your rental on ${format(new Date(booking.start_date), "MMM d, yyyy")}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback if Web Share API is not available
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Helper function to get booking history details
  const getHistoryDetails = (action: string) => {
    let icon;
    let title;
    let colorClass;

    switch (action) {
      case 'creation':
        icon = <Info size={16} />;
        title = 'Booking Created';
        colorClass = 'text-blue-400';
        break;
      case 'status_change':
        icon = <CheckCircle size={16} />;
        title = 'Status Changed';
        colorClass = 'text-green-400';
        break;
      case 'date_change':
        icon = <Calendar size={16} />;
        title = 'Dates Changed';
        colorClass = 'text-purple-400';
        break;
      case 'comment':
        icon = <Mail size={16} />;
        title = 'Comment Added';
        colorClass = 'text-gray-400';
        break;
      case 'review':
        icon = <Star size={16} />;
        title = 'Review Submitted';
        colorClass = 'text-yellow-400';
        break;
      default:
        icon = <Info size={16} />;
        title = 'Booking Updated';
        colorClass = 'text-gray-400';
    }

    return { icon, title, colorClass };
  };

  // Function to get status class for labels
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'text-green-500 bg-green-500/20';
      case 'completed':
        return 'text-blue-500 bg-blue-500/20';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'cancelled':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setReviewSubmitting(true);

      const reviewData = {
        booking_id: booking.id,
        vehicle_id: booking.vehicle_id,
        shop_id: booking.shop_id,
        user_id: booking.user_id,
        rating: reviewRating,
        comment: reviewText.trim(),
        created_at: new Date().toISOString()
      };

      let result;

      if (existingReview) {
        // Update existing review
        const { data, error } = await supabase
          .from("vehicle_reviews")
          .update({
            rating: reviewRating,
            comment: reviewText.trim(),
            updated_at: new Date().toISOString()
          })
          .eq("id", existingReview.id)
          .select();

        if (error) throw error;
        result = data;

        toast.success("Your review has been updated");
      } else {
        // Create new review
        const { data, error } = await supabase
          .from("vehicle_reviews")
          .insert(reviewData)
          .select();

        if (error) throw error;
        result = data;

        // Add to booking history
        await supabase
          .from("booking_history")
          .insert({
            booking_id: booking.id,
            event_type: "review",
            notes: `Review submitted with ${reviewRating} star rating`,
            created_by: booking.user_id,
            metadata: {
              rating: reviewRating,
              review_id: result[0].id
            }
          });

        toast.success("Your review has been submitted");
      }

      setExistingReview(result[0]);
      setShowReviewForm(false);

    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const canReview = () => {
    if (!booking) return false;
    return booking.status === 'completed' && booking.user_id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 animate-spin border-2 border-primary border-t-transparent mb-4"></div>
              <p>Loading booking details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 shadow-xl">
            <div className="flex flex-col items-center justify-center gap-4 text-center py-12">
              <AlertCircle size={64} className="text-red-500" />
              <h1 className="text-2xl font-bold">{error || "Booking not found"}</h1>
              <p className="text-gray-400 mb-4">We couldn't find the booking you're looking for.</p>

              {/* Add debugging info for users */}
              <div className="text-left text-xs text-gray-400 mb-4 p-2 bg-gray-800/50 rounded-md">
                <p>Debug info:</p>
                <p>URL ID: {bookingId || 'Not found'}</p>
                <p>Params: {JSON.stringify(params)}</p>
                <p>Path: {typeof window !== 'undefined' ? window.location.pathname : 'Not available'}</p>
              </div>

              <Button asChild>
                <Link href="/my-bookings">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to My Bookings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add more fallbacks for potentially undefined properties
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const rentalPrice = (booking.vehicle?.price_per_day || 0) * days;
  const deliveryFee = booking.deliveryOption?.fee || 0;

  // Get customer info - use user data if available
  const customerName = booking.user
    ? `${booking.user.first_name || ''} ${booking.user.last_name || ''}`.trim()
    : "Guest";

  const customerEmail = booking.user?.email || "N/A";
  const customerPhone = booking.user?.phone || "N/A";

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white py-12 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="print:hidden">
          <Link
            href="/my-bookings"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to My Bookings
          </Link>
        </div>

        <motion.div
          className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 shadow-xl print:bg-white print:border-gray-200 print:shadow-none"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Confirmation header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-white/10 print:border-gray-200 pb-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="mr-4">
                {booking?.status === 'confirmed' && (
                  <div className="bg-green-500/20 p-3 rounded-full">
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                )}
                {booking?.status === 'pending' && (
                  <div className="bg-yellow-500/20 p-3 rounded-full">
                    <Clock className="text-yellow-500" size={24} />
                  </div>
                )}
                {booking?.status === 'cancelled' && (
                  <div className="bg-red-500/20 p-3 rounded-full">
                    <XCircle className="text-red-500" size={24} />
                  </div>
                )}
                {booking?.status === 'completed' && (
                  <div className="bg-blue-500/20 p-3 rounded-full">
                    <Check className="text-blue-500" size={24} />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Booking {booking?.status}</h1>
                <p className="text-white/60 print:text-gray-600 text-sm">
                  {booking?.created_at && format(new Date(booking.created_at), 'PPP')}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="text-sm text-white/60 print:text-gray-600 mb-1">Booking ID</div>
              <div className="font-mono bg-white/5 print:bg-gray-100 px-3 py-1 rounded text-sm">{booking?.id}</div>
            </div>
          </div>

          {/* Booking Status Timeline */}
          <motion.div
            className="mb-12 print:mb-8"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold mb-6">Booking Timeline</h2>
            <div className="space-y-4">
              {bookingHistory.map((history, index) => {
                const { icon, title, colorClass } = getHistoryDetails(history.event_type);
                const isLast = index === bookingHistory.length - 1;

                return (
                  <div key={history.id} className="flex items-start">
                    <div className="relative mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                        {icon}
                      </div>
                      {!isLast && (
                        <div className="absolute top-10 bottom-0 left-1/2 w-0.5 -ml-px h-full bg-white/10 print:bg-gray-200"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <h3 className="font-medium">{title}</h3>
                        <span className="text-sm text-white/60 print:text-gray-600">
                          {history.created_at && format(new Date(history.created_at), 'PPp')}
                        </span>
                      </div>
                      {history.notes && (
                        <p className="text-white/70 print:text-gray-700 text-sm mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Temporary Cash Payment Notice */}
          {isTemporaryCashPayment && (
            <motion.div
              className="mb-8 bg-green-900/30 border border-green-500/30 rounded-lg p-4 flex items-start"
              variants={itemVariants}
            >
              <CheckCircle className="text-green-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-green-400 mb-1">Cash Payment at {booking?.deliveryOption?.name === 'Self Pickup' ? 'Pickup' : 'Delivery'}</h3>
                <p className="text-white/80">
                  Your booking has been confirmed! Please pay the full amount of ₱{booking?.total_price?.toFixed(2)} in cash when you {booking?.deliveryOption?.name === 'Self Pickup' ? 'pick up your vehicle' : 'receive your vehicle delivery'}.
                </p>
                <p className="mt-2 text-white/70 text-sm">
                  No deposit is required for this booking. The shop owner has been notified of your reservation.
                </p>
              </div>
            </motion.div>
          )}

          {/* Vehicle Details */}
          <motion.div
            className="mb-12 print:mb-8"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold mb-4">Vehicle Details</h2>
            <div className="bg-white/5 print:bg-gray-100 rounded-lg p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-full md:w-36 h-36 bg-gray-800 print:bg-gray-200 rounded-lg overflow-hidden">
                  {booking?.vehicle?.imageUrl ? (
                    <img
                      src={booking.vehicle.imageUrl}
                      alt={booking.vehicle.name}
                      className="w-full h-full object-cover"
                    />
                  ) : booking?.vehicle?.image_url ? (
                    <img
                      src={booking.vehicle.image_url}
                      alt={booking.vehicle.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 print:bg-gray-200">
                      {getVehicleTypeIcon(booking?.vehicle?.type)}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">
                      {booking?.vehicle?.name || "Vehicle"}
                    </h3>
                    <div className={`text-xs px-2 py-1 rounded-full ${getStatusClass(booking?.status || '')}`}>
                      {booking?.status?.toUpperCase()}
                    </div>
                  </div>

                  {booking?.vehicle?.type && (
                    <p className="text-white/60 print:text-gray-600 text-sm mb-4">
                      {booking.vehicle.type.charAt(0).toUpperCase() + booking.vehicle.type.slice(1)}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center">
                      <Calendar className="mr-2 text-primary" size={16} />
                      <div>
                        <div className="text-xs text-white/60 print:text-gray-600">Rental Period</div>
                        <div className="text-sm">
                          {booking?.start_date && booking?.end_date
                            ? `${format(new Date(booking.start_date), 'PPP')} - ${format(new Date(booking.end_date), 'PPP')}`
                            : "Dates not specified"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="mr-2 text-primary" size={16} />
                      <div>
                        <div className="text-xs text-white/60 print:text-gray-600">Duration</div>
                        <div className="text-sm">
                          {booking?.duration
                            ? `${booking.duration} ${booking.duration === 1 ? 'day' : 'days'}`
                            : "Duration not specified"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rental Shop Details */}
          <motion.div
            className="mb-12 print:mb-8"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold mb-4">Rental Shop</h2>
            <div className="bg-white/5 print:bg-gray-100 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <MapPin className="text-primary" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-1">{booking?.shop?.name || "Shop name unavailable"}</h3>
                  <p className="text-white/60 print:text-gray-700 mb-3">{booking?.shop?.address || "Address unavailable"}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {booking?.shop?.phone && (
                      <div className="flex items-center">
                        <Phone className="mr-2 text-primary" size={16} />
                        <div>
                          <div className="text-xs text-white/60 print:text-gray-600">Phone</div>
                          <div className="text-sm">{booking.shop.phone}</div>
                        </div>
                      </div>
                    )}

                    {booking?.shop?.email && (
                      <div className="flex items-center">
                        <Mail className="mr-2 text-primary" size={16} />
                        <div>
                          <div className="text-xs text-white/60 print:text-gray-600">Email</div>
                          <div className="text-sm">{booking.shop.email}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Details */}
          <motion.div
            className="mb-12 print:mb-8"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
            <div className="bg-white/5 print:bg-gray-100 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <CreditCard className="text-primary" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-1">Payment Information</h3>
                  <p className="text-white/60 print:text-gray-700">
                    {booking?.payment_method || "Cash payment on arrival"}
                  </p>

                  {/* Show deposit status if required */}
                  {booking.deposit_required && (
                    <div className="mt-2">
                      {booking.deposit_paid ? (
                        <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">
                          <CheckCircle size={12} className="mr-1" />
                          Deposit Paid (₱{booking.deposit_amount?.toFixed(2)})
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-500">
                          <AlertCircle size={12} className="mr-1" />
                          Deposit Required (₱{booking.deposit_amount?.toFixed(2)})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 print:border-gray-200 pt-4 mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-white/80 print:text-gray-600">Base rental rate</span>
                  <span>₱{booking?.base_price || 0}</span>
                </div>
                {booking?.extras > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-white/80 print:text-gray-600">Additional services</span>
                    <span>₱{booking.extras}</span>
                  </div>
                )}
                {booking?.discount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-white/80 print:text-gray-600">Discount</span>
                    <span className="text-green-500">-₱{booking.discount}</span>
                  </div>
                )}
                {booking.deposit_required && (
                  <div className="flex justify-between mb-2">
                    <span className="text-white/80 print:text-gray-600">Deposit {booking.deposit_paid ? '(Paid)' : '(Required)'}</span>
                    <span>₱{booking.deposit_amount?.toFixed(2) || 0}</span>
                  </div>
                )}
                <div className="border-t border-white/10 print:border-gray-200 pt-4 mt-4 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₱{booking?.total_price || 0}</span>
                </div>
                {booking.deposit_required && !booking.deposit_paid && (
                  <p className="text-sm text-white/60 print:text-gray-600 mt-2">
                    *Deposit payment is required to confirm your booking
                  </p>
                )}
                {booking.deposit_required && booking.deposit_paid && (
                  <p className="text-sm text-white/60 print:text-gray-600 mt-2">
                    *Deposit will be kept by the shop owner if you don't show up for your booking
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Customer Details */}
          <motion.div
            className="mb-8"
            variants={itemVariants}
          >
            <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
            <div className="bg-white/5 print:bg-gray-100 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="text-primary" size={20} />
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                      <div className="text-sm text-white/60 print:text-gray-600">Name</div>
                      <div>{booking?.user?.full_name || "Name not provided"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/60 print:text-gray-600">Email</div>
                      <div>{booking?.user?.email || "Email not provided"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/60 print:text-gray-600">Phone</div>
                      <div>{booking?.contact_phone || "Phone not provided"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/60 print:text-gray-600">License</div>
                      <div>{booking?.license_number || "License not provided"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Additional Notes */}
          {booking?.notes && (
            <motion.div
              className="mb-12 print:mb-8"
              variants={itemVariants}
            >
              <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
              <div className="bg-white/5 print:bg-gray-100 rounded-lg p-6">
                <p className="text-white/80 print:text-gray-800 whitespace-pre-line">{booking.notes}</p>
              </div>
            </motion.div>
          )}

          {/* Review Section */}
          {canReview() && (
            <motion.div
              className="mb-12 print:hidden"
              variants={itemVariants}
            >
              <div className="border-t border-white/10 pt-8 mt-8">
                <h2 className="text-lg font-semibold mb-4">Leave a Review</h2>
                <div className="bg-white/5 rounded-lg p-6">
                  <p className="mb-4">How was your experience with this vehicle?</p>

                  <div className="mb-6">
                    <RatingStars
                      value={reviewRating}
                      onChange={setReviewRating}
                      size="lg"
                    />
                  </div>

                  <div className="mb-6">
                    <Textarea
                      placeholder="Share your experience..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="bg-white/10 border-white/20"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            className="flex flex-wrap gap-3 pt-4 border-t border-white/10 print:border-gray-200 print:hidden"
            variants={itemVariants}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handlePrint}
            >
              <Printer size={16} />
              Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleShare}
            >
              <Share2 size={16} />
              Share
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}