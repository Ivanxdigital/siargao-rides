import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { CreateVehicleGroupRequest } from '@/lib/types';

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
        { error: 'Only shop owners can create vehicle groups' },
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
    const groupData: CreateVehicleGroupRequest = await request.json();
    
    // Validate required fields
    if (!groupData.name || !groupData.vehicle_type_id || !groupData.category_id || !groupData.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (groupData.quantity < 1 || groupData.quantity > 100) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 100' },
        { status: 400 }
      );
    }
    
    if (!groupData.base_vehicle_data?.price_per_day) {
      return NextResponse.json(
        { error: 'Price per day is required' },
        { status: 400 }
      );
    }
    
    // Call the database function to create group and vehicles
    const { data: result, error: createError } = await supabase
      .rpc('create_vehicle_group_with_vehicles', {
        p_shop_id: shopData.id,
        p_name: groupData.name,
        p_vehicle_type_id: groupData.vehicle_type_id,
        p_category_id: groupData.category_id,
        p_quantity: groupData.quantity,
        p_vehicle_data: groupData.base_vehicle_data,
        p_naming_pattern: groupData.naming_pattern || 'Unit {index}',
        p_individual_names: groupData.individual_names || null
      });

    if (createError) {
      console.error('Error creating vehicle group:', createError);
      return NextResponse.json(
        { error: 'Failed to create vehicle group' },
        { status: 500 }
      );
    }

    const { group_id, vehicle_ids } = result[0];

    // Handle images if provided
    if (groupData.base_vehicle_data.images && groupData.base_vehicle_data.images.length > 0) {
      // Create image records for all vehicles
      const imageInserts = vehicle_ids.flatMap((vehicleId: string) => 
        groupData.base_vehicle_data.images!.map(image => ({
          vehicle_id: vehicleId,
          image_url: image.image_url || image.url,
          is_primary: image.is_primary || false
        }))
      );

      const { error: imageError } = await supabase
        .from('vehicle_images')
        .insert(imageInserts);

      if (imageError) {
        console.error('Error creating vehicle images:', imageError);
      }
    }

    // Fetch the created group with details
    const { data: groupDetails, error: fetchError } = await supabase
      .from('vehicle_group_availability')
      .select('*')
      .eq('id', group_id)
      .single();

    if (fetchError) {
      console.error('Error fetching group details:', fetchError);
    }

    return NextResponse.json({
      success: true,
      group_id,
      vehicle_ids,
      group: groupDetails
    });
  } catch (error) {
    console.error('Error in POST /api/vehicle-groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    
    if (!shopId) {
      return NextResponse.json(
        { error: 'shop_id parameter is required' },
        { status: 400 }
      );
    }
    
    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the user owns this shop
    const { data: shopData, error: shopError } = await supabase
      .from('rental_shops')
      .select('owner_id')
      .eq('id', shopId)
      .single();
    
    if (shopError || !shopData || shopData.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this shop\'s vehicle groups' },
        { status: 403 }
      );
    }
    
    // Fetch vehicle groups with availability info
    const { data: groups, error: groupsError } = await supabase
      .from('vehicle_group_availability')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    
    if (groupsError) {
      console.error('Error fetching vehicle groups:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch vehicle groups' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      groups: groups || []
    });
  } catch (error) {
    console.error('Error in GET /api/vehicle-groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}