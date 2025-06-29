# Twilio SMS Integration Plan for Shop Owner Notifications

## Overview

This document outlines the implementation plan for integrating Twilio SMS notifications into the Siargao Rides platform. The primary goal is to ensure shop owners receive instant SMS notifications for every booking request, eliminating the need to be actively monitoring the dashboard.

## Current State Analysis

### Existing Notification System

1. **Real-time In-App Notifications**
   - Toast notifications via Supabase real-time subscriptions
   - Only visible when shop owner is logged into the dashboard
   - Implemented in `/src/lib/notifications.ts`

2. **Email Notifications**
   - Sent via Resend API to shop owners
   - Template: `/src/emails/ShopNotificationEmail.tsx`
   - API endpoint: `/src/app/api/send-booking-email/route.ts`

3. **Limitations**
   - No push notifications
   - No SMS capabilities
   - Shop owners must be online to receive real-time notifications
   - Risk of missed bookings when shop owners are offline

## Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

#### 1.1 Database Schema Updates

```sql
-- Add phone number and SMS preferences to rental_shops table
ALTER TABLE rental_shops
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN sms_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN phone_verified BOOLEAN DEFAULT false,
ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Create SMS notification history table
CREATE TABLE sms_notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES rental_shops(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  twilio_message_sid VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE sms_notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can view their SMS history" ON sms_notification_history
  FOR SELECT USING (shop_id IN (
    SELECT id FROM rental_shops WHERE owner_id = auth.uid()
  ));
```

#### 1.2 Environment Configuration

Add to `.env.local`:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=optional_messaging_service_sid
```

### Phase 2: Core SMS Service Implementation (Week 1-2)

#### 2.1 Twilio SMS Service (`/src/lib/sms.ts`)

```typescript
import twilio from 'twilio';
import { supabase } from './supabase';

export interface SMSNotification {
  to: string;
  message: string;
  shopId: string;
  rentalId: string;
}

export class TwilioService {
  private client: twilio.Twilio;
  
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendBookingNotification(notification: SMSNotification): Promise<void> {
    try {
      // Send SMS
      const message = await this.client.messages.create({
        body: notification.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notification.to
      });

      // Log to database
      await this.logSMSNotification({
        ...notification,
        twilioMessageSid: message.sid,
        status: 'sent'
      });

    } catch (error) {
      // Handle Twilio-specific errors
      await this.handleSMSError(error, notification);
      throw error;
    }
  }

  private async logSMSNotification(data: any): Promise<void> {
    await supabase.from('sms_notification_history').insert({
      shop_id: data.shopId,
      rental_id: data.rentalId,
      phone_number: data.to,
      message_content: data.message,
      twilio_message_sid: data.twilioMessageSid,
      status: data.status,
      error_message: data.errorMessage
    });
  }

  private async handleSMSError(error: any, notification: SMSNotification): Promise<void> {
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || 'UNKNOWN';
    
    await this.logSMSNotification({
      ...notification,
      status: 'failed',
      errorMessage: `${errorCode}: ${errorMessage}`
    });
  }
}
```

#### 2.2 API Route for SMS Webhook (`/src/app/api/webhooks/booking-sms/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TwilioService } from '@/lib/sms';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate webhook payload
    if (body.type !== 'INSERT' || body.table !== 'rentals') {
      return NextResponse.json({ success: true });
    }

    const rental = body.record;
    const supabase = createClient();
    
    // Get shop details with phone number
    const { data: shop } = await supabase
      .from('rental_shops')
      .select('phone_number, sms_notifications_enabled, name')
      .eq('id', rental.shop_id)
      .single();

    // Check if SMS notifications are enabled
    if (!shop?.sms_notifications_enabled || !shop?.phone_number) {
      return NextResponse.json({ success: true });
    }

    // Get customer details
    const { data: customer } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', rental.user_id)
      .single();

    // Prepare SMS message
    const message = `New booking request!\n` +
      `Customer: ${customer?.full_name}\n` +
      `Dates: ${new Date(rental.start_date).toLocaleDateString()} - ${new Date(rental.end_date).toLocaleDateString()}\n` +
      `Vehicle: ${rental.vehicle_name}\n` +
      `View details: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/bookings/${rental.id}`;

    // Send SMS
    const twilioService = new TwilioService();
    await twilioService.sendBookingNotification({
      to: shop.phone_number,
      message,
      shopId: rental.shop_id,
      rentalId: rental.id
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('SMS webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS notification' },
      { status: 500 }
    );
  }
}
```

### Phase 3: Supabase Integration (Week 2)

#### 3.1 Database Webhook Configuration

1. **Create Webhook in Supabase Dashboard**
   - Navigate to Database → Webhooks
   - Create new webhook:
     - Name: `booking-sms-notification`
     - Table: `rentals`
     - Events: `INSERT`
     - URL: `https://yourdomain.com/api/webhooks/booking-sms`
     - HTTP method: `POST`
     - Headers: Add authorization header if needed

2. **Webhook Payload Structure**
   ```json
   {
     "type": "INSERT",
     "table": "rentals",
     "record": {
       "id": "rental-uuid",
       "user_id": "user-uuid",
       "shop_id": "shop-uuid",
       "vehicle_id": "vehicle-uuid",
       "start_date": "2025-01-01",
       "end_date": "2025-01-03",
       "status": "pending"
     },
     "schema": "public"
   }
   ```

### Phase 4: User Interface Updates (Week 2-3)

#### 4.1 Shop Settings Page Enhancement

Update `/src/app/dashboard/settings/page.tsx` to include:

```typescript
// Phone number management section
<Card>
  <CardHeader>
    <CardTitle>SMS Notifications</CardTitle>
    <CardDescription>
      Receive instant SMS alerts for new booking requests
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handlePhoneUpdate}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+639123456789"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Use international format (e.g., +639123456789)
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="sms-enabled"
            checked={smsEnabled}
            onCheckedChange={setSmsEnabled}
          />
          <Label htmlFor="sms-enabled">
            Enable SMS notifications for bookings
          </Label>
        </div>
        
        <Button type="submit">Save SMS Settings</Button>
      </div>
    </form>
  </CardContent>
</Card>
```

#### 4.2 Notification History Component

Create a component to display SMS delivery status:

```typescript
// SMS notification history table
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Booking</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Message</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {smsHistory.map((sms) => (
      <TableRow key={sms.id}>
        <TableCell>{formatDate(sms.sent_at)}</TableCell>
        <TableCell>{sms.rental_id}</TableCell>
        <TableCell>
          <Badge variant={sms.status === 'delivered' ? 'success' : 'secondary'}>
            {sms.status}
          </Badge>
        </TableCell>
        <TableCell className="max-w-xs truncate">
          {sms.message_content}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Phase 5: Testing & Deployment (Week 3)

#### 5.1 Testing Strategy

1. **Development Testing**
   - Use Twilio test credentials
   - Mock phone numbers for local testing
   - Test webhook locally with ngrok or similar

2. **Test Scenarios**
   - New booking creation → SMS sent
   - SMS delivery failure → Error logged
   - Shop without phone number → Email fallback
   - SMS disabled → No SMS sent
   - International phone numbers → Proper formatting

3. **Load Testing**
   - Test with multiple simultaneous bookings
   - Verify rate limiting works correctly
   - Check webhook reliability

#### 5.2 Monitoring & Analytics

1. **SMS Delivery Metrics**
   - Track delivery success rate
   - Monitor failed messages
   - Cost per SMS tracking
   - Response time metrics

2. **Dashboard Analytics**
   ```sql
   -- SMS delivery statistics
   SELECT 
     COUNT(*) as total_sms,
     COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
     COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
     AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) as avg_delivery_time
   FROM sms_notification_history
   WHERE created_at >= NOW() - INTERVAL '30 days';
   ```

### Phase 6: Cost Optimization & Scaling (Ongoing)

#### 6.1 Cost Management

1. **Pricing Considerations**
   - Twilio SMS pricing varies by country
   - Philippines: ~$0.0075 per SMS
   - Budget estimation: 1000 bookings/month = ~$7.50/month

2. **Cost Optimization Strategies**
   - Use Twilio Messaging Services for better rates
   - Implement message templates to reduce length
   - Consider bulk messaging for multiple notifications
   - Add spending alerts in Twilio console

#### 6.2 Scaling Considerations

1. **Rate Limiting**
   - Implement per-shop SMS limits
   - Add daily/monthly caps
   - Queue system for high-volume periods

2. **International Support**
   - E.164 phone number formatting
   - Country-specific message routing
   - Multi-language SMS templates

## Security Considerations

1. **Webhook Security**
   - Implement webhook signature verification
   - Use HTTPS only
   - Add IP whitelisting if possible

2. **Data Protection**
   - Encrypt phone numbers at rest
   - PII handling compliance
   - Audit logs for SMS access

3. **Access Control**
   - Only shop owners can update their phone numbers
   - Admin override capabilities
   - SMS history visibility restrictions

## Rollout Plan

### Week 1: Foundation
- Database schema updates
- Environment setup
- Basic SMS service implementation

### Week 2: Integration
- Webhook configuration
- API route development
- Testing infrastructure

### Week 3: UI & Testing
- Shop settings interface
- SMS history display
- Comprehensive testing

### Week 4: Launch
- Gradual rollout to shops
- Monitor metrics
- Gather feedback
- Optimize based on usage

## Success Metrics

1. **Technical Metrics**
   - SMS delivery rate > 95%
   - Average delivery time < 5 seconds
   - Zero security incidents

2. **Business Metrics**
   - Reduced booking response time
   - Increased booking acceptance rate
   - Improved shop owner satisfaction
   - Reduced missed bookings

## Future Enhancements

1. **Phase 2 Features**
   - Two-way SMS conversations
   - SMS templates customization
   - Scheduled SMS reminders
   - WhatsApp integration

2. **Advanced Features**
   - Voice call notifications
   - Multi-channel preferences
   - Smart notification routing
   - AI-powered message optimization

## Conclusion

This Twilio SMS integration will significantly improve the shop owner experience by ensuring they never miss a booking request. The implementation follows best practices for security, scalability, and reliability while maintaining cost efficiency. The phased approach allows for gradual rollout and continuous improvement based on real-world usage and feedback.