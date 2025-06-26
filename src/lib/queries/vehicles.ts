import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useQuery } from '@tanstack/react-query';
import { Vehicle, VehicleType } from '@/lib/types';

export interface VehicleWithMetadata extends Vehicle {
  shopName: string;
  shopLogo?: string;
  shopLocation?: string;
  shopId: string;
  shopIsShowcase?: boolean;
  is_available_for_dates?: boolean;
  images?: any[];
  vehicle_type: VehicleType;
}

export interface FetchVehiclesResult {
  vehicles: VehicleWithMetadata[];
  availableCategories: Record<VehicleType, string[]>;
  locations: string[];
}

export interface BrowseFilters {
  page?: number;
  limit?: number;
  price_min?: number;
  price_max?: number;
  vehicle_type?: VehicleType | 'all';
  categories?: string[];
  location?: string;
  start_date?: string;
  end_date?: string;
  only_available?: boolean;
  min_seats?: number;
  transmission?: string;
  engine_size_min?: number;
  engine_size_max?: number;
  sort_by?: string;
}

export interface BrowseVehiclesResult {
  vehicles: VehicleWithMetadata[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  availableCategories: Record<VehicleType, string[]>;
  locations: string[];
}

export async function fetchVehicles(): Promise<FetchVehiclesResult> {
  const supabase = createClientComponentClient();

  // Fetch all vehicles with joined shop data
  let vehicleQuery = supabase
    .from('vehicles')
    .select(`
      *,
      vehicle_images(*),
      vehicle_types(*),
      rental_shops!inner(id, name, logo_url, location_area, is_active, is_showcase)
    `)
    .order('price_per_day');

  vehicleQuery = vehicleQuery.eq('is_available', true);
  // SUBSCRIPTION SYSTEM DISABLED: All shops are now permanently active
  vehicleQuery = vehicleQuery.eq('rental_shops.is_active', true);
  vehicleQuery = vehicleQuery.eq('is_verified', true);
  vehicleQuery = vehicleQuery.eq('verification_status', 'approved');

  const { data: vehicleData, error: vehicleError } = await vehicleQuery;

  if (vehicleError) {
    throw vehicleError;
  }

  let processedVehicles: VehicleWithMetadata[] = [];
  if (vehicleData && vehicleData.length > 0) {
    processedVehicles = vehicleData.map(vehicle => ({
      ...vehicle,
      shopId: vehicle.shop_id,
      shopName: vehicle.rental_shops?.name || 'Unknown Shop',
      shopLogo: vehicle.rental_shops?.logo_url,
      shopLocation: vehicle.rental_shops?.location_area,
      shopIsShowcase: vehicle.rental_shops?.is_showcase || false,
      vehicle_type: (vehicle.vehicle_types?.name as VehicleType) || vehicle.vehicle_type || 'motorcycle',
      images: vehicle.vehicle_images || [],
      is_available_for_dates: true // Default to true, will be updated if dates are selected
    })) as VehicleWithMetadata[];
  }

  // Gather all categories by vehicle type
  const allCategories: Record<VehicleType, string[]> = {
    motorcycle: [],
    car: [],
    tuktuk: []
  };

  const { data: categoryData } = await supabase
    .from('categories')
    .select('*');

  if (categoryData) {
    categoryData.forEach((category: any) => {
      const vehicleType = category.vehicle_type_id === '1' ? 'motorcycle' :
                        category.vehicle_type_id === '2' ? 'car' :
                        category.vehicle_type_id === '3' ? 'tuktuk' : null;
      if (vehicleType && !allCategories[vehicleType as VehicleType].includes(category.name)) {
        allCategories[vehicleType as VehicleType].push(category.name);
      }
    });
  }

  // Get all unique locations (subscription system disabled - all shops included)
  const { data: shopData } = await supabase
    .from('rental_shops')
    .select('location_area')
    .order('location_area');

  const allLocations = Array.from(
    new Set(shopData?.map(shop => shop.location_area).filter(Boolean) || [])
  ) as string[];

  // Debug logs
  console.log('[fetchVehicles] vehicles:', processedVehicles.length);
  console.log('[fetchVehicles] categories:', allCategories);
  console.log('[fetchVehicles] locations:', allLocations);

  return {
    vehicles: processedVehicles,
    availableCategories: allCategories,
    locations: allLocations,
  };
}

export async function fetchBrowseVehicles(filters: BrowseFilters): Promise<BrowseVehiclesResult> {
  const searchParams = new URLSearchParams();
  
  // Add all filters to search params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  const response = await fetch(`/api/vehicles/browse?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
  }
  
  return response.json();
}

export function useBrowseVehicles(filters: BrowseFilters) {
  return useQuery({
    queryKey: ['browse-vehicles', filters],
    queryFn: () => fetchBrowseVehicles(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    // Enable background refetching for better UX
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
}