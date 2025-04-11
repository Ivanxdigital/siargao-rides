-- Create paymongo_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS paymongo_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id TEXT NOT NULL,
  rental_id UUID NOT NULL REFERENCES rentals(id),
  amount DECIMAL(10, 2) NOT NULL,
  checkout_url TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment tables
ALTER TABLE paymongo_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymongo_sources ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own payments
-- Check if policy already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'paymongo_payments'
    AND policyname = 'Users can view their own payments'
  ) THEN
    CREATE POLICY "Users can view their own payments"
    ON paymongo_payments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM rentals
        WHERE rentals.id = paymongo_payments.rental_id
        AND rentals.user_id = auth.uid()
      )
    );
  END IF;
END
$$;

-- Shop owners can view payments for their shops
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'paymongo_payments'
    AND policyname = 'Shop owners can view payments for their shops'
  ) THEN
    CREATE POLICY "Shop owners can view payments for their shops"
    ON paymongo_payments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM rentals
        JOIN rental_shops ON rentals.shop_id = rental_shops.id
        WHERE rentals.id = paymongo_payments.rental_id
        AND rental_shops.owner_id = auth.uid()
      )
    );
  END IF;
END
$$;

-- Only admins can modify payment records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'paymongo_payments'
    AND policyname = 'Only admins can modify payment records'
  ) THEN
    CREATE POLICY "Only admins can modify payment records"
    ON paymongo_payments
    FOR ALL
    USING (
      auth.jwt() ->> 'role' = 'admin'
    );
  END IF;
END
$$;

-- Similar policies for paymongo_sources table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'paymongo_sources'
    AND policyname = 'Users can view their own sources'
  ) THEN
    CREATE POLICY "Users can view their own sources"
    ON paymongo_sources
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM rentals
        WHERE rentals.id = paymongo_sources.rental_id
        AND rentals.user_id = auth.uid()
      )
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'paymongo_sources'
    AND policyname = 'Shop owners can view sources for their shops'
  ) THEN
    CREATE POLICY "Shop owners can view sources for their shops"
    ON paymongo_sources
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM rentals
        JOIN rental_shops ON rentals.shop_id = rental_shops.id
        WHERE rentals.id = paymongo_sources.rental_id
        AND rental_shops.owner_id = auth.uid()
      )
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'paymongo_sources'
    AND policyname = 'Only admins can modify source records'
  ) THEN
    CREATE POLICY "Only admins can modify source records"
    ON paymongo_sources
    FOR ALL
    USING (
      auth.jwt() ->> 'role' = 'admin'
    );
  END IF;
END
$$;

-- Allow authenticated users to insert payment records (needed for client-side payment creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'paymongo_payments'
    AND policyname = 'Authenticated users can insert payment records'
  ) THEN
    CREATE POLICY "Authenticated users can insert payment records"
    ON paymongo_payments
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'paymongo_sources'
    AND policyname = 'Authenticated users can insert source records'
  ) THEN
    CREATE POLICY "Authenticated users can insert source records"
    ON paymongo_sources
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END
$$;
