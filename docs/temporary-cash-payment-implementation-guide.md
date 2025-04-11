# Temporary Cash Payment Implementation Guide

## Overview

This document outlines the implementation plan for adding a temporary cash payment option to the Siargao Rides booking system. This feature will allow customers to pay directly to the shop when they pick up or receive their vehicle, without requiring online payment through PayMongo. The feature will be toggleable by administrators to enable or disable it as needed.

## Current System Analysis

### Booking Flow
1. User selects a vehicle and dates
2. User fills out the booking form with delivery options and payment method
3. Current payment options:
   - PayMongo (online payment)
   - Cash (requires 300 PHP deposit through PayMongo)
4. Booking is created in the database with status "pending"
5. For cash payments, user is redirected to deposit payment page
6. For PayMongo payments, user is redirected to full payment page

### Database Structure
- `rentals` table stores booking information with fields for payment_method_id, deposit_required, deposit_amount, and deposit_paid
- `payment_methods` table stores available payment methods (Cash on Pickup, Cash on Delivery, GCash Direct, and PayMongo)
- No existing system-wide settings table for global configurations

## Implementation Plan

### 1. Database Changes

#### Create a System Settings Table
```sql
-- Create system_settings table for global configurations
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insert initial setting for temporary cash payments
INSERT INTO system_settings (key, value, description)
VALUES (
  'payment_settings',
  '{"enable_temporary_cash_payment": true, "require_deposit": false}',
  'Global payment settings for the platform'
);

-- Create RLS policy for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can modify settings
CREATE POLICY "Admins can do everything with system settings"
ON system_settings
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Everyone can view settings
CREATE POLICY "Everyone can view system settings"
ON system_settings
FOR SELECT
TO authenticated
USING (true);
```

#### Add a New Payment Method for Temporary Cash Payments (Optional)
```sql
-- We can use the existing cash payment methods, but if we want a distinct option for temporary cash payments:
INSERT INTO payment_methods (name, description, is_online, provider, is_active)
VALUES (
  'Temporary Cash Payment',
  'Pay with cash at pickup or delivery (no deposit required)',
  false,
  null,
  true
);
```

### 2. Admin Dashboard Settings Page

Create a new admin settings page at `/dashboard/admin/settings` with:
- Toggle for enabling/disabling temporary cash payments
- Toggle for requiring deposits for temporary cash payments
- Save button to update settings

### 3. BookingForm Component Updates

Modify the BookingForm component to:
- Fetch the system settings to check if temporary cash payments are enabled
- Show or hide the temporary cash payment option based on settings
- Update the payment flow to handle temporary cash payments without requiring a deposit
- Modify the booking creation logic to set deposit_required = false when using temporary cash payment

### 4. Backend API Updates

Create or update API endpoints:
- `GET /api/settings/payment` - Get payment settings
- `POST /api/settings/payment` - Update payment settings (admin only)

### 5. Booking Confirmation Flow Updates

Update the booking confirmation flow to:
- Skip the deposit payment step for temporary cash payments if deposits are not required
- Update the confirmation page to show appropriate instructions for temporary cash payments

### 6. Shop Owner Dashboard Updates

Update the shop owner dashboard to:
- Show clear indication of payment method for each booking
- Highlight temporary cash payment bookings

## Implementation Steps

### Phase 1: Database Setup
- [x] Create the system_settings table
- [x] Insert initial payment settings
- [x] Set up RLS policies
- [x] Add new payment method for temporary cash payments

### Phase 2: Admin Settings UI
- [x] Create admin settings page
- [x] Implement settings form with toggles
- [x] Create API endpoints for fetching and updating settings

### Phase 3: Booking Form Updates
- [x] Modify BookingForm to fetch and respect system settings
- [x] Update payment method options based on settings
- [x] Adjust booking creation logic for temporary cash payments (set deposit_required = false)
- [x] Update the booking flow to skip deposit payment for temporary cash payments

### Phase 4: Booking Flow Updates
- [x] Update booking confirmation flow
- [x] Modify confirmation page for temporary cash payments
- [x] Update shop owner dashboard to clearly show payment method

### Phase 5: Testing
- [x] Test enabling/disabling temporary cash payments
- [x] Test booking flow with temporary cash payments enabled
- [x] Test shop owner dashboard with temporary cash payment bookings

### Phase 6: Bug Fixes
- [x] Fixed import path for useAuth in admin settings page
- [x] Installed missing @radix-ui/react-switch package for the Switch component

## Technical Considerations

### Security
- Only administrators should be able to toggle the temporary cash payment option
- System settings should be protected by RLS policies

### User Experience
- Clear messaging for users about payment options
- Seamless transition between payment methods based on admin settings

### Database
- Use a flexible JSONB field for settings to allow for future expansion
- Ensure proper indexing for performance

## Implementation Summary

The temporary cash payment feature has been successfully implemented with the following components:

1. **Database Changes**:
   - Created a system_settings table for global configurations
   - Added a new payment method for temporary cash payments
   - Set up RLS policies for secure access control

2. **Admin Settings**:
   - Created a new admin settings page at `/dashboard/admin/settings`
   - Implemented toggles for enabling/disabling temporary cash payments
   - Added API endpoints for managing payment settings

3. **Booking Form**:
   - Modified the BookingForm component to fetch and respect system settings
   - Added a new payment option for temporary cash payments (no deposit)
   - Updated the booking creation logic to handle temporary cash payments

4. **Booking Flow**:
   - Updated the confirmation page to show special instructions for temporary cash payments
   - Modified the shop owner dashboard to clearly show temporary cash payment bookings

5. **Testing**:
   - Verified that the admin settings page works correctly
   - Tested the booking flow with temporary cash payments enabled
   - Confirmed that the shop owner dashboard correctly displays temporary cash payment bookings

## Future Enhancements
- Add analytics for tracking usage of different payment methods
- Implement automatic reminders for shop owners about pending cash payments
- Consider adding a time limit for temporary cash payments before they expire
- Add email notifications for shop owners when a temporary cash payment booking is made
