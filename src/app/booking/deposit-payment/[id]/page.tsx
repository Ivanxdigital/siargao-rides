"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DepositPayMongoForm from "@/components/DepositPayMongoForm";
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function DepositPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError("Booking ID is missing");
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);

      // Fetch booking details
      const { data: booking, error: bookingError } = await supabase
        .from("rentals")
        .select(`
          *,
          vehicle:vehicle_id(*),
          vehicle_type:vehicle_type_id(*),
          shop:shop_id(*),
          payment_method:payment_method_id(*),
          delivery_option:delivery_option_id(*)
        `)
        .eq("id", bookingId)
        .single();

      if (bookingError) {
        throw new Error(bookingError.message);
      }

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Check if deposit is already paid
      if (booking.deposit_paid) {
        setPaymentSuccess(true);
      }

      setBooking(booking);
    } catch (error: any) {
      console.error("Error fetching booking details:", error);
      setError(error.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);

    // Refresh booking details to get updated status
    await fetchBookingDetails();

    // Wait a moment before redirecting to confirmation page
    setTimeout(() => {
      router.push(`/booking/confirmation/${bookingId}`);
    }, 3000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);

    // The PayMongoForm component will handle redirecting to the failure page
    // after a short delay to show the error message
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-white/70">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 mr-2" />
          <div>
            <h3 className="font-medium text-red-500">Error</h3>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => router.back()} variant="outline" className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push(`/booking/payment-failed/${bookingId}`)}
            className="flex items-center bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            View Payment Options
          </Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="font-medium text-yellow-500">Booking Not Found</h3>
          <p className="text-yellow-400">The booking you're looking for could not be found.</p>
        </div>
        <div className="mt-4">
          <Link href="/">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const rentalVehicle = booking.vehicle;
  const vehicleType = booking.vehicle_type;
  const depositAmount = booking.deposit_amount || 300; // Default to 300 PHP if not set

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950/95 to-blue-950 pt-16 pb-12 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-4000"></div>

      <div className="container max-w-4xl mx-auto relative z-10">
        <div className="mb-8 pt-4">
          <Link
            href={`/booking/${booking?.vehicle_id}`}
            className="inline-flex items-center text-white hover:text-primary py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Back to Booking</span>
          </Link>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-5 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Pay Booking Deposit</h2>
            </div>

            <div className="p-5 border-b border-white/10">
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-5">
                <h3 className="font-medium text-blue-400 mb-2">Deposit Information</h3>
                <p className="text-white/80 text-sm">
                  A ₱{depositAmount} deposit is required to secure your booking with cash payment.
                  This deposit helps prevent ghost bookings and ensures the vehicle will be available for you.
                </p>
                <p className="text-white/80 text-sm mt-2">
                  If you don't show up for your booking, the deposit will be kept by the shop owner as compensation.
                </p>
              </div>
            </div>

            <div className="p-0">
              {paymentSuccess ? (
                <div className="m-6 bg-green-900/30 border border-green-500/30 rounded-lg p-5 flex items-start">
                  <CheckCircle className="text-green-400 w-6 h-6 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-semibold text-green-400 text-lg mb-1">Deposit Payment Successful</h3>
                    <p className="text-green-300">Your deposit has been processed successfully. Redirecting to your booking confirmation...</p>
                  </div>
                </div>
              ) : (
                <DepositPayMongoForm
                  rentalId={bookingId}
                  amount={depositAmount}
                  vehicle={rentalVehicle}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg shadow-lg p-5 sticky top-6">
            <h3 className="font-semibold text-white mb-4 text-lg pb-2 border-b border-white/10">Booking Summary</h3>

            {rentalVehicle?.image_url && (
              <div className="mb-4 aspect-video overflow-hidden rounded-lg border border-white/10">
                <img
                  src={rentalVehicle.image_url}
                  alt={rentalVehicle.name || 'Vehicle'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="mb-5">
              <h4 className="font-medium text-white mb-1">{rentalVehicle?.name || 'Vehicle'}</h4>
              <p className="text-sm text-white/70">{vehicleType?.name || 'Vehicle'}</p>
            </div>

            <div className="mb-5">
              <h4 className="font-medium text-white mb-2">Rental Details</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-white/70">Dates:</span>
                  <span className="font-medium text-white text-right">
                    {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-white/70">Duration:</span>
                  <span className="font-medium text-white">
                    {Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h4 className="font-medium text-white mb-2">Payment Details</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-white/70">Rental Price:</span>
                  <span className="font-medium text-white">₱{(booking.total_price - (booking.delivery_option?.fee || 0)).toFixed(2)}</span>
                </div>

                {booking.delivery_option && (
                  <div className="flex justify-between items-start">
                    <span className="text-white/70">Delivery Fee:</span>
                    <span className="font-medium text-white">₱{(booking.delivery_option.fee || 0).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <span className="text-white/70">Total Booking:</span>
                  <span className="font-medium text-white">₱{booking.total_price.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-between items-start font-semibold">
                  <span className="text-white">Deposit Due Now:</span>
                  <span className="text-primary-400 text-lg">₱{depositAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-white/50 mt-4 pt-3 border-t border-white/10">
              <p className="mb-1">Booking ID: <span className="font-medium">{booking.id}</span></p>
              <p>Status: <span className="font-medium capitalize">{booking.status}</span></p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
