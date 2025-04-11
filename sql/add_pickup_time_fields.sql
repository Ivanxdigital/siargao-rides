-- Add pickup time and auto-cancellation fields to rentals table
ALTER TABLE rentals
  ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS auto_cancel_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS auto_cancel_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_cancel_scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shop_owner_override BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on pickup_time
CREATE INDEX IF NOT EXISTS idx_rentals_pickup_time ON rentals(pickup_time);

-- Create index for auto-cancellation queries
CREATE INDEX IF NOT EXISTS idx_rentals_auto_cancel ON rentals(auto_cancel_enabled, auto_cancel_processed, auto_cancel_scheduled_for);

-- Update system_settings to include auto-cancellation settings
UPDATE system_settings
SET value = jsonb_set(
  value, 
  '{enable_auto_cancellation}', 
  'true'::jsonb
)
WHERE key = 'payment_settings';

-- Add default_grace_period_minutes if it doesn't exist
UPDATE system_settings
SET value = jsonb_set(
  value, 
  '{default_grace_period_minutes}', 
  '30'::jsonb
)
WHERE key = 'payment_settings';

-- Create a function to process auto-cancellations
CREATE OR REPLACE FUNCTION process_auto_cancellations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Update all rentals where:
  -- 1. auto_cancel_enabled is true
  -- 2. auto_cancel_processed is false
  -- 3. pickup_time + grace_period_minutes has passed
  -- 4. status is 'pending' or 'confirmed'
  -- 5. shop_owner_override is false
  UPDATE rentals
  SET 
    status = 'cancelled',
    cancellation_reason = 'Auto-cancelled due to no-show',
    cancelled_at = now(),
    auto_cancel_processed = true,
    updated_at = now()
  WHERE 
    auto_cancel_enabled = true
    AND auto_cancel_processed = false
    AND pickup_time + (grace_period_minutes * interval '1 minute') < now()
    AND status IN ('pending', 'confirmed')
    AND shop_owner_override = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the result
  RAISE NOTICE 'Auto-cancelled % bookings due to no-show', updated_count;
END;
$$;

-- Create a function to schedule auto-cancellation for a booking
CREATE OR REPLACE FUNCTION schedule_auto_cancellation(booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_record rentals;
BEGIN
  -- Get the booking record
  SELECT * INTO booking_record FROM rentals WHERE id = booking_id;
  
  -- If booking exists and has a pickup time
  IF FOUND AND booking_record.pickup_time IS NOT NULL THEN
    -- Calculate when auto-cancellation should happen
    UPDATE rentals
    SET 
      auto_cancel_scheduled_for = booking_record.pickup_time + (booking_record.grace_period_minutes * interval '1 minute'),
      updated_at = now()
    WHERE id = booking_id;
    
    RAISE NOTICE 'Auto-cancellation scheduled for booking % at %', 
      booking_id, 
      booking_record.pickup_time + (booking_record.grace_period_minutes * interval '1 minute');
  ELSE
    RAISE NOTICE 'Could not schedule auto-cancellation for booking % - booking not found or no pickup time set', booking_id;
  END IF;
END;
$$;

-- Create a trigger to automatically schedule auto-cancellation when pickup_time is set
CREATE OR REPLACE FUNCTION trigger_schedule_auto_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If pickup_time is being set or changed and auto_cancel_enabled is true
  IF (NEW.pickup_time IS NOT NULL AND (OLD.pickup_time IS NULL OR NEW.pickup_time <> OLD.pickup_time)) 
     AND NEW.auto_cancel_enabled = true THEN
    -- Calculate when auto-cancellation should happen
    NEW.auto_cancel_scheduled_for := NEW.pickup_time + (NEW.grace_period_minutes * interval '1 minute');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on the rentals table
DROP TRIGGER IF EXISTS trigger_auto_cancellation_schedule ON rentals;
CREATE TRIGGER trigger_auto_cancellation_schedule
BEFORE INSERT OR UPDATE OF pickup_time, grace_period_minutes, auto_cancel_enabled
ON rentals
FOR EACH ROW
EXECUTE FUNCTION trigger_schedule_auto_cancellation();
