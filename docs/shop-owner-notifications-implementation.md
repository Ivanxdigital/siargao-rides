# Shop Owner Notifications Implementation

This document outlines the plan to implement real-time toast notifications for shop owners when they receive new bookings or when payments are processed through PayMongo.

## Problem Statement

Currently, shop owners have no way to be notified in real-time when:
1. A new booking is made for their shop
2. A customer completes a payment (either full payment or deposit) through PayMongo

Shop owners must manually check their dashboard to see if they have received any new bookings or payments.

## Implementation Goals

1. Create a real-time notification system for shop owners using Supabase's realtime subscriptions
2. Display toast notifications when a new booking is made or a payment is processed
3. Provide direct links to view the booking details from the notification
4. Ensure notifications are only shown to the relevant shop owner

## Technical Approach

We'll implement a Supabase realtime subscription that listens for changes to the `rentals` table filtered by the shop owner's shop ID. This will be separate from the existing user notification system.

## Implementation Tasks

### 1. Create Shop Owner Notification Functions

- [x] Create a new function in `src/lib/notifications.ts` to notify shop owners about new bookings
- [x] Create a new function to notify shop owners about payment status changes
- [x] Create a subscription function specifically for shop owners that filters by shop_id

### 2. Update Auth Context for Shop Owner Notifications

- [x] Modify the AuthContext to check if the user is a shop owner
- [x] Add a separate notification subscription for shop owners
- [x] Ensure proper cleanup of subscriptions when unmounting

### 3. Update Database Schema

- [x] Add `customer_name` column to the `rentals` table
- [x] Update existing rentals with customer names from the users table

### 4. Update PayMongo Webhook Handler

- [x] Ensure the PayMongo webhook handler updates the rental record with customer information
- [x] Add additional metadata to help with notification display

### 5. Testing

- [ ] Test notifications for new bookings
- [ ] Test notifications for payment processing (both full payment and deposit)
- [ ] Test notification cleanup on logout

## Detailed Implementation

### 1. Shop Owner Notification Functions

Add the following functions to `src/lib/notifications.ts`:

```typescript
/**
 * Send a notification to a shop owner about a new booking
 */
export const notifyShopOwnerNewBooking = (bookingId: string, vehicleName: string, customerName: string) => {
  toast.success(
    `New booking received for ${vehicleName}`,
    {
      description: `${customerName} has made a booking. Pending your approval.`,
      action: {
        label: 'View',
        onClick: () => window.location.href = `/dashboard/bookings/${bookingId}`
      },
    }
  );
};

/**
 * Send a notification to a shop owner about a payment
 */
export const notifyShopOwnerPayment = (bookingId: string, vehicleName: string, customerName: string, isDeposit: boolean) => {
  toast.success(
    `Payment received for ${vehicleName}`,
    {
      description: `${customerName} has paid ${isDeposit ? 'the deposit' : 'in full'} for their booking.`,
      action: {
        label: 'View',
        onClick: () => window.location.href = `/dashboard/bookings/${bookingId}`
      },
    }
  );
};

/**
 * Subscribe to shop owner booking notifications
 */
export const subscribeToShopOwnerNotifications = (shopId: string) => {
  const supabase = createClientComponentClient<Database>();

  // Listen for changes to bookings for this shop
  const subscription = supabase
    .channel('shop-bookings-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'rentals',
        filter: `shop_id=eq.${shopId}`
      },
      (payload) => {
        const newBooking = payload.new as any;
        notifyShopOwnerNewBooking(
          newBooking.id,
          newBooking.vehicle_name || 'Vehicle',
          newBooking.customer_name || 'A customer'
        );
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rentals',
        filter: `shop_id=eq.${shopId}`
      },
      (payload) => {
        const updatedBooking = payload.new as any;
        const oldBooking = payload.old as any;

        // Notify on payment status change
        if (
          (oldBooking.payment_status !== updatedBooking.payment_status &&
           updatedBooking.payment_status === 'paid') ||
          (oldBooking.deposit_paid !== updatedBooking.deposit_paid &&
           updatedBooking.deposit_paid === true)
        ) {
          notifyShopOwnerPayment(
            updatedBooking.id,
            updatedBooking.vehicle_name || 'Vehicle',
            updatedBooking.customer_name || 'A customer',
            updatedBooking.deposit_paid && updatedBooking.payment_status !== 'paid'
          );
        }
      }
    )
    .subscribe();

  return subscription;
};
```

### 2. Update Auth Context

Modify `src/contexts/AuthContext.tsx` to include shop owner notifications:

```typescript
// Add a new state for shop owner notification subscription
const [shopNotificationSubscription, setShopNotificationSubscription] = useState<{ unsubscribe: () => void } | null>(null);

// In the useEffect where you handle auth state changes:
if (session?.user) {
  const role = session.user.user_metadata?.role;
  setIsAdmin(role === 'admin');

  // Subscribe to user booking notifications
  if (!notificationSubscription && session.user.id) {
    const subscription = subscribeToBookingNotifications(session.user.id);
    setNotificationSubscription(subscription);
  }

  // If user is a shop owner, subscribe to shop notifications
  if (role === 'shop_owner' && !shopNotificationSubscription) {
    // Get the shop ID for this owner
    const getShopId = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from('rental_shops')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();

      if (!error && data) {
        const shopSubscription = subscribeToShopOwnerNotifications(data.id);
        setShopNotificationSubscription(shopSubscription);
      }
    };

    getShopId();
  }
} else {
  setIsAdmin(false);

  // Unsubscribe from notifications if user is no longer authenticated
  if (notificationSubscription) {
    notificationSubscription.unsubscribe();
    setNotificationSubscription(null);
  }

  if (shopNotificationSubscription) {
    shopNotificationSubscription.unsubscribe();
    setShopNotificationSubscription(null);
  }
}

// In the cleanup function:
return () => {
  subscription.unsubscribe();

  // Cleanup notification subscriptions on unmount
  if (notificationSubscription) {
    notificationSubscription.unsubscribe();
  }

  if (shopNotificationSubscription) {
    shopNotificationSubscription.unsubscribe();
  }
};
```

### 3. Update PayMongo Webhook Handler

Ensure the PayMongo webhook handler in `src/app/api/payments/webhook/route.ts` includes customer information for better notifications:

```typescript
// After confirming payment, fetch customer information
const { data: rentalWithCustomer } = await supabase
  .from('rentals')
  .select(`
    id,
    user_id,
    vehicle_name,
    users(first_name, last_name, email)
  `)
  .eq('id', paymentRecord.rental_id)
  .single();

// Update rental record with customer name for notifications
if (rentalWithCustomer) {
  const customerName = rentalWithCustomer.users ?
    `${rentalWithCustomer.users.first_name || ''} ${rentalWithCustomer.users.last_name || ''}`.trim() :
    'Customer';

  await supabase
    .from('rentals')
    .update({
      customer_name: customerName || 'Customer'
    })
    .eq('id', paymentRecord.rental_id);
}
```

## Progress Tracker

| Task | Status | Notes |
|------|--------|-------|
| Create shop owner notification functions | Completed | Added `notifyShopOwnerNewBooking` and `notifyShopOwnerPayment` functions |
| Create shop owner subscription function | Completed | Added `subscribeToShopOwnerNotifications` function |
| Update AuthContext for shop owner notifications | Completed | Added shop owner notification subscription logic |
| Add customer_name column to rentals table | Completed | SQL script executed successfully |
| Update PayMongo webhook handler | Completed | Added user information fetching for better notifications |
| Enable Supabase realtime for rentals table | Completed | Created publication for rentals table |
| Add debugging to track notification flow | Completed | Added console logs to help diagnose issues |
| Test new booking notifications | In Progress | |
| Test payment notifications | In Progress | |
| Test notification cleanup | Not Started | |

## Testing Plan

1. Create a test booking for a shop
2. Verify the shop owner receives a notification
3. Process a test payment through PayMongo
4. Verify the shop owner receives a payment notification
5. Test with both deposit and full payment scenarios
6. Verify notifications are properly cleaned up on logout

## Future Enhancements

1. Add notification preferences for shop owners
2. Add email notifications in addition to toast notifications
3. Add notification history in the dashboard
4. Add sound alerts for new notifications
