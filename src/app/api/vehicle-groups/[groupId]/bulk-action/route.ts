import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { BulkActionRequest } from '@/lib/types';

export async function POST(
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
        { error: 'Unauthorized to perform bulk actions on this vehicle group' },
        { status: 403 }
      );
    }
    
    const bulkAction: BulkActionRequest = await request.json();
    
    // Validate bulk action
    if (!bulkAction.action || !bulkAction.data) {
      return NextResponse.json(
        { error: 'Invalid bulk action request' },
        { status: 400 }
      );
    }
    
    let query = supabase.from('vehicles');
    
    // Apply filter - either specific vehicles or all in group
    if (bulkAction.vehicle_ids && bulkAction.vehicle_ids.length > 0) {
      query = query.in('id', bulkAction.vehicle_ids);
    } else {
      query = query.eq('group_id', groupId);
    }
    
    switch (bulkAction.action) {
      case 'set-availability':
        const { is_available } = bulkAction.data;
        if (typeof is_available !== 'boolean') {
          return NextResponse.json(
            { error: 'is_available must be a boolean' },
            { status: 400 }
          );
        }
        
        const { error: availabilityError } = await query
          .update({ is_available });
        
        if (availabilityError) {
          console.error('Error updating availability:', availabilityError);
          return NextResponse.json(
            { error: 'Failed to update availability' },
            { status: 500 }
          );
        }
        break;
      
      case 'update-pricing':
        const pricingUpdates: any = {};
        
        if (bulkAction.data.price_per_day !== undefined) {
          pricingUpdates.price_per_day = bulkAction.data.price_per_day;
        }
        if (bulkAction.data.price_per_week !== undefined) {
          pricingUpdates.price_per_week = bulkAction.data.price_per_week;
        }
        if (bulkAction.data.price_per_month !== undefined) {
          pricingUpdates.price_per_month = bulkAction.data.price_per_month;
        }
        
        if (Object.keys(pricingUpdates).length === 0) {
          return NextResponse.json(
            { error: 'No pricing updates provided' },
            { status: 400 }
          );
        }
        
        const { error: pricingError } = await query
          .update(pricingUpdates);
        
        if (pricingError) {
          console.error('Error updating pricing:', pricingError);
          return NextResponse.json(
            { error: 'Failed to update pricing' },
            { status: 500 }
          );
        }
        break;
      
      case 'block-dates':
        const { start_date, end_date, reason } = bulkAction.data;
        
        if (!start_date || !end_date) {
          return NextResponse.json(
            { error: 'start_date and end_date are required' },
            { status: 400 }
          );
        }
        
        // Get all vehicles to block
        let vehicleIds: string[];
        if (bulkAction.vehicle_ids && bulkAction.vehicle_ids.length > 0) {
          vehicleIds = bulkAction.vehicle_ids;
        } else {
          const { data: vehicles } = await supabase
            .from('vehicles')
            .select('id')
            .eq('group_id', groupId);
          
          vehicleIds = vehicles?.map(v => v.id) || [];
        }
        
        // Create blocked date entries for each vehicle
        const blockedDateEntries = vehicleIds.map(vehicleId => ({
          vehicle_id: vehicleId,
          start_date,
          end_date,
          reason: reason || 'Blocked by shop owner'
        }));
        
        const { error: blockError } = await supabase
          .from('vehicle_blocked_dates')
          .insert(blockedDateEntries);
        
        if (blockError) {
          console.error('Error blocking dates:', blockError);
          return NextResponse.json(
            { error: 'Failed to block dates' },
            { status: 500 }
          );
        }
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid bulk action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `Bulk action '${bulkAction.action}' completed successfully`
    });
  } catch (error) {
    console.error('Error in POST /api/vehicle-groups/[groupId]/bulk-action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}