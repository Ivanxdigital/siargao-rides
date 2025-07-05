# Surf School Database Migration Plan

## Overview

This document provides the detailed database migration plan for integrating surf school functionality into the existing Siargao Rides platform. This plan is designed to work alongside the [Surf School Integration Plan](./surf-school-integration-plan.md) and provides the specific SQL migrations, database schema changes, and backend implementation details.

## Current Database State Analysis

### Existing Schema (Pre-Migration)
- **35 tables** in production database
- **Core tables**: `users`, `rental_shops`, `vehicles`, `vehicle_types`, `rentals`, `reviews`
- **Vehicle types**: motorcycle, car, tuktuk, van
- **Existing enums**: `shop_status`, `user_role`, `vehicle_document_type`
- **Robust RLS policies** for multi-tenant security

### Key Findings
1. ✅ Flexible shop-based architecture supports multiple business types
2. ✅ Vehicle system using `vehicle_types` table is easily extensible
3. ✅ Existing booking system via `rentals` table with payment integration
4. ✅ Strong foundation for time-based booking extensions

## Migration Timeline & Phases

### Phase 1: Core Surf Lesson Infrastructure (Week 1)
**Goal**: Add surf lesson as a vehicle type and extend vehicles table

### Phase 2: Instructor Management System (Week 2)
**Goal**: Create instructor profiles and management system

### Phase 3: Time-Based Booking System (Week 3)
**Goal**: Implement hourly/time-slot booking functionality

### Phase 4: Lesson Packages & Categories (Week 4)
**Goal**: Add lesson packages and surf-specific categories

### Phase 5: Business Logic Integration (Week 5)
**Goal**: Update existing tables for seamless integration

### Phase 6: Security & Optimization (Week 6)
**Goal**: Add RLS policies, indexes, and optimization

---

## Detailed Migration Scripts

### Phase 1: Core Surf Lesson Infrastructure

#### Migration 1.1: Add Surf Lesson Vehicle Type
**File**: `20250703001_add_surf_lesson_vehicle_type.sql`

```sql
-- Add surf lesson as a new vehicle type
INSERT INTO vehicle_types (id, name, description, icon, created_at, updated_at) 
VALUES (
  gen_random_uuid(), 
  'surf_lesson', 
  'Surf lessons and instruction services', 
  'waves',
  NOW(),
  NOW()
);

-- Add index for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_types_name ON vehicle_types(name);
```

#### Migration 1.2: Extend Vehicles Table for Surf Lessons
**File**: `20250703002_extend_vehicles_for_surf_lessons.sql`

```sql
-- Add surf lesson specific columns to vehicles table
ALTER TABLE vehicles 
ADD COLUMN lesson_duration INTEGER, -- duration in minutes (60, 90, 120, etc.)
ADD COLUMN skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'any')),
ADD COLUMN max_participants INTEGER DEFAULT 1 CHECK (max_participants > 0),
ADD COLUMN equipment_included BOOLEAN DEFAULT false,
ADD COLUMN instructor_id UUID; -- Will reference instructors table (created in Phase 2)

-- Add comments for documentation
COMMENT ON COLUMN vehicles.lesson_duration IS 'Duration of surf lesson in minutes';
COMMENT ON COLUMN vehicles.skill_level IS 'Required skill level: beginner, intermediate, advanced, or any';
COMMENT ON COLUMN vehicles.max_participants IS 'Maximum number of participants for group lessons';
COMMENT ON COLUMN vehicles.equipment_included IS 'Whether surfboard and wetsuit are included';
COMMENT ON COLUMN vehicles.instructor_id IS 'Assigned instructor for this lesson (optional)';

-- Create partial indexes for surf lessons only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_surf_lesson_skill 
ON vehicles(skill_level) 
WHERE vehicle_type_id IN (SELECT id FROM vehicle_types WHERE name = 'surf_lesson');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_surf_lesson_duration 
ON vehicles(lesson_duration) 
WHERE vehicle_type_id IN (SELECT id FROM vehicle_types WHERE name = 'surf_lesson');
```

### Phase 2: Instructor Management System

#### Migration 2.1: Create Instructors Table
**File**: `20250703003_create_instructors_table.sql`

```sql
-- Create instructors table
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES rental_shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  experience_years INTEGER CHECK (experience_years >= 0),
  specialties TEXT[] DEFAULT '{}', -- e.g., {'beginner', 'longboard', 'shortboard'}
  avatar_url TEXT,
  phone_number TEXT,
  email TEXT,
  hourly_rate DECIMAL(10,2) CHECK (hourly_rate >= 0),
  is_active BOOLEAN DEFAULT true,
  languages TEXT[] DEFAULT '{}', -- e.g., {'english', 'tagalog', 'spanish'}
  certifications TEXT[] DEFAULT '{}', -- e.g., {'ISA Level 1', 'First Aid'}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT instructors_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT instructors_email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$' OR email IS NULL)
);

-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_instructors_shop_id ON instructors(shop_id);
CREATE INDEX CONCURRENTLY idx_instructors_active ON instructors(is_active);
CREATE INDEX CONCURRENTLY idx_instructors_specialties ON instructors USING GIN(specialties);

-- Comments
COMMENT ON TABLE instructors IS 'Surf instructors associated with surf schools';
COMMENT ON COLUMN instructors.specialties IS 'Array of instructor specialties and skills';
COMMENT ON COLUMN instructors.hourly_rate IS 'Instructor hourly rate in PHP';
COMMENT ON COLUMN instructors.languages IS 'Languages spoken by instructor';
COMMENT ON COLUMN instructors.certifications IS 'Professional certifications held by instructor';

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instructors_updated_at 
  BEFORE UPDATE ON instructors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 2.2: Add Foreign Key to Vehicles
**File**: `20250703004_add_instructor_foreign_key.sql`

```sql
-- Add foreign key constraint for instructor_id in vehicles table
ALTER TABLE vehicles 
ADD CONSTRAINT fk_vehicles_instructor 
FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL;

-- Create index for the foreign key
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_instructor_id ON vehicles(instructor_id);
```

#### Migration 2.3: Instructor RLS Policies
**File**: `20250703005_instructor_rls_policies.sql`

```sql
-- Enable RLS on instructors table
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Shop owners can manage their instructors
CREATE POLICY "shop_owners_manage_instructors" ON instructors
FOR ALL USING (
  shop_id IN (
    SELECT id FROM rental_shops WHERE owner_id = auth.uid()
  )
);

-- Public can view active instructors
CREATE POLICY "public_view_active_instructors" ON instructors
FOR SELECT USING (is_active = true);

-- Admins can manage all instructors
CREATE POLICY "admins_manage_all_instructors" ON instructors
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Phase 3: Time-Based Booking System

#### Migration 3.1: Create Lesson Bookings Table
**File**: `20250703006_create_lesson_bookings_table.sql`

```sql
-- Create lesson_bookings table for time-based bookings
CREATE TABLE lesson_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES rental_shops(id) ON DELETE CASCADE,
  
  -- Booking time details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Manila',
  
  -- Booking details
  participant_count INTEGER DEFAULT 1 CHECK (participant_count > 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  equipment_rental BOOLEAN DEFAULT false,
  equipment_fee DECIMAL(10,2) DEFAULT 0 CHECK (equipment_fee >= 0),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
  
  -- Additional information
  special_requests TEXT,
  contact_info JSONB,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_date CHECK (booking_date >= CURRENT_DATE),
  CONSTRAINT valid_participant_count_vs_max CHECK (
    participant_count <= (
      SELECT max_participants FROM vehicles WHERE id = lesson_id
    )
  )
);

-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_lesson_bookings_date ON lesson_bookings(booking_date);
CREATE INDEX CONCURRENTLY idx_lesson_bookings_lesson_id ON lesson_bookings(lesson_id);
CREATE INDEX CONCURRENTLY idx_lesson_bookings_instructor ON lesson_bookings(instructor_id);
CREATE INDEX CONCURRENTLY idx_lesson_bookings_user ON lesson_bookings(user_id);
CREATE INDEX CONCURRENTLY idx_lesson_bookings_shop ON lesson_bookings(shop_id);
CREATE INDEX CONCURRENTLY idx_lesson_bookings_status ON lesson_bookings(status);
CREATE INDEX CONCURRENTLY idx_lesson_bookings_datetime ON lesson_bookings(booking_date, start_time);

-- Composite index for availability checking
CREATE INDEX CONCURRENTLY idx_lesson_bookings_availability 
ON lesson_bookings(instructor_id, booking_date, start_time, end_time) 
WHERE status NOT IN ('cancelled');

-- Comments
COMMENT ON TABLE lesson_bookings IS 'Time-based bookings for surf lessons';
COMMENT ON COLUMN lesson_bookings.timezone IS 'Timezone for the booking (default: Asia/Manila)';
COMMENT ON COLUMN lesson_bookings.contact_info IS 'JSON object with contact details for the booking';

-- Update trigger
CREATE TRIGGER update_lesson_bookings_updated_at 
  BEFORE UPDATE ON lesson_bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 3.2: Create Instructor Availability Table
**File**: `20250703007_create_instructor_availability.sql`

```sql
-- Create instructor availability schedule
CREATE TABLE instructor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  break_start_time TIME, -- Optional lunch/break time
  break_end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_break_time CHECK (
    (break_start_time IS NULL AND break_end_time IS NULL) OR
    (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND 
     break_end_time > break_start_time AND 
     break_start_time >= start_time AND 
     break_end_time <= end_time)
  ),
  
  -- Unique constraint to prevent overlapping schedules
  UNIQUE(instructor_id, day_of_week, start_time, end_time)
);

-- Indexes
CREATE INDEX CONCURRENTLY idx_instructor_availability_instructor ON instructor_availability(instructor_id);
CREATE INDEX CONCURRENTLY idx_instructor_availability_day ON instructor_availability(day_of_week);
CREATE INDEX CONCURRENTLY idx_instructor_availability_active ON instructor_availability(is_available);

-- Comments
COMMENT ON TABLE instructor_availability IS 'Weekly availability schedule for instructors';
COMMENT ON COLUMN instructor_availability.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN instructor_availability.break_start_time IS 'Optional break/lunch start time';

-- Update trigger
CREATE TRIGGER update_instructor_availability_updated_at 
  BEFORE UPDATE ON instructor_availability 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Phase 4: Lesson Packages & Categories

#### Migration 4.1: Create Surf Lesson Categories
**File**: `20250703008_create_surf_lesson_categories.sql`

```sql
-- Get the surf_lesson vehicle type ID
DO $$
DECLARE
    surf_lesson_type_id UUID;
BEGIN
    SELECT id INTO surf_lesson_type_id 
    FROM vehicle_types 
    WHERE name = 'surf_lesson';
    
    -- Insert surf lesson categories
    INSERT INTO categories (id, name, description, vehicle_type_id, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'beginner_group', 'Beginner Group Lessons (2-6 people)', surf_lesson_type_id, NOW(), NOW()),
        (gen_random_uuid(), 'intermediate_group', 'Intermediate Group Lessons (2-4 people)', surf_lesson_type_id, NOW(), NOW()),
        (gen_random_uuid(), 'advanced_group', 'Advanced Group Lessons (2-4 people)', surf_lesson_type_id, NOW(), NOW()),
        (gen_random_uuid(), 'private_lesson', 'Private One-on-One Lessons', surf_lesson_type_id, NOW(), NOW()),
        (gen_random_uuid(), 'semi_private', 'Semi-Private Lessons (2 people)', surf_lesson_type_id, NOW(), NOW()),
        (gen_random_uuid(), 'surf_camp', 'Multi-Day Surf Camps', surf_lesson_type_id, NOW(), NOW()),
        (gen_random_uuid(), 'kids_lesson', 'Kids Surf Lessons (Age 6-12)', surf_lesson_type_id, NOW(), NOW()),
        (gen_random_uuid(), 'longboard_lesson', 'Longboard Lessons', surf_lesson_type_id, NOW(), NOW()),
        (gen_random_uuid(), 'shortboard_lesson', 'Shortboard/Performance Lessons', surf_lesson_type_id, NOW(), NOW());
END $$;
```

#### Migration 4.2: Create Lesson Packages Table
**File**: `20250703009_create_lesson_packages.sql`

```sql
-- Create lesson packages for multi-lesson deals
CREATE TABLE lesson_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES rental_shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Package details
  lesson_count INTEGER NOT NULL CHECK (lesson_count > 0),
  total_duration INTEGER NOT NULL CHECK (total_duration > 0), -- total minutes across all lessons
  individual_lesson_duration INTEGER NOT NULL CHECK (individual_lesson_duration > 0), -- minutes per lesson
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  individual_lesson_price DECIMAL(10,2), -- calculated field for comparison
  
  -- Lesson specifics
  skill_level VARCHAR(20) NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'any')),
  max_participants INTEGER DEFAULT 1 CHECK (max_participants > 0),
  equipment_included BOOLEAN DEFAULT false,
  
  -- Package rules
  valid_for_days INTEGER DEFAULT 30 CHECK (valid_for_days > 0), -- package expires after X days from purchase
  lessons_per_week INTEGER DEFAULT 2 CHECK (lessons_per_week > 0), -- recommended frequency
  requires_consecutive_booking BOOLEAN DEFAULT false, -- must book all lessons at once
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT package_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT valid_duration_calculation CHECK (total_duration = lesson_count * individual_lesson_duration)
);

-- Indexes
CREATE INDEX CONCURRENTLY idx_lesson_packages_shop ON lesson_packages(shop_id);
CREATE INDEX CONCURRENTLY idx_lesson_packages_active ON lesson_packages(is_active);
CREATE INDEX CONCURRENTLY idx_lesson_packages_featured ON lesson_packages(is_featured);
CREATE INDEX CONCURRENTLY idx_lesson_packages_skill ON lesson_packages(skill_level);
CREATE INDEX CONCURRENTLY idx_lesson_packages_display_order ON lesson_packages(display_order);

-- Comments
COMMENT ON TABLE lesson_packages IS 'Multi-lesson packages for surf schools';
COMMENT ON COLUMN lesson_packages.valid_for_days IS 'Days after purchase before package expires';
COMMENT ON COLUMN lesson_packages.lessons_per_week IS 'Recommended lesson frequency';
COMMENT ON COLUMN lesson_packages.requires_consecutive_booking IS 'Whether all lessons must be booked at once';

-- Update trigger
CREATE TRIGGER update_lesson_packages_updated_at 
  BEFORE UPDATE ON lesson_packages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically calculate individual lesson price
CREATE OR REPLACE FUNCTION calculate_individual_lesson_price()
RETURNS TRIGGER AS $$
BEGIN
    NEW.individual_lesson_price = NEW.price / NEW.lesson_count;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_lesson_package_price 
  BEFORE INSERT OR UPDATE ON lesson_packages 
  FOR EACH ROW EXECUTE FUNCTION calculate_individual_lesson_price();
```

### Phase 5: Business Logic Integration

#### Migration 5.1: Add Surf School Business Type
**File**: `20250703010_add_surf_school_business_type.sql`

```sql
-- Add business type to rental shops to distinguish surf schools
ALTER TABLE rental_shops 
ADD COLUMN business_type VARCHAR(50) DEFAULT 'vehicle_rental',
ADD CONSTRAINT valid_business_type 
  CHECK (business_type IN ('vehicle_rental', 'surf_school', 'both'));

-- Update existing shops to vehicle_rental type
UPDATE rental_shops SET business_type = 'vehicle_rental' WHERE business_type IS NULL;

-- Add surf school specific fields
ALTER TABLE rental_shops
ADD COLUMN surf_school_info JSONB, -- Store surf school specific information
ADD COLUMN has_equipment_rental BOOLEAN DEFAULT false,
ADD COLUMN equipment_rental_rates JSONB; -- Store equipment rental pricing

-- Create index for business type filtering
CREATE INDEX CONCURRENTLY idx_rental_shops_business_type ON rental_shops(business_type);

-- Comments
COMMENT ON COLUMN rental_shops.business_type IS 'Type of business: vehicle_rental, surf_school, or both';
COMMENT ON COLUMN rental_shops.surf_school_info IS 'JSON object with surf school specific information';
COMMENT ON COLUMN rental_shops.has_equipment_rental IS 'Whether shop offers equipment rental separately';
COMMENT ON COLUMN rental_shops.equipment_rental_rates IS 'JSON object with equipment rental pricing';
```

#### Migration 5.2: Extend Rentals Table for Lesson Integration
**File**: `20250703011_extend_rentals_for_lessons.sql`

```sql
-- Add lesson booking integration to existing rentals table
ALTER TABLE rentals 
ADD COLUMN lesson_booking_id UUID REFERENCES lesson_bookings(id) ON DELETE SET NULL,
ADD COLUMN booking_type VARCHAR(20) DEFAULT 'vehicle_rental',
ADD COLUMN package_id UUID REFERENCES lesson_packages(id) ON DELETE SET NULL;

-- Add constraint for booking type
ALTER TABLE rentals 
ADD CONSTRAINT valid_booking_type 
  CHECK (booking_type IN ('vehicle_rental', 'surf_lesson', 'van_hire', 'package_purchase'));

-- Create indexes
CREATE INDEX CONCURRENTLY idx_rentals_lesson_booking ON rentals(lesson_booking_id);
CREATE INDEX CONCURRENTLY idx_rentals_booking_type ON rentals(booking_type);
CREATE INDEX CONCURRENTLY idx_rentals_package ON rentals(package_id);

-- Comments
COMMENT ON COLUMN rentals.lesson_booking_id IS 'Reference to lesson_bookings for surf lesson rentals';
COMMENT ON COLUMN rentals.booking_type IS 'Type of booking: vehicle_rental, surf_lesson, van_hire, or package_purchase';
COMMENT ON COLUMN rentals.package_id IS 'Reference to purchased lesson package';
```

### Phase 6: Security & Optimization

#### Migration 6.1: Lesson Bookings RLS Policies
**File**: `20250703012_lesson_bookings_rls.sql`

```sql
-- Enable RLS on lesson_bookings table
ALTER TABLE lesson_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "users_view_own_lesson_bookings" ON lesson_bookings
FOR SELECT USING (user_id = auth.uid());

-- Users can create bookings
CREATE POLICY "users_create_lesson_bookings" ON lesson_bookings
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own pending bookings
CREATE POLICY "users_update_own_pending_bookings" ON lesson_bookings
FOR UPDATE USING (
  user_id = auth.uid() AND 
  status IN ('pending') AND
  booking_date > CURRENT_DATE
);

-- Shop owners can manage bookings for their lessons
CREATE POLICY "shop_owners_manage_lesson_bookings" ON lesson_bookings
FOR ALL USING (
  shop_id IN (
    SELECT id FROM rental_shops WHERE owner_id = auth.uid()
  )
);

-- Instructors can view their assigned bookings
CREATE POLICY "instructors_view_assigned_bookings" ON lesson_bookings
FOR SELECT USING (
  instructor_id IN (
    SELECT id FROM instructors 
    WHERE shop_id IN (
      SELECT id FROM rental_shops WHERE owner_id = auth.uid()
    )
  )
);

-- Admins can manage all bookings
CREATE POLICY "admins_manage_all_lesson_bookings" ON lesson_bookings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### Migration 6.2: Lesson Packages RLS Policies
**File**: `20250703013_lesson_packages_rls.sql`

```sql
-- Enable RLS on lesson_packages table
ALTER TABLE lesson_packages ENABLE ROW LEVEL SECURITY;

-- Public can view active packages
CREATE POLICY "public_view_active_packages" ON lesson_packages
FOR SELECT USING (is_active = true);

-- Shop owners can manage their packages
CREATE POLICY "shop_owners_manage_packages" ON lesson_packages
FOR ALL USING (
  shop_id IN (
    SELECT id FROM rental_shops WHERE owner_id = auth.uid()
  )
);

-- Admins can manage all packages
CREATE POLICY "admins_manage_all_packages" ON lesson_packages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### Migration 6.3: Database Functions for Business Logic
**File**: `20250703014_create_business_logic_functions.sql`

```sql
-- Function to check instructor availability
CREATE OR REPLACE FUNCTION check_instructor_availability(
  p_instructor_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  has_schedule BOOLEAN;
  has_conflict BOOLEAN;
  day_of_week INTEGER;
BEGIN
  -- Get day of week (0=Sunday, 6=Saturday)
  day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Check if instructor has availability for this day/time
  SELECT EXISTS (
    SELECT 1 FROM instructor_availability 
    WHERE instructor_id = p_instructor_id
    AND day_of_week = EXTRACT(DOW FROM p_date)
    AND is_available = true
    AND start_time <= p_start_time
    AND end_time >= p_end_time
    AND (
      break_start_time IS NULL OR 
      break_end_time IS NULL OR
      p_end_time <= break_start_time OR
      p_start_time >= break_end_time
    )
  ) INTO has_schedule;
  
  IF NOT has_schedule THEN
    RETURN FALSE;
  END IF;
  
  -- Check for conflicting bookings
  SELECT EXISTS (
    SELECT 1 FROM lesson_bookings 
    WHERE instructor_id = p_instructor_id
    AND booking_date = p_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (id != p_exclude_booking_id OR p_exclude_booking_id IS NULL)
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    )
  ) INTO has_conflict;
  
  RETURN NOT has_conflict;
END;
$$ LANGUAGE plpgsql;

-- Function to get available time slots for a lesson on a specific date
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_lesson_id UUID,
  p_date DATE,
  p_instructor_id UUID DEFAULT NULL
) RETURNS TABLE(
  start_time TIME,
  end_time TIME,
  instructor_id UUID,
  instructor_name TEXT
) AS $$
DECLARE
  lesson_duration INTEGER;
  target_instructor_id UUID;
BEGIN
  -- Get lesson duration
  SELECT v.lesson_duration, v.instructor_id 
  INTO lesson_duration, target_instructor_id
  FROM vehicles v 
  WHERE v.id = p_lesson_id;
  
  -- Use provided instructor or lesson's assigned instructor
  target_instructor_id := COALESCE(p_instructor_id, target_instructor_id);
  
  -- Return available slots (simplified - can be enhanced)
  RETURN QUERY
  SELECT 
    ia.start_time,
    ia.start_time + (lesson_duration || ' minutes')::INTERVAL AS end_time,
    i.id AS instructor_id,
    i.name AS instructor_name
  FROM instructor_availability ia
  JOIN instructors i ON i.id = ia.instructor_id
  WHERE ia.instructor_id = target_instructor_id
  AND ia.day_of_week = EXTRACT(DOW FROM p_date)
  AND ia.is_available = true
  AND check_instructor_availability(
    ia.instructor_id, 
    p_date, 
    ia.start_time, 
    ia.start_time + (lesson_duration || ' minutes')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to validate lesson booking
CREATE OR REPLACE FUNCTION validate_lesson_booking()
RETURNS TRIGGER AS $$
DECLARE
  max_participants INTEGER;
  lesson_duration INTEGER;
BEGIN
  -- Get lesson constraints
  SELECT v.max_participants, v.lesson_duration
  INTO max_participants, lesson_duration
  FROM vehicles v
  WHERE v.id = NEW.lesson_id;
  
  -- Validate participant count
  IF NEW.participant_count > max_participants THEN
    RAISE EXCEPTION 'Participant count (%) exceeds maximum allowed (%)', 
      NEW.participant_count, max_participants;
  END IF;
  
  -- Validate instructor availability (if assigned)
  IF NEW.instructor_id IS NOT NULL THEN
    IF NOT check_instructor_availability(
      NEW.instructor_id, 
      NEW.booking_date, 
      NEW.start_time, 
      NEW.end_time,
      NEW.id
    ) THEN
      RAISE EXCEPTION 'Instructor is not available for the requested time slot';
    END IF;
  END IF;
  
  -- Calculate end time if not provided
  IF NEW.end_time IS NULL AND lesson_duration IS NOT NULL THEN
    NEW.end_time := NEW.start_time + (lesson_duration || ' minutes')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate lesson bookings
CREATE TRIGGER validate_lesson_booking_trigger
  BEFORE INSERT OR UPDATE ON lesson_bookings
  FOR EACH ROW EXECUTE FUNCTION validate_lesson_booking();
```

## Post-Migration Tasks

### 1. Data Seeding
After running all migrations, seed sample data:

```sql
-- Sample surf school
INSERT INTO rental_shops (id, owner_id, name, business_type, address, city) 
VALUES (gen_random_uuid(), 'USER_ID', 'Cloud 9 Surf School', 'surf_school', 'Cloud 9, General Luna', 'Siargao');

-- Sample instructor
INSERT INTO instructors (shop_id, name, bio, experience_years, specialties) 
VALUES ('SHOP_ID', 'Miguel Santos', 'Professional surf instructor with 8 years experience', 8, '{"beginner", "intermediate"}');

-- Sample lesson
INSERT INTO vehicles (shop_id, vehicle_type_id, name, category, price_per_day, lesson_duration, skill_level, max_participants) 
VALUES ('SHOP_ID', 'SURF_LESSON_TYPE_ID', 'Beginner Group Lesson', 'beginner_group', 1500, 90, 'beginner', 6);
```

### 2. Index Optimization
Monitor query performance and add additional indexes as needed:

```sql
-- Additional composite indexes based on common queries
CREATE INDEX CONCURRENTLY idx_lesson_bookings_shop_date_status 
ON lesson_bookings(shop_id, booking_date, status);

CREATE INDEX CONCURRENTLY idx_vehicles_surf_lessons 
ON vehicles(shop_id, vehicle_type_id) 
WHERE vehicle_type_id IN (SELECT id FROM vehicle_types WHERE name = 'surf_lesson');
```

### 3. Performance Monitoring
Set up monitoring for:
- Query performance on new tables
- Index usage statistics
- RLS policy performance
- Concurrent booking conflicts

### 4. Backup Strategy
Ensure backup strategy includes new tables:
- `instructors`
- `lesson_bookings`
- `instructor_availability`
- `lesson_packages`

## Rollback Plan

Each migration includes a rollback script:

```sql
-- Example rollback for Migration 1.1
DELETE FROM vehicle_types WHERE name = 'surf_lesson';

-- Example rollback for Migration 2.1
DROP TABLE IF EXISTS instructors CASCADE;
```

## Testing Checklist

- [ ] All migrations run successfully
- [ ] RLS policies work correctly
- [ ] Foreign key constraints are enforced
- [ ] Business logic functions work as expected
- [ ] Performance is acceptable with sample data
- [ ] Rollback scripts work correctly
- [ ] Integration with existing booking system
- [ ] Time zone handling works correctly

## Integration Points

This migration plan integrates with:
1. **Frontend**: New API endpoints for surf lessons
2. **Payment System**: Existing payment integration works with lesson bookings
3. **Notification System**: Existing SMS/email system for booking confirmations
4. **Admin Dashboard**: New tables accessible through existing admin interface

## Estimated Timeline

- **Phase 1-2**: 3-4 days (Core infrastructure)
- **Phase 3**: 4-5 days (Time-based bookings)
- **Phase 4**: 2-3 days (Packages and categories)
- **Phase 5**: 2-3 days (Integration)
- **Phase 6**: 3-4 days (Security and optimization)
- **Testing**: 3-4 days
- **Total**: ~3 weeks for backend completion

This migration plan provides a solid foundation for surf school integration while maintaining the integrity and performance of the existing vehicle rental system.