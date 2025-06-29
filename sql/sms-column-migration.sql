-- Migration to sync SMS notification columns
-- This handles the fact that the codebase uses 'sms_number' but we want to standardize on 'phone_number'

-- First, check if sms_number column exists and copy its data to phone_number
DO $$
BEGIN
  -- Check if sms_number column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rental_shops' 
    AND column_name = 'sms_number'
  ) THEN
    -- If phone_number doesn't exist, rename sms_number to phone_number
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'rental_shops' 
      AND column_name = 'phone_number'
    ) THEN
      ALTER TABLE rental_shops RENAME COLUMN sms_number TO phone_number;
    ELSE
      -- If both exist, copy data from sms_number to phone_number where phone_number is null
      UPDATE rental_shops 
      SET phone_number = sms_number 
      WHERE phone_number IS NULL AND sms_number IS NOT NULL;
      
      -- Then drop the sms_number column
      ALTER TABLE rental_shops DROP COLUMN IF EXISTS sms_number;
    END IF;
  END IF;
END $$;

-- Ensure phone_number column exists with correct type
ALTER TABLE rental_shops 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add SMS notification fields if they don't exist
ALTER TABLE rental_shops
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Update the column comment to clarify its purpose
COMMENT ON COLUMN rental_shops.phone_number IS 'Phone number for SMS notifications (E.164 format preferred)';
COMMENT ON COLUMN rental_shops.sms_notifications_enabled IS 'Whether the shop owner wants to receive SMS notifications for new bookings';
COMMENT ON COLUMN rental_shops.phone_verified IS 'Whether the phone number has been verified';
COMMENT ON COLUMN rental_shops.phone_verified_at IS 'Timestamp when the phone number was verified';