"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Bike, RentalShop, Vehicle } from "@/lib/types";
import { User } from "@supabase/auth-helpers-nextjs";
import { Info, AlertCircle } from "lucide-react";

interface BookingFormProps {
  bike?: Bike;
  vehicle?: Vehicle;
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
  vehicle,
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
  
  // Use either vehicle or bike depending on which is provided
  const rentalVehicle = vehicle || bike;
  
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
  
  // Get vehicle type for UI customization
  const getVehicleType = (): string => {
    if (vehicle) {
      return vehicle.vehicle_type;
    } else {
      return 'motorcycle'; // Default to motorcycle for bikes
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rentalVehicle) {
      setFormError("No vehicle information found.");
      return;
    }
    
    // Validate required fields
    if (!startDate || !endDate) {
      setFormError("Please select both start and end dates.");
      return;
    }
    
    if (!deliveryOption) {
      setFormError("Please select a delivery option.");
      return;
    }
    
    if (!paymentMethod) {
      setFormError("Please select a payment method.");
      return;
    }
    
    if (!agreeToTerms) {
      setFormError("You must agree to the terms and conditions to proceed.");
      return;
    }
    
    // If the user is not authenticated, validate guest details
    if (!isAuthenticated) {
      const guestName = (document.getElementById("guest-name") as HTMLInputElement)?.value;
      const guestEmail = (document.getElementById("guest-email") as HTMLInputElement)?.value;
      const guestPhone = (document.getElementById("guest-phone") as HTMLInputElement)?.value;
      
      if (!guestName || !guestEmail) {
        setFormError("Please provide your name and email address.");
        return;
      }
    }
    
    // Calculate pricing
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const rentalPrice = rentalVehicle.price_per_day * days;
    const deliveryFeeAmount = deliveryOptions.find(o => o.id === deliveryOption)?.fee || 0;
    const totalPrice = rentalPrice + deliveryFeeAmount;
    
    setLoading(true);
    setFormError(null);
    
    try {
      const supabase = createClientComponentClient();
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get guest details if user is not authenticated
      let guestName = "";
      let guestEmail = "";
      let guestPhone = "";
      
      if (!isAuthenticated) {
        guestName = (document.getElementById("guest-name") as HTMLInputElement)?.value;
        guestEmail = (document.getElementById("guest-email") as HTMLInputElement)?.value;
        guestPhone = (document.getElementById("guest-phone") as HTMLInputElement)?.value;
      }
      
      // Generate a unique confirmation code
      const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Create a new booking record - handle both vehicle and bike paths
      let bookingData: any = {
        shop_id: shop.id,
        user_id: isAuthenticated ? session?.user?.id : null,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        total_price: totalPrice,
        payment_method_id: paymentMethod,
        delivery_option_id: deliveryOption,
        status: "pending", // Initial status
        payment_status: "pending", // Initial payment status
        delivery_address: deliveryAddress,
        confirmation_code: confirmationCode,
        created_at: new Date().toISOString()
      };
      
      // Add the right ID field based on whether we're using vehicle or bike
      if (vehicle) {
        bookingData.vehicle_id = vehicle.id;
        bookingData.vehicle_type_id = vehicle.vehicle_type_id;
      } else if (bike) {
        bookingData.bike_id = bike.id;
      }
      
      const { data: booking, error } = await supabase
        .from("rentals")
        .insert(bookingData)
        .select()
        .single();
      
      if (error) {
        console.error("Error creating booking:", error);
        setFormError("An error occurred while processing your booking. Please try again.");
        setLoading(false);
        return;
      }
      
      console.log("Booking created:", booking);
      
      // Navigate to the confirmation page
      router.push(`/booking/confirmation/${booking.id}`);
      
    } catch (error) {
      console.error("Booking error:", error);
      setFormError("An error occurred while processing your booking. Please try again.");
      setLoading(false);
    }
  };
  
  // Conditional rendering for vehicle-specific options
  const renderVehicleSpecificOptions = () => {
    const vehicleType = getVehicleType();
    
    switch(vehicleType) {
      case 'car':
        return (
          <div className="space-y-4 mt-6 p-4 bg-white/5 rounded-md border border-white/10">
            <h3 className="text-lg font-medium">Car Options</h3>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="additional-driver" 
                className="h-4 w-4"
              />
              <label htmlFor="additional-driver" className="text-sm">
                Additional Driver
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="child-seat" 
                className="h-4 w-4"
              />
              <label htmlFor="child-seat" className="text-sm">
                Child Seat (+₱200)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="gps" 
                className="h-4 w-4"
              />
              <label htmlFor="gps" className="text-sm">
                GPS Navigation (+₱150)
              </label>
            </div>
          </div>
        );
        
      case 'tuktuk':
        return (
          <div className="space-y-4 mt-6 p-4 bg-white/5 rounded-md border border-white/10">
            <h3 className="text-lg font-medium">Tuktuk Options</h3>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="decorated" 
                className="h-4 w-4"
              />
              <label htmlFor="decorated" className="text-sm">
                Decorated Tuktuk (+₱300)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="tour-guide" 
                className="h-4 w-4"
              />
              <label htmlFor="tour-guide" className="text-sm">
                Tour Guide (+₱1500/day)
              </label>
            </div>
          </div>
        );
        
      case 'motorcycle': 
      default:
        return (
          <div className="space-y-4 mt-6 p-4 bg-white/5 rounded-md border border-white/10">
            <h3 className="text-lg font-medium">Bike Options</h3>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="helmet" 
                className="h-4 w-4"
              />
              <label htmlFor="helmet" className="text-sm">
                Extra Helmet (+₱50)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="lock" 
                className="h-4 w-4"
              />
              <label htmlFor="lock" className="text-sm">
                Security Lock (+₱30)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="basket" 
                className="h-4 w-4"
              />
              <label htmlFor="basket" className="text-sm">
                Storage Basket (+₱80)
              </label>
            </div>
          </div>
        );
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
      
      {/* Vehicle-specific options */}
      {renderVehicleSpecificOptions()}
      
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
      
      {/* Show delivery address field if delivery is selected */}
      {deliveryOption && deliveryOptions.find(option => option.id === deliveryOption)?.requires_address && (
        <div>
          <h3 className="text-lg font-medium mb-2">Delivery Address</h3>
          <textarea
            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/50"
            placeholder="Enter your delivery address here..."
            rows={3}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
          />
        </div>
      )}
      
      {/* Payment options */}
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
      
      {/* Guest information (for non-authenticated users) */}
      {!isAuthenticated && (
        <div>
          <h3 className="text-lg font-medium mb-2">Guest Information</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="guest-name" className="block text-sm mb-1">Name</label>
              <input
                id="guest-name"
                type="text"
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/50"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="guest-email" className="block text-sm mb-1">Email</label>
              <input
                id="guest-email"
                type="email"
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/50"
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <label htmlFor="guest-phone" className="block text-sm mb-1">Phone (optional)</label>
              <input
                id="guest-phone"
                type="tel"
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/50"
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Terms and conditions */}
      <div className="pt-4">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-white/70">
            I agree to the <a href="#" className="text-primary hover:underline">terms and conditions</a> and understand that I will need to provide a valid ID as deposit when collecting the vehicle.
          </span>
        </label>
      </div>
      
      {/* Submit button */}
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
} 