# Siargao Rides: Booking System Implementation Guide

## Overview

This document provides a step-by-step guide for implementing a booking system for Siargao Rides with PayMongo integration. The system will allow users to book motorbikes with options to pay online via PayMongo or cash on delivery/pickup.

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
  ('PayMongo - Card', 'Pay with credit or debit card', TRUE, 'paymongo', TRUE),
  ('PayMongo - GCash', 'Pay with GCash', TRUE, 'paymongo', TRUE),
  ('PayMongo - Maya', 'Pay with Maya', TRUE, 'paymongo', TRUE),
  ('Cash on Pickup', 'Pay with cash when picking up the bike', FALSE, NULL, TRUE),
  ('Cash on Delivery', 'Pay with cash when the bike is delivered', FALSE, NULL, TRUE);

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

## Phase 2: Basic Booking Form

### Frontend Components to Create

1. **Booking Form Component**
   - Date range picker
   - Delivery option selection
   - Payment method selection
   - User details form (for non-logged in users)
   - Terms and conditions agreement
   - Submit button

2. **Booking Summary Component**
   - Selected bike details
   - Rental dates
   - Duration calculation
   - Price breakdown
   - Fees and total

### API Routes to Implement

1. **Check Availability API**
   - Endpoint: `/api/bookings/check-availability`
   - Purpose: Verify if bike is available for selected dates

2. **Create Booking API**
   - Endpoint: `/api/bookings/create`
   - Purpose: Create a booking record in Supabase

3. **Calculate Price API**
   - Endpoint: `/api/bookings/calculate-price`
   - Purpose: Calculate rental price based on duration and options

## Phase 3: PayMongo Integration

### Environment Setup

1. Add these environment variables:
```
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```

### API Routes for PayMongo

1. **Create Payment Intent API**
   - Endpoint: `/api/payments/create-intent`
   - Purpose: Create a payment intent with PayMongo

2. **Payment Webhook API**
   - Endpoint: `/api/payments/webhook`
   - Purpose: Handle PayMongo payment event callbacks

3. **Payment Status API**
   - Endpoint: `/api/payments/status/:paymentId`
   - Purpose: Check status of a payment

### Frontend Components

1. **Payment Form Component**
   - Credit Card input fields
   - GCash/Maya payment buttons
   - Error handling UI

2. **Payment Success/Failure Pages**
   - Success confirmation page
   - Failure page with retry options

## Phase 4: Cash Payment System

### API Routes

1. **Confirm Cash Booking API**
   - Endpoint: `/api/bookings/confirm`
   - Purpose: For shop owners to confirm cash bookings

2. **Cancel Booking API**
   - Endpoint: `/api/bookings/cancel`
   - Purpose: Allow users or shop owners to cancel bookings

### Automated Processes

1. **Booking Expiration System**
   - Create a CRON job to check for expired bookings
   - SQL function to automatically expire unconfirmed cash bookings

```sql
-- Create a function to handle booking expiration
CREATE OR REPLACE FUNCTION expire_pending_bookings()
RETURNS void AS $$
BEGIN
  UPDATE rentals
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

## Phase 5: Notifications System

### Email Templates

1. Create the following email templates:
   - Booking confirmation
   - Payment receipt
   - Booking reminder
   - Booking cancellation

### Code Implementation

1. Create an email sending utility:
   - Implement email sending functionality
   - Template rendering
   - Email queue management

2. Create notification triggers for:
   - New bookings
   - Payment status changes
   - Booking status changes
   - Approaching rental dates

## Implementation Timeline

1. **Week 1: Database Setup**
   - Implement all database schema changes
   - Test relationships and queries

2. **Week 2: Basic Booking Form**
   - Create frontend booking components
   - Implement basic booking API endpoints

3. **Week 3: PayMongo Integration**
   - Set up PayMongo test account
   - Implement payment processing
   - Test payment flows

4. **Week 4: Cash Payment & Admin Panel**
   - Implement cash booking confirmation
   - Create admin dashboard for bookings
   - Build booking management UI

5. **Week 5: Testing & Refinement**
   - End-to-end testing
   - Refine user experience
   - Deploy to production environment

## Troubleshooting & Support

For implementation questions, please contact the development team.

Remember to test all payment flows in sandbox mode before going live with PayMongo. 