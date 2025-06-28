-- Add banner positioning fields to rental_shops table
-- This allows shop owners to control the focal point of their banner images

ALTER TABLE rental_shops 
ADD COLUMN banner_position_x DECIMAL(5,2) DEFAULT 50.00 CHECK (banner_position_x >= 0 AND banner_position_x <= 100),
ADD COLUMN banner_position_y DECIMAL(5,2) DEFAULT 50.00 CHECK (banner_position_y >= 0 AND banner_position_y <= 100);

-- Add comments for documentation
COMMENT ON COLUMN rental_shops.banner_position_x IS 'Horizontal position percentage (0-100) for banner image focal point';
COMMENT ON COLUMN rental_shops.banner_position_y IS 'Vertical position percentage (0-100) for banner image focal point';

-- Set default values for existing shops (center position)
UPDATE rental_shops 
SET banner_position_x = 50.00, banner_position_y = 50.00 
WHERE banner_position_x IS NULL OR banner_position_y IS NULL;