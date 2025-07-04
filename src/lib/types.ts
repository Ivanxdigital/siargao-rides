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
export type VehicleType = 'motorcycle' | 'car' | 'tuktuk' | 'van';

// Category types for different vehicles
export type BikeCategory = 'scooter' | 'semi_auto' | 'dirt_bike' | 'sport_bike' | 'other';
export type CarCategory = 'sedan' | 'suv' | 'van' | 'pickup' | 'compact';
export type TuktukCategory = 'standard' | 'premium' | 'electric';
export type VanCategory = 'airport_transfer' | 'tour_van' | 'cargo_van' | 'passenger_van';

// Combined category type
export type VehicleCategory = BikeCategory | CarCategory | TuktukCategory | VanCategory;

// Enum types
export type RentalStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
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
  username?: string
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
  banner_position_x?: number
  banner_position_y?: number
  is_verified: boolean
  location_area?: string
  offers_delivery?: boolean
  delivery_fee?: number
  requires_id_deposit?: boolean
  requires_cash_deposit?: boolean
  cash_deposit_amount?: number
  is_showcase?: boolean
  created_at: string
  updated_at: string
  // Private field for admin use only: stores verification document URLs
  verification_documents?: {
    government_id?: string
    business_permit?: string
  }
  referrer_id?: string
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
  // Grouping fields
  group_id?: string
  group_index?: number
  individual_identifier?: string
  is_group_primary?: boolean
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
  [key: string]: unknown
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
  [key: string]: unknown
}

// Vehicle Group types
export type VehicleGroupAssignmentStrategy = 'sequential' | 'random' | 'least_used';

export type VehicleGroup = {
  id: string
  shop_id: string
  name: string
  base_vehicle_id?: string
  vehicle_type_id: string
  category_id: string
  total_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type VehicleGroupSettings = {
  group_id: string
  auto_assign_strategy: VehicleGroupAssignmentStrategy
  naming_pattern: string
  share_images: boolean
  share_pricing: boolean
  share_specifications: boolean
  created_at: string
  updated_at: string
}

export type VehicleGroupWithDetails = VehicleGroup & {
  settings?: VehicleGroupSettings
  vehicles?: Vehicle[]
  shop?: RentalShop
  vehicle_type_name?: string
  category_name?: string
  available_count?: number
  total_count?: number
  price_per_day?: number
  price_per_week?: number
  price_per_month?: number
  specifications?: VehicleSpecifications
  images?: VehicleImage[]
}

export type VehicleGroupAvailability = {
  group_id: string
  available_count: number
  total_count: number
  available_vehicles: string[]
}

export type VehicleWithGroup = Vehicle & {
  group?: VehicleGroup
  group_availability?: VehicleGroupAvailability
}

// Van Service type for specialized van services
export type VanService = {
  id: string
  name: string
  description?: string
  vehicle_type: string
  base_price: number
  price_per_km?: number
  max_passengers: number
  max_luggage: number
  features?: string[]
  is_active: boolean
  created_at: string
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
  // Van hire specific fields
  van_service_id?: string
  pickup_location?: string
  dropoff_location?: string
  pickup_instructions?: string
  passenger_count?: number
  luggage_count?: number
  special_requests?: string
  estimated_duration?: number // minutes
  is_van_hire?: boolean
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

export type ReferralStatus = 'pending' | 'completed' | 'paid';

export type Referral = {
  id: string;
  referrer_id: string;
  shop_id: string;
  status: ReferralStatus;
  payout_amount: number;
  vehicle_added: boolean;
  shop_verified: boolean;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  payment_reference?: string;
  payment_method?: string;
  notes?: string;
};

// PayPal payment types
export type PayPalPayment = {
  id: string;
  rental_id: string;
  order_id: string;
  capture_id?: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
  created_at: string;
};

export type PayPalOrder = {
  id: string;
  status: string;
  intent: string;
  purchase_units: PayPalPurchaseUnit[];
  create_time: string;
  update_time: string;
  links: PayPalLink[];
};

// Shop browsing types
export interface BrowseShopsFilters {
  page?: number;
  limit?: number;
  sort_by?: 'rating_desc' | 'rating_asc' | 'vehicles_desc' | 'price_asc' | 'price_desc' | 'newest';
  location?: string;
  vehicle_types?: VehicleType[];
  verified_only?: boolean;
  offers_delivery?: boolean;
  has_whatsapp?: boolean;
  min_rating?: number;
  search?: string;
}

export interface ShopWithMetadata extends RentalShop {
  starting_price?: number;
  average_rating?: number;
  review_count?: number;
  vehicle_count?: number;
  vehicle_types?: VehicleType[];
  images?: string[];
}

export interface ShopsPaginationResponse {
  shops: ShopWithMetadata[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  locations: string[];
}

export type PayPalPurchaseUnit = {
  reference_id: string;
  description: string;
  amount: {
    currency_code: string;
    value: string;
  };
  custom_id?: string;
  payments?: {
    captures?: PayPalCapture[];
  };
};

export type PayPalCapture = {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  create_time: string;
  update_time: string;
};

export type PayPalLink = {
  href: string;
  rel: string;
  method: string;
};

// Payment method provider types
export type PaymentProvider = 'paymongo' | 'paypal' | 'cash';

export type PaymentMethod = {
  id: string;
  name: string;
  description?: string;
  provider?: PaymentProvider;
  is_online: boolean;
  is_active: boolean;
  requires_deposit?: boolean;
};

// Vehicle Group API types
export interface CreateVehicleGroupRequest {
  name: string;
  vehicle_type_id: string;
  category_id: string;
  quantity: number;
  base_vehicle_data: {
    description?: string;
    price_per_day: number;
    price_per_week?: number;
    price_per_month?: number;
    specifications?: VehicleSpecifications;
    images?: VehicleImage[];
    documents?: VehicleDocument[];
  };
  naming_pattern?: string;
  individual_names?: string[];
}

export interface BulkActionRequest {
  action: 'set-availability' | 'update-pricing' | 'block-dates';
  vehicle_ids?: string[];
  data: Record<string, any>;
}

export interface GroupAvailabilityRequest {
  start_date: string;
  end_date: string;
}

export interface GroupAvailabilityResponse {
  group_id: string;
  start_date: string;
  end_date: string;
  total_vehicles: number;
  available_count: number;
  available_vehicles: Array<{
    id: string;
    identifier: string;
    next_available_date?: string;
  }>;
}

export interface CreateGroupResponse {
  group: VehicleGroup;
  vehicles: Vehicle[];
  success: boolean;
  message?: string;
}

export interface VehicleDocument {
  type: 'registration' | 'insurance' | 'other';
  url: string;
  name: string;
  uploaded_at: string;
}