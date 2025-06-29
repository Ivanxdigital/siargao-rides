# Twilio SMS Setup Guide

This guide will help you set up Twilio SMS notifications for your Siargao Rides platform.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. A verified phone number for sending SMS
3. Access to your environment variables

## Setup Steps

### 1. Get Your Twilio Credentials

1. Log in to your Twilio Console: https://console.twilio.com
2. From the dashboard, locate your:
   - **Account SID** (starts with `AC`)
   - **Auth Token** (keep this secret!)
3. Get a Twilio phone number:
   - Go to Phone Numbers → Manage → Buy a Number
   - Choose a number that supports SMS
   - For Philippines, you can get a US number that can send to PH

### 2. Update Environment Variables

Update your `.env.local` file with your Twilio credentials:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number in E.164 format
TWILIO_MESSAGING_SERVICE_SID=    # Optional: Leave empty if not using Messaging Service
```

### 3. Apply Database Schema Updates

Run the following SQL scripts in your Supabase SQL Editor:

1. First, run the SMS notification schema:
   ```sql
   -- Copy contents from: sql/sms-notification-schema.sql
   ```

2. Then, run the column migration to sync existing data:
   ```sql
   -- Copy contents from: sql/sms-column-migration.sql
   ```

### 4. Configure Webhook for Status Updates (Optional)

To track SMS delivery status:

1. In Twilio Console, go to Phone Numbers → Manage → Active Numbers
2. Click on your phone number
3. In the Messaging section, set the Status Callback URL to:
   ```
   https://yourdomain.com/api/webhooks/twilio-status
   ```

### 5. Test Your Setup

1. Add your phone number to your shop settings:
   - Go to Dashboard → Shop Settings
   - Enter your phone number in international format (e.g., +639123456789)
   - Enable SMS notifications

2. Test with the test endpoint (development only):
   ```bash
   curl -X POST http://localhost:3000/api/test-sms \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "+639123456789", "shopId": "your-shop-id"}'
   ```

## Phone Number Formatting

- The system automatically formats Philippine numbers
- Accepted formats:
  - `+639123456789` (preferred)
  - `09123456789` (will be converted to +63)
  - `639123456789` (will add +)

## Cost Considerations

- Twilio charges per SMS sent
- Philippines SMS rates: ~$0.0075 USD per message
- Monitor usage in Twilio Console → Usage → Programmable Messaging

## Troubleshooting

### Common Issues

1. **"accountSid must start with AC" error**
   - Your Account SID is invalid
   - Make sure it starts with "AC"

2. **"Invalid phone number" error**
   - Ensure phone numbers are in E.164 format
   - For PH numbers: +639XXXXXXXXX

3. **SMS not sending**
   - Check if Twilio credentials are correct
   - Verify your Twilio account has SMS capabilities
   - Check if the destination country is enabled in your Twilio account

### Debug Mode

To see detailed logs:
1. Check your server console for SMS sending logs
2. View SMS history in Dashboard → Shop Settings → SMS History

## Security Notes

- Never commit your Twilio Auth Token to version control
- Use environment variables for all sensitive credentials
- The webhook endpoint validates Twilio signatures for security

## Support

For Twilio-specific issues:
- Twilio Support: https://support.twilio.com
- Twilio Status: https://status.twilio.com

For integration issues:
- Check the SMS notification history in your shop dashboard
- Review server logs for detailed error messages