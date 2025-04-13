import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { format, addMinutes } from 'date-fns';

// Status types for bookings
type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'auto-cancelled';

// Payment status types
type PaymentStatus = 'pending' | 'paid' | 'failed';

/**
 * Send a notification about a new booking
 */
export const notifyNewBooking = (bookingId: string, vehicleName: string) => {
  toast.success(
    `New booking received for ${vehicleName}`,
    {
      description: `Booking #${bookingId.slice(0, 8)} has been created and is pending approval.`,
      action: {
        label: 'View',
        onClick: () => window.location.href = `/dashboard/bookings/${bookingId}`
      },
    }
  );
};

/**
 * Send a notification about a booking status change
 */
export const notifyBookingStatusChange = (bookingId: string, vehicleName: string, status: BookingStatus) => {
  const statusMessages = {
    pending: {
      title: `Booking for ${vehicleName} is pending`,
      description: 'Awaiting approval from the shop owner.',
      type: 'default' as const
    },
    confirmed: {
      title: `Booking for ${vehicleName} confirmed!`,
      description: 'Your booking has been approved by the shop owner.',
      type: 'success' as const
    },
    cancelled: {
      title: `Booking for ${vehicleName} cancelled`,
      description: 'The booking has been cancelled.',
      type: 'error' as const
    },
    'auto-cancelled': {
      title: `Booking for ${vehicleName} auto-cancelled`,
      description: 'The booking was automatically cancelled due to no-show.',
      type: 'error' as const
    },
    completed: {
      title: `Booking for ${vehicleName} completed`,
      description: 'The rental period has ended.',
      type: 'success' as const
    },
    rejected: {
      title: `Booking for ${vehicleName} rejected`,
      description: "Unfortunately, the shop owner couldn't accept your booking.",
      type: 'error' as const
    }
  };

  const message = statusMessages[status];

  switch (message.type) {
    case 'success':
      toast.success(message.title, {
        description: message.description,
        action: {
          label: 'View',
          onClick: () => window.location.href = `/dashboard/bookings/${bookingId}`
        }
      });
      break;
    case 'error':
      toast.error(message.title, {
        description: message.description,
        action: {
          label: 'View',
          onClick: () => window.location.href = `/dashboard/bookings/${bookingId}`
        }
      });
      break;
    default:
      toast(message.title, {
        description: message.description,
        action: {
          label: 'View',
          onClick: () => window.location.href = `/dashboard/bookings/${bookingId}`
        }
      });
  }
};

/**
 * Subscribe to booking notifications
 * This should be called in _app.tsx or a layout component that wraps authenticated routes
 */
export const subscribeToBookingNotifications = (userId: string) => {
  const supabase = createClientComponentClient<Database>();

  // Listen for changes to bookings for this user
  const subscription = supabase
    .channel('bookings-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'rentals',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const newBooking = payload.new as any;
        notifyNewBooking(newBooking.id, newBooking.vehicle_name || 'Vehicle');
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rentals',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const updatedBooking = payload.new as any;
        // Only notify if status has changed
        if (payload.old.status !== updatedBooking.status) {
          notifyBookingStatusChange(
            updatedBooking.id,
            updatedBooking.vehicle_name || 'Vehicle',
            updatedBooking.status as BookingStatus
          );
        }
      }
    )
    .subscribe();

  // Return the subscription so it can be unsubscribed on component unmount
  return subscription;
};

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
 * Notify about an upcoming pickup
 */
export const notifyUpcomingPickup = (bookingId: string, vehicleName: string, pickupTime: Date) => {
  toast.info(
    `Upcoming Pickup: ${vehicleName}`,
    {
      description: `Reminder: Customer will pick up ${vehicleName} at ${format(pickupTime, 'h:mm a')} today.`,
      action: {
        label: 'View',
        onClick: () => window.location.href = `/dashboard/bookings/${bookingId}`
      },
      duration: 10000, // Show for 10 seconds
    }
  );
};

/**
 * Notify about an auto-cancellation
 */
export const notifyAutoCancellation = (bookingId: string, vehicleName: string, pickupTime: Date, gracePeriodMinutes: number = 30) => {
  const autoCancelTime = addMinutes(pickupTime, gracePeriodMinutes);

  toast.error(
    `Booking Auto-Cancelled: ${vehicleName}`,
    {
      description: `The booking was automatically cancelled because the customer didn't show up by ${format(autoCancelTime, 'h:mm a')}.`,
      action: {
        label: 'View',
        onClick: () => window.location.href = `/dashboard/bookings/${bookingId}`
      },
      duration: 10000, // Show for 10 seconds
    }
  );
};

/**
 * Notify about an auto-cancellation override
 */
export const notifyAutoCancellationOverride = (bookingId: string, vehicleName: string) => {
  toast.success(
    `Auto-Cancellation Overridden: ${vehicleName}`,
    {
      description: `You have successfully overridden the auto-cancellation for this booking.`,
      action: {
        label: 'View',
        onClick: () => window.location.href = `/dashboard/bookings/${bookingId}`
      },
    }
  );
};

/**
 * Subscribe to shop owner booking notifications
 * This should be called for users with the shop_owner role
 */
export const subscribeToShopOwnerNotifications = (shopId: string) => {
  console.log('Setting up shop owner notification subscription for shop ID:', shopId);
  const supabase = createClientComponentClient<Database>();

  // Listen for changes to bookings for this shop
  const subscription = supabase
    .channel('shop-bookings-channel-' + shopId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'rentals',
        filter: `shop_id=eq.${shopId}`
      },
      (payload) => {
        console.log('Shop owner received INSERT notification:', payload);
        const newBooking = payload.new as any;
        notifyShopOwnerNewBooking(
          newBooking.id,
          newBooking.vehicle_name || 'Vehicle',
          newBooking.customer_name || 'A customer'
        );

        // If this is a temporary cash payment with pickup time, set a reminder
        if (newBooking.payment_method_id === '5c5e37c7-3f69-4e72-ae03-10cab46f6724' && newBooking.pickup_time) {
          const pickupTime = new Date(newBooking.pickup_time);
          const now = new Date();
          const timeUntilPickup = pickupTime.getTime() - now.getTime();

          // If pickup is in the future, set a reminder for 1 hour before
          if (timeUntilPickup > 0) {
            const reminderTime = timeUntilPickup - (60 * 60 * 1000); // 1 hour before pickup
            if (reminderTime > 0) {
              setTimeout(() => {
                notifyUpcomingPickup(
                  newBooking.id,
                  newBooking.vehicle_name || 'Vehicle',
                  pickupTime
                );
              }, reminderTime);
            }
          }
        }
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
        console.log('Shop owner received UPDATE notification:', payload);
        const updatedBooking = payload.new as any;
        const oldBooking = payload.old as any;

        console.log('Payment status change check:', {
          oldStatus: oldBooking.payment_status,
          newStatus: updatedBooking.payment_status,
          oldDepositPaid: oldBooking.deposit_paid,
          newDepositPaid: updatedBooking.deposit_paid
        });

        // Notify on payment status change
        if (
          (oldBooking.payment_status !== updatedBooking.payment_status &&
           updatedBooking.payment_status === 'paid') ||
          (oldBooking.deposit_paid !== updatedBooking.deposit_paid &&
           updatedBooking.deposit_paid === true)
        ) {
          console.log('Showing payment notification to shop owner');
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

  console.log('Shop owner notification subscription created successfully');
  return subscription;
};

/**
 * Send an email notification to admins about a new shop application
 * @param shopId The ID of the newly created shop
 */
export const sendAdminNotification = async (shopId: string): Promise<void> => {
  try {
    const response = await fetch('/api/send-admin-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shopId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send admin notification: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('Admin notification sent successfully:', data);
  } catch (error) {
    console.error('Error sending admin notification:', error);
    throw error; // Re-throw to allow the caller to handle it
  }
};