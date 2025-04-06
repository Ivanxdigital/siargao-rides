-- Create a SQL function to check and update expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Update all shops where subscription_end_date is in the past and status is still 'active'
  UPDATE rental_shops
  SET 
    subscription_status = 'expired',
    is_active = false,
    updated_at = now()
  WHERE 
    subscription_end_date < CURRENT_DATE
    AND subscription_status = 'active'
    AND is_active = true;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the result
  RAISE NOTICE 'Updated % shops with expired subscriptions', updated_count;
END;
$$;

-- Create a schedule to run this function daily
-- Uncomment after testing the function manually
-- SELECT cron.schedule(
--   'check-expired-subscriptions-daily',
--   '0 0 * * *', -- Run at midnight every day
--   'SELECT check_expired_subscriptions();'
-- ); 