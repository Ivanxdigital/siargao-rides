# Admin Notification System

This document explains how the admin notification system works in Siargao Rides, specifically for notifying administrators when new shop applications are submitted.

## Overview

When a new rental shop is registered on the platform, an email notification is automatically sent to all users with the 'admin' role. This helps administrators stay informed about new shop applications that require verification.

## Components

The admin notification system consists of the following components:

1. **Email Template**: `AdminShopNotificationEmail.tsx` - A React Email template for admin notifications
2. **API Endpoint**: `/api/send-admin-notification` - Handles sending emails to admin users
3. **Notification Function**: `sendAdminNotification()` - A utility function in the notifications library
4. **Integration**: The shop creation API automatically triggers admin notifications

## How It Works

1. When a user creates a new shop through the `/api/shops` endpoint, the system:
   - Creates the shop record in the database
   - Calls the `sendAdminNotification()` function with the new shop's ID

2. The `sendAdminNotification()` function:
   - Makes a POST request to the `/api/send-admin-notification` endpoint
   - Passes the shop ID in the request body

3. The `/api/send-admin-notification` endpoint:
   - Fetches the shop details including owner information
   - Queries the database for all users with the 'admin' role
   - Sends an email to all admin users using the Resend API
   - Uses the `AdminShopNotificationEmail` template for the email content

4. Admins receive an email notification with:
   - Shop details (name, description, address, etc.)
   - Owner information (name, email, phone)
   - A direct link to the admin verification page

## Email Template

The admin notification email includes:

- A clear subject line: "New Shop Application: [Shop Name] - Verification Required"
- Shop details in a highlighted section
- Owner information in a separate section
- A prominent "Verify Shop" button that links to the admin verification page
- Siargao Rides branding and footer

## Error Handling

- If the notification fails to send, the shop creation still succeeds
- Errors are logged but don't prevent the shop from being created
- The system includes proper error handling and logging at each step

## Testing

To test the admin notification system:

1. Create a test user with the 'admin' role
2. Register a new shop through the application
3. Check the admin user's email for the notification
4. Verify that the notification contains all the expected information
5. Test the "Verify Shop" button to ensure it links to the correct page

## Future Enhancements

Potential future enhancements to the admin notification system:

1. Add notification preferences for admins (email, SMS, in-app)
2. Include more detailed shop information in the notifications
3. Add notification batching for multiple shops created in a short time
4. Implement read receipts to track which admins have seen the notification
