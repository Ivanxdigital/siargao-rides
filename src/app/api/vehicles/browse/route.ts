import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { VehicleType } from '@/lib/types';

interface BrowseFilters {
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

interface VehicleWithMetadata {
  id: string;
  name: string;
  description?: string;
  vehicle_type: VehicleType;
  category: string;
  price_per_day: number;
  price_per_week?: number;
  price_per_month?: number;
  is_available: boolean;
  specifications?: Record<string, unknown>;
  color?: string;
  year?: number;
  shop_id: string;
  shopName: string;
  shopLogo?: string;
  shopLocation?: string;
  shopIsShowcase?: boolean;
  images?: { id: string; url: string; alt?: string }[];
  is_available_for_dates?: boolean;
  // Vehicle group fields
  group_id?: string;
  is_group?: boolean;
  available_count?: number;
  total_count?: number;
}

interface BrowseResponse {
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

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const url = new URL(request.url);
    
    // Parse query parameters
    const filters: BrowseFilters = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '12'),
      price_min: url.searchParams.get('price_min') ? parseInt(url.searchParams.get('price_min')!) : undefined,
      price_max: url.searchParams.get('price_max') ? parseInt(url.searchParams.get('price_max')!) : undefined,
      vehicle_type: (url.searchParams.get('vehicle_type') as VehicleType) || 'all',
      categories: url.searchParams.getAll('categories'),
      location: url.searchParams.get('location') || undefined,
      start_date: url.searchParams.get('start_date') || undefined,
      end_date: url.searchParams.get('end_date') || undefined,
      only_available: url.searchParams.get('only_available') === 'true',
      min_seats: url.searchParams.get('min_seats') ? parseInt(url.searchParams.get('min_seats')!) : undefined,
      transmission: url.searchParams.get('transmission') || undefined,
      engine_size_min: url.searchParams.get('engine_size_min') ? parseInt(url.searchParams.get('engine_size_min')!) : undefined,
      engine_size_max: url.searchParams.get('engine_size_max') ? parseInt(url.searchParams.get('engine_size_max')!) : undefined,
      sort_by: url.searchParams.get('sort_by') || 'price_asc'
    };
    
    const groupVehicles = url.searchParams.get('group_vehicles') !== 'false'; // Default to true

    // Validate pagination parameters
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 12)); // Max 50 items per page
    const offset = (page - 1) * limit;

    // Build base query for vehicles with shop data
    let vehicleQuery = supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_images(*),
        vehicle_types(id, name),
        rental_shops!inner(id, name, logo_url, location_area, is_active, is_showcase),
        group_id,
        group_index,
        individual_identifier,
        is_group_primary
      `, { count: 'exact' });

    // Apply basic filters
    vehicleQuery = vehicleQuery.eq('is_available', true);
    // SUBSCRIPTION SYSTEM DISABLED: All shops are now permanently active
    vehicleQuery = vehicleQuery.eq('rental_shops.is_active', true);
    vehicleQuery = vehicleQuery.eq('is_verified', true);
    vehicleQuery = vehicleQuery.eq('verification_status', 'approved');

    // Apply price filters
    if (filters.price_min !== undefined) {
      vehicleQuery = vehicleQuery.gte('price_per_day', filters.price_min);
    }
    if (filters.price_max !== undefined) {
      vehicleQuery = vehicleQuery.lte('price_per_day', filters.price_max);
    }

    // Apply vehicle type filter
    if (filters.vehicle_type && filters.vehicle_type !== 'all') {
      // Get vehicle type ID from name
      const { data: vehicleTypeData } = await supabase
        .from('vehicle_types')
        .select('id')
        .eq('name', filters.vehicle_type)
        .single();
      
      if (vehicleTypeData) {
        vehicleQuery = vehicleQuery.eq('vehicle_type_id', vehicleTypeData.id);
      }
    }

    // Apply category filters
    if (filters.categories && filters.categories.length > 0) {
      vehicleQuery = vehicleQuery.in('category', filters.categories);
    }

    // Apply location filter
    if (filters.location) {
      vehicleQuery = vehicleQuery.eq('rental_shops.location_area', filters.location);
    }

    // Apply car-specific filters at database level
    if (filters.vehicle_type === 'car') {
      if (filters.min_seats) {
        vehicleQuery = vehicleQuery.gte('specifications->seats', filters.min_seats);
      }
      if (filters.transmission && filters.transmission !== 'any') {
        vehicleQuery = vehicleQuery.eq('specifications->transmission', filters.transmission);
      }
    }

    // Apply motorcycle-specific filters at database level
    if (filters.vehicle_type === 'motorcycle') {
      if (filters.engine_size_min !== undefined) {
        vehicleQuery = vehicleQuery.gte('specifications->engine', filters.engine_size_min);
      }
      if (filters.engine_size_max !== undefined) {
        vehicleQuery = vehicleQuery.lte('specifications->engine', filters.engine_size_max);
      }
    }

    // Apply sorting
    switch (filters.sort_by) {
      case 'price_desc':
        vehicleQuery = vehicleQuery.order('price_per_day', { ascending: false });
        break;
      case 'price_asc':
      default:
        vehicleQuery = vehicleQuery.order('price_per_day', { ascending: true });
        break;
    }

    // Execute the query WITHOUT pagination - we'll paginate after processing
    const { data: vehicleData, error: vehicleError } = await vehicleQuery;

    if (vehicleError) {
      console.error('Error fetching vehicles:', vehicleError);
      return NextResponse.json(
        { error: 'Failed to fetch vehicles', details: vehicleError.message },
        { status: 500 }
      );
    }

    let vehicles: VehicleWithMetadata[] = [];
    
    if (vehicleData && vehicleData.length > 0) {
      // Process vehicle data
      vehicles = vehicleData.map(vehicle => ({
        ...vehicle,
        shopId: vehicle.shop_id,
        shopName: vehicle.rental_shops?.name || 'Unknown Shop',
        shopLogo: vehicle.rental_shops?.logo_url,
        shopLocation: vehicle.rental_shops?.location_area,
        shopIsShowcase: vehicle.rental_shops?.is_showcase || false,
        vehicle_type: (vehicle.vehicle_types?.name as VehicleType) || vehicle.vehicle_type || 'motorcycle',
        images: vehicle.vehicle_images || [],
        is_available_for_dates: true, // Will be updated if date filtering is applied
        group_id: vehicle.group_id,
        is_group: false, // Will be updated during grouping
        available_count: 1,
        total_count: 1
      })) as VehicleWithMetadata[];


      // Apply date availability filtering if dates are provided
      if (filters.start_date && filters.end_date && filters.only_available) {
        const startDate = new Date(filters.start_date);
        const endDate = new Date(filters.end_date);

        // Validate dates
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate < endDate) {
          const formattedStartDate = startDate.toISOString().split('T')[0];
          const formattedEndDate = endDate.toISOString().split('T')[0];

          // Check availability for each vehicle
          const availabilityPromises = vehicles.map(async (vehicle) => {
            try {
              const { data, error } = await supabase
                .rpc('check_vehicle_availability', {
                  vehicle_id: vehicle.id,
                  start_date: formattedStartDate,
                  end_date: formattedEndDate
                });

              if (error) {
                console.error(`Error checking availability for vehicle ${vehicle.id}:`, error);
                return { vehicleId: vehicle.id, available: false };
              }

              return { vehicleId: vehicle.id, available: data === true };
            } catch (error) {
              console.error(`Exception checking availability for vehicle ${vehicle.id}:`, error);
              return { vehicleId: vehicle.id, available: false };
            }
          });

          const availabilityResults = await Promise.all(availabilityPromises);
          const availableVehicleIds = new Set(
            availabilityResults
              .filter(result => result.available)
              .map(result => result.vehicleId)
          );

          // Update vehicles with availability info and filter if only_available is true
          vehicles = vehicles
            .map(vehicle => ({
              ...vehicle,
              is_available_for_dates: availableVehicleIds.has(vehicle.id)
            }))
            .filter(vehicle => vehicle.is_available_for_dates);
        }
      }
      
      // Group vehicles if grouping is enabled
      if (groupVehicles) {
        const groupedVehiclesMap = new Map<string, VehicleWithMetadata[]>();
        const ungroupedVehicles: VehicleWithMetadata[] = [];
        
        // Separate grouped and ungrouped vehicles
        vehicles.forEach(vehicle => {
          if (vehicle.group_id) {
            if (!groupedVehiclesMap.has(vehicle.group_id)) {
              groupedVehiclesMap.set(vehicle.group_id, []);
            }
            groupedVehiclesMap.get(vehicle.group_id)!.push(vehicle);
          } else {
            ungroupedVehicles.push(vehicle);
          }
        });
        
        // Process grouped vehicles
        const processedGroups: VehicleWithMetadata[] = [];
        groupedVehiclesMap.forEach((groupVehicles) => {
          // Find the primary vehicle or use the first one
          const primaryVehicle = groupVehicles.find(v => v.is_group_primary) || groupVehicles[0];
          const availableInGroup = groupVehicles.filter(v => v.is_available_for_dates).length;
          
          // Create a single representative vehicle for the group
          processedGroups.push({
            ...primaryVehicle,
            is_group: true,
            available_count: availableInGroup,
            total_count: groupVehicles.length,
            // Use the lowest price in the group for sorting
            price_per_day: Math.min(...groupVehicles.map(v => v.price_per_day))
          });
        });
        
        // Combine grouped and ungrouped vehicles
        vehicles = [...processedGroups, ...ungroupedVehicles];
      }
    }

    // Now apply pagination to the processed vehicles
    const totalProcessedVehicles = vehicles.length;
    const totalPages = Math.ceil(totalProcessedVehicles / limit);
    const startIndex = offset;
    const endIndex = startIndex + limit;
    
    // Slice the processed vehicles for the current page
    const paginatedVehicles = vehicles.slice(startIndex, endIndex);

    // Get categories and locations (cached/separate queries)
    const [categoriesResult, locationsResult] = await Promise.all([
      // Get categories
      supabase
        .from('categories')
        .select('*'),
      
      // Get locations (subscription system disabled - all shops included)
      supabase
        .from('rental_shops')
        .select('location_area')
        .order('location_area')
    ]);

    // Process categories
    const allCategories: Record<VehicleType, string[]> = {
      motorcycle: [],
      car: [],
      tuktuk: [],
      van: []
    };

    if (categoriesResult.data) {
      categoriesResult.data.forEach((category: { vehicle_type_id: string; name: string }) => {
        const vehicleType = category.vehicle_type_id === '1' ? 'motorcycle' :
                          category.vehicle_type_id === '2' ? 'car' :
                          category.vehicle_type_id === '3' ? 'tuktuk' :
                          category.vehicle_type_id === '4' ? 'van' : null;
        if (vehicleType && !allCategories[vehicleType as VehicleType].includes(category.name)) {
          allCategories[vehicleType as VehicleType].push(category.name);
        }
      });
    }

    // Process locations
    const allLocations = Array.from(
      new Set(locationsResult.data?.map(shop => shop.location_area).filter(Boolean) || [])
    ) as string[];

    // Calculate pagination metadata based on processed vehicles
    const pagination = {
      page,
      limit,
      total: totalProcessedVehicles,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    const response: BrowseResponse = {
      vehicles: paginatedVehicles,
      pagination,
      availableCategories: allCategories,
      locations: allLocations
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in browse vehicles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}