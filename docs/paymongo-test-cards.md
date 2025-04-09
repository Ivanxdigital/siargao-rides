# PayMongo Test Cards

This document provides test card numbers that can be used to test the PayMongo integration in the development environment.

## Test Mode

When using the test API keys, PayMongo operates in test mode. In this mode:
- No real charges are made
- Test card numbers must be used
- Webhooks will still be triggered, but with test data

## Test Card Numbers

### Successful Payments

| Card Number         | Brand | CVC | Expiry Date | Description                |
|---------------------|-------|-----|-------------|----------------------------|
| 4343434343434345    | Visa  | Any | Any future  | Successful payment         |
| 4571736000000075    | Visa  | Any | Any future  | 3DS authentication success |
| 5555555555554444    | Mastercard | Any | Any future | Successful payment     |

### Failed Payments

| Card Number         | Brand | CVC | Expiry Date | Description                |
|---------------------|-------|-----|-------------|----------------------------|
| 4111111111111111    | Visa  | Any | Any future  | Generic decline            |
| 4000000000000002    | Visa  | Any | Any future  | Declined (insufficient funds) |
| 4000000000000069    | Visa  | Any | Any future  | Expired card               |
| 4000000000000127    | Visa  | Any | Any future  | Incorrect CVC              |
| 4000000000000119    | Visa  | Any | Any future  | Processing error           |
| 4000000000000101    | Visa  | Any | Any future  | 3DS authentication failed  |

## Testing 3D Secure Authentication

Some cards will trigger 3D Secure authentication. For test cards, use these authentication values:

- **Success**: Enter any value or leave blank
- **Failure**: Enter "failure" as the authentication value

## Testing E-Wallets (GCash, GrabPay, Maya)

For e-wallets in test mode:
- You will be redirected to a test page
- No real e-wallet app will be opened
- Click "Pay" on the test page to simulate a successful payment
- Click "Fail" to simulate a failed payment

## Testing Workflow

1. Create a booking and select PayMongo as the payment method
2. Enter test card details or select an e-wallet
3. For cards requiring 3D Secure, complete the authentication
4. Check that the booking status is updated correctly
5. Verify that webhook events are received and processed

## Important Notes

- Always use test cards with future expiry dates
- Any name, email, and address can be used with test cards
- Test mode transactions will appear in your PayMongo dashboard with a "TEST" label
- Test mode transactions will never be charged to real cards

For more information, refer to the [PayMongo Testing Documentation](https://developers.paymongo.com/docs/testing).
