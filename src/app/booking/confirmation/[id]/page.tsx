"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

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
  Download,
  Printer,
  User,
  Phone,
  Mail,
  Info,
  Check,
  XCircle
} from "lucide-react";

export default function BookingConfirmationPage() {
  // Use the useParams hook to get the id parameter
  const params = useParams();
  const bookingId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

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
            bike_id,
            shop_id,
            user_id,
            payment_method_id,
            delivery_option_id,
            payment_status,
            confirmation_code,
            delivery_address
          `)
          .eq("id", bookingId)
          .single();

        if (bookingError) {
          console.error("Error fetching booking:", bookingError);
          setError("Booking not found. Please check the booking ID.");
          setLoading(false);
          return;
        }

        // Now fetch all related data separately
        const [bikeResponse, shopResponse, userResponse, paymentMethodResponse, deliveryOptionResponse] = await Promise.all([
          // Get bike data
          supabase
            .from("bikes")
            .select("*")
            .eq("id", bookingData.bike_id)
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
          bike: bikeResponse.data,
          shop: shopResponse.data,
          user: userResponse.data,
          paymentMethod: paymentMethodResponse.data,
          deliveryOption: deliveryOptionResponse.data
        };

        console.log("Full booking data:", fullBookingData);
        setBooking(fullBookingData);
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
              <Button asChild>
                <Link href="/">
                  <ChevronLeft size={16} className="mr-2" />
                  Return to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const rentalPrice = booking.bike.price_per_day * days;
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
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white py-12 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
          >
            <ChevronLeft size={16} />
            Return to Home
          </Link>
        </div>

        <motion.div 
          className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 shadow-xl print:bg-white print:border-gray-200 print:shadow-none"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Confirmation header */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {booking.status === 'confirmed' || booking.status === 'completed' 
                  ? 'Booking Confirmed!' 
                  : booking.status === 'pending' 
                  ? 'Booking Pending' 
                  : 'Booking ' + booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </h1>
              <div className="flex flex-wrap gap-x-4 text-sm text-gray-400">
                <p>Booking ID: <span className="font-mono">{booking.id}</span></p>
                {booking.confirmation_code && (
                  <p>Confirmation Code: <span className="font-mono font-bold">{booking.confirmation_code}</span></p>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="ml-auto flex gap-2 print:hidden">
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share2 size={16} className="mr-1" />
                Share
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer size={16} className="mr-1" />
                Print
              </Button>
            </div>
          </motion.div>

          {/* Top banner with image and bike details */}
          <motion.div 
            variants={itemVariants}
            className="relative h-40 mb-6 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-violet-500/20"
          >
            <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex items-center gap-4 w-full">
                <img
                  src={booking.bike.image_url || "/placeholder-bike.jpg"}
                  alt={booking.bike.name}
                  className="w-20 h-20 object-cover rounded-md border border-white/20"
                />
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold">{booking.bike.name}</h2>
                  <p className="text-gray-300">{booking.shop.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">₱{booking.total_price.toFixed(2)}</div>
                  <div className="text-sm text-gray-300">{days} day{days !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main content in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left column: booking details */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Rental Period</h3>
                  <p>
                    {format(startDate, "MMMM d, yyyy")} to {format(endDate, "MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-gray-400">{days} days</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">
                    {booking.deliveryOption?.name || "Pickup at Shop"}
                  </h3>
                  <p className="text-sm text-gray-400">{booking.shop.address}</p>
                  
                  {booking.delivery_address && (
                    <div className="mt-1 p-2 bg-white/5 rounded-md text-sm">
                      <p className="font-medium text-white/80">Delivery Address:</p>
                      <p className="whitespace-pre-line">{booking.delivery_address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Payment Method</h3>
                  <p>{booking.paymentMethod?.name || "Cash Payment"}</p>
                  <p className="text-sm text-gray-400">
                    {booking.paymentMethod?.description || "Pay directly at pickup"}
                  </p>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1 ${
                      booking.payment_status === 'paid' 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {booking.payment_status === 'paid' 
                        ? <><Check size={12} /> Paid</> 
                        : <><Clock size={12} /> {booking.payment_status || 'Pending'}</>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Customer Details</h3>
                  <p>{customerName}</p>
                  
                  <div className="mt-1 space-y-1 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Mail size={12} /> {customerEmail}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone size={12} /> {customerPhone}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right column: price breakdown and shop info */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium mb-3">Price Breakdown</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Rental ({days} days × ₱{booking.bike.price_per_day.toFixed(2)})
                    </span>
                    <span>₱{rentalPrice.toFixed(2)}</span>
                  </div>
                  {booking.deliveryOption && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        {booking.deliveryOption.name}
                      </span>
                      <span>₱{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₱{booking.total_price.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium mb-3">Shop Information</h3>
                <div className="space-y-3">
                  <p className="font-medium">{booking.shop.name}</p>
                  <p className="text-sm text-gray-400">{booking.shop.address}</p>
                  
                  {booking.shop.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone size={14} className="text-primary" />
                      <a href={`tel:${booking.shop.phone}`} className="hover:text-primary transition-colors">
                        {booking.shop.phone}
                      </a>
                    </div>
                  )}
                  
                  {booking.shop.email && (
                    <div className="flex items-center gap-1 text-sm">
                      <Mail size={14} className="text-primary" />
                      <a href={`mailto:${booking.shop.email}`} className="hover:text-primary transition-colors">
                        {booking.shop.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer with additional info */}
          <motion.div variants={itemVariants} className="border-t border-white/10 pt-6 print:border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div>
                <p className="text-gray-400 text-sm">Booking Status</p>
                <p className="capitalize font-medium flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-500' :
                    booking.status === 'pending' ? 'bg-yellow-500' :
                    booking.status === 'completed' ? 'bg-blue-500' :
                    booking.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></span>
                  {booking.status}
                </p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Booked On</p>
                <p>{format(new Date(booking.created_at), "MMMM d, yyyy")}</p>
              </div>
              
              <div className="print:hidden">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/contact?ref=${booking.id}`}>
                    Need help with your booking?
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="mt-8 text-xs text-gray-500 print:text-gray-600">
              <p>© {new Date().getFullYear()} Siargao Rides. All rights reserved.</p>
              <p className="mt-1">This is an electronic confirmation of your booking. Please present this confirmation (printed or electronic) upon pick-up.</p>
            </div>
          </motion.div>
          
          {/* Print-only QR code */}
          <div className="hidden print:block print:mt-8 print:text-center">
            <div className="mx-auto w-32 h-32 border border-black p-2">
              {/* Placeholder for QR code - in a real app you'd generate this */}
              <div className="w-full h-full flex items-center justify-center text-sm">
                QR Code: {booking.id.substring(0, 8)}
              </div>
            </div>
            <p className="mt-2 text-xs">Scan for verification</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 