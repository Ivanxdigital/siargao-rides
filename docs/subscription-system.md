# Siargao Rides Subscription System Documentation

## Overview

The Siargao Rides subscription system manages access to shop owner features based on subscription status. It includes:

1. **Free Trial Period**: Automatically activated when a shop owner adds their first vehicle
2. **Access Control**: Restricts access to vehicle management and settings based on subscription status
3. **Browse Page Filtering**: Ensures only vehicles from active shops are visible to customers
4. **Subscription Status UI**: Shows subscription state with relevant information
5. **Automatic Expiration**: Handles subscription expiration through scheduled jobs

## Database Schema

The subscription system extends the `rental_shops` table with the following fields:

| Field                  | Type      | Description                                   |
|------------------------|-----------|-----------------------------------------------|
| is_active              | boolean   | Whether the shop can be seen on browse pages  |
| subscription_status    | string    | Current status (null, active, expired)        |
| subscription_start_date| timestamp | When the subscription/trial started           |
| subscription_end_date  | timestamp | When the subscription/trial will end          |

## Subscription States

1. **Unverified** (`is_verified=false`)
   - Shop is awaiting admin verification
   - Can access dashboard but not add vehicles
   - Not visible on browse page

2. **Verified, No Trial** (`is_verified=true`, `subscription_status=null`)
   - Shop is verified but hasn't started trial
   - Can add their first vehicle to activate trial
   - Not visible on browse page

3. **Active Trial** (`subscription_status='active'`, `is_active=true`)
   - 30-day free trial is active
   - Full access to dashboard features
   - Visible on browse page

4. **Expired** (`subscription_status='expired'`, `is_active=false`)
   - Trial period has ended
   - Limited access to dashboard
   - Not visible on browse page

## Core Components

### 1. Shop Access Hook

The `useShopAccess` hook in `src/utils/shopAccess.ts` is used to:

- Check if a shop owner has access to protected pages
- Redirect to subscription page if access is denied
- Provide subscription status information to components

```typescript
// Example usage
const { hasAccess, isVerified, subscriptionStatus } = useShopAccess();

if (!hasAccess) {
  // Show restricted access message
}
```

### 2. Vehicle Management Access Control

The vehicle management pages check subscription status before allowing access. 
If a shop's subscription is expired, the user is redirected to the subscription page.

### 3. Browse Page Filtering

The browse page only displays vehicles from shops with `is_active=true`, ensuring 
customers only see vehicles from shops with active subscriptions.

### 4. Subscription Expiration

A database function and edge function work together to automatically expire subscriptions:

1. `check_expired_subscriptions()` - SQL function that finds and updates expired subscriptions
2. Edge function scheduled to run daily to call this function

## Subscription Flow

1. **Shop Creation**
   - Owner registers a shop
   - Initial state: `is_verified=false`, `is_active=false`, subscription fields null

2. **Admin Verification**
   - Admin verifies the shop
   - Updates to: `is_verified=true`

3. **Free Trial Activation**
   - Shop owner adds their first vehicle
   - System sets:
     - `subscription_status='active'`
     - `is_active=true`
     - `subscription_start_date=current_date`
     - `subscription_end_date=current_date + 30 days`

4. **Trial Period**
   - Shop has full access to all features
   - Subscription page shows remaining days
   - Vehicles appear in browse page

5. **Expiration**
   - After 30 days, the automatic check finds expired subscriptions
   - Updates to: `subscription_status='expired'`, `is_active=false`
   - Shop vehicles no longer appear in browse
   - Owner has limited dashboard access

## Testing

See `scripts/test-subscription-flows.md` for comprehensive testing procedures.

## Future Extensions

The current implementation provides a foundation for future payment integration:

1. **Payment Processing**: Add payment methods and subscription plans
2. **Renewal**: Allow automatic renewal of subscriptions
3. **Notification System**: Send expiration notices to shop owners
4. **Tiered Plans**: Support different subscription levels with varying features

## Troubleshooting

Common issues and solutions:

1. **Subscription not activating**
   - Check if shop is verified (`is_verified=true`)
   - Ensure first vehicle was added successfully

2. **Vehicles not appearing in browse**
   - Verify shop has `is_active=true` in database
   - Check if `subscription_status='active'`

3. **Missing redirect to subscription page**
   - Ensure `useShopAccess` hook is used on protected pages
   - Verify redirect logic is called when access denied 