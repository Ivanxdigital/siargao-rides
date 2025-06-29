
# Booking Management for Shop Owners

This document outlines the process for shop owners to manage incoming bookings, specifically how to accept and decline them.

## 1. Viewing Bookings

Shop owners can view all their bookings from the **Manage Bookings** page in their dashboard, located at `/dashboard/bookings`. This page displays a list of all bookings with the following information:

*   **Vehicle:** The name and image of the booked vehicle.
*   **Customer:** The customer's name and email address.
*   **Dates:** The start and end dates of the booking.
*   **Status:** The current status of the booking (e.g., `pending`, `confirmed`, `completed`, `cancelled`).
*   **Price:** The total price of the booking.

## 2. Viewing Booking Details

To view the full details of a booking, the shop owner can click the **View** button on any booking in the list. This will take them to the booking details page, located at `/dashboard/bookings/[id]`, where `[id]` is the unique identifier for the booking.

This page provides a comprehensive overview of the booking, including:

*   Vehicle details
*   Booking period
*   Customer information
*   Payment details
*   Price breakdown

## 3. Accepting or Declining a Booking

On the booking details page, the shop owner has the ability to either accept or decline a pending booking.

### Accepting a Booking

To accept a booking, the shop owner clicks the **Confirm** button. This action is available only if the booking status is `pending`.

When the **Confirm** button is clicked:

1.  The `handleStatusChange` function is triggered with the new status `confirmed`.
2.  A request is sent to the Supabase backend to update the booking's status in the `rentals` table.
3.  The `status` field for the specific booking is changed from `pending` to `confirmed`.
4.  The system then sends a notification to the user, informing them that their booking has been confirmed.

### Declining a Booking

To decline a booking, the shop owner clicks the **Cancel** button. This action is available for any booking that is not already `cancelled` or `completed`.

When the **Cancel** button is clicked:

1.  The `handleStatusChange` function is triggered with the new status `cancelled`.
2.  A request is sent to the Supabase backend to update the booking's status in the `rentals` table.
3.  The `status` field for the specific booking is changed to `cancelled`.
4.  A notification is sent to the user, informing them that their booking has been cancelled.

## 4. Technical Implementation

The booking management functionality is implemented in the following files:

*   **`src/app/dashboard/bookings/page.tsx`**: This file is responsible for displaying the list of all bookings for a shop owner. It fetches the data from the `rentals` table in Supabase and provides a link to the details page for each booking.

*   **`src/app/dashboard/bookings/[id]/page.tsx`**: This file displays the detailed information for a single booking and contains the logic for updating the booking status. The key functions are:
    *   `handleStatusChange(newStatus: string)`: This function is called when the "Confirm" or "Cancel" buttons are clicked. It updates the booking status in the `rentals` table.
    *   `notifyBookingStatusChange(bookingId, vehicleName, newStatus)`: This function, located in `src/lib/notifications.ts`, is responsible for sending a notification to the user after the booking status has been updated.

The booking status is stored in the `status` column of the `rentals` table in the Supabase database. The possible values for this column are:

*   `pending`
*   `confirmed`
*   `completed`
*   `cancelled`
