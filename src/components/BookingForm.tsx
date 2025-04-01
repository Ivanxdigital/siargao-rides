"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Bike, RentalShop } from "@/lib/types";
import { User } from "@supabase/auth-helpers-nextjs";
import { Info, AlertCircle } from "lucide-react";

interface BookingFormProps {
  bike: Bike;
  shop: RentalShop;
  user: User | null;
  isAuthenticated: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onDeliveryFeeChange: (fee: number) => void;
}

export default function BookingForm({ 
  bike, 
  shop, 
  user, 
  isAuthenticated,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onDeliveryFeeChange
}: BookingFormProps) {
  // State for form fields
  const [deliveryOption, setDeliveryOption] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  
  // Fetch delivery options and payment methods
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const supabase = createClientComponentClient();
        
        // Fetch delivery options
        const { data: deliveryData, error: deliveryError } = await supabase
          .from("delivery_options")
          .select("*")
          .eq("is_active", true);
          
        if (deliveryError) {
          console.error("Error fetching delivery options:", deliveryError);
        } else {
          setDeliveryOptions(deliveryData || []);
        }
        
        // Fetch payment methods (cash only for now)
        const { data: paymentData, error: paymentError } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("is_active", true)
          .eq("is_online", false); // Only get offline payment methods
          
        if (paymentError) {
          console.error("Error fetching payment methods:", paymentError);
        } else {
          setPaymentMethods(paymentData || []);
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    
    fetchOptions();
  }, []);
  
  // Update delivery fee when delivery option changes
  useEffect(() => {
    if (deliveryOption) {
      const selectedOption = deliveryOptions.find(option => option.id === deliveryOption);
      if (selectedOption) {
        onDeliveryFeeChange(selectedOption.fee || 0);
      }
    } else {
      onDeliveryFeeChange(0);
    }
  }, [deliveryOption, deliveryOptions, onDeliveryFeeChange]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form
    if (!startDate || !endDate) {
      setFormError("Please select your rental dates");
      return;
    }
    
    if (!deliveryOption) {
      setFormError("Please select a delivery option");
      return;
    }
    
    if (!paymentMethod) {
      setFormError("Please select a payment method");
      return;
    }
    
    if (!agreeToTerms) {
      setFormError("You must agree to the terms and conditions");
      return;
    }
    
    // Check if delivery address is required but not provided
    const selectedDeliveryOption = deliveryOptions.find(option => option.id === deliveryOption);
    if (selectedDeliveryOption?.name.includes("Delivery") && !deliveryAddress.trim()) {
      setFormError("Please provide a delivery address");
      return;
    }
    
    // Guest user validation
    if (!isAuthenticated) {
      const guestName = (document.getElementById("guest-name") as HTMLInputElement)?.value;
      const guestEmail = (document.getElementById("guest-email") as HTMLInputElement)?.value;
      const guestPhone = (document.getElementById("guest-phone") as HTMLInputElement)?.value;
      
      if (!guestName || !guestEmail || !guestPhone) {
        setFormError("Please provide all guest details");
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail)) {
        setFormError("Please enter a valid email address");
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // TODO: In the next phase, we'll implement the actual booking API calls here.
      // For now, let's simulate a successful booking after a short delay
      
      setTimeout(() => {
        // Simulate success for now
        alert(`Booking request for ${bike.name} submitted successfully! In the next phase, we'll implement the actual booking functionality.`);
        setLoading(false);
        
        // In the future, we'll navigate to a confirmation page
        // router.push(`/booking/confirmation/${bookingId}`);
      }, 1500);
      
    } catch (error) {
      console.error("Booking error:", error);
      setFormError("An error occurred while processing your booking. Please try again.");
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Show form error if any */}
      {formError && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded flex items-start">
          <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}
      
      {/* Rental period selection */}
      <div>
        <h3 className="text-lg font-medium mb-2">Select Rental Period</h3>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
      </div>
      
      {/* Delivery options */}
      <div>
        <h3 className="text-lg font-medium mb-2">Delivery Options</h3>
        <div className="space-y-2">
          {deliveryOptions.map((option) => (
            <label 
              key={option.id} 
              className={`flex items-start gap-2 p-3 rounded-md hover:bg-white/5 cursor-pointer border transition ${
                deliveryOption === option.id 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'border-white/10'
              }`}
            >
              <input
                type="radio"
                name="deliveryOption"
                value={option.id}
                checked={deliveryOption === option.id}
                onChange={() => setDeliveryOption(option.id)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{option.name}</div>
                <div className="text-sm text-white/70">{option.description}</div>
                {option.fee > 0 && (
                  <div className="text-sm mt-1 text-primary">Fee: ₱{option.fee}</div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Show delivery address field if delivery option is selected */}
      {deliveryOption && deliveryOptions.find(o => o.id === deliveryOption)?.name.includes('Delivery') && (
        <div>
          <h3 className="text-lg font-medium mb-2">Delivery Address</h3>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full p-3 bg-black/50 border-white/20 border rounded-md focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            rows={3}
            placeholder="Enter your delivery address..."
          />
        </div>
      )}
      
      {/* Payment methods */}
      <div>
        <h3 className="text-lg font-medium mb-2">Payment Method</h3>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <label 
              key={method.id} 
              className={`flex items-start gap-2 p-3 rounded-md hover:bg-white/5 cursor-pointer border transition ${
                paymentMethod === method.id 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'border-white/10'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={paymentMethod === method.id}
                onChange={() => setPaymentMethod(method.id)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-white/70">{method.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* User details (if not logged in) */}
      {!isAuthenticated && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">Your Details</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/sign-in?redirect=' + encodeURIComponent(window.location.pathname))}
              type="button"
              className="text-xs h-8"
            >
              Sign in instead
            </Button>
          </div>
          
          <div className="space-y-4 bg-white/5 p-4 rounded-md">
            <div>
              <label htmlFor="guest-name" className="block text-sm font-medium mb-1 text-white/80">
                Full Name
              </label>
              <input
                id="guest-name"
                type="text"
                className="w-full p-2 bg-black/50 border-white/20 border rounded-md focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="guest-email" className="block text-sm font-medium mb-1 text-white/80">
                Email Address
              </label>
              <input
                id="guest-email"
                type="email"
                className="w-full p-2 bg-black/50 border-white/20 border rounded-md focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label htmlFor="guest-phone" className="block text-sm font-medium mb-1 text-white/80">
                Phone Number
              </label>
              <input
                id="guest-phone"
                type="tel"
                className="w-full p-2 bg-black/50 border-white/20 border rounded-md focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="+63 912 345 6789"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Terms and conditions */}
      <div className="flex items-start bg-white/5 p-4 rounded-md">
        <input
          type="checkbox"
          id="terms"
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          className="mt-1 mr-3"
        />
        <div>
          <label htmlFor="terms" className="text-sm block mb-1 cursor-pointer">
            I agree to the <a href="/terms" className="text-primary">terms and conditions</a>
          </label>
          <p className="text-xs text-white/60 flex items-start gap-1">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            A valid ID will be required as a deposit when picking up the bike.
          </p>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={loading}
      >
        {loading ? "Processing..." : "Complete Booking"}
      </Button>
    </form>
  );
} 