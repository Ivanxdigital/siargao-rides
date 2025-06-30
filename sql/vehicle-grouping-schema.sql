-- Vehicle Grouping Feature Database Schema
-- This script creates the necessary tables, functions, and views for vehicle grouping

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create vehicle_groups table for managing collections
CREATE TABLE IF NOT EXISTS vehicle_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES rental_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for vehicle_groups
CREATE INDEX idx_vehicle_groups_shop_id ON vehicle_groups(shop_id, is_active);
CREATE INDEX idx_vehicle_groups_base_vehicle ON vehicle_groups(base_vehicle_id);

-- 2. Create vehicle_group_settings table for customization
CREATE TABLE IF NOT EXISTS vehicle_group_settings (
  group_id UUID PRIMARY KEY REFERENCES vehicle_groups(id) ON DELETE CASCADE,
  auto_assign_strategy TEXT DEFAULT 'sequential' CHECK (auto_assign_strategy IN ('sequential', 'random', 'least_used')),
  naming_pattern TEXT DEFAULT 'Unit {index}',
  share_images BOOLEAN DEFAULT TRUE,
  share_pricing BOOLEAN DEFAULT TRUE,
  share_specifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add grouping columns to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES vehicle_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS group_index INTEGER,
ADD COLUMN IF NOT EXISTS individual_identifier TEXT,
ADD COLUMN IF NOT EXISTS is_group_primary BOOLEAN DEFAULT FALSE;

-- Ensure unique group positions
ALTER TABLE vehicles 
DROP CONSTRAINT IF EXISTS unique_group_position;

ALTER TABLE vehicles 
ADD CONSTRAINT unique_group_position 
  UNIQUE (group_id, group_index) 
  DEFERRABLE INITIALLY DEFERRED;

-- Create index for group queries
CREATE INDEX IF NOT EXISTS idx_vehicles_group_id ON vehicles(group_id) 
  WHERE group_id IS NOT NULL;

-- 4. Create vehicle group availability view
CREATE OR REPLACE VIEW vehicle_group_availability AS
WITH availability_counts AS (
  SELECT 
    vg.id as group_id,
    COUNT(DISTINCT v.id) FILTER (WHERE v.is_available = true) as total_available,
    COUNT(DISTINCT v.id) as total_vehicles,
    ARRAY_AGG(
      jsonb_build_object(
        'vehicle_id', v.id,
        'identifier', COALESCE(v.individual_identifier, v.name || ' #' || v.group_index),
        'is_available', v.is_available,
        'group_index', v.group_index
      ) ORDER BY v.group_index
    ) as vehicles
  FROM vehicle_groups vg
  LEFT JOIN vehicles v ON v.group_id = vg.id
  GROUP BY vg.id
)
SELECT 
  vg.*,
  ac.total_available,
  ac.total_vehicles,
  ac.vehicles,
  v.price_per_day,
  v.price_per_week,
  v.price_per_month,
  v.specifications,
  rs.name as shop_name,
  rs.username as shop_username,
  vt.name as vehicle_type_name,
  c.name as category_name
FROM vehicle_groups vg
JOIN availability_counts ac ON ac.group_id = vg.id
LEFT JOIN vehicles v ON v.id = vg.base_vehicle_id
LEFT JOIN rental_shops rs ON rs.id = vg.shop_id
LEFT JOIN vehicle_types vt ON vt.id = vg.vehicle_type_id
LEFT JOIN categories c ON c.id = vg.category_id
WHERE vg.is_active = true;

-- 5. Create function to check group availability for date range
CREATE OR REPLACE FUNCTION check_group_availability(
  p_group_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  available_count INTEGER,
  total_count INTEGER,
  available_vehicles UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (COUNT(*) FILTER (
      WHERE v.is_available = true
      AND NOT EXISTS (
        SELECT 1 FROM rentals r
        WHERE r.vehicle_id = v.id
        AND r.status IN ('pending', 'confirmed')
        AND daterange(p_start_date, p_end_date, '[]') && 
            daterange(r.start_date::DATE, r.end_date::DATE, '[]')
      )
      AND NOT EXISTS (
        SELECT 1 FROM vehicle_blocked_dates vbd
        WHERE vbd.vehicle_id = v.id
        AND daterange(p_start_date, p_end_date, '[]') && 
            daterange(vbd.start_date::DATE, vbd.end_date::DATE, '[]')
      )
    ))::INTEGER as available_count,
    COUNT(*)::INTEGER as total_count,
    ARRAY_AGG(v.id) FILTER (
      WHERE v.is_available = true
      AND NOT EXISTS (
        SELECT 1 FROM rentals r
        WHERE r.vehicle_id = v.id
        AND r.status IN ('pending', 'confirmed')
        AND daterange(p_start_date, p_end_date, '[]') && 
            daterange(r.start_date::DATE, r.end_date::DATE, '[]')
      )
      AND NOT EXISTS (
        SELECT 1 FROM vehicle_blocked_dates vbd
        WHERE vbd.vehicle_id = v.id
        AND daterange(p_start_date, p_end_date, '[]') && 
            daterange(vbd.start_date::DATE, vbd.end_date::DATE, '[]')
      )
    ) as available_vehicles
  FROM vehicles v
  WHERE v.group_id = p_group_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to assign a vehicle from a group
CREATE OR REPLACE FUNCTION assign_vehicle_from_group(
  p_group_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_strategy TEXT DEFAULT 'sequential'
) RETURNS UUID AS $$
DECLARE
  v_vehicle_id UUID;
  v_available_vehicles UUID[];
BEGIN
  -- Get available vehicles for the date range
  SELECT available_vehicles INTO v_available_vehicles
  FROM check_group_availability(p_group_id, p_start_date, p_end_date);
  
  -- Check if any vehicles are available
  IF array_length(v_available_vehicles, 1) IS NULL OR array_length(v_available_vehicles, 1) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Apply assignment strategy
  CASE p_strategy
    WHEN 'random' THEN
      -- Random selection
      SELECT v_available_vehicles[1 + floor(random() * array_length(v_available_vehicles, 1))]
      INTO v_vehicle_id;
      
    WHEN 'least_used' THEN
      -- Select the vehicle with the least number of rentals
      SELECT v.id INTO v_vehicle_id
      FROM vehicles v
      LEFT JOIN (
        SELECT vehicle_id, COUNT(*) as rental_count
        FROM rentals
        WHERE status IN ('completed', 'confirmed')
        GROUP BY vehicle_id
      ) rc ON rc.vehicle_id = v.id
      WHERE v.id = ANY(v_available_vehicles)
      ORDER BY COALESCE(rc.rental_count, 0), v.group_index
      LIMIT 1;
      
    ELSE -- 'sequential' (default)
      -- Select based on group_index order
      SELECT v.id INTO v_vehicle_id
      FROM vehicles v
      WHERE v.id = ANY(v_available_vehicles)
      ORDER BY v.group_index
      LIMIT 1;
  END CASE;
  
  RETURN v_vehicle_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to create a vehicle group with multiple vehicles
CREATE OR REPLACE FUNCTION create_vehicle_group_with_vehicles(
  p_shop_id UUID,
  p_name TEXT,
  p_vehicle_type_id UUID,
  p_category_id UUID,
  p_quantity INTEGER,
  p_vehicle_data JSONB,
  p_naming_pattern TEXT DEFAULT 'Unit {index}',
  p_individual_names TEXT[] DEFAULT NULL
) RETURNS TABLE (
  group_id UUID,
  vehicle_ids UUID[]
) AS $$
DECLARE
  v_group_id UUID;
  v_base_vehicle_id UUID;
  v_vehicle_ids UUID[];
  v_vehicle_id UUID;
  i INTEGER;
  v_identifier TEXT;
BEGIN
  -- Create the vehicle group
  INSERT INTO vehicle_groups (
    shop_id, name, vehicle_type_id, category_id, total_quantity
  ) VALUES (
    p_shop_id, p_name, p_vehicle_type_id, p_category_id, p_quantity
  ) RETURNING id INTO v_group_id;
  
  -- Create group settings
  INSERT INTO vehicle_group_settings (group_id, naming_pattern)
  VALUES (v_group_id, p_naming_pattern);
  
  -- Create individual vehicles
  FOR i IN 1..p_quantity LOOP
    -- Determine the identifier for this vehicle
    IF p_individual_names IS NOT NULL AND array_length(p_individual_names, 1) >= i THEN
      v_identifier := p_individual_names[i];
    ELSE
      v_identifier := REPLACE(p_naming_pattern, '{index}', i::TEXT);
      v_identifier := REPLACE(v_identifier, '{name}', p_name);
    END IF;
    
    -- Create the vehicle
    INSERT INTO vehicles (
      shop_id,
      vehicle_type_id,
      category_id,
      name,
      description,
      price_per_day,
      price_per_week,
      price_per_month,
      specifications,
      group_id,
      group_index,
      individual_identifier,
      is_group_primary
    ) VALUES (
      p_shop_id,
      p_vehicle_type_id,
      p_category_id,
      p_name,
      p_vehicle_data->>'description',
      (p_vehicle_data->>'price_per_day')::NUMERIC,
      (p_vehicle_data->>'price_per_week')::NUMERIC,
      (p_vehicle_data->>'price_per_month')::NUMERIC,
      p_vehicle_data->'specifications',
      v_group_id,
      i,
      v_identifier,
      i = 1  -- First vehicle is the primary
    ) RETURNING id INTO v_vehicle_id;
    
    v_vehicle_ids := array_append(v_vehicle_ids, v_vehicle_id);
    
    -- Set the base vehicle ID if this is the first vehicle
    IF i = 1 THEN
      v_base_vehicle_id := v_vehicle_id;
    END IF;
  END LOOP;
  
  -- Update the group with the base vehicle ID
  UPDATE vehicle_groups 
  SET base_vehicle_id = v_base_vehicle_id
  WHERE id = v_group_id;
  
  RETURN QUERY SELECT v_group_id, v_vehicle_ids;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to update vehicle_groups updated_at
CREATE OR REPLACE FUNCTION update_vehicle_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicle_groups_updated_at_trigger
  BEFORE UPDATE ON vehicle_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_groups_updated_at();

CREATE TRIGGER update_vehicle_group_settings_updated_at_trigger
  BEFORE UPDATE ON vehicle_group_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_groups_updated_at();

-- 9. Create RLS policies for vehicle_groups
ALTER TABLE vehicle_groups ENABLE ROW LEVEL SECURITY;

-- Shop owners can view their own groups
CREATE POLICY "Shop owners can view their own groups" ON vehicle_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rental_shops rs
      WHERE rs.id = vehicle_groups.shop_id
      AND rs.owner_id = auth.uid()
    )
  );

-- Shop owners can create groups for their shops
CREATE POLICY "Shop owners can create groups" ON vehicle_groups
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rental_shops rs
      WHERE rs.id = vehicle_groups.shop_id
      AND rs.owner_id = auth.uid()
    )
  );

-- Shop owners can update their own groups
CREATE POLICY "Shop owners can update their own groups" ON vehicle_groups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rental_shops rs
      WHERE rs.id = vehicle_groups.shop_id
      AND rs.owner_id = auth.uid()
    )
  );

-- Shop owners can delete their own groups
CREATE POLICY "Shop owners can delete their own groups" ON vehicle_groups
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rental_shops rs
      WHERE rs.id = vehicle_groups.shop_id
      AND rs.owner_id = auth.uid()
    )
  );

-- 10. Create RLS policies for vehicle_group_settings
ALTER TABLE vehicle_group_settings ENABLE ROW LEVEL SECURITY;

-- Shop owners can view settings for their groups
CREATE POLICY "Shop owners can view group settings" ON vehicle_group_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_groups vg
      JOIN rental_shops rs ON rs.id = vg.shop_id
      WHERE vg.id = vehicle_group_settings.group_id
      AND rs.owner_id = auth.uid()
    )
  );

-- Shop owners can update settings for their groups
CREATE POLICY "Shop owners can update group settings" ON vehicle_group_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicle_groups vg
      JOIN rental_shops rs ON rs.id = vg.shop_id
      WHERE vg.id = vehicle_group_settings.group_id
      AND rs.owner_id = auth.uid()
    )
  );

-- Shop owners can insert settings for their groups
CREATE POLICY "Shop owners can insert group settings" ON vehicle_group_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicle_groups vg
      JOIN rental_shops rs ON rs.id = vg.shop_id
      WHERE vg.id = vehicle_group_settings.group_id
      AND rs.owner_id = auth.uid()
    )
  );

-- 11. Grant necessary permissions
GRANT SELECT ON vehicle_group_availability TO authenticated;
GRANT EXECUTE ON FUNCTION check_group_availability TO authenticated;
GRANT EXECUTE ON FUNCTION assign_vehicle_from_group TO authenticated;
GRANT EXECUTE ON FUNCTION create_vehicle_group_with_vehicles TO authenticated;

-- 12. Add comments for documentation
COMMENT ON TABLE vehicle_groups IS 'Manages collections of identical vehicles for rental shops';
COMMENT ON TABLE vehicle_group_settings IS 'Stores customization settings for vehicle groups';
COMMENT ON COLUMN vehicles.group_id IS 'References the vehicle group this vehicle belongs to';
COMMENT ON COLUMN vehicles.group_index IS 'The position of this vehicle within its group';
COMMENT ON COLUMN vehicles.individual_identifier IS 'Custom identifier for this specific vehicle unit';
COMMENT ON COLUMN vehicles.is_group_primary IS 'Whether this vehicle is the primary/template for the group';
COMMENT ON VIEW vehicle_group_availability IS 'Provides aggregated availability information for vehicle groups';
COMMENT ON FUNCTION check_group_availability IS 'Checks availability of vehicles in a group for a date range';
COMMENT ON FUNCTION assign_vehicle_from_group IS 'Assigns an available vehicle from a group using the specified strategy';
COMMENT ON FUNCTION create_vehicle_group_with_vehicles IS 'Creates a vehicle group and populates it with individual vehicles';