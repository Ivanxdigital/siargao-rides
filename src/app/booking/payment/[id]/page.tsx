"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import PayMongoForm from "@/components/PayMongoForm";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function BookingPaymentPage() {
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
      
      // Check if payment is already completed
      if (booking.payment_status === "paid") {
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
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
        <div className="mt-4">
          <Button onClick={() => router.back()} variant="outline" className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
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
  const shop = booking.shop;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href={`/booking/confirmation/${bookingId}`} className="inline-flex items-center text-primary hover:text-primary/80">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to Booking Details</span>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-5 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Complete Your Payment</h2>
            
            {paymentSuccess ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start">
                <CheckCircle className="text-green-500 w-5 h-5 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium text-green-500">Payment Successful</h3>
                  <p className="text-green-400">Your payment has been processed successfully. Redirecting to your booking confirmation...</p>
                </div>
              </div>
            ) : (
              <PayMongoForm
                rentalId={bookingId}
                amount={booking.total_price}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-5 shadow-sm sticky top-6">
            <h3 className="font-semibold mb-4 text-lg pb-2 border-b border-white/10">Booking Summary</h3>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">{rentalVehicle?.name || 'Vehicle'}</h4>
              <p className="text-sm text-white/70">{vehicleType?.name || 'Vehicle'}</p>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-start">
                <span className="text-white/70">Rental Period:</span>
                <span className="font-medium text-right">
                  {format(new Date(booking.start_date), 'MMM d, yyyy')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-white/70">Rental Fee:</span>
                <span className="font-medium">₱{(booking.total_price - (booking.delivery_option?.fee || 0)).toFixed(2)}</span>
              </div>
              
              {booking.delivery_option && (
                <div className="flex justify-between items-start">
                  <span className="text-white/70">Delivery Fee:</span>
                  <span className="font-medium">₱{(booking.delivery_option.fee || 0).toFixed(2)}</span>
                </div>
              )}
              
              <div className="pt-2 border-t border-white/10 flex justify-between items-start font-semibold">
                <span>Total:</span>
                <span>₱{booking.total_price.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-xs text-white/50 mt-4">
              <p>Booking ID: {booking.id}</p>
              <p>Status: {booking.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
