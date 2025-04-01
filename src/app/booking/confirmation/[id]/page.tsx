"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import Link from "next/link";

// Icons
import { CheckCircle, AlertCircle, ChevronLeft, Calendar, MapPin, CreditCard } from "lucide-react";

export default function BookingConfirmationPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        
        // Get the booking data
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
            )
          `)
          .eq("id", params.id)
          .single();

        if (bookingError) {
          setError("Booking not found. Please check the booking ID.");
          setLoading(false);
          return;
        }

        setBooking(bookingData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError("An unexpected error occurred. Please try again later.");
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse">Loading booking details...</div>
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
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-primary px-4 py-2 rounded-md text-white hover:bg-primary/80 transition-colors"
              >
                <ChevronLeft size={16} />
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const rentalPrice = booking.motorcycles.daily_rate * days;
  const deliveryFee = booking.delivery_options?.fee || 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
        >
          <ChevronLeft size={16} />
          Return to Home
        </Link>

        <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="text-green-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
              <p className="text-gray-400">
                Booking ID: <span className="font-mono">{booking.id}</span>
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <img
                src={booking.motorcycles.image_url || "/placeholder-bike.jpg"}
                alt={booking.motorcycles.model}
                className="w-24 h-24 object-cover rounded-md"
              />
              <div>
                <h2 className="text-xl font-semibold">{booking.motorcycles.brand} {booking.motorcycles.model}</h2>
                <p className="text-gray-400">{booking.shops.name}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
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
                    {booking.delivery_options?.name || "Pickup at Shop"}
                  </h3>
                  <p className="text-sm text-gray-400">{booking.shops.address}</p>
                </div>
              </div>

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
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-medium mb-3">Price Breakdown</h3>
              <div className="space-y-2 mb-4">
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
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>₱{booking.total_price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="font-medium mb-4">Booking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Status</p>
                <p className="capitalize font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  {booking.status}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Booked On</p>
                <p>{format(new Date(booking.created_at), "MMMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-gray-400">Customer</p>
                <p>{booking.guest_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400">Contact</p>
                <p>{booking.guest_email || "N/A"}</p>
                <p>{booking.guest_phone || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href={`/contact`}
              className="inline-flex justify-center items-center gap-2 bg-transparent border border-white/20 px-6 py-3 rounded-md text-white hover:bg-white/5 transition-colors"
            >
              Need Help?
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex justify-center items-center gap-2 bg-transparent border border-white/20 px-6 py-3 rounded-md text-white hover:bg-white/5 transition-colors"
            >
              Print Confirmation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 