# Chapter 5: Booking System

Welcome back! In [Chapter 4: Data Service & API Layers (`src/lib/service.ts`, `src/lib/api.ts`)](04_data_service___api_layers___src_lib_service_ts____src_lib_api_ts__.md), we saw how our app organizes fetching data, using a "librarian" (`service.ts`) to get information, sometimes using mock data and sometimes calling the "storage room worker" (`api.ts`) for real data from Supabase.

Now, let's look at one of the most important features: how does a user actually rent a motorbike? This is handled by the **Booking System**.

## What Problem Does the Booking System Solve? Handling the Rental Process

Imagine you've found the perfect motorbike on the Siargao Rides website. How do you actually reserve it for your trip? You need to:

1.  Make sure it's **available** for the dates you want.
2.  Know the **price** for that rental period.
3.  Provide your **dates** and maybe some personal **information**.
4.  Arrange **payment** (online or cash).
5.  Get a **confirmation** that the bike is reserved for you.

Doing all this manually would be chaotic! The Booking System automates this entire process. It acts like the **rental counter** at a physical shop, guiding you through all the steps to secure your ride.

## Meet the "Rental Counter": The Booking System

The Booking System isn't just one file; it's a collection of components, API routes, and database interactions working together to manage the rental process. It handles everything from the moment you click "Book Now" until you receive your confirmation.

**Key Steps Handled by the Booking System:**

1.  **Checking Availability:** Before you can book, the system needs to check if the specific vehicle is free during your chosen dates. It looks at the `rentals` table in our [Supabase Backend & Admin Client](02_supabase_backend___admin_client_.md) database to see if there are any existing, confirmed bookings that overlap.
2.  **Calculating Prices:** Based on the vehicle's daily rate and the number of days you select, the system calculates the rental cost. It might also add fees for optional extras like delivery.
3.  **Handling Dates:** You select your start and end dates using a calendar interface. The system validates these dates (making sure the end date is after the start date).
4.  **Collecting Information:** It needs to know *who* is booking (using [Authentication & User Roles (AuthContext)](03_authentication___user_roles__authcontext__.md)) and potentially collect guest details if the user isn't logged in (though we usually require login for bookings). It also collects the chosen dates and payment method.
5.  **Processing Payments (or Cash):** If you choose online payment, it interacts with the [Payment System (PayMongo)](07_payment_system__paymongo__.md) to handle the transaction securely. If you choose cash, it notes this down and might trigger a deposit requirement.
6.  **Confirming Reservation:** Once availability is confirmed and payment is handled (or noted as cash), the system saves the booking details into the `rentals` table in the database with a status like `pending` or `confirmed`. It then shows you a confirmation page.

## How a Booking Happens: The User Flow

Let's trace the steps when you book a motorbike:

1.  **Browse & Select:** You find a motorbike you like on the website.
2.  **Choose Dates:** On the vehicle details page, you select your rental start and end dates using a calendar.
3.  **Check Price & Availability (Behind the Scenes):** As you select dates, the frontend might quietly ask the backend ([API Routes (`src/app/api/`)](01_api_routes___src_app_api____.md)) "Is this bike available?" and "What's the price?".
4.  **Fill Booking Form:** You proceed to the booking page (`src/app/booking/[vehicleId]/page.tsx`). Here, you see a summary and might confirm details or choose delivery/payment options using components like `BookingForm.tsx` and `BookingSummary.tsx`.
5.  **Click "Confirm Booking":** This triggers the core booking logic.
6.  **API Call:** Your browser sends a request to the `/api/create-booking` [API Route (`src/app/api/`)](01_api_routes___src_app_api____.md) with all the details (vehicle ID, dates, user info, payment choice).
7.  **Backend Processing (`/api/create-booking`):**
    *   The API route receives the request.
    *   It double-checks your authentication ([Chapter 3](03_authentication___user_roles__authcontext__.md)).
    *   It performs a final check for vehicle availability in the [Supabase Backend & Admin Client](02_supabase_backend___admin_client_.md).
    *   It verifies the price calculation.
    *   It saves the new booking record to the `rentals` table in Supabase.
    *   It might prepare for payment processing ([Chapter 7](07_payment_system__paymongo__.md)).
8.  **Response & Redirect:** The API route sends a success message back to your browser. The browser then redirects you to either a payment page or a confirmation page (`src/app/booking/confirmation/[id]/page.tsx`).
9.  **Confirmation:** You see a page confirming your booking details, status, and booking ID.

## Key API Routes Involved

The backend logic for booking relies heavily on specific [API Routes (`src/app/api/`)](01_api_routes___src_app_api____.md):

### 1. Checking Availability (`/api/check-availability`)

The frontend calls this to see if a vehicle is free for certain dates *before* trying to book.

```typescript
// Simplified: src/app/api/check-availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { vehicleId, startDate, endDate } = await request.json();
  const supabase = createServerComponentClient({ cookies });

  // TODO: Validate input dates

  // Query Supabase for rentals that overlap with the requested dates
  const { data: overlappingBookings, error } = await supabase
    .from('rentals')
    .select('id')
    .eq('vehicle_id', vehicleId)
    // Only check confirmed/pending bookings
    .or(`status.eq.pending,status.eq.confirmed`)
    // Check if rental range overlaps query range
    .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

  // Handle potential errors from Supabase
  if (error) { /* ... error handling ... */ }

  // If no overlapping bookings found, it's available
  const isAvailable = !overlappingBookings || overlappingBookings.length === 0;

  return NextResponse.json({ available: isAvailable });
}
```

**Explanation:**

*   It receives the `vehicleId`, `startDate`, and `endDate` from the frontend.
*   It connects to Supabase ([Chapter 2](02_supabase_backend___admin_client_.md)).
*   It queries the `rentals` table for any existing `pending` or `confirmed` bookings for that vehicle that overlap with the requested dates.
*   It returns `true` if no overlaps are found, `false` otherwise.

### 2. Calculating Price (`/api/calculate-price`)

The frontend might call this to get an accurate price based on the selected dates and options (like delivery).

```typescript
// Simplified: src/app/api/calculate-price/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { differenceInCalendarDays } from 'date-fns'; // Date helper library

export async function POST(request: NextRequest) {
  const { vehicleId, startDate, endDate, deliveryOptionId } = await request.json();
  const supabase = createServerComponentClient({ cookies });

  // TODO: Validate input

  // 1. Get vehicle's daily price from Supabase
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('price_per_day')
    .eq('id', vehicleId)
    .single();

  // 2. Calculate number of days
  const days = differenceInCalendarDays(new Date(endDate), new Date(startDate));

  // 3. Calculate rental cost
  const rentalPrice = vehicle.price_per_day * days;

  // 4. Get delivery fee (if applicable) from Supabase
  let deliveryFee = 0;
  if (deliveryOptionId) { /* ... fetch delivery fee ... */ }

  // 5. Calculate total
  const totalPrice = rentalPrice + deliveryFee;

  return NextResponse.json({ totalPrice: totalPrice /*, breakdown */ });
}
```

**Explanation:**

*   It receives vehicle ID, dates, and maybe delivery info.
*   It fetches the vehicle's `price_per_day` from Supabase.
*   It calculates the number of rental days using `differenceInCalendarDays`.
*   It calculates the base rental cost.
*   It fetches and adds any delivery fee.
*   It returns the calculated `totalPrice`.

### 3. Creating the Booking (`/api/create-booking`)

This is the core API route called when the user confirms their booking.

```typescript
// Simplified: src/app/api/create-booking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
// Import the function to block dates
import { blockDatesForBooking } from '@/lib/bookings';

export async function POST(request: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const bookingDetails = await request.json(); // Get details from frontend

  // 1. Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { /* ... return error: Unauthorized ... */ }

  // 2. TODO: Validate received bookingDetails (dates, IDs, etc.)

  // 3. Final Availability Check (similar to /api/check-availability)
  const isAvailable = true; // Assume available after check
  if (!isAvailable) { /* ... return error: Not Available ... */ }

  // 4. TODO: Verify Price (recalculate and compare with frontend price)

  // 5. Prepare data for the 'rentals' table
  const newBookingData = {
    vehicle_id: bookingDetails.vehicleId,
    shop_id: bookingDetails.shopId, // Need shop ID too!
    user_id: session.user.id,
    start_date: bookingDetails.startDate,
    end_date: bookingDetails.endDate,
    total_price: bookingDetails.totalPrice, // Use verified price
    status: 'pending', // Or 'confirmed' depending on payment
    payment_method_id: bookingDetails.paymentMethodId,
    // ... other fields like delivery info, guest info (if needed)
  };

  // 6. Insert the new booking into the database
  const { data: booking, error } = await supabase
    .from('rentals')
    .insert(newBookingData)
    .select() // Get the newly created booking back
    .single();

  if (error) { /* ... return error: Booking Failed ... */ }

  // 7. Block the dates for this booking (if successful)
  if (booking) {
    try {
      await blockDatesForBooking(booking.id);
      console.log(`Dates blocked for booking ${booking.id}`);
    } catch (blockError) {
      console.error(`Failed to block dates for booking ${booking.id}:`, blockError);
      // Decide if this is critical - maybe log it and continue
    }
  }

  // 8. Return success response with the new booking ID
  return NextResponse.json({ success: true, booking: booking });
}
```

**Explanation:**

*   It receives all booking details from the `BookingForm.tsx`.
*   It checks authentication using [AuthContext](03_authentication___user_roles__authcontext__.md).
*   It performs final validation and availability checks against the [Supabase Backend & Admin Client](02_supabase_backend___admin_client_.md).
*   It prepares the data matching the columns in the `rentals` table.
*   It uses `supabase.from('rentals').insert(...)` to save the booking.
*   **Important:** After successfully inserting the booking, it calls `blockDatesForBooking` (defined in `src/lib/bookings.ts`) to mark those dates as unavailable in a separate `blocked_dates` table, making availability checks faster.
*   It sends back a success response, usually containing the ID of the newly created booking.

## Under the Hood: The Booking Flow

Here's a simplified sequence diagram showing the flow when a user clicks "Confirm Booking" and pays online:

```mermaid
sequenceDiagram
    participant Browser (User)
    participant Booking Page (Frontend)
    participant API Route (/api/create-booking)
    participant Supabase DB
    participant Payment System (e.g., PayMongo)

    Browser (User)->>Booking Page (Frontend): Clicks "Confirm Booking"
    Booking Page (Frontend)->>+API Route (/api/create-booking): POST Request (Booking Details)
    API Route (/api/create-booking)->>Supabase DB: Check Authentication
    Supabase DB-->>API Route (/api/create-booking): User Authenticated
    API Route (/api/create-booking)->>Supabase DB: Final Check Availability (vehicleId, dates)
    Supabase DB-->>API Route (/api/create-booking): Vehicle Available
    API Route (/api/create-booking)->>API Route (/api/create-booking): Verify Price Calculation
    API Route (/api/create-booking)->>Supabase DB: Insert New Booking (status: pending)
    Supabase DB-->>API Route (/api/create-booking): Booking Record Created (ID: booking123)
    API Route (/api/create-booking)->>Supabase DB: Block Dates for Booking (booking123)
    Supabase DB-->>API Route (/api/create-booking): Dates Blocked
    API Route (/api/create-booking)-->>-Booking Page (Frontend): Success Response (bookingId: booking123)
    Booking Page (Frontend)->>Browser (User): Redirect to Payment Page
    Browser (User)->>Payment System (e.g., PayMongo): Completes Payment
    Payment System (e.g., PayMongo)->>API Route (Payment Webhook): Payment Successful Notification
    activate API Route (Payment Webhook)
    API Route (Payment Webhook)->>Supabase DB: Update Booking Status (booking123 -> confirmed)
    Supabase DB-->>API Route (Payment Webhook): Status Updated
    deactivate API Route (Payment Webhook)
    Browser (User)->>Booking Page (Frontend): Redirected to Confirmation Page
    Booking Page (Frontend)->>Supabase DB: Fetch Confirmed Booking Details (booking123)
    Supabase DB-->>Booking Page (Frontend): Booking Details
    Booking Page (Frontend)->>Browser (User): Display Confirmation
```

**Note:** The payment step involves more complexity, including webhooks to update the booking status after payment, which is covered in [Chapter 7: Payment System (PayMongo)](07_payment_system__paymongo__.md). For cash payments, the flow might redirect to a deposit page or directly to confirmation with a 'pending payment' status.

## Conclusion

The Booking System is the core workflow for users renting vehicles in Siargao Rides Summarised.

*   It manages the entire process: checking availability, calculating prices, collecting details, handling payments (or cash options), and confirming the reservation.
*   It relies on frontend components (`BookingForm.tsx`, `BookingSummary.tsx`, date pickers) for user interaction.
*   It uses backend [API Routes (`src/app/api/`)](01_api_routes___src_app_api____.md) like `/api/check-availability`, `/api/calculate-price`, and `/api/create-booking` to perform secure actions.
*   These API routes interact heavily with the [Supabase Backend & Admin Client](02_supabase_backend___admin_client_.md) to read vehicle data, check existing bookings, and save new ones in the `rentals` table.
*   It ensures users are logged in ([Chapter 3](03_authentication___user_roles__authcontext__.md)) and integrates with the [Payment System (PayMongo)](07_payment_system__paymongo__.md).

Now that we understand how users book vehicles, how do shop owners manage their shops and list the vehicles available for booking?

Let's move on to [Chapter 6: Shop & Vehicle Management](06_shop___vehicle_management_.md)!

---

Generated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)