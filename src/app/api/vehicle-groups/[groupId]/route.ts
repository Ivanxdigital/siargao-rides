import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const groupId = params.groupId;
    
    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Fetch the vehicle group with details
    const { data: group, error: groupError } = await supabase
      .from('vehicle_group_availability')
      .select('*')
      .eq('id', groupId)
      .single();
    
    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Vehicle group not found' },
        { status: 404 }
      );
    }
    
    // Verify the user owns this shop
    const { data: shopData, error: shopError } = await supabase
      .from('rental_shops')
      .select('owner_id')
      .eq('id', group.shop_id)
      .single();
    
    if (shopError || !shopData || shopData.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this vehicle group' },
        { status: 403 }
      );
    }
    
    // Fetch individual vehicles in the group
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_images (
          id,
          image_url,
          is_primary
        )
      `)
      .eq('group_id', groupId)
      .order('group_index');
    
    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError);
    }
    
    // Fetch group settings
    const { data: settings, error: settingsError } = await supabase
      .from('vehicle_group_settings')
      .select('*')
      .eq('group_id', groupId)
      .single();
    
    if (settingsError) {
      console.error('Error fetching group settings:', settingsError);
    }
    
    return NextResponse.json({
      group: {
        ...group,
        settings,
        vehicles: vehicles || []
      }
    });
  } catch (error) {
    console.error('Error in GET /api/vehicle-groups/[groupId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const groupId = params.groupId;
    
    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify ownership through the group
    const { data: group, error: groupError } = await supabase
      .from('vehicle_groups')
      .select('shop_id')
      .eq('id', groupId)
      .single();
    
    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Vehicle group not found' },
        { status: 404 }
      );
    }
    
    const { data: shopData, error: shopError } = await supabase
      .from('rental_shops')
      .select('owner_id')
      .eq('id', group.shop_id)
      .single();
    
    if (shopError || !shopData || shopData.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this vehicle group' },
        { status: 403 }
      );
    }
    
    const updates = await request.json();
    
    // Update group details if provided
    if (updates.group) {
      const { error: updateError } = await supabase
        .from('vehicle_groups')
        .update({
          name: updates.group.name,
          is_active: updates.group.is_active
        })
        .eq('id', groupId);
      
      if (updateError) {
        console.error('Error updating group:', updateError);
        return NextResponse.json(
          { error: 'Failed to update vehicle group' },
          { status: 500 }
        );
      }
    }
    
    // Update group settings if provided
    if (updates.settings) {
      const { error: settingsError } = await supabase
        .from('vehicle_group_settings')
        .update(updates.settings)
        .eq('group_id', groupId);
      
      if (settingsError) {
        console.error('Error updating group settings:', settingsError);
      }
    }
    
    // Update all vehicles if vehicle data is provided
    if (updates.vehicles) {
      // Get group settings to check what should be shared
      const { data: settings } = await supabase
        .from('vehicle_group_settings')
        .select('*')
        .eq('group_id', groupId)
        .single();
      
      const vehicleUpdates: any = {};
      
      if (settings?.share_pricing) {
        if (updates.vehicles.price_per_day !== undefined) {
          vehicleUpdates.price_per_day = updates.vehicles.price_per_day;
        }
        if (updates.vehicles.price_per_week !== undefined) {
          vehicleUpdates.price_per_week = updates.vehicles.price_per_week;
        }
        if (updates.vehicles.price_per_month !== undefined) {
          vehicleUpdates.price_per_month = updates.vehicles.price_per_month;
        }
      }
      
      if (settings?.share_specifications && updates.vehicles.specifications) {
        vehicleUpdates.specifications = updates.vehicles.specifications;
      }
      
      // Always share these fields
      if (updates.vehicles.description !== undefined) {
        vehicleUpdates.description = updates.vehicles.description;
      }
      if (updates.vehicles.is_available !== undefined) {
        vehicleUpdates.is_available = updates.vehicles.is_available;
      }
      
      if (Object.keys(vehicleUpdates).length > 0) {
        const { error: vehiclesError } = await supabase
          .from('vehicles')
          .update(vehicleUpdates)
          .eq('group_id', groupId);
        
        if (vehiclesError) {
          console.error('Error updating vehicles:', vehiclesError);
          return NextResponse.json(
            { error: 'Failed to update vehicles in group' },
            { status: 500 }
          );
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Vehicle group updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/vehicle-groups/[groupId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const groupId = params.groupId;
    
    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify ownership
    const { data: group, error: groupError } = await supabase
      .from('vehicle_groups')
      .select('shop_id')
      .eq('id', groupId)
      .single();
    
    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Vehicle group not found' },
        { status: 404 }
      );
    }
    
    const { data: shopData, error: shopError } = await supabase
      .from('rental_shops')
      .select('owner_id')
      .eq('id', group.shop_id)
      .single();
    
    if (shopError || !shopData || shopData.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this vehicle group' },
        { status: 403 }
      );
    }
    
    // First, ungroup all vehicles (set group fields to null)
    const { error: ungroupError } = await supabase
      .from('vehicles')
      .update({
        group_id: null,
        group_index: null,
        individual_identifier: null,
        is_group_primary: false
      })
      .eq('group_id', groupId);
    
    if (ungroupError) {
      console.error('Error ungrouping vehicles:', ungroupError);
      return NextResponse.json(
        { error: 'Failed to ungroup vehicles' },
        { status: 500 }
      );
    }
    
    // Delete the group (settings will cascade delete)
    const { error: deleteError } = await supabase
      .from('vehicle_groups')
      .delete()
      .eq('id', groupId);
    
    if (deleteError) {
      console.error('Error deleting group:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete vehicle group' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Vehicle group deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/vehicle-groups/[groupId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}