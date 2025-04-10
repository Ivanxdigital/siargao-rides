-- Add customer_name column to rentals table
ALTER TABLE rentals ADD COLUMN customer_name TEXT;

-- Update existing rentals with customer names from users table
UPDATE rentals
SET customer_name = CONCAT(u.first_name, ' ', u.last_name)
FROM users u
WHERE rentals.user_id = u.id;

-- Add comment to the column
COMMENT ON COLUMN rentals.customer_name IS 'Customer name for display in notifications';
