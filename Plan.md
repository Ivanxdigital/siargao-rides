# Siargao Rides - Referral System Implementation Plan

## Overview

This document outlines the implementation plan for a referral system in the Siargao Rides application. The system rewards users who refer new shop owners who successfully register, get verified, and add at least one verified vehicle. The reward is a payout of 500 PHP per successful referral.

---

## Progress Summary (as of latest update)

### **What Has Been Completed**
- [x] **Database migration:**
  - `referrals` table created in Supabase
  - `referrer_id` column added to `rental_shops`
  - RLS policies and indexes set up
- [x] **Backend implementation:**
  - Referral-related functions added to `api.ts` and `service.ts`
  - Types added to `types.ts`
  - Referral link generation utility created
- [x] **Frontend implementation:**
  - Registration form enhanced to handle referral codes/links
  - User referral dashboard (`/dashboard/referrals`) created
  - Admin referral management dashboard (`/dashboard/admin/referrals`) created
  - Universal sidebar link for "Referrals" added for all users
- [x] **Basic notification logic** (console log, ready for extension)
- [x] **Automation of referral status updates:**
  - Referral status is now automatically updated when a shop or vehicle is verified. Referrals are marked as `completed` when both conditions are met, with no manual admin intervention required.

---

## Implementation Steps (Checklist)

### 1. **Database Setup**
- [x] Create the `referrals` table in Supabase
- [x] Add `referrer_id` column to `rental_shops` table
- [x] Set up RLS policies for security

### 2. **Backend Implementation**
- [x] Add referral-related functions to `api.ts`
- [x] Add service layer functions in `service.ts`
- [x] Implement referral link generation and parsing
- [x] Add types to `types.ts`

### 3. **Frontend Implementation**
- [x] Enhance registration form to handle referrals
- [x] Create a referral dashboard for users (`/dashboard/referrals`)
- [x] Add referral management to admin dashboard (`/dashboard/admin/referrals`)
- [x] Add universal sidebar link for "Referrals" for all users

### 4. **Integration**
- [x] Automate referral status updates when shops/vehicles are verified
- [ ] Implement user-facing notification system for referral events (in-app/email)
- [x] Add Zod validation to all new API/service functions

### 5. **Testing**
- [ ] Test complete referral flow (registration → verification → payout)
- [ ] Test edge cases (invalid referrals, duplicate referrals, etc.)
- [ ] Verify security of the system (RLS, access control)

### 6. **Documentation**
- [ ] Update CODEBASE.md with referral system documentation
- [ ] Create user guide for the referral system

---

## **Next Steps**
1. **Implement user-facing notifications** (in-app and/or email) for referral events (shop verified, vehicle added, payout ready/sent).
2. **Add Zod validation** to all new API/service functions for strong type safety and error handling.
3. **Thoroughly test** the referral system end-to-end, including edge cases and security.
4. **Update documentation** and create a user guide for the referral system.

---

## **Accomplished**
- The referral system is now visible and accessible to all users via the dashboard sidebar.
- Users can generate and share their referral link, and track their referral history and status.
- Admins can manage, filter, and pay out referrals from the admin dashboard.
- Referral status is now automatically updated when shops and vehicles are verified.

## **Pending**
- User-facing notifications for referral events
- Final validation, testing, and documentation

## Current State

Based on the code analysis:

1. The application already has a shop registration form (`/register/page.tsx`) that includes a referral field
2. There is no tracking system in place to validate or process referrals
3. The database does not have a table for tracking referrals and payouts
4. The verification system for shops already exists (shops have an `is_verified` field)
5. Vehicles are tracked and can be verified separately

## Database Changes

We need to create a new table in the Supabase database to track referrals:

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  shop_id UUID NOT NULL REFERENCES rental_shops(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, paid
  payout_amount NUMERIC(10, 2) NOT NULL DEFAULT 500.00, -- Default to 500 PHP
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

-- Add RLS policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own referrals
CREATE POLICY "Users can view their own referrals" 
ON referrals FOR SELECT 
USING (auth.uid() = referrer_id);

-- Allow admin to access all referrals
CREATE POLICY "Admins can perform all operations on referrals" 
ON referrals FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Add an index for faster lookup
CREATE INDEX referrals_referrer_id_idx ON referrals(referrer_id);
CREATE INDEX referrals_shop_id_idx ON referrals(shop_id);
```

Additionally, we need to modify the `rental_shops` table to properly track referrals:

```sql
-- Add a referrer_id field to the rental_shops table
ALTER TABLE rental_shops ADD COLUMN referrer_id UUID REFERENCES users(id);
```

## API Changes

### 1. Create new API functions in `src/lib/api.ts`:

```typescript
// Referral-related functions
export async function createReferral(referral: {
  referrer_id: string;
  shop_id: string;
}): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referral.referrer_id,
      shop_id: referral.shop_id,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating referral:', error);
    return null;
  }

  return data;
}

export async function getUserReferrals(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      shops:rental_shops(id, name, is_verified)
    `)
    .eq('referrer_id', userId);

  if (error) {
    console.error('Error fetching user referrals:', error);
    return [];
  }

  return data || [];
}

export async function updateReferralStatus(
  referralId: string, 
  updates: {
    status?: string;
    shop_verified?: boolean;
    vehicle_added?: boolean;
    payout_amount?: number;
    paid_at?: string;
    payment_reference?: string;
    payment_method?: string;
    notes?: string;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('referrals')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', referralId);

  if (error) {
    console.error('Error updating referral status:', error);
    return false;
  }

  return true;
}
```

### 2. Create service functions in `src/lib/service.ts`:

```typescript
// Referral-related functions
export async function createReferral(referral: {
  referrer_id: string;
  shop_id: string;
}): Promise<{ id: string } | null> {
  return api.createReferral(referral);
}

export async function getUserReferrals(userId: string): Promise<any[]> {
  return api.getUserReferrals(userId);
}

export async function updateReferralStatus(
  referralId: string, 
  updates: {
    status?: string;
    shop_verified?: boolean;
    vehicle_added?: boolean;
    payout_amount?: number;
    paid_at?: string;
    payment_reference?: string;
    payment_method?: string;
    notes?: string;
  }
): Promise<boolean> {
  return api.updateReferralStatus(referralId, updates);
}
```

## Frontend Changes

### 1. Modify the Shop Registration Form (`src/app/register/page.tsx`):

The registration form already has a referral field, but we need to modify it to:

- Validate that the referrer exists
- Lookup users by email or name
- Store the referral information

### 2. Create a Referral Dashboard for Users:

Create a new page at `src/app/dashboard/referrals/page.tsx` to allow users to:

- View their referral history
- See payouts status
- Get a referral link to share

### 3. Add a Referral Management Component to Admin Dashboard:

Create a new component at `src/app/admin/referrals/page.tsx` to allow admins to:

- View all referrals
- Mark referrals as paid
- Track verification status

## Implementing Verification Tracking for Referrals

We need to modify several existing workflows:

### 1. Shop Verification Process:

When a shop is verified, we need to check if it was referred and update the referral record:

```typescript
// In shop verification code
async function verifyShop(shopId: string): Promise<boolean> {
  const { data: shop, error: shopError } = await supabase
    .from('rental_shops')
    .select('referrer_id')
    .eq('id', shopId)
    .single();

  if (shopError || !shop) {
    console.error('Error fetching shop for verification:', shopError);
    return false;
  }

  // Update shop to verified status
  const { error: updateError } = await supabase
    .from('rental_shops')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', shopId);

  if (updateError) {
    console.error('Error updating shop verification status:', updateError);
    return false;
  }

  // If the shop was referred, update the referral record
  if (shop.referrer_id) {
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', shop.referrer_id)
      .eq('shop_id', shopId)
      .single();

    if (!referralError && referral) {
      await supabase
        .from('referrals')
        .update({ 
          shop_verified: true,
          updated_at: new Date().toISOString(),
          // If a vehicle has been added and verified, mark the referral as completed
          status: referral.vehicle_added ? 'completed' : 'pending'
        })
        .eq('id', referral.id);
    }
  }

  return true;
}
```

### 2. Vehicle Addition Process:

When a vehicle is added and verified for a shop, check and update the referral status:

```typescript
// In vehicle verification code
async function verifyVehicle(vehicleId: string): Promise<boolean> {
  // First, get the vehicle details to find the shop
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('shop_id')
    .eq('id', vehicleId)
    .single();

  if (vehicleError || !vehicle) {
    console.error('Error fetching vehicle for verification:', vehicleError);
    return false;
  }

  // Mark the vehicle as verified
  const { error: updateError } = await supabase
    .from('vehicles')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', vehicleId);

  if (updateError) {
    console.error('Error updating vehicle verification status:', updateError);
    return false;
  }

  // Now get the shop details to check if it was referred
  const { data: shop, error: shopError } = await supabase
    .from('rental_shops')
    .select('referrer_id, is_verified')
    .eq('id', vehicle.shop_id)
    .single();

  if (shopError || !shop) {
    console.error('Error fetching shop for referral check:', shopError);
    return false;
  }

  // If the shop was referred, update the referral record
  if (shop.referrer_id) {
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('id, shop_verified')
      .eq('referrer_id', shop.referrer_id)
      .eq('shop_id', vehicle.shop_id)
      .single();

    if (!referralError && referral) {
      await supabase
        .from('referrals')
        .update({ 
          vehicle_added: true,
          updated_at: new Date().toISOString(),
          // If shop is verified and now a vehicle is added, mark as completed
          status: shop.is_verified ? 'completed' : 'pending'
        })
        .eq('id', referral.id);
    }
  }

  return true;
}
```

## Creating a Referral Link System

We'll create a system to generate and track referral links:

```typescript
// In a new file: src/lib/referral.ts
import { generateShortId } from './utils'; // Create this utility if needed

export function generateReferralLink(userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siargaorides.ph';
  return `${baseUrl}/register?ref=${userId}`;
}

export function parseReferralCode(code: string): string | null {
  // Simple validation to ensure the code is a valid user ID
  if (!code || typeof code !== 'string' || code.length < 10) {
    return null;
  }
  return code;
}
```

## Types Definitions

Add the following types to `src/lib/types.ts`:

```typescript
export type ReferralStatus = 'pending' | 'completed' | 'paid';

export type Referral = {
  id: string
  referrer_id: string
  shop_id: string
  status: ReferralStatus
  payout_amount: number
  vehicle_added: boolean
  shop_verified: boolean
  created_at: string
  updated_at: string
  paid_at?: string
  payment_reference?: string
  payment_method?: string
  notes?: string
}
```

## Notification System

Implement notifications for referrals in `src/lib/notifications.ts`:

```typescript
export const sendReferralNotification = async (userId: string, shopName: string, eventType: 'shop_verified' | 'vehicle_added' | 'payout_ready' | 'payout_sent') => {
  let message = '';
  let title = '';
  
  switch (eventType) {
    case 'shop_verified':
      title = 'Shop Verification Update';
      message = `The shop "${shopName}" you referred has been verified! They now need to add a verified vehicle to complete the referral.`;
      break;
    case 'vehicle_added':
      title = 'Referral Update';
      message = `Great news! The shop "${shopName}" you referred has added a verified vehicle. Your referral is now complete and eligible for payout.`;
      break;
    case 'payout_ready':
      title = 'Referral Payout Ready';
      message = `Your referral payout for "${shopName}" of 500 PHP is ready to be claimed. Please check your dashboard for details.`;
      break;
    case 'payout_sent':
      title = 'Referral Payout Sent';
      message = `Your referral payout for "${shopName}" of 500 PHP has been sent. Check your payment method for details.`;
      break;
  }
  
  // Use existing notification system
  // Implementation depends on your notification system
}
```

## Implementation Steps

1. **Database Setup**
   - [ ] Create the `referrals` table in Supabase
   - [ ] Add `referrer_id` column to `rental_shops` table
   - [ ] Set up RLS policies for security

2. **Backend Implementation**
   - [ ] Add referral-related functions to `api.ts`
   - [ ] Add service layer functions in `service.ts`
   - [ ] Implement referral link generation and parsing
   - [ ] Add types to `types.ts`

3. **Frontend Implementation**
   - [ ] Enhance registration form to handle referrals
   - [ ] Create a referral dashboard for users
   - [ ] Add referral management to admin dashboard

4. **Integration**
   - [ ] Update shop verification process
   - [ ] Update vehicle verification process
   - [ ] Implement notification system for referrals

5. **Testing**
   - [ ] Test complete referral flow
   - [ ] Test edge cases (invalid referrals, etc.)
   - [ ] Verify security of the system

6. **Documentation**
   - [ ] Update CODEBASE.md with referral system documentation
   - [ ] Create user guide for the referral system

## Conclusion

The referral system will encourage users to refer new shop owners to the platform, increasing the number of rental shops and vehicles available. The system will track referrals through the registration process and automatically mark them as eligible for payout when both the shop and a vehicle are verified. Admins will then have the ability to process payouts through the admin dashboard.

**Note:** All new referral API/service functions now use Zod validation for input checking, following project conventions. 