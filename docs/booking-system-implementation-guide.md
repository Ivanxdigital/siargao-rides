# Siargao Rides: Booking System Implementation Guide

## Overview

This document provides a step-by-step guide for implementing a booking system for Siargao Rides. The initial implementation will focus on cash payments only, where users pay directly to the shop when picking up the bike or when it's delivered. PayMongo integration for online payments will be added in a future update.

## User Flow

1. User visits a shop page (`/shop/[id]`)
2. User browses available bikes
3. User clicks "Book This Bike" button on a bike card
4. User is taken to a booking form page
5. User selects rental dates and delivery options
6. User chooses a payment method (Cash on Pickup, Cash on Delivery, or GCash Direct to shop owner)
7. User completes booking process
8. Shop owner receives notification and confirms the booking
9. User receives confirmation with pickup/delivery details
10. User pays the shop directly with their chosen payment method
11. Shop owner marks the booking as completed after the rental period ends

## Phase 1: Database Schema Extensions

Based on the current database schema, we need to add several tables to support the booking system functionality.

### SQL Code for Database Changes

```sql
-- Create payment_methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  provider TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create delivery_options table
CREATE TABLE delivery_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  fee NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create booking_statuses table for standardized status values
CREATE TABLE booking_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payment_statuses table for standardized payment status values
CREATE TABLE payment_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enhance existing rentals table with additional fields for booking
ALTER TABLE rentals 
  ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id),
  ADD COLUMN delivery_option_id UUID REFERENCES delivery_options(id),
  ADD COLUMN delivery_address TEXT,
  ADD COLUMN payment_reference TEXT,
  ADD COLUMN payment_intent_id TEXT,
  ADD COLUMN payment_amount NUMERIC,
  ADD COLUMN payment_fee NUMERIC DEFAULT 0,
  ADD COLUMN payment_date TIMESTAMPTZ,
  ADD COLUMN booking_notes TEXT,
  ADD COLUMN expires_at TIMESTAMPTZ,
  ADD COLUMN cancellation_reason TEXT,
  ADD COLUMN cancelled_at TIMESTAMPTZ,
  ADD COLUMN cancelled_by UUID REFERENCES users(id),
  ADD COLUMN confirmation_code TEXT;

-- Insert initial data for payment methods
INSERT INTO payment_methods (name, description, is_online, provider, is_active)
VALUES 
  ('Cash on Pickup', 'Pay with cash when picking up the bike', FALSE, NULL, TRUE),
  ('Cash on Delivery', 'Pay with cash when the bike is delivered', FALSE, NULL, TRUE),
  ('GCash Direct', 'Pay with GCash directly to the shop owner', FALSE, NULL, TRUE);

-- Insert initial data for delivery options
INSERT INTO delivery_options (name, description, fee, is_active)
VALUES 
  ('Self Pickup', 'Pick up the bike at the shop location', 0, TRUE),
  ('Delivery to Accommodation', 'Have the bike delivered to your accommodation', 300, TRUE);

-- Insert initial booking statuses
INSERT INTO booking_statuses (status, description)
VALUES 
  ('pending', 'Booking has been created but not confirmed'),
  ('confirmed', 'Booking has been confirmed by the shop'),
  ('in_progress', 'Rental period has started'),
  ('completed', 'Rental has been completed'),
  ('cancelled', 'Booking was cancelled'),
  ('expired', 'Booking expired due to no confirmation or payment');

-- Insert initial payment statuses
INSERT INTO payment_statuses (status, description)
VALUES 
  ('pending', 'Payment is pending'),
  ('processing', 'Payment is being processed'),
  ('paid', 'Payment has been completed'),
  ('failed', 'Payment attempt failed'),
  ('refunded', 'Payment has been refunded'),
  ('partially_refunded', 'Payment has been partially refunded');

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment_methods table
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for delivery_options table
CREATE TRIGGER update_delivery_options_updated_at
BEFORE UPDATE ON delivery_options
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## Phase 2: Booking Page and Flow Implementation

### 1. Modify Shop Page - Connect Book Button to Booking Flow

Update the `handleBookClick` function in `src/app/shop/[id]/page.tsx` to navigate to the new booking page:

```typescript
const handleBookClick = (bikeId: string) => {
  router.push(`/booking/${bikeId}?shop=${id}`);
};
```

### 2. Create Booking Page

Create a new page at `src/app/booking/[bikeId]/page.tsx` that will handle the booking process:

```typescript
// src/app/booking/[bikeId]/page.tsx
"use client"

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BookingForm from "@/components/BookingForm";
import BookingSummary from "@/components/BookingSummary";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Bike, RentalShop } from "@/lib/types";

export default function BookingPage() {
  const { bikeId } = useParams();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shop");
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [bike, setBike] = useState<Bike | null>(null);
  const [shop, setShop] = useState<RentalShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch bike and shop data
    // This will be implemented to load the selected bike and shop details
  }, [bikeId, shopId]);

  // Implement the booking page with form and summary components
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Book Your Bike</h1>
      
      {loading ? (
        <div>Loading booking details...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <BookingForm 
              bike={bike} 
              shop={shop}
              user={user}
              isAuthenticated={isAuthenticated}
            />
          </div>
          <div className="lg:col-span-1">
            <BookingSummary 
              bike={bike} 
              shop={shop}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Create BookingForm Component

Create a new component at `src/components/BookingForm.tsx`:

```typescript
// src/components/BookingForm.tsx
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function BookingForm({ bike, shop, user, isAuthenticated }) {
  // State for form fields
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [deliveryOption, setDeliveryOption] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const router = useRouter();
  
  // Fetch delivery options and payment methods
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const supabase = createClientComponentClient();
        
        // Fetch delivery options
        const { data: deliveryData } = await supabase
          .from("delivery_options")
          .select("*")
          .eq("is_active", true);
          
        setDeliveryOptions(deliveryData || []);
        
        // Fetch payment methods (cash only for now)
        const { data: paymentData } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("is_active", true)
          .eq("is_online", false); // Only get offline payment methods
          
        setPaymentMethods(paymentData || []);
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    
    fetchOptions();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeToTerms) {
      alert("You must agree to the terms and conditions");
      return;
    }
    
    setLoading(true);
    try {
      // Check availability
      const availabilityResponse = await fetch("/api/bookings/check-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bikeId: bike.id,
          startDate,
          endDate,
        }),
      });
      
      const availabilityData = await availabilityResponse.json();
      if (!availabilityData.isAvailable) {
        alert("Sorry, this bike is not available for the selected dates.");
        setLoading(false);
        return;
      }
      
      // Calculate price
      const priceResponse = await fetch("/api/bookings/calculate-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bikeId: bike.id,
          startDate,
          endDate,
          deliveryOptionId: deliveryOption,
        }),
      });
      
      const priceData = await priceResponse.json();
      
      // Create booking
      const bookingResponse = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bikeId: bike.id,
          shopId: shop.id,
          startDate,
          endDate,
          deliveryOptionId: deliveryOption,
          deliveryAddress,
          paymentMethodId: paymentMethod,
          userId: user?.id,
          guestDetails: !user ? {
            // Collect guest details if user is not logged in
            name: document.getElementById("guest-name")?.value,
            email: document.getElementById("guest-email")?.value,
            phone: document.getElementById("guest-phone")?.value,
          } : null,
          total: priceData.total,
          subtotal: priceData.subtotal,
          deliveryFee: priceData.deliveryFee,
        }),
      });
      
      const bookingData = await bookingResponse.json();
      
      if (bookingData.error) {
        throw new Error(bookingData.error);
      }
      
      // Redirect to confirmation page
      router.push(`/booking/confirmation/${bookingData.bookingId}`);
      
    } catch (error) {
      console.error("Booking error:", error);
      alert("There was an error creating your booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rental period selection */}
      <div>
        <h3 className="text-lg font-medium mb-2">Select Rental Period</h3>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>
      
      {/* Delivery options */}
      <div>
        <h3 className="text-lg font-medium mb-2">Delivery Options</h3>
        <div className="space-y-2">
          {deliveryOptions.map((option) => (
            <label key={option.id} className="flex items-start gap-2 p-3 border rounded-md hover:bg-muted/10 cursor-pointer">
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
                <div className="text-sm text-muted-foreground">{option.description}</div>
                {option.fee > 0 && (
                  <div className="text-sm mt-1">Fee: ₱{option.fee.toFixed(2)}</div>
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
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Enter your delivery address..."
            required
          />
        </div>
      )}
      
      {/* Payment methods */}
      <div>
        <h3 className="text-lg font-medium mb-2">Payment Method</h3>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <label key={method.id} className="flex items-start gap-2 p-3 border rounded-md hover:bg-muted/10 cursor-pointer">
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
                <div className="text-sm text-muted-foreground">{method.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* User details (if not logged in) */}
      {!isAuthenticated && (
        <div>
          <h3 className="text-lg font-medium mb-2">Your Details</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="guest-name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="guest-name"
                type="text"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="guest-email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                id="guest-email"
                type="email"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="guest-phone" className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <input
                id="guest-phone"
                type="tel"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Terms and conditions */}
      <div className="flex items-start">
        <input
          type="checkbox"
          id="terms"
          checked={agreeToTerms}
          onChange={(e) => setAgreeToTerms(e.target.checked)}
          className="mt-1 mr-2"
        />
        <label htmlFor="terms" className="text-sm">
          I agree to the <a href="/terms" className="text-primary">terms and conditions</a>, 
          including providing a valid ID as deposit when picking up the bike.
        </label>
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={loading || !startDate || !endDate || !deliveryOption || !paymentMethod || !agreeToTerms}
      >
        {loading ? "Processing..." : "Complete Booking"}
      </Button>
    </form>
  );
}
```

### 4. Create BookingSummary Component

Create a new component at `src/components/BookingSummary.tsx`:

```typescript
// src/components/BookingSummary.tsx
"use client"

import { useState, useEffect } from "react";
import Image from "next/image";

export default function BookingSummary({ bike, shop, startDate, endDate, deliveryOption, paymentMethod }) {
  const [totalDays, setTotalDays] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Calculate rental duration and costs
  useEffect(() => {
    if (startDate && endDate) {
      // Calculate days, prices, etc.
    }
  }, [startDate, endDate, bike, deliveryOption]);
  
  return (
    <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-5 shadow-sm sticky top-6">
      <h3 className="font-semibold mb-4 text-lg pb-2 border-b border-white/10">Booking Summary</h3>
      
      {/* Bike details */}
      <div className="flex items-center gap-3 mb-4">
        {bike?.images && bike.images[0] && (
          <div className="w-20 h-20 relative rounded-md overflow-hidden">
            <Image
              src={bike.images[0].image_url}
              alt={bike.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div>
          <h4 className="font-medium">{bike?.name || "Bike"}</h4>
          <p className="text-sm text-white/70">{shop?.name || "Shop"}</p>
        </div>
      </div>
      
      {/* Price breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-white/70">Rental Period:</span>
          <span>{totalDays} days</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/70">Subtotal:</span>
          <span>₱{subtotal.toFixed(2)}</span>
        </div>
        {deliveryOption && (
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Delivery Fee:</span>
            <span>₱{deliveryFee.toFixed(2)}</span>
          </div>
        )}
      </div>
      
      {/* Total */}
      <div className="border-t border-white/10 pt-3 mt-3">
        <div className="flex justify-between">
          <span className="font-medium">Total:</span>
          <span className="text-lg font-semibold">₱{total.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Refund policy info */}
      <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs">
        <p className="text-yellow-400 font-medium mb-1">Cancellation Policy</p>
        <p className="text-white/80">Free cancellation up to 24 hours before pickup. Please note that a valid ID will be required as a deposit.</p>
      </div>
    </div>
  );
}
```

### 5. Create a DateRangePicker Component

If you don't already have one, create a `DateRangePicker` component:

```typescript
// src/components/DateRangePicker.tsx
"use client"

import { useState } from "react";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startDate && endDate ? (
            <>
              {format(startDate, "PPP")} - {format(endDate, "PPP")}
            </>
          ) : (
            <span>Select date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{
            from: startDate,
            to: endDate,
          }}
          onSelect={(range) => {
            onStartDateChange(range?.from);
            onEndDateChange(range?.to);
            if (range?.from && range?.to) {
              setIsCalendarOpen(false);
            }
          }}
          numberOfMonths={2}
          disabled={(date) => {
            // Disable past dates
            return date < new Date();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
```

## Phase 3: API Routes Implementation

### 1. Check Availability API

Create an API route at `src/app/api/bookings/check-availability/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const body = await request.json();
    const { bikeId, startDate, endDate } = body;
    
    if (!bikeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if the bike exists and is available
    const { data: bike, error: bikeError } = await supabase
      .from("bikes")
      .select("*")
      .eq("id", bikeId)
      .eq("is_available", true)
      .single();
      
    if (bikeError || !bike) {
      return NextResponse.json(
        { error: "Bike not available" },
        { status: 404 }
      );
    }
    
    // Check for overlapping bookings
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("rentals")
      .select("*")
      .eq("bike_id", bikeId)
      .or(
        `status.eq.pending,status.eq.confirmed,status.eq.in_progress`
      )
      .or(
        `and(start_date.lte.${endDate},end_date.gte.${startDate})`
      );
      
    if (bookingsError) {
      return NextResponse.json(
        { error: "Error checking availability" },
        { status: 500 }
      );
    }
    
    const isAvailable = existingBookings.length === 0;
    
    return NextResponse.json({ isAvailable });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Error checking availability" },
      { status: 500 }
    );
  }
}
```

### 2. Calculate Price API

Create an API route at `src/app/api/bookings/calculate-price/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const body = await request.json();
    const { bikeId, startDate, endDate, deliveryOptionId } = body;
    
    if (!bikeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get bike pricing data
    const { data: bike, error: bikeError } = await supabase
      .from("bikes")
      .select("*")
      .eq("id", bikeId)
      .single();
      
    if (bikeError || !bike) {
      return NextResponse.json(
        { error: "Bike not found" },
        { status: 404 }
      );
    }
    
    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 0) {
      return NextResponse.json(
        { error: "Invalid date range" },
        { status: 400 }
      );
    }
    
    // Calculate rental price based on duration
    let rentalPrice = 0;
    
    // For longer rentals, apply weekly/monthly rates if available
    if (daysDiff >= 30 && bike.price_per_month) {
      const months = Math.floor(daysDiff / 30);
      const remainingDays = daysDiff % 30;
      rentalPrice = months * bike.price_per_month;
      
      if (remainingDays > 0) {
        if (remainingDays >= 7 && bike.price_per_week) {
          const weeks = Math.floor(remainingDays / 7);
          const remainingDaysAfterWeeks = remainingDays % 7;
          rentalPrice += weeks * bike.price_per_week;
          rentalPrice += remainingDaysAfterWeeks * bike.price_per_day;
        } else {
          rentalPrice += remainingDays * bike.price_per_day;
        }
      }
    } else if (daysDiff >= 7 && bike.price_per_week) {
      const weeks = Math.floor(daysDiff / 7);
      const remainingDays = daysDiff % 7;
      rentalPrice = weeks * bike.price_per_week;
      rentalPrice += remainingDays * bike.price_per_day;
    } else {
      rentalPrice = daysDiff * bike.price_per_day;
    }
    
    // Calculate delivery fee if applicable
    let deliveryFee = 0;
    if (deliveryOptionId) {
      const { data: deliveryOption } = await supabase
        .from("delivery_options")
        .select("fee")
        .eq("id", deliveryOptionId)
        .single();
        
      if (deliveryOption) {
        deliveryFee = deliveryOption.fee;
      }
    }
    
    // Calculate total
    const subtotal = rentalPrice;
    const total = subtotal + deliveryFee;
    
    return NextResponse.json({
      subtotal,
      deliveryFee,
      total,
      days: daysDiff,
    });
  } catch (error) {
    console.error("Error calculating price:", error);
    return NextResponse.json(
      { error: "Error calculating price" },
      { status: 500 }
    );
  }
}
```

### 3. Create Booking API

Create an API route at `src/app/api/bookings/create/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generateConfirmationCode } from "@/lib/utils";

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      bikeId, 
      shopId, 
      startDate, 
      endDate, 
      deliveryOptionId, 
      deliveryAddress,
      paymentMethodId,
      userId,
      guestDetails,
      total,
      subtotal,
      deliveryFee
    } = body;
    
    // Validate required fields
    if (!bikeId || !shopId || !startDate || !endDate || !deliveryOptionId || !paymentMethodId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if the user is authenticated or get guest user info
    let bookingUserId = userId;
    if (!bookingUserId && !guestDetails) {
      return NextResponse.json(
        { error: "User not authenticated or guest details missing" },
        { status: 401 }
      );
    }
    
    // Create a temporary user for guests if needed
    if (!bookingUserId && guestDetails) {
      // Store guest details in a separate table or use a guest user account
      // This is a simplified example - in production, you'd want to handle this differently
      const { data: guestUser, error: guestUserError } = await supabase
        .from("guest_users")
        .insert({
          name: guestDetails.name,
          email: guestDetails.email,
          phone: guestDetails.phone
        })
        .select()
        .single();
        
      if (guestUserError) {
        console.error("Error creating guest user:", guestUserError);
        return NextResponse.json(
          { error: "Failed to create guest user" },
          { status: 500 }
        );
      }
      
      bookingUserId = guestUser.id;
    }
    
    // Check if the bike is available for the selected dates
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("rentals")
      .select("*")
      .eq("bike_id", bikeId)
      .or(
        `status.eq.pending,status.eq.confirmed,status.eq.in_progress`
      )
      .or(
        `and(start_date.lte.${endDate},end_date.gte.${startDate})`
      );
      
    if (bookingsError) {
      console.error("Error checking availability:", bookingsError);
      return NextResponse.json(
        { error: "Error checking availability" },
        { status: 500 }
      );
    }
    
    const isAvailable = existingBookings.length === 0;
    if (!isAvailable) {
      return NextResponse.json(
        { error: "Bike is not available for the selected dates" },
        { status: 409 }
      );
    }
    
    // Generate a unique confirmation code
    const confirmationCode = generateConfirmationCode();
    
    // Set initial status and expiration date
    const status = "pending"; // All bookings start as pending until confirmed by shop owner
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire in 24 hours if not confirmed
    
    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from("rentals")
      .insert({
        bike_id: bikeId,
        shop_id: shopId,
        user_id: bookingUserId,
        start_date: startDate,
        end_date: endDate,
        payment_method_id: paymentMethodId,
        delivery_option_id: deliveryOptionId,
        delivery_address: deliveryAddress || null,
        status,
        payment_amount: total,
        expires_at: expiresAt.toISOString(),
        confirmation_code: confirmationCode,
        rental_subtotal: subtotal,
        payment_fee: deliveryFee,
      })
      .select()
      .single();
      
    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }
    
    // Send notification to shop owner (implementation will depend on your notification system)
    // This could be an email, SMS, or in-app notification
    
    // Return booking confirmation
    return NextResponse.json({
      bookingId: booking.id,
      confirmationCode,
      redirectUrl: `/booking/confirmation/${booking.id}`
    });
    
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
```

## Phase 4: Cash Payment System

For the initial implementation, we will only support cash payments where users pay directly to the shop when picking up the bike or when it's delivered. PayMongo integration will be added in a future update.

### Payment Flow

1. User selects dates and delivery options
2. User chooses a payment method (Cash on Pickup, Cash on Delivery, or GCash Direct to shop owner)
3. Booking is created with "pending" status
4. Shop owner receives notification of new booking
5. Shop owner confirms the booking
6. User receives confirmation and pickup/delivery details

### API Routes

1. **Confirm Cash Booking API**
   - Endpoint: `/api/bookings/confirm`
   - Purpose: For shop owners to confirm cash bookings

2. **Cancel Booking API**
   - Endpoint: `/api/bookings/cancel`
   - Purpose: Allow users or shop owners to cancel bookings

### Booking Management for Shop Owners

Create a booking management interface for shop owners that allows them to:
1. View all pending bookings
2. Confirm or reject bookings
3. Contact customers
4. Mark bookings as completed when the rental period ends

### Booking Management for Users

Create a booking management interface for users that allows them to:
1. View their booking history
2. See the status of current bookings
3. Cancel bookings (if cancellation policy allows)
4. Contact the shop

## Implementation Timeline

1. **Week 1: Database Setup**
   - Implement all database schema changes
   - Test relationships and queries

2. **Week 2: Booking Flow Implementation**
   - Update shop page to connect "Book This Bike" buttons
   - Create booking page and form components
   - Implement price calculation functionality

3. **Week 3: API Routes & Confirmation**
   - Implement all API routes for the booking system
   - Create booking confirmation page
   - Add email notification functionality

4. **Week 4: Cash Payment & Booking Management**
   - Implement booking management for shop owners
   - Create booking history page for users
   - Add confirmation/cancellation functionality

5. **Week 5: Testing & Refinement**
   - Perform end-to-end testing
   - Refine user experience
   - Deploy to production environment

## Future Enhancements

1. **PayMongo Integration**
   - Add online payment capabilities using PayMongo
   - Implement credit/debit card processing
   - Add GCash and Maya payment options

2. **Additional Features**
   - **Calendar UI Components**: Implemented UI components for the booking system, including:
     - Calendar component using react-day-picker
     - Popover component using Radix UI
     - DateRangePicker component for selecting rental periods
   - **PayMongo Integration**: Will be implemented in a future phase.
   - **Booking Management**: Will allow shop owners to manage their bookings.

## Troubleshooting & Support

For implementation questions, please contact the development team.

Remember to test all payment flows in sandbox mode before going live with PayMongo. 