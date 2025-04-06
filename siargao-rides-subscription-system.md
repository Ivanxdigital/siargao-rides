# Siargao Rides Subscription System

## Overview

The Siargao Rides subscription system is a core feature that manages access to shop owner features based on their subscription status. It consists of a free trial period followed by paid subscription tiers (coming soon). The system controls shop visibility in browse pages and restricts access to certain features based on subscription status.

## Database Schema

The subscription system uses the following fields in the `rental_shops` table:

| Field                   | Type                      | Description                                      |
|-------------------------|---------------------------|--------------------------------------------------|
| `is_active`             | boolean                   | Controls shop visibility in browse pages          |
| `subscription_status`   | varchar                   | Current status ('active', 'inactive', 'expired') |
| `subscription_start_date` | timestamp with time zone | When the subscription/trial started              |
| `subscription_end_date` | timestamp with time zone  | When the subscription/trial will end             |

## Subscription States

### 1. Unverified Shop
- **Database State**: `is_verified = false`, `is_active = false`
- **Visibility**: Not visible on browse pages
- **Access**: Limited dashboard access, cannot add vehicles
- **UI**: Shows pending verification message

### 2. Verified, No Trial Started
- **Database State**: `is_verified = true`, `subscription_status = 'inactive'`, `is_active = false`
- **Visibility**: Not visible on browse pages
- **Access**: Can access dashboard but limited functionality
- **UI**: Shows "Start Free Trial" option when adding first vehicle

### 3. Active Trial
- **Database State**: `is_verified = true`, `subscription_status = 'active'`, `is_active = true`
- **Visibility**: Visible on browse pages
- **Access**: Full access to all dashboard features
- **UI**: Shows trial progress bar and days remaining

### 4. Expired
- **Database State**: `is_verified = true`, `subscription_status = 'expired'`, `is_active = false`
- **Visibility**: Not visible on browse pages
- **Access**: Limited dashboard access, redirected to subscription page
- **UI**: Shows expired message with renewal options (coming soon)

## Key Components

### 1. Access Control Hook (`useShopAccess`)

Located in `src/utils/shopAccess.ts`, this hook:
- Checks if a shop owner has access to protected dashboard pages
- Redirects to subscription page if subscription is inactive/expired
- Provides subscription status information to components

Usage example:
```typescript
const { hasAccess, isVerified, subscriptionStatus } = useShopAccess();

// Conditionally render UI based on access
if (!hasAccess) {
  // Show restricted access message or redirect
}
```

### 2. Subscription Activation

The free trial is automatically activated when a shop owner adds their first vehicle:

```typescript
// In src/app/api/vehicles/route.ts
if (vehicleCount === 1) {
  // This is the first vehicle - start subscription
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // Add 1 month for free trial
  
  // Update the shop with subscription info
  await supabase
    .from('rental_shops')
    .update({
      subscription_status: 'active',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      is_active: true
    })
    .eq('id', shopData.id);
}
```

### 3. Subscription UI

The subscription page (`/dashboard/subscription/page.tsx`) shows:
- Current subscription status
- Trial progress with days remaining
- Available subscription plans (free trial active, paid tiers coming soon)

Different UI states include:
- Pending verification
- Free trial active (with progress bar)
- Free trial expired
- Start free trial prompt

### 4. Automatic Expiration

Subscription expiration is handled by:

1. **Database Function**: `check_expired_subscriptions()` 
   - Updates expired subscriptions to `subscription_status = 'expired'` and `is_active = false`

2. **Edge Function**: `/supabase/functions/check-expired-subscriptions/index.ts`
   - Calls the database function on a schedule

3. **Test API Route**: `/api/cron/check-subscriptions/route.ts`
   - For manual testing of the expiration flow

### 5. Admin Management

Admins can manage shop subscriptions via `/dashboard/admin/subscriptions/page.tsx`:
- View all shops with subscription details
- Extend subscription end dates
- Activate/deactivate subscriptions
- Refresh shop status

## Subscription Flow

1. **Shop Registration**
   - Owner registers shop, initially `is_verified = false`
   - Admin verification required before adding vehicles

2. **Admin Verification**
   - Admin approves shop, setting `is_verified = true`
   - Shop remains invisible until subscription activation

3. **Trial Activation**
   - Owner adds first vehicle
   - System automatically sets:
     - `subscription_status = 'active'`
     - `subscription_start_date = current_date`
     - `subscription_end_date = current_date + 30 days`
     - `is_active = true`
   - Shop becomes visible in browse pages

4. **Active Trial Period**
   - Shop has full dashboard access
   - Vehicles appear in browse pages
   - Owner can see remaining days in trial

5. **Expiration**
   - Automated check updates expired shops:
     - `subscription_status = 'expired'`
     - `is_active = false`
   - Shop no longer visible in browse
   - Owner redirected to subscription page when accessing restricted areas

## Integration Points

The subscription system integrates with multiple parts of the application:

1. **Vehicle Management**: Restricted if subscription expired
2. **Browse Page**: Only shows vehicles from active shops
3. **Dashboard Access**: Limited for inactive/expired subscriptions
4. **Admin Panel**: Provides subscription management tools

## Future Plans

The system is designed for future expansion:

1. **Payment Integration**: Add payment methods and subscription plans
2. **Renewal Flow**: Automatic renewal system
3. **Notification System**: Expiration reminders
4. **Tiered Plans**: Different subscription levels with varying features

## Troubleshooting

Common issues and solutions:

1. **Subscription Not Activating**
   - Ensure shop is verified (`is_verified = true`)
   - Check that first vehicle was added successfully

2. **Vehicles Not Appearing in Browse**
   - Verify shop has `is_active = true`
   - Check if `subscription_status = 'active'`

3. **Missing Redirect to Subscription Page**
   - Confirm `useShopAccess` hook is used on protected pages
   - Verify redirect logic triggers when access is denied 