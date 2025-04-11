-- Add contact_info field to rentals table
ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS contact_info JSONB;

-- Create an index for faster queries on contact_info
CREATE INDEX IF NOT EXISTS idx_rentals_contact_info ON rentals USING GIN (contact_info);

-- Comment on the column to explain its purpose
COMMENT ON COLUMN rentals.contact_info IS 'Stores customer contact information like WhatsApp or Telegram with country code and number';
