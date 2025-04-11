# Pickup Time Selection & Auto-Cancellation Implementation Guide

This document outlines the implementation plan for adding pickup time selection to temporary cash payment bookings and implementing an auto-cancellation system for no-shows.

## Overview

To reduce ghost bookings while waiting for PayMongo verification, we'll implement a system where:

1. Customers must select a specific pickup time when choosing the temporary cash payment option
2. Bookings are automatically cancelled if customers don't show up within a configurable grace period
3. Shop owners can override auto-cancellations if they choose to hold the vehicle longer
4. The UI is clean, modern, and mobile-friendly

## Database Changes

### Add New Fields to Rentals Table

```sql
ALTER TABLE rentals
  ADD COLUMN pickup_time TIMESTAMPTZ,
  ADD COLUMN grace_period_minutes INTEGER DEFAULT 30,
  ADD COLUMN auto_cancel_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN auto_cancel_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN auto_cancel_scheduled_for TIMESTAMPTZ,
  ADD COLUMN cancellation_type TEXT,
  ADD COLUMN shop_owner_override BOOLEAN DEFAULT FALSE;
```

### Add System Settings for Default Values

```sql
-- Add new fields to system_settings table if they don't exist
INSERT INTO system_settings (key, value, description)
VALUES
  ('default_grace_period_minutes', '30', 'Default grace period in minutes before auto-cancellation'),
  ('enable_auto_cancellation', 'true', 'Whether auto-cancellation is enabled by default');
```

## UI Components

### 1. Time Slot Picker Component

Create a new component for selecting pickup time slots:

- Show available time slots based on shop operating hours
- Highlight recommended/popular time slots
- Disable unavailable time slots
- Mobile-friendly design with large touch targets
- Clear visual indication of selected time

### 2. Booking Form Updates

Modify the BookingForm component to:

- Show time slot picker when temporary cash payment is selected
- Display clear explanation of the auto-cancellation policy
- Allow shop owners to configure grace period (in admin settings)

### 3. Confirmation Page Updates

Update the booking confirmation page to:

- Prominently display the selected pickup time
- Show the auto-cancellation policy and grace period
- Include countdown timer on the day of pickup (optional)

### 4. Shop Owner Dashboard Updates

Add to the shop owner dashboard:

- Ability to override auto-cancellation for specific bookings
- Configuration for default grace period
- Notification when a booking is about to be auto-cancelled
- List of upcoming pickups with times

## Backend Implementation

### 0. Supabase Integration Considerations

Before implementation, we need to assess Supabase's capabilities for:

- **Scheduled Functions**: Determine if Supabase supports scheduled functions or if we need an external service (like Vercel Cron Jobs) for the auto-cancellation system
- **Database Functions**: Evaluate if we should use Supabase's PostgreSQL functions for business logic
- **Realtime Subscriptions**: Check if we can use Supabase's realtime features for notifications
- **RLS Policies**: Ensure our Row Level Security policies allow the necessary operations
- **Edge Functions**: Assess if Supabase Edge Functions are suitable for our auto-cancellation logic

### 1. API Endpoints

Create or update these endpoints:

- `POST /api/bookings/create` - Update to include pickup time
- `GET /api/shop/operating-hours` - Get shop operating hours for time slot generation
- `POST /api/bookings/override-cancellation` - Allow shop owners to override auto-cancellation
- `GET /api/bookings/upcoming-pickups` - Get list of upcoming pickups for a shop

### 2. Auto-Cancellation System

Implement a background job system:

- Create a function to check for no-shows
- Set up a scheduled task to run every 5-10 minutes
- Update booking status and release vehicle availability when cancelled
- Send notifications to relevant parties

### 3. Notification System

Enhance the notification system to:

- Send reminder to customer a few hours before pickup
- Notify shop owner of upcoming pickups
- Alert both parties when a booking is auto-cancelled
- Confirm when shop owner overrides an auto-cancellation

## Implementation Checklist

### Phase 0: Preliminary Database Assessment
- [x] Verify current Supabase database structure and tables
- [x] Check if system_settings table exists or needs to be created
- [x] Assess Supabase capabilities for scheduled functions/cron jobs
- [x] Verify permissions and RLS policies for the rentals table
- [x] Check if any existing triggers or functions might conflict with new features
- [x] Determine if Edge Functions or Database Functions are better for auto-cancellation
- [x] Document any limitations or workarounds needed for Supabase implementation

#### Findings from Preliminary Assessment:

1. **Rentals Table Structure**:
   - The rentals table already has fields for handling cancellations (`cancellation_reason`, `cancelled_at`, `cancelled_by`)
   - It has deposit-related fields (`deposit_required`, `deposit_amount`, `deposit_paid`, `deposit_processed`)
   - It has an `expires_at` field that could potentially be used for auto-cancellation timing
   - We need to add: `pickup_time`, `grace_period_minutes`, `auto_cancel_enabled`, `auto_cancel_processed`, `auto_cancel_scheduled_for`, and `shop_owner_override`

2. **System Settings Table**:
   - The table exists with a structure of `id`, `key`, `value` (JSONB), `description`, `created_at`, `updated_at`
   - Current settings include `payment_settings` with values for `enable_temporary_cash_payment` (currently true)
   - We can add our auto-cancellation settings to the existing `payment_settings` object

3. **Scheduled Functions**:
   - The pg_cron extension is available but not installed
   - We'll need to either install pg_cron or use an external service like Vercel Cron Jobs

4. **RLS Policies**:
   - Existing policies allow users to see their own rentals
   - Shop owners can view rentals for their vehicles
   - Admins have full access to all rentals
   - These policies should work with our new features without modification

5. **Triggers and Functions**:
   - There is one trigger on the rentals table: `update_rentals_updated_at` which updates the `updated_at` column on any change
   - This trigger won't conflict with our auto-cancellation feature
   - No existing functions related to bookings or cancellations were found

6. **Edge Functions vs. Database Functions**:
   - Edge Functions are available but none are currently deployed
   - For auto-cancellation, we'll use a combination of:
     - Database functions for the cancellation logic (to ensure data integrity)
     - Vercel Cron Jobs to trigger the function at regular intervals (since pg_cron is not installed)
     - Edge Functions could be used for more complex processing if needed

### Phase 1: Database Setup
- [x] Add new fields to rentals table
- [x] Add system settings for default values
- [x] Create indexes for efficient queries
- [x] Update database types in TypeScript

#### Database Setup Implementation:

1. **SQL Script Created**: Created `sql/add_pickup_time_fields.sql` with:
   - New columns for rentals table: `pickup_time`, `grace_period_minutes`, `auto_cancel_enabled`, `auto_cancel_processed`, `auto_cancel_scheduled_for`, `shop_owner_override`
   - Indexes for efficient queries
   - Updates to system_settings for auto-cancellation settings
   - Functions for auto-cancellation processing
   - Trigger to automatically schedule auto-cancellation when pickup_time is set

2. **TypeScript Types Updated**: Updated `src/lib/database.types.ts` to include all new fields in the rentals table

3. **Next Steps**: The SQL script needs to be executed in the Supabase SQL Editor to apply the changes to the database

### Phase 2: Time Slot Picker Component
- [x] Create TimeSlotPicker component
- [x] Implement logic to generate available time slots
- [x] Style component for desktop and mobile
- [x] Add validation and error handling

#### Time Slot Picker Implementation:

1. **TimeSlotPicker Component Created**: Created a reusable component at `src/components/TimeSlotPicker.tsx` with:
   - Dynamic time slot generation based on shop hours
   - Mobile-friendly grid layout with responsive design
   - Clear visual indication of selected time
   - Support for minimum and maximum time constraints
   - Automatic handling of today's date (not showing past times)
   - Clear messaging about the auto-cancellation policy

### Phase 3: Booking Form Updates
- [x] Modify BookingForm to include time slot picker for temporary cash payments
- [x] Add clear explanation of auto-cancellation policy
- [x] Update booking creation logic to include pickup time
- [x] Test form submission with new fields

#### Booking Form Updates Implementation:

1. **BookingForm Component Updated**: Modified `src/components/BookingForm.tsx` to:
   - Add pickup time state and validation
   - Display TimeSlotPicker component when temporary cash payment is selected
   - Add clear explanation of the auto-cancellation policy
   - Update booking creation logic to include pickup time and auto-cancellation settings
   - Add validation to require pickup time for temporary cash payments

### Phase 4: Confirmation Page Updates
- [x] Update confirmation page to display pickup time
- [x] Add auto-cancellation policy information
- [ ] Implement countdown timer (optional)
- [x] Test display on mobile and desktop

#### Confirmation Page Updates Implementation:

1. **Confirmation Page Updated**: Modified `src/app/booking/confirmation/[id]/page.tsx` to:
   - Display pickup time in a clear, visually distinct section
   - Show the grace period and auto-cancellation policy
   - Use consistent styling with the rest of the application
   - Ensure mobile-friendly display of pickup time information

### Phase 5: Auto-Cancellation System
- [x] Create function to check for no-shows
- [x] Implement auto-cancellation logic
- [x] Set up scheduled task to run the function
- [ ] Test auto-cancellation with various scenarios

#### Auto-Cancellation System Implementation:

1. **Database Functions Created**: Added to `sql/add_pickup_time_fields.sql`:
   - `process_auto_cancellations()` function to identify and cancel no-show bookings
   - `schedule_auto_cancellation()` function to set the auto-cancellation time
   - Trigger to automatically schedule auto-cancellation when pickup time is set

2. **API Endpoints Created**:
   - `src/app/api/cron/process-auto-cancellations/route.ts` - Endpoint to be called by a cron job
   - `src/app/api/bookings/override-auto-cancellation/route.ts` - Endpoint for shop owners to override auto-cancellation

3. **Scheduled Task Setup**:
   - The auto-cancellation process should be triggered by a Vercel Cron Job
   - Recommended schedule: Every 5-10 minutes
   - Cron expression: `*/10 * * * *` (every 10 minutes)

4. **Next Steps**:
   - Set up the Vercel Cron Job to call the process-auto-cancellations endpoint
   - Test the auto-cancellation system with various scenarios

### Phase 6: Shop Owner Dashboard Updates
- [x] Add override functionality for shop owners
- [x] Create interface for configuring grace period
- [x] Implement upcoming pickups display
- [ ] Test shop owner controls

#### Shop Owner Dashboard Updates Implementation:

1. **AutoCancellationOverride Component Created**: Created a reusable component at `src/components/AutoCancellationOverride.tsx` with:
   - Clear display of pickup time and auto-cancellation time
   - Override button for shop owners
   - Success and error state handling
   - Visual indication of override status

2. **Booking Details Page Updated**: Modified `src/app/dashboard/bookings/[id]/page.tsx` to:
   - Display pickup time for temporary cash payment bookings
   - Show the AutoCancellationOverride component for eligible bookings
   - Update the UI when override is successful
   - Remove mentions of "No Deposit" from the temporary cash payment notice

### Phase 7: Notification System
- [x] Implement pickup reminders
- [x] Add auto-cancellation notifications
- [x] Create override confirmation notifications
- [ ] Test notification delivery

#### Notification System Implementation:

1. **New Notification Functions Added**: Added to `src/lib/notifications.ts`:
   - `notifyUpcomingPickup()` - Reminds shop owners about upcoming pickups
   - `notifyAutoCancellation()` - Notifies about auto-cancelled bookings
   - `notifyAutoCancellationOverride()` - Confirms when auto-cancellation is overridden

2. **Automatic Reminder Setup**: Modified the shop owner notification subscription to:
   - Detect temporary cash payment bookings with pickup times
   - Schedule reminders for 1 hour before pickup time
   - Use setTimeout to trigger notifications at the appropriate time

3. **Enhanced Status Handling**: Added 'auto-cancelled' as a booking status type with appropriate messaging

### Phase 8: Testing & Refinement
- [ ] Conduct end-to-end testing
- [ ] Test edge cases (shop closed, holidays, etc.)
- [ ] Optimize for performance
- [ ] Gather feedback and make refinements

## UI Design Guidelines

### General Principles
- Clean, minimalist design with ample white space
- Consistent color scheme matching the existing app
- Clear typography with good contrast
- Intuitive interactions with visual feedback

### Mobile Considerations
- Large touch targets (minimum 44×44px)
- Single column layout on small screens
- Bottom-aligned actions for easy thumb access
- Reduced motion for better performance

### Desktop Enhancements
- Multi-column layout where appropriate
- Hover states for interactive elements
- Keyboard navigation support
- Tooltips for additional information

### Accessibility
- Proper ARIA labels
- Keyboard navigable components
- Sufficient color contrast
- Screen reader friendly markup

## Implementation Summary

We have successfully implemented the pickup time selection and auto-cancellation feature with the following components:

1. **Database Changes**:
   - Added new fields to the rentals table: `pickup_time`, `grace_period_minutes`, `auto_cancel_enabled`, `auto_cancel_processed`, `auto_cancel_scheduled_for`, `shop_owner_override`
   - Created database functions for auto-cancellation processing
   - Added system settings for default values

2. **UI Components**:
   - Created a TimeSlotPicker component for selecting pickup times
   - Updated the BookingForm to include pickup time selection for temporary cash payments
   - Updated the confirmation page to display pickup time and auto-cancellation policy
   - Added an AutoCancellationOverride component for shop owners

3. **Backend Implementation**:
   - Created API endpoints for processing auto-cancellations and overriding auto-cancellations
   - Implemented notification functions for pickup reminders and auto-cancellation events

## Next Steps

Before deploying to production, the following steps need to be completed:

1. ✅ **Execute SQL Script**: Run the `sql/add_pickup_time_fields.sql` script in the Supabase SQL Editor
2. ✅ **Set Up Cron Job**: Configure a Vercel Cron Job to call the `/api/cron/process-auto-cancellations` endpoint every 10 minutes
   - Added `vercel.json` with cron configuration to run every 10 minutes
3. **Testing**: Conduct thorough testing of the auto-cancellation system with various scenarios
4. ✅ **Documentation**: Update user documentation to explain the new pickup time selection and auto-cancellation features
   - Created `docs/pickup-time-auto-cancellation-user-guide.md` with instructions for both customers and shop owners

## Success Metrics

We'll measure the success of this implementation by:

1. Reduction in ghost booking rate
2. Customer satisfaction with the booking process
3. Shop owner satisfaction with the system
4. Technical reliability of the auto-cancellation system

## Future Enhancements

After initial implementation, consider these enhancements:

1. Customer check-in feature to extend grace period
2. Integration with maps for estimated arrival time
3. Reputation system for reliable customers
4. Dynamic grace periods based on weather or traffic conditions
