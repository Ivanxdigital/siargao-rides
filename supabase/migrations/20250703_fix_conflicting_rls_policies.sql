-- Migration to fix conflicting RLS policies for rental_shops
-- This migration resolves the conflict between the public policy and owner-only policy

-- Drop the conflicting public policy from the main schema
DROP POLICY IF EXISTS "Public rental shops are viewable by everyone" ON public.rental_shops;

-- Drop the conflicting owner-only policy from onboarding V2
DROP POLICY IF EXISTS "Shop owners can view their own shops" ON public.rental_shops;

-- Create the comprehensive policy that replaces both conflicting policies
CREATE POLICY "Comprehensive rental shops SELECT policy"
ON public.rental_shops FOR SELECT
USING (
    -- Public can see active, verified shops
    (status = 'active' AND is_verified = true)
    OR
    -- Owners can see their own shops regardless of status
    (auth.uid() = owner_id)
    OR
    -- Admins can see all shops
    (EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    ))
);

-- Add comment to document the policy
COMMENT ON POLICY "Comprehensive rental shops SELECT policy" ON public.rental_shops IS 
'Consolidated SELECT policy for rental_shops: Public sees verified shops, owners see their own shops, admins see all';

-- Ensure all required columns exist for the policy to work correctly
-- The policy references 'status' and 'is_verified' columns
DO $$
BEGIN
    -- Check if status column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rental_shops' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        -- Create enum type if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_status') THEN
            CREATE TYPE shop_status AS ENUM ('pending_verification', 'active', 'rejected');
        END IF;
        
        -- Add status column
        ALTER TABLE public.rental_shops
        ADD COLUMN status shop_status DEFAULT 'pending_verification';
        
        -- Set status based on existing is_verified values
        UPDATE public.rental_shops
        SET status = CASE 
            WHEN is_verified = true THEN 'active'::shop_status
            ELSE 'pending_verification'::shop_status
        END;
    END IF;
END$$;