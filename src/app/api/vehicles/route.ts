import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

interface VehicleSpecifications {
  features: string[];
  [key: string]: any; // Allow any additional properties
}

interface VehicleDocument {
  type: 'registration' | 'insurance' | 'other';
  url: string;
  name: string;
  uploaded_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 500 }
      );
    }
    
    // Check if user is a shop owner
    if (userData.role !== 'shop_owner') {
      return NextResponse.json(
        { error: 'Only shop owners can add vehicles' },
        { status: 403 }
      );
    }
    
    // Get shop ID for the user
    const { data: shopData, error: shopError } = await supabase
      .from('rental_shops')
      .select('id')
      .eq('owner_id', userId)
      .single();
    
    if (shopError || !shopData) {
      return NextResponse.json(
        { error: 'No shop found for this user' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const vehicleData = await request.json();
    
    // Validate vehicle data
    if (!vehicleData.name || !vehicleData.vehicle_type_id || !vehicleData.price_per_day) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate required documents
    if (!vehicleData.documents || !Array.isArray(vehicleData.documents) || vehicleData.documents.length < 2) {
      return NextResponse.json(
        { error: 'Vehicle registration and insurance documents are required' },
        { status: 400 }
      );
    }
    
    // Check if registration and insurance documents are present
    const hasRegistration = vehicleData.documents.some((doc: VehicleDocument) => doc.type === 'registration');
    const hasInsurance = vehicleData.documents.some((doc: VehicleDocument) => doc.type === 'insurance');
    
    if (!hasRegistration || !hasInsurance) {
      return NextResponse.json(
        { error: 'Both vehicle registration and insurance documents are required' },
        { status: 400 }
      );
    }
    
    // Check if vehicle type exists
    const { data: vehicleTypeData, error: vehicleTypeError } = await supabase
      .from('vehicle_types')
      .select('id')
      .eq('id', vehicleData.vehicle_type_id)
      .single();
    
    if (vehicleTypeError || !vehicleTypeData) {
      return NextResponse.json(
        { error: 'Invalid vehicle type' },
        { status: 400 }
      );
    }
    
    // Check if category exists
    if (vehicleData.category_id) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', vehicleData.category_id)
        .eq('vehicle_type_id', vehicleData.vehicle_type_id)
        .single();
      
      if (categoryError || !categoryData) {
        return NextResponse.json(
          { error: 'Invalid category for the selected vehicle type' },
          { status: 400 }
        );
      }
    }
    
    // Prepare vehicle object for database
    const vehicleToInsert: {
      name: string;
      description: string;
      vehicle_type_id: number;
      category_id: string;
      price_per_day: number;
      price_per_week: number | null;
      price_per_month: number | null;
      shop_id: string;
      is_available: boolean;
      color: string | null;
      year: number | null;
      specifications: VehicleSpecifications;
      documents: VehicleDocument[];
      is_verified: boolean;
      verification_status: string;
    } = {
      name: vehicleData.name,
      description: vehicleData.description || '',
      vehicle_type_id: vehicleData.vehicle_type_id,
      category_id: vehicleData.category_id,
      price_per_day: vehicleData.price_per_day,
      price_per_week: vehicleData.price_per_week || null,
      price_per_month: vehicleData.price_per_month || null,
      shop_id: shopData.id,
      is_available: vehicleData.is_available ?? true,
      color: vehicleData.color || null,
      year: vehicleData.year || null,
      specifications: {
        features: vehicleData.features || []
      },
      // Add document data and verification status
      documents: vehicleData.documents,
      is_verified: false,
      verification_status: 'pending'
    };
    
    // Add vehicle-specific data
    if (vehicleData.vehicle_type_id === 1) { // Motorcycle
      vehicleToInsert.specifications = {
        ...vehicleToInsert.specifications,
        engine_size: vehicleData.engine_size || null
      };
    } else if (vehicleData.vehicle_type_id === 2) { // Car
      vehicleToInsert.specifications = {
        ...vehicleToInsert.specifications,
        seats: vehicleData.seats || null,
        transmission: vehicleData.transmission || 'automatic'
      };
    } else if (vehicleData.vehicle_type_id === 3) { // Tuktuk
      // No specific fields for tuktuks yet
    }
    
    // Insert vehicle
    const { data: vehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert(vehicleToInsert)
      .select()
      .single();
    
    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to add vehicle', details: insertError.message },
        { status: 500 }
      );
    }
    
    // Handle images if provided
    if (vehicleData.images && vehicleData.images.length > 0) {
      const vehicleImages = vehicleData.images.map((image, index) => ({
        vehicle_id: vehicle.id,
        image_url: image.url || image.image_url,
        is_primary: image.is_primary || index === 0
      }));
      
      const { error: imagesError } = await supabase
        .from('vehicle_images')
        .insert(vehicleImages);
      
      if (imagesError) {
        // Log error but continue as the vehicle was created
        console.error('Error adding vehicle images:', imagesError);
      }
    }
    
    // Check if this is the first vehicle for this shop
    const { data: vehicleCountData, error: countError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('shop_id', shopData.id);
      
    const vehicleCount = vehicleCountData?.length || 0;
      
    if (!countError && vehicleCount === 1) {
      // This is the first vehicle - start subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Add 1 month for free trial
      
      // Update the shop with subscription info
      const { error: updateError } = await supabase
        .from('rental_shops')
        .update({
          subscription_status: 'active',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          is_active: true
        })
        .eq('id', shopData.id);
        
      if (updateError) {
        console.error('Error starting subscription:', updateError);
        // Continue despite this error since the vehicle was created successfully
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Vehicle added successfully and awaiting verification',
      vehicle,
      is_verified: false,
      verification_status: 'pending'
    });
    
  } catch (error) {
    console.error('Error in add vehicle API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const url = new URL(request.url);
    
    // Get query parameters
    const shopId = url.searchParams.get('shop_id');
    const vehicleTypeId = url.searchParams.get('vehicle_type_id');
    const categoryId = url.searchParams.get('category_id');
    const isAvailable = url.searchParams.get('is_available');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    
    // Build query
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_images(*),
        rental_shops(id, name),
        vehicle_types(id, name),
        categories(id, name)
      `);
    
    // Apply filters
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }
    
    if (vehicleTypeId) {
      query = query.eq('vehicle_type_id', vehicleTypeId);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    // Filter by general availability first if requested
    if (isAvailable === 'true') {
      query = query.eq('is_available', true);
    }
    
    // Execute query to get vehicles
    const { data: vehicles, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch vehicles', details: error.message },
        { status: 500 }
      );
    }
    
    // If start date and end date are provided, check date-specific availability
    if (startDate && endDate && vehicles && vehicles.length > 0) {
      // Validate date format
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      
      if (
        isNaN(parsedStartDate.getTime()) || 
        isNaN(parsedEndDate.getTime()) || 
        parsedStartDate >= parsedEndDate
      ) {
        return NextResponse.json(
          { error: 'Invalid date range' },
          { status: 400 }
        );
      }
      
      // Format dates for the database query
      const formattedStartDate = parsedStartDate.toISOString().split('T')[0];
      const formattedEndDate = parsedEndDate.toISOString().split('T')[0];
      
      // Get all vehicle IDs for batch availability check
      const vehicleIds = vehicles.map(vehicle => vehicle.id);
      
      // Check availability for each vehicle using our database function
      const availabilityPromises = vehicleIds.map(async (vehicleId) => {
        const { data, error } = await supabase
          .rpc('check_vehicle_availability', {
            vehicle_id: vehicleId,
            start_date: formattedStartDate,
            end_date: formattedEndDate
          });
          
        if (error) {
          console.error(`Error checking availability for vehicle ${vehicleId}:`, error);
          return { vehicleId, available: false };
        }
        
        return { vehicleId, available: data === true };
      });
      
      // Wait for all availability checks to complete
      const availabilityResults = await Promise.all(availabilityPromises);
      
      // Create map of available vehicle IDs
      const availableVehicleIds = availabilityResults
        .filter(result => result.available)
        .map(result => result.vehicleId);
      
      // Filter vehicles by availability for the specific dates
      const availableVehicles = vehicles.filter(vehicle => 
        availableVehicleIds.includes(vehicle.id)
      );
      
      // Add availability information to each vehicle
      const vehiclesWithAvailability = availableVehicles.map(vehicle => ({
        ...vehicle,
        is_available_for_dates: true
      }));
      
      return NextResponse.json(vehiclesWithAvailability);
    }
    
    return NextResponse.json(vehicles);
    
  } catch (error) {
    console.error('Error in get vehicles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}