# Email Notification System for Siargao Rides

This document explains how the email notification system works in Siargao Rides and how to properly configure it for both development and production environments.

## Current Implementation

The email notification system uses [Resend](https://resend.com) as the email service provider. It sends emails to both customers and shop owners when a booking is created.

### Email Types

1. **Booking Confirmation Email** - Sent to customers when they make a booking
2. **Shop Notification Email** - Sent to shop owners when a customer makes a booking

### How It Works

1. When a user completes a booking, the `BookingForm` component calls the `/api/send-booking-email` endpoint
2. The endpoint validates the request data and sends two emails:
   - A confirmation email to the customer
   - A notification email to the shop owner
3. The emails are sent using React Email templates with Tailwind CSS for styling

## Development Mode vs. Production Mode

### Development Mode Limitations

In development mode or when using Resend's free tier, there's a limitation: **you can only send emails to the email address associated with your Resend account** (currently `support@siargaorides.ph`).

To work around this limitation, we've implemented a fallback mechanism:
- In development mode, all emails are redirected to `support@siargaorides.ph`
- The original recipient is logged in the console for debugging purposes

### Setting Up for Production

To send emails to actual users and shop owners in production, you need to:

1. **Verify a Domain with Resend**:
   - Log in to your [Resend Dashboard](https://resend.com/domains)
   - Click "Add Domain" and follow the instructions to verify your domain (e.g., `siargaorides.ph`)
   - This involves adding DNS records to your domain

2. **Update the "From" Address**:
   - Once your domain is verified, update the "from" address in the email sending code
   - We've updated the "from" address in the email sending code to:
   - `'Siargao Rides <support@siargaorides.ph>'`

3. **Update Environment Variables**:
   - Make sure your Resend API key is set in your production environment variables
   - In Vercel, go to Settings > Environment Variables and add/update `RESEND_API_KEY`

## Testing the Email System

### In Development

1. Make a test booking
2. Check the console logs to see if the emails are being sent to `support@siargaorides.ph`
3. Check your `support@siargaorides.ph` inbox to see if the emails are being received

### In Production

1. Verify your domain with Resend
2. Update the "from" address to use your verified domain
3. Deploy the changes to production
4. Make a test booking
5. Check if both the customer and shop owner receive their respective emails

## Troubleshooting

### Common Issues

1. **Emails not being sent**:
   - Check if the Resend API key is correctly set in environment variables
   - Check the console logs for any error messages from the Resend API

2. **"You can only send testing emails to your own email address" error**:
   - This means you're trying to send to an email other than your Resend account email in test mode
   - Either verify a domain (for production) or use the development mode fallback

3. **Emails going to spam**:
   - Make sure your domain is properly verified with Resend
   - Set up SPF, DKIM, and DMARC records for your domain

## Future Improvements

- [ ] Add more email templates for different booking statuses (confirmed, cancelled, etc.)
- [ ] Add pickup reminder emails
- [ ] Add payment reminder emails
- [ ] Create a centralized email sending service for reuse across the application
- [ ] Add email tracking and analytics

## Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Email Deliverability Best Practices](https://resend.com/blog/email-deliverability-best-practices)
