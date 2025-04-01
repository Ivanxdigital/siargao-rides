"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { format } from "date-fns";

// Icons
import { 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Clock,
  CheckCircle, 
  XCircle,
  User
} from "lucide-react";

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchBooking = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/sign-in");
          return;
        }

        // Get user's shop
        const { data: shop, error: shopError } = await supabase
          .from("shops")
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
            guest_name,
            guest_email,
            guest_phone,
            created_at,
            motorcycle_id,
            shop_id,
            user_id,
            payment_method_id,
            delivery_option_id,
            payment_status,
            motorcycles (
              id,
              model,
              brand,
              image_url,
              daily_rate
            ),
            shops (
              id,
              name,
              address,
              phone
            ),
            payment_methods (
              id,
              name,
              description
            ),
            delivery_options (
              id,
              name,
              fee
            ),
            users (
              id,
              first_name,
              last_name,
              email,
              phone
            )
          `)
          .eq("id", params.id)
          .eq("shop_id", shop.id)
          .single();

        if (bookingError) {
          setError("Booking not found or you don't have permission to view it.");
          setLoading(false);
          return;
        }

        setBooking(bookingData);
        setLoading(false);
      } catch (error) {
        console.error("Error checking user/shop:", error);
        setError("Failed to verify your account.");
        setLoading(false);
      }
    };

    checkUserAndFetchBooking();
  }, [params.id, supabase, router]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setProcessing(true);
      
      const { error } = await supabase
        .from("rentals")
        .update({ status: newStatus })
        .eq("id", booking.id)
        .eq("shop_id", shopId); // Extra safety check
      
      if (error) throw error;
      
      // Update local state
      setBooking({
        ...booking,
        status: newStatus
      });
      
      setProcessing(false);
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status. Please try again.");
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
      <DashboardShell>
        <div className="animate-pulse text-center py-20">Loading booking details...</div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-center">
          <p className="text-red-400">{error}</p>
          <Link
            href="/dashboard/bookings"
            className="inline-block mt-4 px-4 py-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors"
          >
            Back to Bookings
          </Link>
        </div>
      </DashboardShell>
    );
  }

  if (!booking) {
    return (
      <DashboardShell>
        <div className="text-center py-20">
          <p>Booking not found</p>
          <Link
            href="/dashboard/bookings"
            className="inline-block mt-4 px-4 py-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors"
          >
            Back to Bookings
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const rentalPrice = booking.motorcycles.daily_rate * days;
  const deliveryFee = booking.delivery_options?.fee || 0;
  
  const customerName = booking.user_id
    ? `${booking.users.first_name} ${booking.users.last_name}`
    : booking.guest_name;
    
  const customerEmail = booking.user_id
    ? booking.users.email
    : booking.guest_email;
    
  const customerPhone = booking.user_id
    ? booking.users.phone
    : booking.guest_phone;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Bookings
          </Link>
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
              {/* Bike Details */}
              <div className="bg-white/5 rounded-lg p-4">
                <h2 className="text-lg font-medium mb-4">Motorcycle Details</h2>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={booking.motorcycles.image_url || "/placeholder-bike.jpg"}
                      alt={booking.motorcycles.model}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {booking.motorcycles.brand} {booking.motorcycles.model}
                    </h3>
                    <p className="text-gray-400">Daily Rate: ₱{booking.motorcycles.daily_rate.toFixed(2)}</p>
                    <Link
                      href={`/dashboard/bikes/${booking.motorcycle_id}`}
                      className="text-primary hover:underline text-sm inline-block mt-2"
                    >
                      View Bike Details
                    </Link>
                  </div>
                </div>
              </div>

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

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">
                          {booking.delivery_options?.name || "Pickup at Shop"}
                        </h3>
                        <p className="text-sm text-gray-400">{booking.shops.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Payment Method</h3>
                        <p>{booking.payment_methods.name}</p>
                        <p className="text-sm text-gray-400">
                          {booking.payment_methods.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Customer</h3>
                        <p>{customerName || "N/A"}</p>
                        <p className="text-sm text-gray-400">{customerEmail || "N/A"}</p>
                        <p className="text-sm text-gray-400">{customerPhone || "N/A"}</p>
                      </div>
                    </div>
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
                      Rental ({days} days × ₱{booking.motorcycles.daily_rate})
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
                    <span>₱{booking.total_price.toFixed(2)}</span>
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
                  
                  {/* Link to print booking details */}
                  <Link
                    href={`/booking/confirmation/${booking.id}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-md transition-colors"
                  >
                    View Confirmation Page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
} 