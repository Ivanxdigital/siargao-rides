# Siargao Rides Referral System – Full Implementation Prompt

```txt
🤖 You are a full-stack AI agent building a web app using Next.js, Tailwind CSS, and Supabase.
Context: Siargao Rides project for vehicle rentals.

**Feature:** Referral System for Shop Onboarding

---

**Step 1: Think**
- **Data Models:**  
  - New Supabase table: `referrals` (see schema below)
  - Add `referrer_id` (UUID, FK to users) to `rental_shops`
- **Components:**  
  - Registration form (with referral field, validation, and logic)
  - User referral dashboard (shows referral link, status, payouts)
  - Admin referral management dashboard (view, filter, mark as paid)
- **API/Service:**  
  - Functions to create, update, and fetch referrals
  - Logic to update referral status on shop/vehicle verification
  - Notification system for referral events

---

**Step 2: Explain**
- When a user refers a shop owner (via link or name/email), and that shop is registered, verified, and has a verified vehicle, the referrer is eligible for a 500 PHP payout.
- The system must track referrals, update their status as shops/vehicles are verified, and allow admins to process payouts.
- Users can view/share their referral link and see their referral history and payout status.
- Admins can view all referrals, filter by status, and mark payouts as completed.

---

**Step 3: Code**

**A. Supabase SQL Migration**
- Create the `referrals` table:
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  shop_id UUID NOT NULL REFERENCES rental_shops(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, paid
  payout_amount NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  vehicle_added BOOLEAN NOT NULL DEFAULT FALSE,
  shop_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference VARCHAR(255),
  payment_method VARCHAR(100),
  notes TEXT,
  UNIQUE(referrer_id, shop_id)
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Admins can perform all operations on referrals" ON referrals FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE INDEX referrals_referrer_id_idx ON referrals(referrer_id);
CREATE INDEX referrals_shop_id_idx ON referrals(shop_id);
```
- Add `referrer_id` to `rental_shops`:
```sql
ALTER TABLE rental_shops ADD COLUMN referrer_id UUID REFERENCES users(id);
```

**B. TypeScript Types**
- Add to `src/lib/types.ts`:
```typescript
export type ReferralStatus = 'pending' | 'completed' | 'paid';
export type Referral = {
  id: string;
  referrer_id: string;
  shop_id: string;
  status: ReferralStatus;
  payout_amount: number;
  vehicle_added: boolean;
  shop_verified: boolean;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  payment_reference?: string;
  payment_method?: string;
  notes?: string;
};
```

**C. API & Service Layer**
- Add functions to `src/lib/api.ts` and `src/lib/service.ts` for:
  - `createReferral`
  - `getUserReferrals`
  - `updateReferralStatus`
  - `getReferralStats`

**D. Referral Link Utility**
- In `src/lib/referral.ts`:
```typescript
export function generateReferralLink(userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siargaorides.ph';
  return `${baseUrl}/register?ref=${userId}`;
}
export function parseReferralCode(code: string): string | null {
  if (!code || typeof code !== 'string' || code.length < 10) return null;
  return code;
}
```

**E. Registration Form**
- Update `/register/page.tsx` to:
  - Validate referrer (by email/name or referral link)
  - Store `referrer_id` in `rental_shops` and create a referral record

**F. User Dashboard**
- Create `/dashboard/referrals/page.tsx`:
  - Show referral link, referral history, payout status

**G. Admin Dashboard**
- Create `/admin/referrals/page.tsx`:
  - List all referrals, filter by status, mark as paid

**H. Notification System**
- In `src/lib/notifications.ts`, add:
```typescript
export const sendReferralNotification = async (userId: string, shopName: string, eventType: 'shop_verified' | 'vehicle_added' | 'payout_ready' | 'payout_sent') => {
  // ...see Plan.md for message logic
};
```

**I. Integration**
- Update shop and vehicle verification logic to update referral status as described in Plan.md.

**J. Testing & Documentation**
- Test the full referral flow (registration, verification, payout).
- Update documentation and user guides.

---

**Constraints:**
- Mobile-first, responsive, minimalist UI
- Use reusable components and hooks
- Optimize for performance and load speed
- Well-structured, clean, and commented code

---

**Goal:**  
Implement the Siargao Rides referral system end-to-end, following the above plan and best practices.

``` 