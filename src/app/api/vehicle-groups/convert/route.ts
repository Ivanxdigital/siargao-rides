import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

interface ConvertToGroupRequest {
  vehicle_ids: string[];
  group_name: string;
  naming_pattern?: string;
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
    
    // Parse request body
    const { vehicle_ids, group_name, naming_pattern = 'Unit {index}' }: ConvertToGroupRequest = await request.json();
    
    // Validate input
    if (!vehicle_ids || vehicle_ids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 vehicle IDs required to create a group' },
        { status: 400 }
      );
    }
    
    if (!group_name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }
    
    // Fetch vehicles and verify ownership
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        *,
        rental_shops!inner(owner_id)
      `)
      .in('id', vehicle_ids);
    
    if (vehiclesError || !vehicles || vehicles.length !== vehicle_ids.length) {
      return NextResponse.json(
        { error: 'Failed to fetch all vehicles' },
        { status: 404 }
      );
    }
    
    // Verify all vehicles belong to the same shop and user owns the shop
    const firstVehicle = vehicles[0];
    const shopId = firstVehicle.shop_id;
    
    for (const vehicle of vehicles) {
      if (vehicle.shop_id !== shopId) {
        return NextResponse.json(
          { error: 'All vehicles must belong to the same shop' },
          { status: 400 }
        );
      }
      
      if (vehicle.rental_shops.owner_id !== userId) {
        return NextResponse.json(
          { error: 'You do not own one or more of these vehicles' },
          { status: 403 }
        );
      }
      
      if (vehicle.group_id) {
        return NextResponse.json(
          { error: `Vehicle ${vehicle.name} is already part of a group` },
          { status: 400 }
        );
      }
    }
    
    // Create the vehicle group
    const { data: group, error: groupError } = await supabase
      .from('vehicle_groups')
      .insert({
        shop_id: shopId,
        name: group_name,
        base_vehicle_id: firstVehicle.id,
        vehicle_type_id: firstVehicle.vehicle_type_id,
        category_id: firstVehicle.category_id,
        total_quantity: vehicles.length,
        is_active: true
      })
      .select()
      .single();
    
    if (groupError) {
      console.error('Error creating vehicle group:', groupError);
      return NextResponse.json(
        { error: 'Failed to create vehicle group' },
        { status: 500 }
      );
    }
    
    // Create group settings
    const { error: settingsError } = await supabase
      .from('vehicle_group_settings')
      .insert({
        group_id: group.id,
        naming_pattern: naming_pattern,
        share_images: true,
        share_pricing: true,
        share_specifications: true
      });
    
    if (settingsError) {
      console.error('Error creating group settings:', settingsError);
    }
    
    // Update vehicles to be part of the group
    const updatePromises = vehicles.map((vehicle, index) => 
      supabase
        .from('vehicles')
        .update({
          group_id: group.id,
          group_index: index + 1,
          individual_identifier: naming_pattern
            .replace('{index}', (index + 1).toString())
            .replace('{name}', vehicle.name),
          is_group_primary: index === 0
        })
        .eq('id', vehicle.id)
    );
    
    const updateResults = await Promise.all(updatePromises);
    const updateErrors = updateResults.filter(result => result.error);
    
    if (updateErrors.length > 0) {
      console.error('Errors updating vehicles:', updateErrors);
      // Rollback by deleting the group (will cascade to settings)
      await supabase
        .from('vehicle_groups')
        .delete()
        .eq('id', group.id);
      
      return NextResponse.json(
        { error: 'Failed to update vehicles, rolling back' },
        { status: 500 }
      );
    }
    
    // Fetch the created group with details
    const { data: groupDetails } = await supabase
      .from('vehicle_group_availability')
      .select('*')
      .eq('id', group.id)
      .single();
    
    return NextResponse.json({
      success: true,
      message: `Successfully converted ${vehicles.length} vehicles into a group`,
      group: groupDetails || group,
      vehicle_count: vehicles.length
    });
  } catch (error) {
    console.error('Error in POST /api/vehicle-groups/convert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}