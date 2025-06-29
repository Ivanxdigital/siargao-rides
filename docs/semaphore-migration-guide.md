# Semaphore SMS Migration Guide

This guide covers the migration from Twilio to Semaphore SMS provider for the Siargao Rides platform.

## Overview

We've migrated from Twilio to Semaphore for SMS notifications to:
- Reduce costs (₱0.50/SMS vs higher Twilio pricing)
- Improve delivery rates for Philippine mobile networks
- Use a local SMS provider with better support for Philippines

## Changes Made

### 1. Service Implementation
- **File**: `src/lib/sms.ts`
- **Changes**: Replaced `TwilioService` with `SemaphoreService`
- **API**: Now uses Semaphore REST API instead of Twilio SDK
- **Backward Compatibility**: Maintained through export aliases

### 2. Database Schema
- **Migration File**: `sql/semaphore-migration.sql`
- **Changes**: Added `semaphore_message_id` column to `sms_notification_history`
- **Compatibility**: Keeps existing `twilio_message_sid` for historical data
- **Functions**: Added helper functions for provider detection

### 3. Webhook Endpoints
- **New**: `/api/webhooks/semaphore-status` (prepared for future use)
- **Alternative**: `/api/sms/check-status` for manual status polling
- **Existing**: `/api/webhooks/twilio-status` (kept for historical records)

### 4. Environment Variables
- **Added**: `SEMAPHORE_API_KEY` (required)
- **Added**: `SEMAPHORE_SENDER_NAME` (optional, defaults to "SEMAPHORE")
- **Removed**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### 5. Dependencies
- **Removed**: `twilio` package from `package.json`
- **No new dependencies**: Uses native `fetch()` for API calls

## Setup Instructions

### 1. Get Semaphore API Key
1. Sign up at [semaphore.co](https://semaphore.co)
2. Complete account verification
3. Get your API key from the dashboard
4. Purchase SMS credits (₱0.50/SMS)

### 2. Environment Configuration
Add to your `.env.local`:
```env
SEMAPHORE_API_KEY=your_api_key_here
SEMAPHORE_SENDER_NAME=SIARGAORIDES  # Optional custom sender name
```

### 3. Database Migration
Execute the migration SQL in Supabase SQL Editor:
```sql
-- Run the contents of sql/semaphore-migration.sql
```

### 4. Install Dependencies
```bash
npm install  # Removes Twilio, no new dependencies needed
```

### 5. Testing
Test the SMS functionality:
```bash
# Start development server
npm run dev

# Test SMS endpoint (if configured)
curl -X POST http://localhost:3000/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+639xxxxxxxxx", "message": "Test message"}'
```

## API Differences

### Phone Number Format
- **Twilio**: Required E.164 format (+639xxxxxxxxx)
- **Semaphore**: Accepts Philippine formats (09xxxxxxxxx or +639xxxxxxxxx)

### Message Limits
- **Twilio**: No specific limit per message
- **Semaphore**: 160 characters per SMS (automatically splits longer messages)

### Delivery Status
- **Twilio**: Real-time webhooks for delivery status
- **Semaphore**: Polling required (webhooks may not be available)

### Priority Messaging
- **Twilio**: Standard delivery
- **Semaphore**: Optional priority queue (2 credits/SMS)

## Status Tracking

### Webhook Alternative
Since Semaphore may not support webhooks, we've implemented polling:

1. **Manual Trigger**: `/api/sms/check-status` endpoint
2. **Automatic**: Can be scheduled via cron jobs
3. **Function**: `smsService.checkPendingMessageStatuses()`

### Monitoring
- Check delivery rates in the admin dashboard
- Monitor via `sms_notification_stats` view
- Review error logs for failed messages

## Migration Checklist

- [x] Replace SMS service implementation
- [x] Update database schema
- [x] Create webhook endpoints
- [x] Update environment variables
- [x] Remove Twilio dependencies
- [x] Test SMS functionality
- [ ] **Execute database migration in production**
- [ ] **Update production environment variables**
- [ ] **Monitor delivery rates**
- [ ] **Set up status polling cron job (optional)**

## Rollback Plan

If issues arise, rollback steps:

1. **Environment**: Switch back to Twilio environment variables
2. **Code**: The service still supports Twilio through backward compatibility
3. **Database**: Historical Twilio data remains intact
4. **Dependencies**: Re-add `twilio` package if needed

```bash
npm install twilio@^5.7.1
```

## Cost Comparison

### Twilio (Previous)
- Base SMS: Variable pricing
- Philippine delivery: Higher costs
- Additional fees for international routing

### Semaphore (Current)
- Base SMS: ₱0.50 per message
- Priority SMS: ₱1.00 per message (2 credits)
- OTP SMS: ₱1.00 per message (dedicated route)
- No additional fees for Philippine networks

## Support

### Semaphore Support
- Website: [semaphore.co](https://semaphore.co)
- Documentation: [semaphore.co/docs](https://semaphore.co/docs)
- Email: support@semaphore.co

### Technical Issues
- Check logs in `/api/sms/check-status` endpoint
- Monitor database `sms_notification_history` table
- Review service logs for error messages

## Future Enhancements

1. **Scheduled Status Checks**: Implement cron job for automatic status polling
2. **Bulk Messaging**: Utilize Semaphore's bulk API for multiple recipients
3. **OTP Service**: Use dedicated OTP endpoint for verification codes
4. **Analytics**: Enhanced reporting on SMS delivery performance