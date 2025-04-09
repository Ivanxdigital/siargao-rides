"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker from "@/components/DateRangePicker";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Bike, RentalShop, Vehicle } from "@/lib/types";
import { User } from "@supabase/auth-helpers-nextjs";
import { Info, AlertCircle } from "lucide-react";
import { addDays, subDays, format, isWithinInterval } from "date-fns";
import { TermsAndConditions } from "./TermsAndConditions";

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

interface DateRange {
  startDate: Date;
  endDate: Date;
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
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  // Use either vehicle or bike depending on which is provided
  const rentalVehicle = vehicle || bike;

  // Check availability for pre-filled dates when component mounts
  useEffect(() => {
    // Only check if both dates are provided and we have a vehicle ID
    if (startDate && endDate && rentalVehicle?.id) {
      // Format dates for consistency
      const formattedStart = new Date(startDate);
      const formattedEnd = new Date(endDate);

      console.log("Checking availability for pre-filled dates:", {
        vehicleId: rentalVehicle.id,
        startDate: formattedStart.toISOString(),
        endDate: formattedEnd.toISOString(),
        formattedStartDate: formattedStart.toISOString().split('T')[0],
        formattedEndDate: formattedEnd.toISOString().split('T')[0]
      });

      // If the dates are the same or invalid, skip check
      if (formattedStart >= formattedEnd || isNaN(formattedStart.getTime()) || isNaN(formattedEnd.getTime())) {
        console.log("Invalid date range, skipping availability check");
        return;
      }

      const checkInitialAvailability = async () => {
        try {
          // Skip API call entirely - we'll trust the API when user clicks "Book"
          // This avoids showing potentially incorrect unavailability messages
          console.log("Skipping pre-validation for automatic date filling to avoid false negatives");

          // If we want to validate, we can add a simple check here
          // But for now, we're allowing the user to proceed to avoid false negatives

        } catch (error) {
          console.error("Error checking availability:", error);
          // On error, don't show unavailability message to prevent blocking valid bookings
        }
      };

      checkInitialAvailability();
    }
  }, [startDate, endDate, rentalVehicle?.id]);

  // Fetch delivery options
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
          // If shop offers delivery, add/modify the delivery option
          let options = [...(deliveryData || [])];

          // Filter out accommodation delivery option if it exists
          options = options.filter(option => !option.name.toLowerCase().includes('accommodation'));

          // Add shop-specific delivery option if shop offers delivery
          if (shop.offers_delivery) {
            const shopDeliveryOption = {
              id: "shop-delivery",
              name: "Delivery to Accommodation",
              description: `Have your vehicle delivered to your accommodation by ${shop.name}`,
              fee: shop.delivery_fee || 0,
              is_active: true,
              requires_address: true
            };
            options.push(shopDeliveryOption);
          }

          setDeliveryOptions(options);
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

    // If the user is not authenticated, prompt them to sign in
    if (!isAuthenticated) {
      setFormError("Please sign in or create an account to complete your booking.");
      return;
    }

    // Double-check vehicle availability before proceeding
    setLoading(true);
    setFormError(null);

    try {
      const supabase = createClientComponentClient();

      // Make an API call to check if the vehicle is still available for the selected dates
      const vehicleId = vehicle?.id || bike?.id;

      if (!vehicleId) {
        setFormError("Vehicle ID is missing.");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/vehicles/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
      });

      const availabilityData = await response.json();

      if (!availabilityData.available) {
        // Vehicle is not available for the selected dates
        // Find alternative dates
        const alternativeDates = await findAlternativeDates(vehicleId, startDate, endDate);

        if (alternativeDates.length > 0) {
          const formattedAlternatives = alternativeDates.map(period =>
            `${format(period.startDate, 'MMM d')} - ${format(period.endDate, 'MMM d, yyyy')}`
          ).join(', ');

          setFormError(
            `Sorry, this vehicle is no longer available for the selected dates. ` +
            `Alternative dates: ${formattedAlternatives}`
          );
        } else {
          setFormError(
            "Sorry, this vehicle is no longer available for the selected dates. " +
            "Please choose different dates or select another vehicle."
          );
        }

        setLoading(false);
        return;
      }

      // Calculate pricing
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const rentalPrice = rentalVehicle.price_per_day * days;
      const deliveryFeeAmount = deliveryOptions.find(o => o.id === deliveryOption)?.fee || 0;
      const totalPrice = rentalPrice + deliveryFeeAmount;

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();

      // We only proceed with authenticated users at this point

      // Generate a unique confirmation code
      const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Create a new booking record - handle both vehicle and bike paths
      let bookingData: any = {
        shop_id: shop.id,
        user_id: session?.user?.id, // User must be authenticated at this point
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        total_price: totalPrice,
        payment_method_id: paymentMethod === 'cash' ? '0bea770f-c0c2-4510-a22f-e42fc122eb9c' : 'c1cc5137-46dd-48c2-b91a-831d0a822c16', // Use the appropriate ID based on selection
        delivery_option_id: deliveryOption,
        status: "pending", // Initial status
        payment_status: "pending", // Initial payment status
        delivery_address: deliveryAddress,
        confirmation_code: confirmationCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString() // Add updated_at field
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

      // Check if the selected payment method is PayMongo
      if (paymentMethod === 'paymongo') {
        // Navigate to the payment page for online payment
        router.push(`/booking/payment/${booking.id}`);
      } else {
        // Navigate to the confirmation page for offline payment methods
        router.push(`/booking/confirmation/${booking.id}`);
      }

    } catch (error) {
      console.error("Booking error:", error);
      setFormError("An error occurred while processing your booking. Please try again.");
      setLoading(false);
    }
  };

  // Function to find alternative available dates
  const findAlternativeDates = async (vehicleId: string, initialStartDate: Date, initialEndDate: Date) => {
    const supabase = createClientComponentClient();
    const today = new Date();
    const alternativesCount = 3; // Number of alternatives to suggest

    const alternatives: DateRange[] = [];

    // Get existing bookings for this vehicle
    const { data: rentals, error: rentalsError } = await supabase
      .from('rentals')
      .select('id, start_date, end_date')
      .or(`vehicle_id.eq.${vehicleId},bike_id.eq.${vehicleId}`)
      .in('status', ['pending', 'confirmed'])
      .gte('end_date', today.toISOString().split('T')[0]);

    if (rentalsError) {
      console.error('Error fetching vehicle bookings:', rentalsError);
      return [];
    }

    // Convert to BookedPeriod objects
    const bookedPeriods: DateRange[] = (rentals || []).map(rental => ({
      startDate: new Date(rental.start_date),
      endDate: new Date(rental.end_date)
    }));

    // Get the rental duration
    const daysDifference = Math.ceil(
      (initialEndDate.getTime() - initialStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Try dates before the selected period
    const alternateBefore: DateRange = {
      startDate: subDays(initialStartDate, 7),
      endDate: subDays(initialEndDate, 7)
    };

    // Check if this period is available
    if (alternateBefore.startDate >= today &&
        !isDateRangeOverlapping(alternateBefore.startDate, alternateBefore.endDate, bookedPeriods)) {
      alternatives.push(alternateBefore);
    }

    // Try dates after the selected period
    const alternateAfter: DateRange = {
      startDate: addDays(initialStartDate, 7),
      endDate: addDays(initialEndDate, 7)
    };

    // Check if this period is available
    if (!isDateRangeOverlapping(alternateAfter.startDate, alternateAfter.endDate, bookedPeriods)) {
      alternatives.push(alternateAfter);
    }

    // Try an additional period further in the future
    const alternateFurther: DateRange = {
      startDate: addDays(initialStartDate, 14),
      endDate: addDays(initialEndDate, 14)
    };

    // Check if this period is available
    if (!isDateRangeOverlapping(alternateFurther.startDate, alternateFurther.endDate, bookedPeriods)) {
      alternatives.push(alternateFurther);
    }

    return alternatives.slice(0, alternativesCount);
  };

  // Helper function to check if a date range overlaps with any booked periods
  const isDateRangeOverlapping = (start: Date, end: Date, bookedPeriods: DateRange[]) => {
    return bookedPeriods.some(period => {
      // Check if either the start or end date falls within a booked period
      return (
        isWithinInterval(start, { start: period.startDate, end: period.endDate }) ||
        isWithinInterval(end, { start: period.startDate, end: period.endDate }) ||
        // Or if the date range completely encompasses a booked period
        (start <= period.startDate && end >= period.endDate)
      );
    });
  };

  // Conditional rendering for vehicle-specific options
  const renderVehicleSpecificOptions = () => {
    // Return null for all vehicle types to remove all options
    return null;
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
          onStartDateChange={(date) => {
            onStartDateChange(date);
            // Clear any existing date-related errors when the user changes dates
            if (formError && formError.includes("dates")) {
              setFormError(null);
            }
          }}
          onEndDateChange={(date) => {
            onEndDateChange(date);
            // Clear any existing date-related errors when the user changes dates
            if (formError && formError.includes("dates")) {
              setFormError(null);
            }
          }}
          vehicleId={vehicle?.id || bike?.id}
          showAvailabilityIndicator={true}
        />

        {/* Show a message if both dates are already selected */}
        {startDate && endDate && (
          <p className="text-xs text-primary/90 mt-1.5 flex items-center">
            <Info size={12} className="mr-1.5" />
            Dates pre-filled from your search. You can modify if needed.
          </p>
        )}

        <p className="text-xs text-white/60 mt-1.5">
          Dates in red are already booked and cannot be selected.
        </p>
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
          {/* Cash option (merged Cash on Delivery and Cash on Pickup) */}
          <label
            className={`flex items-start gap-2 p-3 rounded-md hover:bg-white/5 cursor-pointer border transition ${
              paymentMethod === 'cash'
                ? 'border-primary/50 bg-primary/5'
                : 'border-white/10'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={() => setPaymentMethod('cash')}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Cash Payment</div>
              <div className="text-sm text-white/70">Pay with cash when picking up or when the vehicle is delivered</div>
            </div>
          </label>

          {/* PayMongo option */}
          <label
            className={`flex items-start gap-2 p-3 rounded-md hover:bg-white/5 cursor-pointer border transition ${
              paymentMethod === 'paymongo'
                ? 'border-primary/50 bg-primary/5'
                : 'border-white/10'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="paymongo"
              checked={paymentMethod === 'paymongo'}
              onChange={() => setPaymentMethod('paymongo')}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Online Payment</div>
              <div className="text-sm text-white/70">Pay online with credit/debit card, GCash, or other e-wallets</div>
            </div>
          </label>
        </div>
      </div>

      {/* Authentication prompt for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 my-4">
          <h3 className="text-lg font-medium mb-2 text-primary">Sign In Required</h3>
          <p className="text-white/80 mb-3">
            You need to sign in or create an account to complete your booking.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push(`/sign-in`)}
              className="bg-primary hover:bg-primary/90"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push(`/sign-up`)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
            >
              Create Account
            </Button>
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
            I agree to the <TermsAndConditions><span className="text-primary hover:underline cursor-pointer">terms and conditions</span></TermsAndConditions> and understand that
            {shop.requires_id_deposit && shop.requires_cash_deposit ? (
              ` I will need to provide a valid ID and a cash deposit of ₱${shop.cash_deposit_amount} when collecting the vehicle.`
            ) : shop.requires_id_deposit ? (
              " I will need to provide a valid ID as deposit when collecting the vehicle."
            ) : shop.requires_cash_deposit ? (
              ` I will need to provide a cash deposit of ₱${shop.cash_deposit_amount} when collecting the vehicle.`
            ) : (
              " no deposit is required for this rental."
            )}
          </span>
        </label>
      </div>

      {/* Submit button */}
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full"
          disabled={loading || !isAuthenticated}
        >
          {loading ? "Processing..." : isAuthenticated ? "Confirm Booking" : "Sign In to Book"}
        </Button>
      </div>
    </form>
  );
}