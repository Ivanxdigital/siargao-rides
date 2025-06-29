-- SMS Notification Schema Updates for Siargao Rides
-- This adds SMS notification capabilities to the rental_shops table
-- and creates a history table for tracking SMS messages

-- Add SMS-related columns to rental_shops table
ALTER TABLE rental_shops
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_rental_shops_phone_number ON rental_shops(phone_number);

-- Create SMS notification history table
CREATE TABLE IF NOT EXISTS sms_notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES rental_shops(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  twilio_message_sid VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
  error_message TEXT,
  error_code VARCHAR(20),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sms_history_shop_id ON sms_notification_history(shop_id);
CREATE INDEX IF NOT EXISTS idx_sms_history_rental_id ON sms_notification_history(rental_id);
CREATE INDEX IF NOT EXISTS idx_sms_history_status ON sms_notification_history(status);
CREATE INDEX IF NOT EXISTS idx_sms_history_created_at ON sms_notification_history(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE sms_notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sms_notification_history

-- Shop owners can view their own SMS history
CREATE POLICY "Shop owners can view their SMS history" ON sms_notification_history
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM rental_shops WHERE owner_id = auth.uid()
    )
  );

-- Admins can view all SMS history
CREATE POLICY "Admins can view all SMS history" ON sms_notification_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Service role can insert SMS records (for backend operations)
CREATE POLICY "Service role can insert SMS records" ON sms_notification_history
  FOR INSERT WITH CHECK (true);

-- Service role can update SMS records (for status updates)
CREATE POLICY "Service role can update SMS records" ON sms_notification_history
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_sms_notification_history_updated_at
  BEFORE UPDATE ON sms_notification_history
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_history_updated_at();

-- Add comments for documentation
COMMENT ON TABLE sms_notification_history IS 'Tracks all SMS notifications sent to shop owners';
COMMENT ON COLUMN sms_notification_history.twilio_message_sid IS 'Unique identifier from Twilio for tracking message status';
COMMENT ON COLUMN sms_notification_history.status IS 'Current status of the SMS message';
COMMENT ON COLUMN sms_notification_history.error_code IS 'Twilio error code if message failed';

-- Create a view for SMS analytics (optional but useful)
CREATE OR REPLACE VIEW sms_notification_stats AS
SELECT 
  shop_id,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_messages,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
  COUNT(CASE WHEN status = 'undelivered' THEN 1 END) as undelivered_messages,
  MIN(created_at) as first_message_at,
  MAX(created_at) as last_message_at,
  COUNT(DISTINCT DATE(created_at)) as active_days
FROM sms_notification_history
GROUP BY shop_id;

-- Grant appropriate permissions on the view
GRANT SELECT ON sms_notification_stats TO authenticated;