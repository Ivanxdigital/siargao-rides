import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

interface VehicleSpecifications {
  features: string[];
  [key: string]: any; // Allow any additional properties
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
      shop_id: string;
      is_available: boolean;
      color: string | null;
      year: number | null;
      specifications: VehicleSpecifications;
    } = {
      name: vehicleData.name,
      description: vehicleData.description || '',
      vehicle_type_id: vehicleData.vehicle_type_id,
      category_id: vehicleData.category_id,
      price_per_day: vehicleData.price_per_day,
      shop_id: shopData.id,
      is_available: vehicleData.is_available ?? true,
      color: vehicleData.color || null,
      year: vehicleData.year || null,
      specifications: {
        features: vehicleData.features || []
      }
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
    
    return NextResponse.json({
      success: true,
      message: 'Vehicle added successfully',
      vehicle
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
    
    if (isAvailable === 'true') {
      query = query.eq('is_available', true);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch vehicles', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in get vehicles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}