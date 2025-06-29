-- Migration: Add Semaphore SMS Provider Support (FIXED VERSION)
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

-- Drop the existing view first (required to change column structure)
DROP VIEW IF EXISTS sms_notification_stats;

-- Recreate the analytics view with provider information
CREATE VIEW sms_notification_stats AS
SELECT 
  shop_id,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_messages,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
  COUNT(CASE WHEN status = 'undelivered' THEN 1 END) as undelivered_messages,
  MIN(created_at) as first_message_at,
  MAX(created_at) as last_message_at,
  COUNT(DISTINCT DATE(created_at)) as active_days,
  -- New provider-specific columns added at the end
  COUNT(CASE WHEN get_sms_provider(sms_notification_history.*) = 'twilio' THEN 1 END) as twilio_messages,
  COUNT(CASE WHEN get_sms_provider(sms_notification_history.*) = 'semaphore' THEN 1 END) as semaphore_messages
FROM sms_notification_history
GROUP BY shop_id;

-- Grant permissions on the new functions
GRANT EXECUTE ON FUNCTION get_sms_message_id(sms_notification_history) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sms_provider(sms_notification_history) TO authenticated;

-- Grant permissions on the recreated view
GRANT SELECT ON sms_notification_stats TO authenticated;

-- Note: Removed the task_queue related function as it references a non-existent table
-- This can be added later if needed for scheduled status checks

-- Migration completed successfully
-- The system now supports both Twilio (legacy) and Semaphore SMS providers