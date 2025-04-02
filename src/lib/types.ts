// Define database types based on our Supabase schema

import { Database } from './database.types';

// Re-export database types for convenience
export type Tables = Database['public']['Tables'];

// Supabase row types
export type UserRow = Tables['users']['Row'];
export type RentalShopRow = Tables['rental_shops']['Row'];
export type BikeRow = Tables['bikes']['Row'];
export type VehicleRow = Tables['vehicles']['Row'];
export type RentalRow = Tables['rentals']['Row'];
export type ReviewRow = Tables['reviews']['Row'];

// Vehicle Type
export type VehicleType = 'motorcycle' | 'car' | 'tuktuk';

// Category types for different vehicles
export type BikeCategory = 'scooter' | 'semi_auto' | 'dirt_bike' | 'sport_bike' | 'other';
export type CarCategory = 'sedan' | 'suv' | 'van' | 'pickup' | 'compact';
export type TuktukCategory = 'standard' | 'premium' | 'electric';

// Combined category type
export type VehicleCategory = BikeCategory | CarCategory | TuktukCategory;

// Enum types
export type RentalStatus = 'booked' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'cancelled';
export type UserRole = 'tourist' | 'shop_owner' | 'admin';

// Extended types with relations
export type RentalShopWithOwner = RentalShopRow & {
  owner: UserRow;
};

export type BikeWithShop = BikeRow & {
  shop: RentalShopRow;
};

export type VehicleWithShop = VehicleRow & {
  shop: RentalShopRow;
};

export type RentalWithDetails = RentalRow & {
  vehicle: VehicleRow;
  user: UserRow;
  shop: RentalShopRow;
};

export type ReviewWithDetails = ReviewRow & {
  user: UserRow;
  shop: RentalShopRow;
  vehicle?: VehicleRow;
};

export type User = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone_number?: string
  avatar_url?: string
  role: 'tourist' | 'shop_owner' | 'admin'
  created_at: string
  updated_at: string
}

export type RentalShop = {
  id: string
  owner_id: string
  name: string
  description?: string
  address: string
  city: string
  latitude?: number
  longitude?: number
  phone_number?: string
  whatsapp?: string
  email?: string
  opening_hours?: OpeningHours
  logo_url?: string
  banner_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export type OpeningHours = {
  monday?: TimeRange
  tuesday?: TimeRange
  wednesday?: TimeRange
  thursday?: TimeRange
  friday?: TimeRange
  saturday?: TimeRange
  sunday?: TimeRange
}

export type TimeRange = {
  open: string
  close: string
}

export type Category = {
  id: string
  name: string
  description?: string
  icon?: string
  vehicle_type_id: string
  created_at: string
  updated_at: string
}

// Legacy Bike type (keeping for backward compatibility)
export type Bike = {
  id: string
  shop_id: string
  name: string
  description?: string
  category: BikeCategory
  price_per_day: number
  price_per_week?: number
  price_per_month?: number
  is_available: boolean
  specifications?: BikeSpecifications
  created_at: string
  updated_at: string
  images?: BikeImage[]
}

// New Vehicle type that replaces Bike
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

// Legacy BikeImage type (keeping for backward compatibility)
export type BikeImage = {
  id: string
  bike_id: string
  image_url: string
  is_primary: boolean
  created_at: string
}

// New VehicleImage type that replaces BikeImage
export type VehicleImage = {
  id: string
  vehicle_id: string
  image_url: string
  is_primary: boolean
  created_at: string
}

// Legacy BikeSpecifications type (keeping for backward compatibility)
export type BikeSpecifications = {
  engine?: string
  year?: number
  color?: string
  features?: string[]
  [key: string]: any
}

// New VehicleSpecifications type that replaces BikeSpecifications
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
}

export type Review = {
  id: string
  shop_id: string
  vehicle_id?: string
  vehicle_type_id?: string
  user_id: string
  rental_id: string
  rating: number
  comment?: string
  reply?: string
  reply_date?: string
  created_at: string
  updated_at: string
}

export type Favorite = {
  id: string
  user_id: string
  vehicle_id: string
  vehicle_type_id: string
  created_at: string
}

export enum RentalStatusEnum {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed'
}

export enum PaymentStatusEnum {
  Pending = 'pending',
  Paid = 'paid',
  Refunded = 'refunded'
} 