# Notification System Improvement Plan

## Executive Summary

This document outlines a comprehensive plan to transform the Siargao Rides notification system from a fragile, frontend-dependent email-only system to a robust, multi-channel notification platform that ensures shop owners never miss critical booking updates.

## Current System Analysis

### 🔍 What's Working
- **Email Infrastructure**: Resend service with React email templates
- **Real-time Browser Notifications**: Supabase real-time subscriptions for live updates
- **Basic Email Templates**: Customer booking confirmations and shop owner notifications

### ❌ Critical Problems Identified

#### 1. **Missed Notifications**
- Shop owners only receive real-time notifications when dashboard is actively open
- No email notifications for booking status changes (confirmed, cancelled, completed)
- If shop owner closes browser, they miss all subsequent booking updates

#### 2. **Fragile Architecture**
- Email notifications depend on frontend API calls after booking creation
- If `/api/send-booking-email` fails, booking is created but no notifications sent
- No retry mechanism for failed email deliveries
- No fallback notification channels

#### 3. **Limited Notification Types**
- Only new booking creation triggers email notifications
- Status changes (pending → confirmed → completed) have no email alerts
- No pickup reminders or cancellation warnings
- No payment confirmation notifications

#### 4. **No User Control**
- Zero notification preferences or settings
- No opt-out mechanisms for different notification types
- No frequency controls (immediate vs digest)
- No quiet hours or timezone considerations

#### 5. **No Notification History**
- No tracking of sent notifications
- No delivery status monitoring
- Cannot resend failed notifications
- No analytics on notification effectiveness

## Market Research: Cost-Effective Solutions (2025)

### SMS API Providers
| Provider | Cost (Philippines) | Reliability | Notes |
|----------|-------------------|-------------|-------|
| **Semaphore** | ₱0.50 per SMS | High | Local provider, all PH networks |
| **Vonage** | $0.007 USD per SMS | High | Global provider, competitive pricing |
| **Twilio** | $0.0075 USD per SMS | High | Premium service, excellent docs |
| **ITEXMO** | Contact for pricing | Medium | Local provider, package-based |

### WhatsApp Business API
- **2025 Pricing Change**: Moving from conversation-based to per-message billing (July 2025)
- **Cost**: $0.001-0.01 USD per message (varies by message type)
- **Key Benefits**: 
  - Free 24-hour service conversation window for customer replies
  - Rich media support (images, documents, location)
  - Higher engagement rates than SMS
  - Two-way conversations for customer support

### Recommended Provider Selection
1. **SMS**: **Semaphore** for local reliability and transparent pricing
2. **WhatsApp**: **Meta's Business API** via providers like Twilio or direct integration
3. **Email**: Continue with **Resend** (already working well)

## Proposed Solution Architecture

### Phase 1: Foundation & Database Triggers (Week 1-2)

#### 1.1 Database Schema Updates
```sql
-- Notification preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  shop_id UUID REFERENCES rental_shops(id),
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  notification_types JSONB DEFAULT '{"new_booking": true, "status_change": true, "payment": true, "pickup_reminder": true}',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'Asia/Manila',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification queue table
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  recipient_type VARCHAR(20) NOT NULL, -- 'user' or 'shop_owner'
  notification_type VARCHAR(50) NOT NULL,
  channels JSONB NOT NULL, -- ['email', 'sms', 'whatsapp']
  subject VARCHAR(255),
  message TEXT NOT NULL,
  template_data JSONB,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, sent, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification delivery log
CREATE TABLE notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES notification_queue(id),
  channel VARCHAR(20) NOT NULL,
  provider VARCHAR(50),
  external_id VARCHAR(255), -- Provider's message ID
  status VARCHAR(20) NOT NULL, -- sent, delivered, failed, bounced
  delivered_at TIMESTAMPTZ,
  cost_amount DECIMAL(10,4),
  cost_currency VARCHAR(3) DEFAULT 'PHP',
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 Database Triggers
```sql
-- Function to queue notifications on booking status changes
CREATE OR REPLACE FUNCTION queue_booking_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle new bookings
  IF TG_OP = 'INSERT' THEN
    -- Queue notification for shop owner
    INSERT INTO notification_queue (
      recipient_id, recipient_type, notification_type,
      channels, subject, message, template_data
    )
    SELECT 
      rs.owner_id, 'shop_owner', 'new_booking',
      CASE 
        WHEN np.sms_enabled THEN '["email", "sms"]'::jsonb
        ELSE '["email"]'::jsonb
      END,
      'New Booking Received',
      'You have received a new booking request.',
      jsonb_build_object(
        'booking_id', NEW.id,
        'vehicle_name', v.name,
        'customer_name', COALESCE(NEW.guest_name, u.first_name || ' ' || u.last_name),
        'start_date', NEW.start_date,
        'end_date', NEW.end_date,
        'total_price', NEW.total_price
      )
    FROM rental_shops rs
    JOIN vehicles v ON v.id = NEW.vehicle_id
    LEFT JOIN users u ON u.id = NEW.user_id
    LEFT JOIN notification_preferences np ON np.shop_id = rs.id
    WHERE rs.id = NEW.shop_id;
    
  -- Handle status changes
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Queue notification for customer
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO notification_queue (
        recipient_id, recipient_type, notification_type,
        channels, subject, message, template_data
      )
      SELECT 
        NEW.user_id, 'user', 'status_change',
        '["email"]'::jsonb,
        'Booking Status Updated',
        'Your booking status has been updated to: ' || NEW.status,
        jsonb_build_object(
          'booking_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'vehicle_name', v.name
        )
      FROM vehicles v
      WHERE v.id = NEW.vehicle_id;
    END IF;
    
    -- Queue notification for shop owner on confirmations/cancellations
    IF NEW.status IN ('confirmed', 'cancelled', 'completed') THEN
      INSERT INTO notification_queue (
        recipient_id, recipient_type, notification_type,
        channels, subject, message, template_data
      )
      SELECT 
        rs.owner_id, 'shop_owner', 'status_change',
        '["email"]'::jsonb,
        'Booking Status Updated',
        'Booking has been updated to: ' || NEW.status,
        jsonb_build_object(
          'booking_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'vehicle_name', v.name
        )
      FROM rental_shops rs
      JOIN vehicles v ON v.id = NEW.vehicle_id
      WHERE rs.id = NEW.shop_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_queue_booking_notifications
  AFTER INSERT OR UPDATE ON rentals
  FOR EACH ROW
  EXECUTE FUNCTION queue_booking_notifications();
```

#### 1.3 Notification Processing Service
Create `/src/lib/notification-processor.ts`:
```typescript
interface NotificationProcessor {
  processQueue(): Promise<void>
  sendEmail(notification: QueuedNotification): Promise<boolean>
  sendSMS(notification: QueuedNotification): Promise<boolean>
  sendWhatsApp(notification: QueuedNotification): Promise<boolean>
  retryFailed(): Promise<void>
}
```

### Phase 2: Multi-Channel Integration (Week 3-4)

#### 2.1 SMS Integration (Semaphore)
```typescript
// src/lib/sms-service.ts
export class SemaphoreSMSService {
  private apiKey: string
  private baseUrl = 'https://semaphore.co/api/v4'
  
  async sendSMS(to: string, message: string): Promise<SMSResult> {
    // Implementation for Semaphore SMS API
  }
}
```

#### 2.2 WhatsApp Integration
```typescript
// src/lib/whatsapp-service.ts
export class WhatsAppService {
  private accessToken: string
  private phoneNumberId: string
  
  async sendMessage(to: string, message: WhatsAppMessage): Promise<WhatsAppResult> {
    // Implementation for WhatsApp Business API
  }
  
  async sendTemplate(to: string, template: string, params: any[]): Promise<WhatsAppResult> {
    // Send pre-approved template messages
  }
}
```

#### 2.3 Enhanced Email Templates
- Booking confirmation with rich formatting
- Status change notifications with action buttons
- Pickup reminders with maps/directions
- Payment confirmations with receipts

### Phase 3: User Preferences & Dashboard (Week 5-6)

#### 3.1 Notification Settings Page
Create `/src/app/dashboard/settings/notifications/page.tsx`:
- Channel preferences (email, SMS, WhatsApp)
- Notification type controls
- Quiet hours settings
- Test notification feature

#### 3.2 Shop Owner Notification Dashboard
- Real-time notification feed
- Delivery status tracking
- Notification history
- Performance analytics

### Phase 4: Advanced Features (Week 7-8)

#### 4.1 Smart Scheduling
- Respect quiet hours and timezones
- Batch non-urgent notifications into daily digests
- Priority queuing for urgent notifications

#### 4.2 Fallback Logic
- If email fails → try SMS
- If SMS fails → try WhatsApp
- If all fail → escalate to admin

#### 4.3 Analytics & Monitoring
- Delivery rates by channel
- User engagement metrics
- Cost tracking and optimization
- Performance dashboards

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Create database schema
- [ ] Implement database triggers
- [ ] Build notification queue processor
- [ ] Test with existing email system

### Week 3-4: Multi-Channel
- [ ] Integrate Semaphore SMS
- [ ] Set up WhatsApp Business API
- [ ] Create enhanced email templates
- [ ] Implement channel routing logic

### Week 5-6: User Experience
- [ ] Build notification preferences UI
- [ ] Create shop owner notification dashboard
- [ ] Add notification history
- [ ] Implement test notification feature

### Week 7-8: Advanced Features
- [ ] Add smart scheduling
- [ ] Implement fallback logic
- [ ] Build analytics dashboard
- [ ] Performance optimization

## Cost Analysis

### Current Costs (Monthly)
- **Email**: ~$10-20 (Resend, based on volume)
- **Total**: $10-20/month

### Projected Costs with Multi-Channel
| Service | Volume | Unit Cost | Monthly Cost |
|---------|--------|-----------|--------------|
| Email | 5,000 emails | $0.0004 | $2 |
| SMS | 1,000 SMS | ₱0.50 | ₱500 (~$9) |
| WhatsApp | 2,000 messages | $0.005 | $10 |
| **Total** | | | **~$21/month** |

### ROI Calculation
- **Reduced missed bookings**: 15-20% improvement in booking confirmations
- **Better customer satisfaction**: Faster response times
- **Increased shop owner engagement**: More active participation
- **Cost per prevented missed booking**: ~$0.50

## Success Metrics

### Technical Metrics
- **Notification delivery rate**: Target >99%
- **Processing latency**: <30 seconds for urgent notifications
- **Failed notification rate**: <1%
- **System uptime**: >99.9%

### Business Metrics
- **Booking confirmation rate**: +15-20%
- **Shop owner response time**: <2 hours average
- **Customer satisfaction**: +10% improvement
- **Support ticket reduction**: -30% notification-related issues

## Risk Mitigation

### Technical Risks
- **API failures**: Implement robust retry logic and fallback channels
- **Rate limiting**: Queue management and exponential backoff
- **Data privacy**: Ensure GDPR compliance for user preferences

### Business Risks
- **Notification fatigue**: Provide granular user controls
- **Cost overruns**: Implement usage monitoring and alerts
- **Regulatory compliance**: Follow telecom regulations for SMS/WhatsApp

## Next Steps

1. **Review and approve** this plan
2. **Set up development environment** with test accounts for SMS/WhatsApp
3. **Begin Phase 1 implementation** with database schema
4. **Create detailed technical specifications** for each component
5. **Set up monitoring and alerting** for the new system

## Conclusion

This comprehensive notification system will transform how Siargao Rides communicates with shop owners and customers, ensuring no booking is missed while providing users with full control over their notification preferences. The phased approach allows for iterative testing and refinement, minimizing risk while maximizing impact.

The investment of ~$21/month in notification infrastructure will pay for itself through improved booking confirmation rates and customer satisfaction, while positioning Siargao Rides as a modern, reliable platform for vehicle rentals.