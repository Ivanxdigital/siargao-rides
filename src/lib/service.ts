import * as api from './api';
import { 
  Bike, 
  BikeCategory, 
  RentalShop, 
  User, 
  Rental, 
  Review,
  Favorite 
} from './types';
import { 
  mockBikes, 
  mockShops, 
  mockReviews,
  mockUsers
} from './mock-data';

// Environment variable to control whether to use mock data or real API
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Shop-related functions
export async function getShops(): Promise<RentalShop[]> {
  if (USE_MOCK_DATA) {
    return mockShops;
  }
  return api.getShops();
}

export async function getShopById(id: string): Promise<RentalShop | null> {
  if (USE_MOCK_DATA) {
    return mockShops.find(shop => shop.id === id) || null;
  }
  return api.getShopById(id);
}

export async function createShop(shop: Omit<RentalShop, 'id' | 'created_at' | 'updated_at' | 'is_verified'>): Promise<RentalShop | null> {
  // Always use real API for creation operations
  return api.createShop(shop);
}

// Bike-related functions
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

export async function getBikeReviews(bikeId: string): Promise<Review[]> {
  if (USE_MOCK_DATA) {
    return mockReviews.filter(review => review.bike_id === bikeId);
  }
  
  return api.getBikeReviews(bikeId);
}

// Add other functions as needed... 