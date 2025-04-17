-- Siargao Rides Referral System Migration

-- 1. Create referrals table
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

-- 2. Add referrer_id to rental_shops
ALTER TABLE rental_shops ADD COLUMN referrer_id UUID REFERENCES users(id);

-- 3. Enable RLS on referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Admins can perform all operations on referrals" ON referrals FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- 5. Indexes for performance
CREATE INDEX referrals_referrer_id_idx ON referrals(referrer_id);
CREATE INDEX referrals_shop_id_idx ON referrals(shop_id); 