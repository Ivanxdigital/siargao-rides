# Subscription System Testing Guide

This guide outlines the manual testing procedures for the Siargao Rides subscription system.

## Prerequisites
- Admin account
- Shop owner account
- Test vehicle data

## Test Cases

### 1. Admin Verification Flow
1. **Create a new shop account**
   - Register a new shop owner
   - Verify the shop starts as `is_verified=false` and `is_active=false`

2. **Admin Verification**
   - Login as admin
   - Navigate to admin verification page
   - Verify the shop
   - Confirm database update to `is_verified=true`

### 2. Free Trial Activation Flow
1. **Add First Vehicle**
   - Login as shop owner with a verified shop
   - Navigate to "Add Vehicle" page
   - Add a new vehicle
   - Verify that subscription is activated with:
     - `subscription_status='active'`
     - `is_active=true`
     - `subscription_start_date` is set to current date
     - `subscription_end_date` is set to 30 days from now

### 3. Dashboard Access Control
1. **Shop Settings Access**
   - Login as shop owner with active subscription
   - Verify access to all dashboard sections
   - Test with expired subscription (manually set in database)
   - Verify redirect to subscription page

2. **Vehicle Management Access**
   - Attempt to add/edit vehicles with expired subscription
   - Verify appropriate error messages and redirects

### 4. Subscription Status UI
1. **Trial Period Display**
   - Login as shop owner with active subscription
   - Navigate to subscription page
   - Verify trial progress bar shows correctly
   - Verify days remaining is accurate

2. **Expired Status Display**
   - Set subscription status to expired in database
   - View subscription page
   - Verify expired message displays correctly

### 5. Browse Page Filtering
1. **Vehicle Visibility**
   - Create two shops: one active, one inactive
   - Add vehicles to both shops
   - Browse vehicles as a customer
   - Verify only vehicles from active shops appear

### 6. Subscription Expiration
1. **Manual Testing**
   - Manually set a shop's `subscription_end_date` to yesterday
   - Run the `check_expired_subscriptions()` function
   - Verify the shop status updates to expired and inactive

2. **Edge Function Testing**
   - Deploy the edge function
   - Trigger it manually
   - Verify it correctly identifies and updates expired subscriptions

## Expected Results

After completing all tests, you should have verified:
1. ✅ Shop verification works correctly
2. ✅ Free trial activation triggers when adding the first vehicle
3. ✅ Dashboard access control redirects properly
4. ✅ Subscription status UI displays correctly for all states
5. ✅ Browse page only shows vehicles from active shops
6. ✅ Subscription expiration logic works correctly

## Notes

- Document any issues or edge cases discovered during testing
- If all tests pass, mark the corresponding tasks as complete in the implementation tracker 