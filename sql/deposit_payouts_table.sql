-- Create deposit_payouts table to track deposit payouts to shop owners
CREATE TABLE IF NOT EXISTS deposit_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID NOT NULL REFERENCES rentals(id),
  shop_id UUID NOT NULL REFERENCES rental_shops(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  processed_by UUID REFERENCES auth.users(id),
  payment_reference TEXT,
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_deposit_payouts_rental_id ON deposit_payouts(rental_id);
CREATE INDEX idx_deposit_payouts_shop_id ON deposit_payouts(shop_id);
CREATE INDEX idx_deposit_payouts_status ON deposit_payouts(status);

-- Add deposit_processed field to rentals table if it doesn't exist
ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS deposit_processed BOOLEAN DEFAULT FALSE;

-- Create RLS policies for deposit_payouts table
ALTER TABLE deposit_payouts ENABLE ROW LEVEL SECURITY;

-- Policy for admins to see all payouts
CREATE POLICY admin_all_access ON deposit_payouts
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policy for shop owners to see their own payouts
CREATE POLICY shop_owner_select ON deposit_payouts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rental_shops
      WHERE rental_shops.id = deposit_payouts.shop_id
      AND rental_shops.owner_id = auth.uid()
    )
  );
