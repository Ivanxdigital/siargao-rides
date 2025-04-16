import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

  // Get all unique locations from active shops
  const { data: shopData } = await supabase
    .from('rental_shops')
    .select('location_area')
    .eq('is_active', true)
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