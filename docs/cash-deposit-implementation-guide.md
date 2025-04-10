# Cash Deposit Implementation Guide

This document outlines the implementation plan for requiring a 300 PHP deposit for cash payment bookings to prevent ghost bookings.

## Overview

When users choose cash payment in the booking form, they will be required to pay a 300 PHP deposit through PayMongo to secure their booking. If the user doesn't show up to pick up the vehicle, the shop owner gets to keep the deposit.

## Implementation Progress

### Database Changes
- [x] Add deposit-related fields to rentals table
- [x] Create index for faster queries

### BookingForm Component Updates
- [x] Update payment method section to explain deposit requirement
- [x] Add logic to set deposit_required and deposit_amount when cash payment is selected
- [x] Modify form submission to handle deposit flow
- [x] Update UI to show deposit information

### Deposit Payment Flow
- [x] Create API endpoint for deposit payment intents
- [x] Create specialized DepositPayMongoForm component for deposit payments
- [x] Create deposit payment page
- [x] Handle deposit payment success/failure

### Booking Status Logic
- [x] Update booking creation logic for cash payments with deposit
- [x] Modify payment webhook to handle deposit payments
- [x] Update payment APIs to handle deposit payments
- [x] Only block dates on calendar after deposit is paid
- [x] Update booking confirmation page to show deposit status

### Shop Owner Payouts
- [x] Create system to track deposits for no-shows
- [x] Add admin functionality to process payouts to shop owners

## Technical Details

### Database Schema Changes

```sql
-- Add deposit-related fields to rentals table
ALTER TABLE rentals
  ADD COLUMN deposit_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN deposit_amount NUMERIC DEFAULT 0,
  ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN deposit_payment_id UUID;

-- Create index for faster queries
CREATE INDEX idx_rentals_deposit_paid ON rentals(deposit_paid);
```

### Payment Flow

1. User selects cash payment in BookingForm
2. System creates booking with deposit_required=true, deposit_amount=300, deposit_paid=false
3. User is redirected to deposit payment page
4. After successful payment, deposit_paid=true and booking is confirmed
5. If payment fails, booking remains in pending state and dates are not blocked

### No-Show Handling

1. If user doesn't show up, shop owner marks booking as no-show
2. System processes deposit as payment to shop owner
3. Booking is marked as cancelled but deposit is not refunded

## Implementation Steps

1. Update BookingForm.tsx to handle deposit requirement
   - Added deposit information to the cash payment option
   - Added deposit_required and deposit_amount fields to booking data
   - Modified form submission to redirect to deposit payment page for cash payments

2. Create deposit payment API endpoint
   - Created /api/payments/create-deposit-intent endpoint
   - Modified payment APIs to handle deposit payments

3. Create deposit payment page
   - Created /booking/deposit-payment/[id]/page.tsx
   - Created DepositPayMongoForm component

4. Update payment webhook to handle deposits
   - Modified webhook to check for deposit payments
   - Updated payment status handling for deposits

5. Update booking confirmation page
   - Added deposit status information to the payment details section

6. Implement shop owner payout system
   - Created deposit_payouts table
   - Created admin API endpoint for processing payouts
   - Created admin interface for managing deposit payouts

## Blocking Dates on Calendar

To prevent vehicles from being double-booked, we've implemented a system that only blocks dates on the calendar after payment confirmation:

1. For cash payments, dates are only blocked after the deposit has been paid
2. For online payments, dates are only blocked after the full payment has been processed

This ensures that vehicles remain available for booking until a financial commitment has been made, preventing ghost bookings and maximizing vehicle availability.

## Conclusion

The cash deposit implementation is now complete. This feature ensures that when users choose cash payment, they must pay a 300 PHP deposit through PayMongo to secure their booking. This helps prevent ghost bookings and provides compensation to shop owners in case of cancellations.

The implementation includes:

1. Database changes to track deposits
2. UI updates to inform users about the deposit requirement
3. Payment flow for processing deposits
4. Admin interface for managing deposit payouts
5. Smart date blocking that only reserves dates after payment/deposit confirmation

Shop owners can now be confident that their vehicles won't be reserved by users who cancel their bookings, and they'll receive compensation for their time and lost business opportunities in case of cancellations.
