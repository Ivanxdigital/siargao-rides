-- Add onboarding_email_sent column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_email_sent BOOLEAN DEFAULT false;

-- Create comment to explain column's purpose
COMMENT ON COLUMN public.users.onboarding_email_sent IS 'Tracks whether shop onboarding email has been sent to the user';

-- No need to update policies as the existing ones will work:
-- "Users can update their own data" - authenticated users can update their own records
-- "Users can view their own data" - users can view their own records
-- "Admins can manage all users" - admins can manage all user records 