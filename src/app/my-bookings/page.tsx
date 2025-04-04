"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addHours } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Filter,
  Calendar,
  Bike,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cancelling, setCancelling] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    if (isAuthenticated && user) {
      fetchUserBookings();
    }
  }, [isAuthenticated, isLoading, user, statusFilter]);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      
      // Base query for rentals
      let query = supabase
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
          shop_id
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      // Apply status filter if not "all"
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      // Execute the query to get rentals
      const { data: rentalData, error: rentalsError } = await query;
      
      if (rentalsError) {
        console.error("Supabase rentals query error:", rentalsError);
        throw new Error(rentalsError.message);
      }
      
      // Enhanced logging to debug id issues
      console.log("Rental data:", rentalData);
      if (rentalData && rentalData.length > 0) {
        console.log("Sample booking ID:", rentalData[0].id);
        console.log("Booking ID type:", typeof rentalData[0].id);
        console.log("All booking IDs:", rentalData.map(b => b.id));
      }
      
      // Process the rentals to fetch related data
      if (rentalData && rentalData.length > 0) {
        const processedBookings = await Promise.all(
          rentalData.map(async (rental) => {
            try {
              // Get vehicle info with all possible image fields
              const { data: vehicleData, error: vehicleError } = await supabase
                .from("vehicles")
                .select("*")  // Select all fields to ensure we get all image related fields
                .eq("id", rental.vehicle_id)
                .single();
                
              if (vehicleError) {
                console.error("Error fetching vehicle data:", vehicleError);
                return {
                  ...rental,
                  vehicle: { name: "Unknown Vehicle" },
                  shop: null
                };
              }
              
              console.log("Full vehicle data:", vehicleData);
              
              // Try multiple possible sources for the vehicle image
              let vehicleImageUrl: string | null = null;
              
              // Check if we have vehicle images
              const { data: vehicleImages, error: vehicleImagesError } = await supabase
                .from("vehicle_images")
                .select("*")
                .eq("vehicle_id", rental.vehicle_id)
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
              
              console.log("Final resolved vehicle image URL:", vehicleImageUrl);
              
              // Get shop info
              const { data: shopData } = await supabase
                .from("rental_shops")
                .select("name, address")
                .eq("id", rental.shop_id)
                .single();
              
              return {
                ...rental,
                vehicle: {
                  ...vehicleData,
                  imageUrl: vehicleImageUrl
                },
                shop: shopData
              };
            } catch (error) {
              console.error("Error processing booking:", error);
              return {
                ...rental,
                vehicle: { name: "Error loading vehicle data" },
                shop: null
              };
            }
          })
        );
        
        setBookings(processedBookings);
      } else {
        // No bookings found
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(`Error fetching bookings: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const canCancelBooking = (booking: any) => {
    // Allow cancellation only if:
    // 1. Booking is in "pending" or "confirmed" status
    // 2. Start date is at least 24 hours in the future
    const allowedStatuses = ["pending", "confirmed"];
    if (!allowedStatuses.includes(booking.status)) return false;
    
    const now = new Date();
    const startDate = new Date(booking.start_date);
    const hoursUntilStart = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    return hoursUntilStart >= 24;
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancelling(bookingId);
      
      // Update booking status to cancelled
      const { error } = await supabase
        .from("rentals")
        .update({ 
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: user!.id,
          cancellation_reason: "Cancelled by user"
        })
        .eq("id", bookingId)
        .eq("user_id", user!.id); // Ensure the booking belongs to this user

      if (error) throw error;

      // Refresh bookings
      fetchUserBookings();
      alert("Booking cancelled successfully");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-yellow-400">
            <Clock size={14} />
            <span>Pending</span>
          </span>
        );
      case "confirmed":
        return (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle size={14} />
            <span>Confirmed</span>
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 text-blue-400">
            <CheckCircle size={14} />
            <span>Completed</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1 text-red-400">
            <XCircle size={14} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-gray-400">
            <AlertTriangle size={14} />
            <span>{status}</span>
          </span>
        );
    }
  };

  // Redirect if not authenticated
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="pt-24">
      <div className="bg-black text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-lg">Manage your vehicle rentals and view your booking history</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All Bookings
            </Button>
            <Button 
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              Pending
            </Button>
            <Button 
              variant={statusFilter === "confirmed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("confirmed")}
            >
              Confirmed
            </Button>
            <Button 
              variant={statusFilter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("completed")}
            >
              Completed
            </Button>
            <Button 
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("cancelled")}
            >
              Cancelled
            </Button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : loading ? (
          <div className="animate-pulse text-center py-20">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-lg">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold mb-2">No bookings found</p>
            <p className="text-gray-400 mb-6">
              {statusFilter !== "all" 
                ? `You don't have any ${statusFilter} bookings.` 
                : "You haven't made any bookings yet."}
            </p>
            <Button asChild>
              <Link href="/browse">Browse Vehicles</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors">
                <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
                  {/* Vehicle Image */}
                  <div className="w-full md:w-48 h-32 rounded-md overflow-hidden flex-shrink-0 bg-gray-800">
                    <img 
                      src={booking.vehicle?.imageUrl || booking.vehicle?.image_url || "/placeholder.jpg"} 
                      alt={booking.vehicle?.name || "Vehicle"} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Image failed to load:", e.currentTarget.src);
                        e.currentTarget.src = "/placeholder.jpg";
                      }}
                    />
                  </div>
                  
                  {/* Booking Details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{booking.vehicle?.name || "Vehicle Rental"}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">{booking.shop?.name} • {booking.shop?.address}</p>
                      
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-sm">
                            {format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bike className="h-4 w-4 text-primary" />
                          <span className="text-sm">
                            ₱{booking.vehicle?.price_per_day || 0}/day • Total: ₱{booking.total_price}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-2 mt-4 justify-between items-start md:items-center">
                      <div className="text-xs text-gray-400">
                        Booked on {format(new Date(booking.created_at), "MMMM d, yyyy")}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            console.log("Booking ID before navigation:", booking.id);
                            console.log("Full booking object:", booking);
                          }}
                        >
                          <Link href={`/booking/confirmation/${booking.id?.toString()}`}>
                            View Details
                          </Link>
                        </Button>
                        
                        {canCancelBooking(booking) && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancelling === booking.id}
                          >
                            {cancelling === booking.id ? "Cancelling..." : "Cancel Booking"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 