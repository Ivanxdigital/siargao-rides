# Siargao Rides Subscription System - Implementation Plan

## Summary

This document outlines the implementation plan for adding a subscription system to Siargao Rides, specifically focusing on rental shop owners. The key features include:

- **Free Trial Period**: Shop owners get a 1-month free trial that starts automatically when they add their first vehicle
- **User Flow**:
  1. Shop owner registers on the platform
  2. Admin verifies the shop through the admin verification page
  3. Shop becomes visible on the site after verification
  4. When shop owner adds their first vehicle, the 1-month free trial begins
  5. During the trial, shop owners can access the dashboard and list vehicles
- **Expiration Handling**:
  - When the trial expires, the shop is deactivated and no longer visible in browse pages
  - Shop owners lose access to their dashboard and are redirected to a subscription page
- **Future Plans**:
  - Payment system for monthly/annual subscriptions (to be implemented later)

This implementation focuses on building the core subscription infrastructure without the payment integration components.

## Current Database Structure

From analyzing the database, we have:

- `rental_shops` table with verification status but no subscription fields
- `bikes` table linked to shops via foreign key
- Multiple RLS policies for proper access control
- Various related tables with foreign key constraints

## 1. Database Schema Changes

```sql
-- Add subscription related fields to rental_shops table
ALTER TABLE rental_shops
ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'inactive',
ADD COLUMN subscription_start_date TIMESTAMPTZ,
ADD COLUMN subscription_end_date TIMESTAMPTZ,
ADD COLUMN is_active BOOLEAN DEFAULT FALSE;

-- Update existing verified shops (optional if you want them to start with active status)
UPDATE rental_shops
SET is_active = is_verified
WHERE is_verified = true;

-- Create a function to check expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE rental_shops
  SET is_active = FALSE, 
      subscription_status = 'expired'
  WHERE subscription_end_date < NOW() 
    AND subscription_status = 'active';
END;
$$ LANGUAGE plpgsql;
```

## 2. Update RLS Policies

```sql
-- Add policy for subscription visibility
CREATE POLICY "Only show active shops in public views" 
ON rental_shops
FOR SELECT
TO public
USING (is_active = true OR auth.uid() = owner_id OR auth.jwt() ->> 'role' = 'admin');
```

## 3. Implementation Steps

### Step 1: Admin Verification Flow

Update the admin verification page to only set `is_verified = true`, keeping subscription inactive until they add a vehicle.

Update `/dashboard/admin/verification/page.tsx`:

```typescript
// After approving shop in handleApprove function
const { error } = await supabase
  .from("rental_shops")
  .update({
    is_verified: true,
    // Don't set is_active yet - this happens when they add first vehicle
  })
  .eq("id", shopId);
```

### Step 2: Start Subscription When First Vehicle is Added

Add code to `vehicles/add/page.tsx` to check if this is their first vehicle and start subscription:

```typescript
// After successfully adding a vehicle
const startSubscription = async (shopId) => {
  // Check if this is their first vehicle
  const { count, error: countError } = await supabase
    .from('bikes')
    .select('id', { count: 'exact' })
    .eq('shop_id', shopId);
    
  if (countError) {
    console.error('Error counting bikes:', countError);
    return;
  }
    
  if (count === 1) {
    // This is their first vehicle, start subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Add 1 month
    
    const { error: updateError } = await supabase
      .from('rental_shops')
      .update({
        subscription_status: 'active',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        is_active: true
      })
      .eq('id', shopId);
      
    if (updateError) {
      console.error('Error starting subscription:', updateError);
    } else {
      console.log('Free trial started successfully');
    }
  }
}

// Call this after successfully adding the bike
startSubscription(shop.id);
```

### Step 3: Create Subscription Status Component

```typescript
// components/SubscriptionStatus.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Clock } from 'lucide-react';

export const SubscriptionStatus = ({ shop }) => {
  const [daysLeft, setDaysLeft] = useState(0);
  
  useEffect(() => {
    if (shop?.subscription_end_date) {
      const endDate = new Date(shop.subscription_end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, diffDays));
    }
  }, [shop]);
  
  if (!shop || !shop.subscription_status) {
    return null;
  }
  
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="text-primary h-5 w-5" />
        <h3 className="font-medium">Subscription Status</h3>
      </div>
      
      {shop.subscription_status === 'active' ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2.5 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Your free trial ends in <span className="font-bold text-foreground">{daysLeft} days</span>
          </p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ 
                width: `${Math.max(0, Math.min(100, (30 - daysLeft) / 30 * 100))}%` 
              }}
            ></div>
          </div>
        </>
      ) : shop.subscription_status === 'expired' ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs px-2.5 py-0.5 rounded-full">
              Expired
            </span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
            <AlertCircle className="text-red-500 h-5 w-5" />
            <p className="text-sm text-red-800 dark:text-red-400">
              Your free trial has ended. Soon you'll be able to subscribe to continue listing your vehicles.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-full">
              Inactive
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Add your first vehicle to start your free 1-month trial!
          </p>
        </>
      )}
    </div>
  );
};
```

### Step 4: Modify Shop Dashboard Page

Add subscription status component to shop dashboard:

```typescript
// In dashboard/shop/page.tsx
import { SubscriptionStatus } from '@/components/SubscriptionStatus';

// Inside the component's return statement
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="md:col-span-2 space-y-6">
    {/* Existing shop info and stats */}
  </div>
  
  <div className="space-y-6">
    <SubscriptionStatus shop={shop} />
    
    {/* Quick Links section */}
    <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm h-fit">
      {/* Existing quick links content */}
    </div>
  </div>
</div>
```

### Step 5: Add Access Control to Dashboard

```typescript
// In shop/page.tsx (and other dashboard pages)
useEffect(() => {
  const checkShopAccess = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('rental_shops')
      .select('is_active, subscription_status')
      .eq('owner_id', user.id)
      .single();
    
    if (error || !data || !data.is_active) {
      // Subscription inactive, redirect to subscription page
      router.push('/dashboard/subscription');
    }
  };
  
  if (isAuthenticated && user) {
    checkShopAccess();
  }
}, [isAuthenticated, user, router]);
```

### Step 6: Modify Browse Page to Filter Active Shops

Update the query in `browse/page.tsx`:

```typescript
// Modify the shop query to only show active shops
const { data: shops, error: shopsError } = await supabase
  .from('rental_shops')
  .select('*')
  .eq('is_verified', true)
  .eq('is_active', true);
```

### Step 7: Create Subscription Status Page

```typescript
// pages/dashboard/subscription/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { AlertCircle, ShoppingBag, Clock } from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchShop = async () => {
      if (!user) return;
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from("rental_shops")
        .select("*")
        .eq("owner_id", user.id)
        .single();
        
      if (!error && data) {
        setShop(data);
      }
      setIsLoading(false);
    };
    
    if (user) {
      fetchShop();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">No Shop Found</h1>
          <p className="text-muted-foreground mb-6">
            You don't have a registered shop yet.
          </p>
          <Button asChild>
            <Link href="/register">Register Your Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Subscription Status</h1>
      <p className="text-muted-foreground mb-8">Manage your shop's subscription</p>
      
      <div className="bg-card rounded-xl border border-border p-8 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">{shop.name}</h2>
            <p className="text-muted-foreground">{shop.address}</p>
          </div>
          
          <div>
            {shop.is_verified ? (
              <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2.5 py-1 rounded-full">
                Verified
              </span>
            ) : (
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs px-2.5 py-1 rounded-full">
                Pending Verification
              </span>
            )}
          </div>
        </div>
        
        {!shop.is_verified ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center mb-8">
            <Clock size={40} className="text-amber-600 dark:text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Pending Verification</h3>
            <p className="text-muted-foreground">
              Your shop is currently being reviewed by our team. You'll be able to add vehicles once it's verified.
            </p>
          </div>
        ) : shop.subscription_status === 'expired' ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center mb-8">
            <AlertCircle size={40} className="text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Free Trial Expired</h3>
            <p className="text-muted-foreground mb-6">
              Your free trial has ended. Soon you'll be able to subscribe to continue listing your vehicles.
            </p>
            <Button disabled className="cursor-not-allowed">
              Subscribe Coming Soon
            </Button>
          </div>
        ) : shop.subscription_status === 'active' ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center mb-8">
            <Clock size={40} className="text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Active Free Trial</h3>
            <p className="text-muted-foreground mb-4">
              Your free trial is active until {new Date(shop.subscription_end_date).toLocaleDateString()}.
            </p>
            <div className="max-w-md mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-primary" 
                  style={{ 
                    width: `${Math.max(0, Math.min(100, (new Date(shop.subscription_end_date).getTime() - new Date().getTime()) / (30 * 24 * 60 * 60 * 1000) * 100))}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.max(0, Math.ceil((new Date(shop.subscription_end_date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)))} days remaining
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center mb-8">
            <ShoppingBag size={40} className="text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Start Your Free Trial</h3>
            <p className="text-muted-foreground mb-6">
              Add your first vehicle to start your free 1-month trial!
            </p>
            <Button asChild>
              <Link href="/dashboard/vehicles/add">Add Your First Vehicle</Link>
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Free Trial</p>
              <p className="text-sm text-muted-foreground">30 days free access</p>
            </div>
            {shop.subscription_status === 'active' && (
              <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded">Current Plan</span>
            )}
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg opacity-60">
            <div>
              <p className="font-medium">Monthly Subscription</p>
              <p className="text-sm text-muted-foreground">₱XXX per month</p>
            </div>
            <span className="text-sm bg-muted text-muted-foreground px-2 py-1 rounded">Coming Soon</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg opacity-60">
            <div>
              <p className="font-medium">Annual Subscription</p>
              <p className="text-sm text-muted-foreground">₱XXX per year (Save XX%)</p>
            </div>
            <span className="text-sm bg-muted text-muted-foreground px-2 py-1 rounded">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 8: Schedule Background Job for Checking Expired Subscriptions

Set up a Supabase Edge Function or external scheduled job:

```typescript
// supabase/functions/check-subscriptions/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
);

Deno.serve(async () => {
  // Call the database function to update expired subscriptions
  const { error } = await supabase.rpc('check_expired_subscriptions');
  
  if (error) {
    console.error('Error checking subscriptions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(
    JSON.stringify({ message: 'Subscription check completed' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

## 4. Implementation Timeline and Testing

1. **Week 1: Database Updates and Core Logic**
   - Implement database schema changes
   - Modify vehicle addition to start subscription
   - Add subscription status to shop dashboard
   
2. **Week 2: User Experience and Visibility Controls**
   - Implement subscription status page
   - Update browse page filtering
   - Add access control to dashboard
   
3. **Week 3: Testing and Monitoring**
   - Test full user journey
   - Set up background job for checking expiry
   - Monitor subscription status transitions

## 5. Future Payment Integration

When ready to implement payments:

1. Add payment-related fields to the `rental_shops` table
2. Integrate with a payment processor like Stripe or PayPal
3. Create payment pages with pricing plans
4. Add subscription renewal logic and notifications
