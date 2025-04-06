-- SQL for Vehicle Verification Schema Changes

-- Add verification columns to vehicles table
ALTER TABLE vehicles
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_status VARCHAR(255) DEFAULT 'pending',
ADD COLUMN verification_notes TEXT,
ADD COLUMN documents JSONB,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verified_by UUID REFERENCES auth.users(id);

-- Create index on verification_status for faster queries
CREATE INDEX idx_vehicles_verification_status ON vehicles(verification_status);

-- Create index on is_verified for faster filtering
CREATE INDEX idx_vehicles_is_verified ON vehicles(is_verified);

-- Update RLS policies to ensure only verified vehicles are shown to regular users
CREATE POLICY "Only verified vehicles visible to public" 
ON vehicles FOR SELECT 
USING (
  is_verified = TRUE 
  OR 
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
  OR
  auth.uid() IN (
    SELECT owner_id FROM rental_shops WHERE id = vehicles.shop_id
  )
);

-- Update existing vehicles to be verified (for existing production data)
-- Comment out before running in production if you want to manually verify existing vehicles
-- UPDATE vehicles SET is_verified = TRUE, verification_status = 'approved' WHERE is_verified IS NULL;

-- Create a function to update verified_at timestamp when a vehicle is verified
CREATE OR REPLACE FUNCTION update_vehicle_verified_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_verified = TRUE AND (OLD.is_verified = FALSE OR OLD.is_verified IS NULL) THEN
    NEW.verified_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER set_vehicle_verified_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_verified_at();

-- Add an enum type for document types if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_document_type') THEN
    CREATE TYPE vehicle_document_type AS ENUM ('registration', 'insurance', 'other');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

-- Add comment to help understand the documents JSONB structure
COMMENT ON COLUMN vehicles.documents IS 'Array of document objects: [{"type": "registration", "url": "https://...", "uploaded_at": "2023-06-15T12:00:00Z"}, ...]'; 