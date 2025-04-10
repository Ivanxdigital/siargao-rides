-- Add is_deposit column to paymongo_payments table
ALTER TABLE paymongo_payments
  ADD COLUMN IF NOT EXISTS is_deposit BOOLEAN DEFAULT FALSE;
