-- Create vehicle_blocked_dates table
CREATE TABLE IF NOT EXISTS vehicle_blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (vehicle_id, date)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_vehicle_blocked_dates_vehicle_id ON vehicle_blocked_dates(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_blocked_dates_date ON vehicle_blocked_dates(date);

-- Update the existing check_vehicle_availability function to also check blocked dates
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  vehicle_id UUID,
  start_date DATE,
  end_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
  booking_count INTEGER;
  blocked_count INTEGER;
BEGIN
  -- Check for overlapping bookings
  SELECT COUNT(*) INTO booking_count
  FROM rentals
  WHERE 
    rentals.vehicle_id = $1
    AND status IN ('pending', 'confirmed')
    AND (
      (start_date <= $2 AND end_date >= $2) OR
      (start_date <= $3 AND end_date >= $3) OR
      (start_date >= $2 AND end_date <= $3)
    );
  
  -- Check for blocked dates within the range
  SELECT COUNT(*) INTO blocked_count
  FROM vehicle_blocked_dates
  WHERE 
    vehicle_blocked_dates.vehicle_id = $1
    AND date >= $2
    AND date <= $3;
  
  -- Vehicle is available if there are no bookings AND no blocked dates
  RETURN booking_count = 0 AND blocked_count = 0;
END;
$$ LANGUAGE plpgsql; 