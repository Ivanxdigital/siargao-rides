-- Migration for simplified shop owner onboarding (ONBOARDING_V2)

-- Add has_shop boolean field to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS has_shop BOOLEAN DEFAULT false;

-- Add comment to explain column's purpose
COMMENT ON COLUMN public.users.has_shop IS 'Indicates whether the user has created a shop';

-- Add status enum field to rental_shops table
-- First, create the enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_status') THEN
        CREATE TYPE shop_status AS ENUM ('pending_verification', 'active', 'rejected');
    END IF;
END$$;

-- Add the status column if it doesn't exist
ALTER TABLE public.rental_shops
ADD COLUMN IF NOT EXISTS status shop_status DEFAULT 'pending_verification';

-- For existing shops, set status based on is_verified
UPDATE public.rental_shops
SET status = CASE 
    WHEN is_verified = true THEN 'active'::shop_status
    ELSE 'pending_verification'::shop_status
END
WHERE status IS NULL;

-- Update users.has_shop for existing shop owners
UPDATE public.users
SET has_shop = true
FROM public.rental_shops
WHERE public.users.id = public.rental_shops.owner_id
AND public.users.has_shop = false;

-- Create or update RLS policies
-- Policy for shop owners to view their own shops
CREATE POLICY IF NOT EXISTS "Shop owners can view their own shops" 
ON public.rental_shops
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- Policy for shop owners to update their own unverified shops
CREATE POLICY IF NOT EXISTS "Shop owners can update their own unverified shops" 
ON public.rental_shops
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id AND (status = 'pending_verification' OR status = 'rejected'));

-- Policy for admins to manage all shops
CREATE POLICY IF NOT EXISTS "Admins can manage all shops" 
ON public.rental_shops
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Create a function to update user.has_shop when a shop is created
CREATE OR REPLACE FUNCTION public.update_user_has_shop()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's has_shop field to true
    UPDATE public.users
    SET has_shop = true
    WHERE id = NEW.owner_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a shop is created
DROP TRIGGER IF EXISTS update_user_has_shop_trigger ON public.rental_shops;
CREATE TRIGGER update_user_has_shop_trigger
AFTER INSERT ON public.rental_shops
FOR EACH ROW
EXECUTE FUNCTION public.update_user_has_shop();
