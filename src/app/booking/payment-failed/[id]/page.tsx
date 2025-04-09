"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  RefreshCw,
  CreditCard,
  MessageSquare,
  ArrowRight
} from "lucide-react";

export default function PaymentFailedPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
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
      
      setBooking(booking);
      
      // Fetch payment error details if available
      const { data: paymentData } = await supabase
        .from("paymongo_payments")
        .select("last_error_message")
        .eq("rental_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
        
      if (paymentData?.last_error_message) {
        setErrorDetails(paymentData.last_error_message);
      }
    } catch (error: any) {
      console.error("Error fetching booking details:", error);
      setError(error.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    router.push(`/booking/payment/${bookingId}`);
  };

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
      transition: { type: "spring", stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white/70">Loading booking details...</p>
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
            <ChevronLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/booking/confirmation/${bookingId}`}
            className="inline-flex items-center text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Back to Booking Details</span>
          </Link>
        </div>

        <motion.div
          className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 shadow-xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
            <p className="text-white/70 max-w-lg mx-auto">
              We couldn't process your payment for this booking. This could be due to insufficient funds, 
              card restrictions, or a temporary issue with the payment system.
            </p>
          </motion.div>

          {/* Error details if available */}
          {errorDetails && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h3 className="font-medium text-red-400 mb-1">Error Details</h3>
                <p className="text-white/70">{errorDetails}</p>
              </div>
            </motion.div>
          )}

          {/* Booking summary */}
          {booking && (
            <motion.div variants={itemVariants} className="mb-8">
              <h2 className="text-lg font-medium mb-3">Booking Summary</h2>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/50 text-sm">Vehicle</p>
                    <p className="font-medium">{booking.vehicle?.name || "Vehicle"}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Rental Shop</p>
                    <p className="font-medium">{booking.shop?.name || "Shop"}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Total Amount</p>
                    <p className="font-medium">₱{booking.total_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Booking ID</p>
                    <p className="font-medium font-mono text-sm">{booking.id}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Options */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-lg font-medium mb-3">What would you like to do?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Try again */}
              <div 
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-5 cursor-pointer transition-colors"
                onClick={handleTryAgain}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <RefreshCw size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Try Again</h3>
                    <p className="text-sm text-white/70">Attempt the payment again or try a different payment method</p>
                  </div>
                </div>
              </div>
              
              {/* Contact support */}
              <Link 
                href="/contact"
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-5 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <MessageSquare size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Contact Support</h3>
                    <p className="text-sm text-white/70">Get help from our support team to resolve the issue</p>
                  </div>
                </div>
              </Link>
            </div>
            
            {/* Cash payment option */}
            <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="bg-green-500/20 p-2 rounded-full">
                  <CreditCard size={20} className="text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-green-400 mb-1">Switch to Cash Payment</h3>
                  <p className="text-sm text-white/70 mb-3">
                    You can switch to paying with cash when you pick up your vehicle or when it's delivered to you.
                  </p>
                  <Button 
                    onClick={() => router.push(`/api/bookings/switch-to-cash?id=${bookingId}`)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Switch to Cash Payment <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
