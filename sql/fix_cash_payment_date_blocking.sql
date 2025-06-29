-- Fix Cash Payment Date Blocking Issue
-- This SQL script implements automatic date blocking when shop owners confirm cash payment bookings

-- 1. Create function to block rental dates
CREATE OR REPLACE FUNCTION block_rental_dates(
  p_rental_id UUID,
  p_vehicle_id UUID, 
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  -- Use generate_series to create blocked dates for each day in the rental period
  INSERT INTO vehicle_blocked_dates (vehicle_id, date, reason)
  SELECT 
    p_vehicle_id,
    date_series::DATE,
    'Booked (Rental #' || p_rental_id || ')'
  FROM generate_series(p_start_date::DATE, p_end_date::DATE, '1 day'::interval) AS date_series
  ON CONFLICT (vehicle_id, date) DO NOTHING; -- Prevent duplicates
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger function for booking confirmation
CREATE OR REPLACE FUNCTION trigger_block_dates_on_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Block dates when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    PERFORM block_rental_dates(NEW.id, NEW.vehicle_id, NEW.start_date, NEW.end_date);
  END IF;
  
  -- Unblock dates when booking is cancelled after being confirmed
  IF NEW.status IN ('cancelled', 'auto-cancelled') AND OLD.status = 'confirmed' THEN
    DELETE FROM vehicle_blocked_dates 
    WHERE vehicle_id = NEW.vehicle_id 
    AND date >= NEW.start_date::DATE 
    AND date <= NEW.end_date::DATE
    AND reason = 'Booked (Rental #' || NEW.id || ')';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add trigger to rentals table
CREATE TRIGGER trigger_block_dates_on_booking_confirmation
  AFTER UPDATE ON rentals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_block_dates_on_confirmation();

-- SUMMARY:
-- - When shop owners confirm cash payment bookings (status changes from 'pending' to 'confirmed'), 
--   dates are automatically blocked in vehicle_blocked_dates table
-- - When confirmed bookings are cancelled, dates are automatically unblocked
-- - This prevents double bookings for cash payments
-- - The trigger works for all booking confirmation methods (dashboard, API, etc.)