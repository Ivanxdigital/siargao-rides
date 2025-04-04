"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Calendar, User, Bike, MapPin, CreditCard, CheckCircle, XCircle, Clock, AlertTriangle, Eye } from "lucide-react";
import { format } from "date-fns";

interface VehicleData {
  id: string;
  name: string;
  price_per_day: number;
  description?: string;
  image_url?: string;
  [key: string]: any; // For other properties
}

export default function BookingDetailsPage() {
  // Use the useParams hook to get the id parameter
  const params = useParams();
  const bookingId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchBooking = async () => {
      if (!bookingId) {
        setError("Booking ID is missing");
        setLoading(false);
        return;
      }

      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/sign-in");
          return;
        }

        // Get user's shop
        const { data: shop, error: shopError } = await supabase
          .from("rental_shops")
          .select("id")
          .eq("owner_id", session.user.id)
          .single();

        if (shopError || !shop) {
          setError("You don't have a shop. Please create one first.");
          setLoading(false);
          return;
        }

        setShopId(shop.id);
        
        // Fetch the booking details
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
            shop_id,
            user_id,
            payment_method_id,
            delivery_option_id,
            payment_status
          `)
          .eq("id", bookingId)
          .eq("shop_id", shop.id)
          .single();

        if (bookingError) {
          console.error("Error fetching booking:", bookingError);
          setError("Booking not found or you don't have permission to view it.");
          setLoading(false);
          return;
        }

        console.log("Base booking data:", bookingData);

        // Now fetch all the related data in separate queries
        let vehicleData: VehicleData | null = null;
        let shopData = null;
        let userData = null;
        let paymentMethodData = null;
        let deliveryOptionData = null;

        // Get vehicle data
        if (bookingData.vehicle_id) {
          const { data: vehicle, error: vehicleError } = await supabase
            .from("vehicles")
            .select("*")
            .eq("id", bookingData.vehicle_id)
            .single();
            
          if (vehicleError) {
            console.error("Error fetching vehicle:", vehicleError);
          } else {
            vehicleData = vehicle;
            console.log("Vehicle data:", vehicleData);
            
            // Get vehicle image
            const { data: vehicleImages, error: imagesError } = await supabase
              .from("vehicle_images")
              .select("image_url")
              .eq("vehicle_id", bookingData.vehicle_id)
              .eq("is_primary", true)
              .limit(1);
              
            if (!imagesError && vehicleImages && vehicleImages.length > 0 && vehicleData) {
              (vehicleData as any).image_url = vehicleImages[0].image_url;
              console.log("Found primary image:", vehicleData.image_url);
            } else {
              // If no primary image, try to get any image
              const { data: anyImage } = await supabase
                .from("vehicle_images")
                .select("image_url")
                .eq("vehicle_id", bookingData.vehicle_id)
                .limit(1);
                
              if (anyImage && anyImage.length > 0 && vehicleData) {
                (vehicleData as any).image_url = anyImage[0].image_url;
                console.log("Found alternative image:", vehicleData.image_url);
              } else if (vehicleData) {
                (vehicleData as any).image_url = "/placeholder.jpg";
                console.log("No images found for vehicle, using placeholder");
              }
            }
          }
        }

        // Get shop data
        if (bookingData.shop_id) {
          const { data: shop, error: shopFetchError } = await supabase
            .from("rental_shops")
            .select("*")
            .eq("id", bookingData.shop_id)
            .single();
            
          if (shopFetchError) {
            console.error("Error fetching shop:", shopFetchError);
          } else {
            shopData = shop;
            console.log("Shop data:", shopData);
          }
        }

        // Get user data
        if (bookingData.user_id) {
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", bookingData.user_id)
            .single();
            
          if (userError) {
            console.error("Error fetching user:", userError);
          } else {
            userData = user;
            console.log("User data:", userData);
          }
        }

        // Get payment method data
        if (bookingData.payment_method_id) {
          const { data: paymentMethod, error: paymentError } = await supabase
            .from("payment_methods")
            .select("*")
            .eq("id", bookingData.payment_method_id)
            .single();
            
          if (paymentError) {
            console.error("Error fetching payment method:", paymentError);
          } else {
            paymentMethodData = paymentMethod;
            console.log("Payment method data:", paymentMethodData);
          }
        }

        // Get delivery option data
        if (bookingData.delivery_option_id) {
          const { data: deliveryOption, error: deliveryError } = await supabase
            .from("delivery_options")
            .select("*")
            .eq("id", bookingData.delivery_option_id)
            .single();
            
          if (deliveryError) {
            console.error("Error fetching delivery option:", deliveryError);
          } else {
            deliveryOptionData = deliveryOption;
            console.log("Delivery option data:", deliveryOptionData);
          }
        }

        // Combine all data
        const fullBookingData = {
          ...bookingData,
          vehicles: vehicleData,
          rental_shops: shopData,
          users: userData,
          payment_methods: paymentMethodData,
          delivery_options: deliveryOptionData
        };

        console.log("Full booking data:", fullBookingData);
        setBooking(fullBookingData);
        setLoading(false);
      } catch (error) {
        console.error("Error checking user/shop:", error);
        setError("Failed to verify your account.");
        setLoading(false);
      }
    };

    checkUserAndFetchBooking();
  }, [bookingId, supabase, router]);

  const handleStatusChange = async (newStatus: string) => {
    if (!bookingId) return;
    
    try {
      setProcessing(true);
      
      const { error } = await supabase
        .from("rentals")
        .update({ status: newStatus })
        .eq("id", bookingId);
      
      if (error) throw error;
      
      // Instead of fetching all new data, just update the status in our existing state
      setBooking((prevBooking) => {
        if (!prevBooking) return null;
        return {
          ...prevBooking,
          status: newStatus
        };
      });
      
      setProcessing(false);
      
      // Show success message
      alert(`Booking status updated to ${newStatus}`);
      
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update booking status");
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "confirmed":
        return <CheckCircle className="w-5 h-5" />;
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse text-center py-20">Loading booking details...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-center">
        <p className="text-red-400">{error}</p>
        <Link
          href="/dashboard/bookings"
          className="inline-block mt-4 px-4 py-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <p>Booking not found</p>
        <Link
          href="/dashboard/bookings"
          className="inline-block mt-4 px-4 py-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Add null checks for vehicles and related properties
  const pricePerDay = booking.vehicles?.price_per_day || 0;
  const rentalPrice = pricePerDay * days;
  const deliveryFee = booking.delivery_options?.fee || 0;
  
  const customerName = booking.users 
    ? `${booking.users.first_name || ''} ${booking.users.last_name || ''}`.trim() 
    : "Guest";
    
  const customerEmail = booking.users?.email || "N/A";
  const customerPhone = booking.users?.phone || "N/A";

  const renderVehicleDetails = () => {
    if (!booking || !booking.vehicles) return null;
    
    console.log("Rendering vehicle details with image:", booking.vehicles.image_url);
    
    return (
      <div className="bg-white/5 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-4">Vehicle Details</h2>
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
            <img
              src={booking.vehicles.image_url || "/placeholder.jpg"}
              alt={booking.vehicles.name || "Vehicle"}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log("Image failed to load:", e.currentTarget.src);
                e.currentTarget.src = "/placeholder.jpg";
              }}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{booking.vehicles.name || "Vehicle"}</h3>
            <p className="text-gray-400">Daily Rate: ₱{(booking.vehicles.price_per_day || 0).toFixed(2)}</p>
            {/* Link disabled until vehicle details page is created */}
            {/* <Link
              href={`/dashboard/vehicles/${booking.vehicle_id}`}
              className="text-primary hover:underline text-sm inline-block mt-2"
            >
              View Vehicle Details
            </Link> */}
          </div>
        </div>
      </div>
    );
  }

  const renderShopDetails = () => {
    if (!booking || !booking.rental_shops) return null;
    
    return (
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium">
            {booking.delivery_options?.name || "Pickup at Shop"}
          </h3>
          <p className="text-sm text-gray-400">{booking.rental_shops.address}</p>
        </div>
      </div>
    );
  }

  const renderCustomerInfo = () => {
    return (
      <div className="flex items-start gap-3">
        <User className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium">Customer</h3>
          <p>{customerName}</p>
          <p className="text-sm text-gray-400">{customerEmail}</p>
          <p className="text-sm text-gray-400">{customerPhone}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/bookings">
            <ChevronLeft size={16} />
            Back to Bookings
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              booking.status
            )}/20 text-${getStatusColor(booking.status).replace("bg-", "")}`}
          >
            {getStatusIcon(booking.status)}
            <span className="capitalize">{booking.status}</span>
          </span>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Booking #{booking.id.substring(0, 8)}</h1>
          <p className="text-sm text-gray-400">
            Created on {format(new Date(booking.created_at), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {renderVehicleDetails()}

            {/* Booking Details */}
            <div className="bg-white/5 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-4">Booking Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Rental Period</h3>
                      <p>
                        {format(startDate, "MMMM d, yyyy")} to{" "}
                        {format(endDate, "MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-gray-400">{days} days</p>
                    </div>
                  </div>

                  {renderShopDetails()}
                </div>

                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Payment Method</h3>
                      <p>{booking.payment_methods?.name || "Not specified"}</p>
                      <p className="text-sm text-gray-400">
                        {booking.payment_methods?.description || ""}
                      </p>
                    </div>
                  </div>

                  {renderCustomerInfo()}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Price Summary */}
            <div className="bg-white/5 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-4">Price Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Rental ({days} days × ₱{pricePerDay.toFixed(2)})
                  </span>
                  <span>₱{rentalPrice.toFixed(2)}</span>
                </div>
                {booking.delivery_options && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {booking.delivery_options.name}
                    </span>
                    <span>₱{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₱{(booking.total_price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="bg-white/5 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-4">Manage Booking</h2>
              <div className="space-y-4">
                {booking.status === "pending" && (
                  <button
                    onClick={() => handleStatusChange("confirmed")}
                    disabled={processing}
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={16} />
                    Confirm Booking
                  </button>
                )}
                
                {(booking.status === "pending" || booking.status === "confirmed") && (
                  <button
                    onClick={() => handleStatusChange("completed")}
                    disabled={processing}
                    className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={16} />
                    Mark as Completed
                  </button>
                )}
                
                {booking.status !== "cancelled" && booking.status !== "completed" && (
                  <button
                    onClick={() => handleStatusChange("cancelled")}
                    disabled={processing}
                    className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={16} />
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 