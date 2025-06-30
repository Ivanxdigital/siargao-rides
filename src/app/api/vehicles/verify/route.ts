import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function PATCH(request: NextRequest) {
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
    
    // Check if user is an admin (only admins can verify vehicles)
    // Use the user metadata for role check to be consistent with frontend
    const userRole = session.user.user_metadata?.role;
    
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can verify vehicles' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { vehicleId, vehicleIds, approve, notes } = await request.json();
    
    // Support both single vehicle and batch operations
    const targetVehicleIds = vehicleIds || (vehicleId ? [vehicleId] : []);
    
    if (!targetVehicleIds.length) {
      return NextResponse.json(
        { error: 'Vehicle ID(s) required' },
        { status: 400 }
      );
    }
    
    // Check if vehicles exist and are pending
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, shop_id, is_verified, verification_status')
      .in('id', targetVehicleIds);
    
    if (vehiclesError) {
      return NextResponse.json(
        { error: 'Error checking vehicles', details: vehiclesError.message },
        { status: 500 }
      );
    }
    
    if (!vehiclesData || vehiclesData.length === 0) {
      return NextResponse.json(
        { error: 'No vehicles found' },
        { status: 404 }
      );
    }
    
    // Check if all vehicles are pending
    const nonPendingVehicles = vehiclesData.filter(v => v.verification_status !== 'pending');
    if (nonPendingVehicles.length > 0) {
      return NextResponse.json(
        { 
          error: `Some vehicles are not pending verification`,
          details: nonPendingVehicles.map(v => `${v.id} is ${v.verification_status}`)
        },
        { status: 400 }
      );
    }
    
    if (approve) {
      // Approve vehicles in batch
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          is_verified: true,
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: userId,
          verification_notes: notes || null
        })
        .in('id', targetVehicleIds);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to approve vehicles', details: updateError.message },
          { status: 500 }
        );
      }
      
      // Update referrals for all affected shops
      const uniqueShopIds = [...new Set(vehiclesData.map(v => v.shop_id))];
      for (const shopId of uniqueShopIds) {
        // Get the shop's referrer_id and is_verified status
        const { data: shop, error: shopError } = await supabase
          .from('rental_shops')
          .select('referrer_id, is_verified')
          .eq('id', shopId)
          .single();
        
        if (shop && shop.referrer_id) {
          await supabase
            .from('referrals')
            .update({
              vehicle_added: true,
              status: shop.is_verified ? 'completed' : 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('referrer_id', shop.referrer_id)
            .eq('shop_id', shopId);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `${targetVehicleIds.length} vehicle(s) have been approved successfully`,
        processed: targetVehicleIds.length
      });
    } else {
      // Reject vehicles in batch - mark as rejected instead of deleting
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          is_verified: false,
          verification_status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: userId,
          verification_notes: notes || null,
          is_available: false // Also mark as unavailable
        })
        .in('id', targetVehicleIds);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reject vehicles', details: updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `${targetVehicleIds.length} vehicle(s) have been rejected`,
        processed: targetVehicleIds.length
      });
    }
    
  } catch (error) {
    console.error('Error in verify vehicle API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 