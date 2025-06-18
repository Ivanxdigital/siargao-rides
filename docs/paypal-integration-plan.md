# PayPal Checkout Integration Plan for Siargao Rides

## Overview
Add PayPal as a new payment option to complement existing PayMongo and cash payment methods, leveraging PayPal's 2025 JavaScript SDK with React integration.

## Research Summary

### Current System Analysis
- **Payment Architecture**: Modular design with `payment_methods` table supporting multiple providers
- **Existing Providers**: PayMongo (cards/GCash), Cash payments
- **Frontend**: React/Next.js with TypeScript, existing payment forms in `/booking/payment/[id]`
- **Database**: Well-structured with `paymongo_payments` table pattern for provider-specific data

### PayPal 2025 Best Practices
- **SDK**: Use official `@paypal/react-paypal-js` package (v8.8.3)
- **Architecture**: PayPal Advanced Checkout with Smart Buttons
- **Security**: Client ID exposed on frontend (normal), Secret key server-side only
- **Philippines Fees**: ~4.4% for international transactions + ₱15-20 fixed fee
- **Performance**: Async loading, React Context provider pattern

## Implementation Plan

### Phase 1: Backend Infrastructure (2-3 hours)
1. **Environment Configuration**
   - Add PayPal environment variables to `.env.local`
   - Update CLAUDE.md with PayPal keys documentation

2. **Database Schema**
   - Create `paypal_payments` table (following `paymongo_payments` pattern)
   - Add PayPal payment method to `payment_methods` table
   - Update TypeScript types in `src/lib/types.ts`

3. **PayPal Service Layer**
   - Create `src/lib/paypal.ts` service (following `paymongo.ts` pattern)
   - Implement order creation, capture, and status checking
   - Add webhook signature verification

### Phase 2: API Routes (2-3 hours)
1. **Payment Intent API**
   - `/api/payments/paypal/create-order/` - Order creation
   - `/api/payments/paypal/capture-order/` - Payment capture
   - `/api/payments/paypal/webhook/` - Status updates

2. **Integration Points**
   - Update `/api/create-booking/` to handle PayPal method
   - Extend payment status checking APIs

### Phase 3: Frontend Components (3-4 hours)
1. **PayPal Component**
   - Create `PayPalCheckoutForm.tsx` using `@paypal/react-paypal-js`
   - Implement proper error handling and loading states
   - Follow existing UI patterns from PayMongo components

2. **Payment Page Updates**
   - Add PayPal option to payment method selector in `/booking/payment/[id]`
   - Update booking form to include PayPal routing
   - Add PayPal provider context at app level

### Phase 4: Configuration & Testing (1-2 hours)
1. **System Settings**
   - Add PayPal toggle to admin payment settings
   - Update environment variable validation
   - Configure PayPal sandbox for development

2. **Integration Testing**
   - Test complete booking flow with PayPal
   - Verify webhook handling and status updates
   - Test error scenarios and fallbacks

## Technical Implementation Details

### PayPal SDK Integration
```typescript
// Provider setup in _app.tsx
<PayPalScriptProvider options={{
  "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  currency: "PHP",
  intent: "capture"
}}>
```

### Database Schema Addition
```sql
-- New payment method entry
INSERT INTO payment_methods (name, description, provider, is_online, is_active)
VALUES ('PayPal', 'Pay with PayPal account or card', 'paypal', true, true);

-- PayPal transactions table
CREATE TABLE paypal_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES rentals(id),
  order_id TEXT NOT NULL,
  capture_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'PHP',
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Environment Variables
```bash
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_ENVIRONMENT=sandbox # or live
```

## Risk Mitigation

### Security Considerations
- Keep PayPal client secret server-side only
- Implement proper webhook signature verification
- Use HTTPS for all PayPal communications
- Validate all payment amounts server-side

### Business Considerations
- 4.4% + fixed fee impact on pricing
- Currency conversion from PHP handling
- International customer support implications
- Chargeback/dispute handling procedures

## Timeline
- **Total Estimated Time**: 8-12 hours
- **Complexity**: Medium (following existing patterns)
- **Dependencies**: PayPal business account approval
- **Testing Phase**: 1-2 days for thorough validation

## Success Metrics
- Successful PayPal payment completion
- Proper booking status updates
- Error handling for failed payments
- Webhook reliability
- Performance benchmarks maintained

## Research References

### PayPal Documentation (2025)
- [PayPal JavaScript SDK](https://developer.paypal.com/sdk/js/)
- [React PayPal JS Package](https://www.npmjs.com/package/@paypal/react-paypal-js)
- [PayPal Security Guidelines](https://developer.paypal.com/api/rest/reference/info-security-guidelines/)

### Fee Structure (Philippines)
- International merchant transactions: 4.4% + fixed fee
- Currency conversion: 3-4% markup on exchange rates
- Updated January 2025

### Integration Patterns
- Smart Buttons with dynamic payment options
- Orders API v2 (recommended over legacy Express Checkout)
- Webhook verification for payment status updates
- React Context provider for SDK management

## Implementation Checklist

### Phase 1: Backend Infrastructure ✅ COMPLETED
- [x] Add PayPal environment variables
- [x] Create `paypal_payments` table
- [x] Add PayPal payment method to database
- [x] Create `src/lib/paypal.ts` service
- [x] Update TypeScript types

### Phase 2: API Routes ✅ COMPLETED
- [x] `/api/payments/paypal/create-order/`
- [x] `/api/payments/paypal/capture-order/`
- [x] `/api/payments/paypal/webhook/`
- [x] Update existing booking APIs

### Phase 3: Frontend Components ✅ COMPLETED
- [x] Install `@paypal/react-paypal-js`
- [x] Create `PayPalCheckoutForm.tsx`
- [x] Add PayPal to payment method selector
- [x] Update payment page routing
- [x] Add PayPal provider to app

### Phase 4: Configuration & Testing ⚠️ READY FOR TESTING
- [x] Add PayPal admin settings toggle
- [x] Configure sandbox environment
- [ ] End-to-end booking flow testing (requires PayPal sandbox credentials)
- [ ] Webhook testing and validation (requires PayPal webhook setup)
- [ ] Error scenario testing (requires PayPal sandbox credentials)

## Implementation Status: ✅ COMPLETE

**Date Completed:** June 18, 2025

The PayPal checkout integration has been successfully implemented following the planned architecture. All core functionality is now ready for testing with actual PayPal sandbox credentials.

### What's Been Implemented

1. **Complete Backend Infrastructure**
   - PayPal service layer with Orders API v2
   - Database schema for PayPal transactions
   - Three API endpoints for order management
   - Webhook handling with signature verification

2. **Frontend Integration**
   - PayPal React component using official SDK
   - Payment method selector updated
   - Admin settings panel for PayPal toggle
   - Full integration with existing payment flow

3. **Following Best Practices**
   - 2025 PayPal SDK and security standards
   - Consistent with existing PayMongo patterns
   - TypeScript strict mode compliance
   - Proper error handling and user feedback

### Next Steps for Production

1. **Get PayPal Business Account Credentials**
   - Replace placeholder environment variables with real PayPal credentials
   - Set up PayPal webhooks in PayPal Developer Dashboard
   - Configure live vs sandbox environment

2. **Testing**
   - Test complete booking flow with PayPal sandbox
   - Verify webhook functionality
   - Test error scenarios and edge cases

## Notes
- This plan follows existing PayMongo integration patterns for consistency
- All new code should follow the project's TypeScript strict mode requirements
- Security best practices from 2025 research incorporated
- Modular design allows easy future payment provider additions