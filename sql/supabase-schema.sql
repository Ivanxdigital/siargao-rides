-- Drop existing tables
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS bike_images;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS rentals;
DROP TABLE IF EXISTS bikes;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS rental_shops;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('tourist', 'shop_owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create rental_shops table
CREATE TABLE rental_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Siargao',
  latitude NUMERIC,
  longitude NUMERIC,
  phone_number TEXT,
  whatsapp TEXT,
  email TEXT,
  opening_hours JSONB,
  logo_url TEXT,
  banner_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('scooter', 'Small scooters and mopeds'),
  ('semi_auto', 'Semi-automatic motorcycles'),
  ('dirt_bike', 'Off-road dirt bikes'),
  ('sport_bike', 'Sport motorcycles'),
  ('other', 'Other types of motorbikes');

-- Create bikes table
CREATE TABLE bikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES rental_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL REFERENCES categories(name),
  price_per_day NUMERIC NOT NULL,
  price_per_week NUMERIC,
  price_per_month NUMERIC,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  specifications JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bike_images table
CREATE TABLE bike_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create rentals table
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID NOT NULL REFERENCES bikes(id),
  user_id UUID NOT NULL REFERENCES users(id),
  shop_id UUID NOT NULL REFERENCES rental_shops(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES rental_shops(id) ON DELETE CASCADE,
  bike_id UUID REFERENCES bikes(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  rental_id UUID NOT NULL REFERENCES rentals(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reply TEXT,
  reply_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create favorites table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, bike_id)
);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_rental_shops_updated_at
BEFORE UPDATE ON rental_shops
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_bikes_updated_at
BEFORE UPDATE ON bikes
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_rentals_updated_at
BEFORE UPDATE ON rentals
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bike_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public users are viewable by everyone"
ON users FOR SELECT
USING (true);

-- Comprehensive rental shops SELECT policy - consolidates all access patterns
CREATE POLICY "Comprehensive rental shops SELECT policy"
ON rental_shops FOR SELECT
USING (
    -- Public can see active, verified shops
    (status = 'active' AND is_verified = true)
    OR
    -- Owners can see their own shops regardless of status
    (auth.uid() = owner_id)
    OR
    -- Admins can see all shops
    (EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    ))
);

CREATE POLICY "Shop owners can update their own shops"
ON rental_shops FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create shops"
ON rental_shops FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Bikes are viewable by everyone"
ON bikes FOR SELECT
USING (true);

-- Add more policies as needed for your application security requirements 