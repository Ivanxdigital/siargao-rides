-- Vehicle Grouping Feature Rollback Script
-- This script removes all vehicle grouping functionality

-- 1. Drop RLS policies
DROP POLICY IF EXISTS "Shop owners can view their own groups" ON vehicle_groups;
DROP POLICY IF EXISTS "Shop owners can create groups" ON vehicle_groups;
DROP POLICY IF EXISTS "Shop owners can update their own groups" ON vehicle_groups;
DROP POLICY IF EXISTS "Shop owners can delete their own groups" ON vehicle_groups;
DROP POLICY IF EXISTS "Shop owners can view group settings" ON vehicle_group_settings;
DROP POLICY IF EXISTS "Shop owners can update group settings" ON vehicle_group_settings;
DROP POLICY IF EXISTS "Shop owners can insert group settings" ON vehicle_group_settings;

-- 2. Revoke permissions
REVOKE SELECT ON vehicle_group_availability FROM authenticated;
REVOKE EXECUTE ON FUNCTION check_group_availability FROM authenticated;
REVOKE EXECUTE ON FUNCTION assign_vehicle_from_group FROM authenticated;
REVOKE EXECUTE ON FUNCTION create_vehicle_group_with_vehicles FROM authenticated;

-- 3. Drop views
DROP VIEW IF EXISTS vehicle_group_availability;

-- 4. Drop functions
DROP FUNCTION IF EXISTS check_group_availability(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS assign_vehicle_from_group(UUID, DATE, DATE, TEXT);
DROP FUNCTION IF EXISTS create_vehicle_group_with_vehicles(UUID, TEXT, UUID, UUID, INTEGER, JSONB, TEXT, TEXT[]);

-- 5. Drop triggers
DROP TRIGGER IF EXISTS update_vehicle_groups_updated_at_trigger ON vehicle_groups;
DROP TRIGGER IF EXISTS update_vehicle_group_settings_updated_at_trigger ON vehicle_group_settings;

-- 6. Remove columns from vehicles table
ALTER TABLE vehicles 
DROP CONSTRAINT IF EXISTS unique_group_position;

ALTER TABLE vehicles 
DROP COLUMN IF EXISTS group_id,
DROP COLUMN IF EXISTS group_index,
DROP COLUMN IF EXISTS individual_identifier,
DROP COLUMN IF EXISTS is_group_primary;

-- 7. Drop indexes
DROP INDEX IF EXISTS idx_vehicles_group_id;
DROP INDEX IF EXISTS idx_vehicle_groups_shop_id;
DROP INDEX IF EXISTS idx_vehicle_groups_base_vehicle;

-- 8. Drop tables
DROP TABLE IF EXISTS vehicle_group_settings;
DROP TABLE IF EXISTS vehicle_groups;

-- 9. Emergency data preservation (optional)
-- Before running this rollback, you might want to:
-- 1. Export vehicle_groups data: COPY vehicle_groups TO '/tmp/vehicle_groups_backup.csv' CSV HEADER;
-- 2. Export vehicle grouping data: COPY (SELECT id, group_id, group_index, individual_identifier FROM vehicles WHERE group_id IS NOT NULL) TO '/tmp/vehicles_grouping_backup.csv' CSV HEADER;