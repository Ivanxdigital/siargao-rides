# PayMongo Webhook Setup Guide

This guide explains how to set up webhooks for PayMongo to receive payment notifications.

## What are Webhooks?

Webhooks allow PayMongo to send real-time notifications to your application when events occur, such as successful payments or failed transactions.

## Setting Up Webhooks

### 1. Create a Webhook Endpoint

PayMongo needs a publicly accessible URL to send webhook events. For production, this would be your live domain, for example:

```
https://siargaorides.ph/api/payments/webhook
```

For local development, you can use a service like [ngrok](https://ngrok.com/) to create a temporary public URL that forwards to your local development server.

### 2. Register the Webhook with PayMongo

1. Log in to your [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to Developers > Webhooks
3. Click "Add Endpoint"
4. Enter your webhook URL
5. Select the events you want to receive:
   - `payment.paid` - Triggered when a payment is successful
   - `payment.failed` - Triggered when a payment fails
6. Save the webhook

### 3. Secure Your Webhook (Production)

For production, you should verify webhook signatures to ensure the requests are coming from PayMongo:

1. Get your webhook secret from the PayMongo dashboard
2. Add the secret to your environment variables:
   ```
   PAYMONGO_WEBHOOK_SECRET=your_webhook_secret
   ```
3. Update the webhook handler to verify signatures

## Testing Webhooks

1. Make a test payment using the PayMongo test cards
2. Check your server logs to see if the webhook event was received
3. Verify that the payment status was updated in your database

## Webhook Events

The main events you'll receive are:

### payment.paid

This event is triggered when a payment is successfully processed. The webhook payload contains details about the payment, including:

- Payment ID
- Amount
- Status
- Payment method used
- Customer information

### payment.failed

This event is triggered when a payment fails. The webhook payload contains details about the failed payment, including:

- Payment ID
- Error information
- Payment method used

## Handling Webhook Events

When you receive a webhook event, you should:

1. Verify the webhook signature (in production)
2. Parse the event data
3. Update the booking status in your database
4. Send confirmation emails or notifications to the customer and shop owner

## Troubleshooting

If you're not receiving webhook events:

1. Check that your webhook URL is publicly accessible
2. Verify that you've registered the correct URL with PayMongo
3. Check your server logs for any errors in processing the webhook
4. Make sure your server is properly handling POST requests to the webhook endpoint

For more information, refer to the [PayMongo API Documentation](https://developers.paymongo.com/docs/webhooks).
