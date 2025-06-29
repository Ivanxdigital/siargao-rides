-- Migration: Add Semaphore SMS Provider Support
-- This migration adds support for Semaphore SMS provider while maintaining backward compatibility with Twilio

-- Add Semaphore message ID column to SMS notification history
ALTER TABLE sms_notification_history 
ADD COLUMN IF NOT EXISTS semaphore_message_id VARCHAR(50);

-- Create index on semaphore_message_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sms_history_semaphore_message_id ON sms_notification_history(semaphore_message_id);

-- Update the comments to reflect both providers
COMMENT ON COLUMN sms_notification_history.twilio_message_sid IS 'Unique identifier from Twilio for tracking message status (legacy)';
COMMENT ON COLUMN sms_notification_history.semaphore_message_id IS 'Unique identifier from Semaphore for tracking message status';

-- Add a constraint to ensure at least one message ID is present
-- (Either Twilio SID or Semaphore message ID should be set)
ALTER TABLE sms_notification_history 
ADD CONSTRAINT chk_message_id_present 
CHECK (
  twilio_message_sid IS NOT NULL 
  OR semaphore_message_id IS NOT NULL
);

-- Update the table comment to reflect the migration
COMMENT ON TABLE sms_notification_history IS 'Tracks all SMS notifications sent to shop owners via Twilio (legacy) or Semaphore';

-- Create a function to get the provider-specific message ID
CREATE OR REPLACE FUNCTION get_sms_message_id(record sms_notification_history)
RETURNS VARCHAR(50) AS $$
BEGIN
  -- Return Semaphore ID if available, otherwise return Twilio SID
  RETURN COALESCE(record.semaphore_message_id, record.twilio_message_sid);
END;
$$ LANGUAGE plpgsql;

-- Create a function to determine the SMS provider
CREATE OR REPLACE FUNCTION get_sms_provider(record sms_notification_history)
RETURNS VARCHAR(20) AS $$
BEGIN
  IF record.semaphore_message_id IS NOT NULL THEN
    RETURN 'semaphore';
  ELSIF record.twilio_message_sid IS NOT NULL THEN
    RETURN 'twilio';
  ELSE
    RETURN 'unknown';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update the analytics view to include provider information
CREATE OR REPLACE VIEW sms_notification_stats AS
SELECT 
  shop_id,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_messages,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
  COUNT(CASE WHEN status = 'undelivered' THEN 1 END) as undelivered_messages,
  COUNT(CASE WHEN get_sms_provider(sms_notification_history.*) = 'twilio' THEN 1 END) as twilio_messages,
  COUNT(CASE WHEN get_sms_provider(sms_notification_history.*) = 'semaphore' THEN 1 END) as semaphore_messages,
  MIN(created_at) as first_message_at,
  MAX(created_at) as last_message_at,
  COUNT(DISTINCT DATE(created_at)) as active_days
FROM sms_notification_history
GROUP BY shop_id;

-- Grant permissions on the new functions
GRANT EXECUTE ON FUNCTION get_sms_message_id(sms_notification_history) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sms_provider(sms_notification_history) TO authenticated;

-- Add an API endpoint check function for status polling
CREATE OR REPLACE FUNCTION schedule_sms_status_check()
RETURNS TRIGGER AS $$
BEGIN
  -- This could be used to schedule status checks for Semaphore messages
  -- Since Semaphore may not support webhooks, we might need periodic polling
  IF NEW.semaphore_message_id IS NOT NULL AND NEW.status = 'sent' THEN
    -- Log that this message needs status checking
    INSERT INTO task_queue (task_type, task_data, scheduled_for)
    VALUES (
      'sms_status_check',
      jsonb_build_object('message_id', NEW.semaphore_message_id, 'record_id', NEW.id),
      NOW() + INTERVAL '5 minutes'
    )
    ON CONFLICT DO NOTHING; -- Avoid duplicate tasks
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The task_queue table and trigger would need to be created if implementing scheduled status checks
-- This is commented out for now as it requires additional infrastructure

-- COMMENT: To enable scheduled status checking for Semaphore messages:
-- 1. Create a task_queue table for scheduling background tasks
-- 2. Create the trigger: CREATE TRIGGER schedule_status_check AFTER INSERT ON sms_notification_history FOR EACH ROW EXECUTE FUNCTION schedule_sms_status_check();
-- 3. Implement a background worker to process the task queue

-- Migration completed successfully
-- The system now supports both Twilio (legacy) and Semaphore SMS providers