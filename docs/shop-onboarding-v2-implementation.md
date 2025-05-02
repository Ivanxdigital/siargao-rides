# Siargao Rides - Shop Owner Onboarding V2

## Overview

This document describes the implementation of the new shop owner onboarding flow (ONBOARDING_V2) for Siargao Rides. The new flow simplifies the process by eliminating the separate registration page and integrating the shop registration form directly into the dashboard.

## Key Changes

1. **User Sign-up**:
   - Users can select "List my vehicles" intent during sign-up
   - Intent is stored in user metadata
   - Role is automatically set to "shop_owner"
   - `has_shop` flag is set to `false` initially

2. **Dashboard Integration**:
   - Shop owners without a shop see a collapsible onboarding banner
   - Banner contains the same form fields as the legacy registration page
   - Form submission creates a shop with `status = "pending_verification"`
   - User's `has_shop` flag is updated to `true` after submission

3. **Database Changes**:
   - Added `has_shop` boolean field to `users` table
   - Added `status` enum field to `rental_shops` table with values: `pending_verification`, `active`, `rejected`
   - Updated RLS policies for shop access

4. **Legacy Registration Page**:
   - Now redirects to dashboard for shop owners if ONBOARDING_V2 is enabled

## Feature Flag

The new onboarding flow is deployed behind a feature flag `ONBOARDING_V2`. This allows for easy rollback if issues arise.

To enable/disable the feature:
- Set the environment variable `NEXT_PUBLIC_FEATURE_ONBOARDING_V2` to `"true"` or `"false"`
- Or modify the default value in `src/lib/featureFlags.ts`

## Implementation Details

### Database Migration

A new migration file `supabase/migrations/20240501_shop_onboarding_v2.sql` adds:
- `has_shop` boolean field to `users` table (default: false)
- `status` enum field to `rental_shops` table (default: pending_verification)
- Updated RLS policies for shop access
- Trigger to update `has_shop` when a shop is created

### New Components

1. **ShopOnboardingBanner**:
   - Located at `src/components/shop/ShopOnboardingBanner.tsx`
   - Collapsible banner with shop registration form
   - Uses Framer Motion for animations
   - Stores collapse state in localStorage
   - Shows "Verification pending" state after submission

### Modified Files

1. **AuthContext.tsx**:
   - Updated to store intent and has_shop in user metadata
   - Modified register function to accept intent parameter

2. **Dashboard Page**:
   - Added ShopOnboardingBanner component
   - Removed redirect to registration page
   - Added feature flag check

3. **Register Page**:
   - Added redirect to dashboard for shop owners
   - Added feature flag check

4. **API Routes**:
   - Updated `/api/shops` to set shop status and update user's has_shop flag

## Testing

To test the new onboarding flow:

1. Sign up as a new user with "List my vehicles" intent
2. Verify that you're redirected to the dashboard after email verification
3. Check that the onboarding banner appears
4. Fill out the form and submit
5. Verify that the banner shows "Verification pending" state
6. As an admin, verify and approve the shop
7. Check that the banner disappears and is replaced with shop management UI

## Rollback Plan

If issues arise with the new onboarding flow:

1. Set `NEXT_PUBLIC_FEATURE_ONBOARDING_V2` to `"false"` in environment variables
2. Deploy the change
3. The application will revert to the legacy registration flow

## Future Improvements

1. Add progress tracking for form completion
2. Implement form validation with better error messages
3. Add ability to save form progress and continue later
4. Improve mobile responsiveness of the form
5. Add analytics to track conversion rates

## Recent Updates

### Location Dropdown Implementation

- Replaced the text input for location_area with a dropdown select component
- Created a shared constants file at `src/lib/constants.ts` to store location options
- Updated all components to use the shared location constants:
  - ShopOnboardingBanner.tsx
  - SearchBar.tsx
  - Dashboard shop page
- This ensures consistency between the shop registration form and the search functionality
- When users search for a specific location (e.g., "General Luna"), shops registered with that location will appear in the search results
