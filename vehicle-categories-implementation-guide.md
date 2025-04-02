# Siargao Rides: Vehicle Categories Implementation Guide

## Overview

This document outlines the steps required to extend the Siargao Rides platform to support multiple vehicle types (motorcycles, cars, and tuktuks) instead of only motorcycles.

## IMPORTANT
Go through this one by one, confirm each of the steps if I'm okay with it.

## 1. Database Schema Changes

### 1.1 Create a Vehicle Types Table

```sql
-- Create vehicle_types table
CREATE TABLE vehicle_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert vehicle types
INSERT INTO vehicle_types (name, description, icon) VALUES
  ('motorcycle', 'Two-wheeled motorized vehicles', 'motorcycle'),
  ('car', 'Four-wheeled automobiles', 'car'),
  ('tuktuk', 'Three-wheeled auto rickshaws', 'truck');

-- Add trigger for updated_at
CREATE TRIGGER update_vehicle_types_updated_at
BEFORE UPDATE ON vehicle_types
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
```

### 1.2 Modify Categories Table

```sql
-- Add vehicle_type_id to categories
ALTER TABLE categories 
ADD COLUMN vehicle_type_id UUID REFERENCES vehicle_types(id);

-- Update existing categories (set them all to motorcycle type)
UPDATE categories 
SET vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'motorcycle');

-- Make vehicle_type_id required
ALTER TABLE categories 
ALTER COLUMN vehicle_type_id SET NOT NULL;

-- Add unique constraint for name within each vehicle type
ALTER TABLE categories 
ADD CONSTRAINT unique_category_per_vehicle_type UNIQUE (name, vehicle_type_id);

-- Add car-specific categories
INSERT INTO categories (name, description, vehicle_type_id, icon) 
SELECT 
  c.name, 
  c.description, 
  (SELECT id FROM vehicle_types WHERE name = 'car'),
  c.icon
FROM (
  VALUES 
    ('sedan', 'Four-door passenger cars', 'car'),
    ('suv', 'Sport utility vehicles', 'suv'),
    ('van', 'Passenger and cargo vans', 'van'),
    ('pickup', 'Pickup trucks', 'truck'),
    ('compact', 'Small compact cars', 'car-compact')
) AS c(name, description, icon);

-- Add tuktuk-specific categories
INSERT INTO categories (name, description, vehicle_type_id, icon) 
SELECT 
  c.name, 
  c.description, 
  (SELECT id FROM vehicle_types WHERE name = 'tuktuk'),
  c.icon
FROM (
  VALUES 
    ('standard', 'Standard tuktuks', 'truck'),
    ('premium', 'Premium tuktuks with extra features', 'truck'),
    ('electric', 'Electric tuktuks', 'truck-electric')
) AS c(name, description, icon);
```

### 1.3 Create Vehicles Table and Migrate Bikes Data

```sql
-- Create vehicles table (more generalized than bikes)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES rental_shops(id) ON DELETE CASCADE,
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_per_day NUMERIC NOT NULL,
  price_per_week NUMERIC,
  price_per_month NUMERIC,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  specifications JSONB,
  -- Additional fields for all vehicle types
  color TEXT,
  year INTEGER,
  license_plate TEXT,
  -- Car specific fields
  seats INTEGER,
  transmission TEXT,
  fuel_type TEXT,
  doors INTEGER,
  air_conditioning BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Copy existing bikes to vehicles table
INSERT INTO vehicles (
  id, shop_id, vehicle_type_id, name, description, 
  category, price_per_day, price_per_week, price_per_month, 
  is_available, specifications, created_at, updated_at
)
SELECT 
  b.id, b.shop_id, (SELECT id FROM vehicle_types WHERE name = 'motorcycle'), 
  b.name, b.description, b.category, b.price_per_day, 
  b.price_per_week, b.price_per_month, b.is_available, 
  b.specifications, b.created_at, b.updated_at
FROM bikes b;

-- Add trigger for updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create vehicle_images table
CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrate bike_images to vehicle_images
INSERT INTO vehicle_images (vehicle_id, image_url, is_primary, created_at)
SELECT bike_id, image_url, is_primary, created_at
FROM bike_images;
```

### 1.4 Update Rentals Table

```sql
-- Rename bike_id to vehicle_id
ALTER TABLE rentals RENAME COLUMN bike_id TO vehicle_id;

-- Add vehicle_type_id to rentals
ALTER TABLE rentals 
ADD COLUMN vehicle_type_id UUID REFERENCES vehicle_types(id);

-- Update existing rentals (set them to motorcycle type)
UPDATE rentals 
SET vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'motorcycle');

-- Make vehicle_type_id not null after migration
ALTER TABLE rentals 
ALTER COLUMN vehicle_type_id SET NOT NULL;
```

### 1.5 Update Reviews Table

```sql
-- Rename bike_id to vehicle_id
ALTER TABLE reviews RENAME COLUMN bike_id TO vehicle_id;

-- Add vehicle_type_id to reviews
ALTER TABLE reviews 
ADD COLUMN vehicle_type_id UUID REFERENCES vehicle_types(id);

-- Update existing reviews with motorcycle type
UPDATE reviews 
SET vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'motorcycle')
WHERE vehicle_id IS NOT NULL;
```

### 1.6 Update Favorites Table

```sql
-- Rename bike_id to vehicle_id
ALTER TABLE favorites RENAME COLUMN bike_id TO vehicle_id;

-- Add vehicle_type_id to favorites
ALTER TABLE favorites 
ADD COLUMN vehicle_type_id UUID REFERENCES vehicle_types(id);

-- Update existing favorites with motorcycle type
UPDATE favorites 
SET vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'motorcycle');

-- Make vehicle_type_id not null
ALTER TABLE favorites 
ALTER COLUMN vehicle_type_id SET NOT NULL;

-- Update unique constraint
ALTER TABLE favorites 
DROP CONSTRAINT favorites_user_id_bike_id_key;

ALTER TABLE favorites 
ADD CONSTRAINT favorites_user_id_vehicle_id_vehicle_type_id_key 
UNIQUE (user_id, vehicle_id, vehicle_type_id);
```

## 2. TypeScript Type Definitions

### 2.1 Update Types in `src/lib/types.ts`

```typescript
// Add VehicleType
export type VehicleType = 'motorcycle' | 'car' | 'tuktuk';

// Update BikeCategory to also include car and tuktuk categories
export type BikeCategory = 'scooter' | 'semi_auto' | 'dirt_bike' | 'sport_bike' | 'other';
export type CarCategory = 'sedan' | 'suv' | 'van' | 'pickup' | 'compact';
export type TuktukCategory = 'standard' | 'premium' | 'electric';

// Combined category type
export type VehicleCategory = BikeCategory | CarCategory | TuktukCategory;

// New Vehicle interface to replace Bike
export type Vehicle = {
  id: string
  shop_id: string
  vehicle_type_id: string
  vehicle_type: VehicleType
  name: string
  description?: string
  category: VehicleCategory
  price_per_day: number
  price_per_week?: number
  price_per_month?: number
  is_available: boolean
  specifications?: VehicleSpecifications
  // Additional fields
  color?: string
  year?: number
  license_plate?: string
  // Car-specific fields
  seats?: number
  transmission?: 'manual' | 'automatic'
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid'
  doors?: number
  air_conditioning?: boolean
  // Timestamps
  created_at: string
  updated_at: string
  images?: VehicleImage[]
}

// Replace BikeSpecifications with VehicleSpecifications
export type VehicleSpecifications = {
  // Common fields
  color?: string
  year?: number
  // Motorcycle fields
  engine?: string
  // Car fields
  fuel_economy?: string
  trunk_capacity?: string
  // Tuktuk fields
  passenger_capacity?: number
  // Allow for extensibility
  features?: string[]
  [key: string]: any
}

// Replace BikeImage with VehicleImage
export type VehicleImage = {
  id: string
  vehicle_id: string
  image_url: string
  is_primary: boolean
  created_at: string
}

// Update Rental type
export type Rental = {
  id: string
  vehicle_id: string
  vehicle_type_id: string
  user_id: string
  shop_id: string
  start_date: string
  end_date: string
  total_price: number
  status: RentalStatus
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
  // ...other existing fields
}
```

## 3. Component Changes

### 3.1 SearchBar Component (`src/components/SearchBar.tsx`)

The SearchBar component needs to be updated to allow users to choose a vehicle type and display appropriate filters for each type:

1. Update the SearchParams interface to include vehicle type
2. Add a vehicle type selector at the top of the form
3. Create dynamic filters based on the selected vehicle type
4. Update the form submission to include vehicle type information

```typescript
// Updated interface
export interface SearchParams {
  location: string
  startDate: string
  endDate: string
  budget: number
  vehicleType: 'motorcycle' | 'car' | 'tuktuk'
  category?: string
  // Car-specific parameters
  seats?: number
  transmission?: string
  // Other filter parameters
}

// New constants
const vehicleTypes = [
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'tuktuk', label: 'Tuktuk', icon: Truck }
]

// Category options by vehicle type
const categoryOptions = {
  motorcycle: ["Any Type", "Scooter", "Semi-automatic", "Manual", "Dirt Bike", "Electric"],
  car: ["Any Type", "Sedan", "SUV", "Van", "Pickup", "Compact"],
  tuktuk: ["Any Type", "Standard", "Premium", "Electric"]
}
```

### 3.2 Browse Page (`src/app/browse/page.tsx`)

The Browse page needs to display and filter different vehicle types:

1. Update the ShopWithMetadata interface to include all vehicle types
2. Update the filter UI to show vehicle type selector
3. Add vehicle-specific filters (seats, transmission, etc.)
4. Update the filtering logic to filter by vehicle type

```typescript
// Updated ShopWithMetadata interface
interface ShopWithMetadata extends RentalShop {
  startingPrice: number
  rating: number
  reviewCount: number
  vehicleTypes: string[] // e.g., ['motorcycle', 'car', 'tuktuk']
  motorcycles: { count: number, types: string[], minPrice: number }
  cars: { count: number, types: string[], minPrice: number }
  tuktuks: { count: number, types: string[], minPrice: number }
  totalVehicles: number
  availableVehicles: number
  images: string[]
}
```

### 3.3 Shop Page (`src/app/shop/[id]/page.tsx`)

The shop page needs tabs for different vehicle types:

1. Add a tab control to switch between vehicle types
2. Update the vehicle fetching logic to get all vehicle types
3. Display vehicle-specific details in the vehicle cards

### 3.4 Booking Components

The booking flow needs to be updated to handle different vehicle types. This requires changes to multiple files:

#### 3.4.1 Update Directory Structure

```
src/app/booking/[vehicleId]/        # Rename from [bikeId]
src/app/booking/confirmation/[id]/  # No change needed
```

#### 3.4.2 Update BookingPage (`src/app/booking/[vehicleId]/page.tsx`)

The booking page needs to be updated to handle different vehicle types:

```typescript
// Rename params from bikeId to vehicleId
const { vehicleId } = useParams();

// Update the state to use Vehicle type instead of Bike
const [vehicle, setVehicle] = useState<Vehicle | null>(null);

// Update the fetchData function to query from vehicles table
const fetchData = async () => {
  // ...
  const { data: vehicleData, error: vehicleError } = await supabase
    .from('vehicles')
    .select(`
      *,
      vehicle_images(*),
      vehicle_types(*)
    `)
    .eq('id', vehicleId)
    .single();
    
  // Format vehicle data
  const formattedVehicle = {
    ...vehicleData,
    images: vehicleData.vehicle_images || [],
    vehicle_type: vehicleData.vehicle_types?.name || 'motorcycle'
  };
  
  setVehicle(formattedVehicle);
  // ...
}

// Update the JSX to use different titles based on vehicle type
<h1 className="text-2xl md:text-3xl font-bold mb-2">
  Book {vehicle.name}
  {vehicle.vehicle_type === 'car' && ' Car'}
  {vehicle.vehicle_type === 'tuktuk' && ' Tuktuk'}
</h1>

// Update component props
<BookingForm
  vehicle={vehicle}
  shop={shop}
  user={user}
  isAuthenticated={isAuthenticated}
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
  onDeliveryFeeChange={setDeliveryFee}
/>

<BookingSummary
  vehicle={vehicle}
  shop={shop}
  startDate={startDate}
  endDate={endDate}
  deliveryFee={deliveryFee}
/>
```

#### 3.4.3 Update BookingForm (`src/components/BookingForm.tsx`)

The booking form needs to handle vehicle-specific fields and requirements:

```typescript
interface BookingFormProps {
  vehicle: Vehicle;  // Change from bike: Bike
  shop: RentalShop;
  user: User | null;
  isAuthenticated: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onDeliveryFeeChange: (fee: number) => void;
}

export default function BookingForm({
  vehicle,  // Changed from bike
  shop,
  // ... other props
}: BookingFormProps) {
  // ... existing state
  
  // Add vehicle-type specific state
  const [additionalOptions, setAdditionalOptions] = useState<any[]>([]);
  
  // Conditional rendering based on vehicle type
  const renderVehicleSpecificFields = () => {
    switch(vehicle.vehicle_type) {
      case 'car':
        return (
          <div>
            <h3 className="text-lg font-medium mb-2">Car Rental Options</h3>
            {/* Car-specific options like insurance, child seat, GPS */}
            {/* ... */}
          </div>
        );
      case 'tuktuk':
        return (
          <div>
            <h3 className="text-lg font-medium mb-2">Tuktuk Options</h3>
            {/* Tuktuk-specific options */}
            {/* ... */}
          </div>
        );
      default:
        return (
          <div>
            <h3 className="text-lg font-medium mb-2">Motorcycle Options</h3>
            {/* Motorcycle-specific options like helmet rental */}
            {/* ... */}
          </div>
        );
    }
  };
  
  // Modify the API call to include vehicle type
  const createBooking = async () => {
    const response = await fetch('/api/create-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        vehicleType: vehicle.vehicle_type,
        // ... other booking data
      })
    });
    
    // ... rest of the function
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Existing form fields */}
      
      {/* Vehicle-specific fields */}
      {renderVehicleSpecificFields()}
      
      {/* ... other fields */}
    </form>
  );
}
```

#### 3.4.4 Update BookingSummary (`src/components/BookingSummary.tsx`)

The booking summary needs to display vehicle-specific information:

```typescript
interface BookingSummaryProps {
  vehicle: Vehicle;  // Change from bike: Bike
  shop: RentalShop;
  startDate: Date | null;
  endDate: Date | null;
  deliveryFee?: number;
}

export default function BookingSummary({
  vehicle,  // Changed from bike
  shop,
  startDate,
  endDate,
  deliveryFee = 0
}: BookingSummaryProps) {
  // ... existing code
  
  // Render vehicle-specific details
  const renderVehicleDetails = () => {
    const specs = vehicle.specifications || {};
    
    switch(vehicle.vehicle_type) {
      case 'car':
        return (
          <div className="text-sm text-white/70 mt-2">
            <div className="flex justify-between">
              <span>Seats:</span>
              <span>{vehicle.seats || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Transmission:</span>
              <span>{vehicle.transmission || 'N/A'}</span>
            </div>
            {/* More car-specific details */}
          </div>
        );
      case 'tuktuk':
        return (
          <div className="text-sm text-white/70 mt-2">
            <div className="flex justify-between">
              <span>Passenger Capacity:</span>
              <span>{specs.passenger_capacity || 'N/A'}</span>
            </div>
            {/* More tuktuk-specific details */}
          </div>
        );
      default:
        return (
          <div className="text-sm text-white/70 mt-2">
            <div className="flex justify-between">
              <span>Engine:</span>
              <span>{specs.engine || 'N/A'}</span>
            </div>
            {/* More motorcycle-specific details */}
          </div>
        );
    }
  };
  
  return (
    <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-5 shadow-sm sticky top-6">
      <h3 className="font-semibold mb-4 text-lg pb-2 border-b border-white/10">Booking Summary</h3>
      
      {/* Vehicle details */}
      <div className="flex items-center gap-3 mb-6">
        {vehicle?.images && vehicle.images[0]?.image_url && (
          <div className="w-20 h-20 relative rounded-md overflow-hidden">
            <Image
              src={vehicle.images[0].image_url}
              alt={vehicle.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div>
          <h4 className="font-medium">{vehicle?.name}</h4>
          <p className="text-sm text-white/70">{shop?.name}</p>
          <p className="text-xs text-white/50">
            {vehicle.vehicle_type.charAt(0).toUpperCase() + vehicle.vehicle_type.slice(1)}
          </p>
        </div>
      </div>
      
      {/* Display vehicle-specific details */}
      {renderVehicleDetails()}
      
      {/* Rest of the summary */}
      {/* ... */}
    </div>
  );
}
```

#### 3.4.5 Update Booking Confirmation (`src/app/booking/confirmation/[id]/page.tsx`)

The booking confirmation page needs to display the correct vehicle type:

```typescript
// Update the data fetching to include vehicle type
const { data: booking, error: bookingError } = await supabase
  .from('rentals')
  .select(`
    *,
    vehicles(*),
    vehicle_types(*),
    rental_shops(*),
    users(*)
  `)
  .eq('id', id)
  .single();

// Update the JSX to display vehicle type
<div className="flex items-center justify-between">
  <h1 className="text-2xl font-bold">{booking.vehicles.name}</h1>
  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
    {booking.vehicle_types.name.charAt(0).toUpperCase() + booking.vehicle_types.name.slice(1)}
  </span>
</div>

// Add vehicle-specific details section
<div className="bg-white/5 rounded-lg p-4 mb-6">
  <h3 className="text-lg font-medium mb-2">Vehicle Details</h3>
  
  {booking.vehicle_types.name === 'car' && (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <span className="text-white/70">Seats:</span>
        <p>{booking.vehicles.seats || 'N/A'}</p>
      </div>
      <div>
        <span className="text-white/70">Transmission:</span>
        <p>{booking.vehicles.transmission || 'N/A'}</p>
      </div>
      {/* More car fields */}
    </div>
  )}
  
  {booking.vehicle_types.name === 'tuktuk' && (
    /* Tuktuk specific fields */
  )}
  
  {booking.vehicle_types.name === 'motorcycle' && (
    /* Motorcycle specific fields */
  )}
</div>
```

#### 3.4.6 Update API Endpoints

Update the booking-related API endpoints:

1. `/api/check-availability`
2. `/api/create-booking`

```typescript
// In src/app/api/check-availability/route.ts
// Update to check vehicle availability instead of just bike availability
export async function POST(request: NextRequest) {
  const { vehicleId, vehicleType, startDate, endDate } = await request.json();
  
  // Query overlapping bookings using the vehicle_id field now
  const { data: overlappingBookings, error: bookingError } = await supabase
    .from('rentals')
    .select('id, start_date, end_date, status')
    .eq('vehicle_id', vehicleId)
    .eq('vehicle_type_id', vehicleTypeId)  // Include vehicle type
    .or(`status.eq.pending,status.eq.confirmed`)
    .or(
      `and(start_date.lte.${parsedEndDate.toISOString()},end_date.gte.${parsedStartDate.toISOString()})`
    );
    
  // ... rest of the function
}

// In src/app/api/create-booking/route.ts
// Update to handle different vehicle types
export async function POST(request: NextRequest) {
  const { vehicleId, vehicleType, /* other fields */ } = await request.json();
  
  // Get vehicle data using vehicles table
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single();
    
  // Create booking with vehicle_id and vehicle_type_id
  const bookingData = {
    vehicle_id: vehicleId,
    vehicle_type_id: vehicleTypeId,
    shop_id: vehicle.shop_id,
    // ... other fields
  };
  
  const { data: booking, error: bookingError } = await supabase
    .from('rentals')
    .insert(bookingData)
    .select()
    .single();
    
  // ... rest of the function
}
```

## 4. API Changes

### 4.1 API Endpoints

Update all bike-related API endpoints to work with the new vehicles table:

1. `/api/bikes` → `/api/vehicles`
2. `/api/check-availability` - Update to check vehicle availability
3. `/api/create-booking` - Update to handle different vehicle types

### 4.2 Update Service Functions (`src/lib/api.ts`)

Update service functions to fetch and manage vehicles:

```typescript
// New function to get all vehicle types
export async function getVehicleTypes(): Promise<any[]> {
  const { data, error } = await supabase
    .from('vehicle_types')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching vehicle types:', error)
    return []
  }

  return data || []
}

// Update function to get vehicles (replacing getBikes)
export async function getVehicles(filters?: {
  vehicle_type?: VehicleType
  shop_id?: string
  category?: string
  min_price?: number
  max_price?: number
  is_available?: boolean
  seats?: number
  transmission?: string
}): Promise<Vehicle[]> {
  // Implementation here
}

// Update shop function to include vehicle counts
export async function getShopWithVehicles(shopId: string): Promise<any> {
  // Implementation here
}
```

## 5. UI/UX Considerations

### 5.1 Vehicle Icons and Visuals

Add appropriate icons for each vehicle type:
- Cars: Car icon
- Tuktuks: Truck icon or custom Tuktuk icon
- Motorcycles: Existing Bike icon

### 5.2 Vehicle Type Selection

Make vehicle type selection intuitive:
- Use tabs or segmented control for vehicle type in search/browse
- Show appropriate images for each vehicle type
- Use clear icons and labels

### 5.3 Vehicle-Specific Information

Display vehicle-specific details:
- Cars: Seats, doors, transmission type, fuel type
- Tuktuks: Passenger capacity, open/enclosed
- Motorcycles: Engine size, type, etc.

## 6. Migration Strategy

### 6.1 Database Migration

1. Create the new tables and columns
2. Migrate existing data to the new structure
3. Verify data integrity
4. Update references in all tables

### 6.2 Code Deployment

1. Deploy database changes first
2. Deploy backend API changes
3. Deploy UI changes
4. Test all vehicle types in development
5. Release to production

## 7. Testing Checklist

- [ ] Vehicle Type Selection in Search Bar
- [ ] Vehicle-specific filtering
- [ ] Shop page with multiple vehicle types
- [ ] Booking process for each vehicle type
- [ ] Dashboard management of all vehicle types
- [ ] Vehicle availability checking
- [ ] Rental history and details by vehicle type
- [ ] Admin features for all vehicle types

## 8. Future Considerations

- Analytics by vehicle type
- Vehicle-specific pricing strategies
- Special features for certain vehicle types
- Insurance and damage policies by vehicle type
- Cross-rental discounts (rent a bike and car together)

## 9. Path Migration Strategy

To ensure backward compatibility during the transition, implement a redirection strategy:

```typescript
// Create a redirect file at src/app/booking/[bikeId]/page.tsx
"use client"

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BikeBookingRedirect() {
  const { bikeId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    // Get all existing query parameters
    const params = new URLSearchParams(searchParams.toString());
    
    // Redirect to the new URL structure
    router.replace(`/booking/${bikeId}?${params.toString()}`);
  }, [bikeId, router, searchParams]);
  
  return <div>Redirecting...</div>;
}
```

This ensures that existing links and bookmarks to the bike booking page continue to work during and after the migration. 