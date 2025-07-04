import * as api from './api';
import { 
  Bike, 
  BikeCategory, 
  RentalShop, 
  User, 
  Review,
  Vehicle,
  VehicleType,
  VehicleCategory,
  VehicleImage,
  Referral
} from './types';
import { 
  mockBikes, 
  mockShops, 
  mockReviews,
  mockUsers
} from './mock-data';
import { createReferral as apiCreateReferral, getUserReferrals as apiGetUserReferrals, updateReferralStatus as apiUpdateReferralStatus, getReferralStats as apiGetReferralStats } from './api';

// Environment variable to control whether to use mock data or real API
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Shop-related functions
export async function getShops(): Promise<RentalShop[]> {
  if (USE_MOCK_DATA) {
    return mockShops;
  }
  return api.getShops();
}

export async function getVerifiedShops(): Promise<RentalShop[]> {
  const shops = await api.getShops();
  return shops.filter(shop => shop.is_verified);
}

export async function getShopById(id: string): Promise<RentalShop | null> {
  if (USE_MOCK_DATA) {
    return mockShops.find(shop => shop.id === id) || null;
  }
  return api.getShopById(id);
}

export async function getShopByUsername(username: string): Promise<RentalShop | null> {
  if (USE_MOCK_DATA) {
    return mockShops.find(shop => shop.username?.toLowerCase() === username.toLowerCase()) || null;
  }
  return api.getShopByUsername(username);
}

export async function getShopByIdOrUsername(identifier: string): Promise<RentalShop | null> {
  if (USE_MOCK_DATA) {
    return mockShops.find(shop => 
      shop.id === identifier || 
      shop.username?.toLowerCase() === identifier.toLowerCase()
    ) || null;
  }
  return api.getShopByIdOrUsername(identifier);
}

export async function createShop(shop: Omit<RentalShop, 'id' | 'created_at' | 'updated_at' | 'is_verified'>): Promise<RentalShop | null> {
  // Use our server API route to handle shop creation with admin privileges
  try {
    const response = await fetch('/api/shops', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shop)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating shop:', errorData);
      
      // Throw a descriptive error based on the error response
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling createShop API:', error);
    
    // Re-throw the error to be handled by the caller
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to create shop due to an unexpected error');
  }
}

// Vehicle-related functions
export async function getVehicleTypes(): Promise<{id: string, name: VehicleType, description: string | null}[]> {
  if (USE_MOCK_DATA) {
    // Mock vehicle types
    return [
      { id: '1', name: 'motorcycle', description: 'Two-wheeled motorized vehicles' },
      { id: '2', name: 'car', description: 'Four-wheeled automobiles' },
      { id: '3', name: 'tuktuk', description: 'Three-wheeled auto rickshaws' }
    ];
  }
  return api.getVehicleTypes();
}

export async function getVehicles(filters?: {
  vehicle_type?: VehicleType;
  shop_id?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  is_available?: boolean;
  seats?: number;
  transmission?: string;
  includeUnverified?: boolean;
}): Promise<Vehicle[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    // If we're using mock data, convert the mock bike data to vehicle format
    let filteredBikes = mockBikes;
    
    if (filters?.shop_id) {
      filteredBikes = filteredBikes.filter(bike => bike.shop_id === filters.shop_id);
    }
    
    if (filters?.vehicle_type === 'motorcycle') {
      // We only have motorcycle data in our mock data
      if (filters?.category) {
        const category = filters.category as BikeCategory;
        filteredBikes = filteredBikes.filter(bike => bike.category === category);
      }
    } else if (filters?.vehicle_type) {
      // If any other vehicle type is requested, return empty for mock data
      return [];
    }
    
    if (filters?.min_price !== undefined) {
      filteredBikes = filteredBikes.filter(bike => bike.price_per_day >= filters.min_price!);
    }
    
    if (filters?.max_price !== undefined) {
      filteredBikes = filteredBikes.filter(bike => bike.price_per_day <= filters.max_price!);
    }
    
    if (filters?.is_available !== undefined) {
      filteredBikes = filteredBikes.filter(bike => bike.is_available === filters.is_available);
    }
    
    // Convert bikes to vehicles
    return filteredBikes.map(bike => {
      // Convert BikeImage to VehicleImage
      const vehicleImages = bike.images?.map(img => ({
        ...img,
        vehicle_id: img.bike_id,
      })) as VehicleImage[] | undefined;
      
      return {
        ...bike,
        vehicle_type_id: '1', // Assuming 1 is motorcycle
        vehicle_type: 'motorcycle',
        images: vehicleImages,
      } as Vehicle;
    });
  } else {
    // Use the real API
    return api.getVehicles(filters);
  }
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  if (USE_MOCK_DATA) {
    // Convert mockBike to vehicle for mock data
    const bike = mockBikes.find(bike => bike.id === id);
    if (!bike) return null;
    
    // Convert BikeImage to VehicleImage
    const vehicleImages = bike.images?.map(img => ({
      ...img,
      vehicle_id: img.bike_id
    } as VehicleImage)) || [];
    
    return {
      ...bike,
      vehicle_type_id: '1',
      vehicle_type: 'motorcycle' as VehicleType,
      category: bike.category as VehicleCategory,
      // For mock data, add car-specific fields with defaults
      seats: 0,
      transmission: 'automatic' as const,
      images: vehicleImages
    } as Vehicle;
  }
  
  return api.getVehicleById(id);
}

export async function createVehicle(
  vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'images'>, 
  images: { url: string, is_primary: boolean }[]
): Promise<Vehicle | null> {
  // Always use real API for creation operations
  // We'll use the /api/vehicles endpoint, which will be implemented to handle multiple vehicle types
  try {
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...vehicle, images })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating vehicle:', errorData);
      
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling createVehicle API:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to create vehicle due to an unexpected error');
  }
}

// Bike-related functions (keeping for backward compatibility)
export async function getBikes(filters?: {
  shop_id?: string
  category?: BikeCategory
  min_price?: number
  max_price?: number
  is_available?: boolean
}): Promise<Bike[]> {
  if (USE_MOCK_DATA) {
    let filteredBikes = [...mockBikes];
    
    // Apply filters if provided
    if (filters?.shop_id) {
      filteredBikes = filteredBikes.filter(bike => bike.shop_id === filters.shop_id);
    }
    
    if (filters?.category) {
      filteredBikes = filteredBikes.filter(bike => bike.category === filters.category);
    }
    
    if (filters?.is_available !== undefined) {
      filteredBikes = filteredBikes.filter(bike => bike.is_available === filters.is_available);
    }
    
    if (filters?.min_price !== undefined && filters.min_price !== null) {
      filteredBikes = filteredBikes.filter(bike => bike.price_per_day >= filters.min_price!);
    }
    
    if (filters?.max_price !== undefined && filters.max_price !== null) {
      filteredBikes = filteredBikes.filter(bike => bike.price_per_day <= filters.max_price!);
    }
    
    return filteredBikes.sort((a, b) => a.price_per_day - b.price_per_day);
  }
  
  return api.getBikes(filters);
}

export async function getBikeById(id: string): Promise<Bike | null> {
  if (USE_MOCK_DATA) {
    return mockBikes.find(bike => bike.id === id) || null;
  }
  
  return api.getBikeById(id);
}

export async function addBike(
  bike: Omit<Bike, 'id' | 'created_at' | 'updated_at' | 'images'>, 
  images: { url: string, is_primary: boolean }[]
): Promise<Bike | null> {
  // Always use real API for creation operations
  return api.addBike(bike, images);
}

// User-related functions
export async function getCurrentUser(): Promise<User | null> {
  if (USE_MOCK_DATA) {
    // For mock data, just return the first user
    return mockUsers[0];
  }
  
  return api.getCurrentUser();
}

// Review-related functions
export async function getShopReviews(shopId: string): Promise<Review[]> {
  if (USE_MOCK_DATA) {
    return mockReviews.filter(review => review.shop_id === shopId);
  }
  
  return api.getShopReviews(shopId);
}

// Updated to handle vehicles rather than just bikes
export async function getVehicleReviews(vehicleId: string): Promise<Review[]> {
  if (USE_MOCK_DATA) {
    return mockReviews.filter(review => review.vehicle_id === vehicleId);
  }
  
  // Use getBikeReviews as a fallback since the API may not have getVehicleReviews yet
  return api.getBikeReviews(vehicleId);
}

// Legacy compatibility function
export async function getBikeReviews(bikeId: string): Promise<Review[]> {
  return getVehicleReviews(bikeId);
}

// Add new functions for vehicle-specific operations

// Get shop's vehicles by type
export async function getShopVehiclesByType(shopId: string, vehicleType?: VehicleType): Promise<Vehicle[]> {
  const filters = {
    shop_id: shopId,
    vehicle_type: vehicleType
  };
  
  return getVehicles(filters);
}

// Referral-related service functions
export async function createReferral(referral: {
  referrer_id: string;
  shop_id: string;
}): Promise<{ id: string } | null> {
  return apiCreateReferral(referral);
}

export async function getUserReferrals(userId: string): Promise<Referral[]> {
  return apiGetUserReferrals(userId);
}

export async function updateReferralStatus(
  referralId: string,
  updates: Partial<Omit<Referral, 'id' | 'referrer_id' | 'shop_id' | 'created_at'>>
): Promise<boolean> {
  return apiUpdateReferralStatus(referralId, updates);
}

export async function getReferralStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  paid: number;
  totalAmount: number;
  pendingAmount: number;
}> {
  return apiGetReferralStats();
}

// Add other functions as needed... 