-- Add username column to rental_shops table for custom shop URLs
-- Execute this in Supabase SQL Editor

-- Add username column (nullable initially to allow existing shops)
ALTER TABLE rental_shops 
ADD COLUMN username VARCHAR(30) UNIQUE;

-- Add constraint for username validation
-- Allows alphanumeric characters, hyphens, and underscores, 3-30 characters
ALTER TABLE rental_shops 
ADD CONSTRAINT username_format 
CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$');

-- Create index for performance (case-insensitive lookups)
CREATE INDEX idx_rental_shops_username_lower ON rental_shops(LOWER(username));

-- Add comment to the column for documentation
COMMENT ON COLUMN rental_shops.username IS 'Custom username for SEO-friendly shop URLs (e.g., /shop/rentagao)';

-- Reserved usernames that should not be allowed
-- Create a function to check reserved usernames
CREATE OR REPLACE FUNCTION is_reserved_username(username_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- List of reserved usernames (system routes, common names)
    RETURN LOWER(username_to_check) = ANY(ARRAY[
        'admin', 'api', 'www', 'app', 'dashboard', 'browse', 'search',
        'about', 'contact', 'privacy', 'terms', 'help', 'support',
        'booking', 'payment', 'auth', 'login', 'register', 'signup',
        'siargao', 'rides', 'rental', 'bike', 'motorcycle', 'car',
        'root', 'system', 'test', 'demo', 'example', 'null', 'undefined'
    ]);
END;
$$ LANGUAGE plpgsql;

-- Add constraint to prevent reserved usernames
ALTER TABLE rental_shops 
ADD CONSTRAINT username_not_reserved 
CHECK (NOT is_reserved_username(username));

-- Add RLS policy for username access (public read for username-based lookups)
-- This allows public access to shop data via username (same as existing ID-based access)
CREATE POLICY "Allow public read access by username" ON rental_shops
    FOR SELECT
    USING (true);

-- Note: Existing policies for insert/update/delete remain unchanged
-- Only shop owners can modify their own shops via existing policies

-- Migration notes:
-- 1. Existing shops will have NULL username initially
-- 2. Shop owners can set their username via dashboard
-- 3. URLs will work with both UUID (/shop/uuid) and username (/shop/username)
-- 4. Username must be unique across all shops
-- 5. Username validation enforced at database level
-- 6. Reserved system names are blocked