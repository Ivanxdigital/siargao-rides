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
    const { vehicleId, approve, notes } = await request.json();
    
    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }
    
    // Check if vehicle exists
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, shop_id, is_verified, verification_status')
      .eq('id', vehicleId)
      .single();
    
    if (vehicleError || !vehicleData) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }
    
    // If vehicle is already verified or rejected, return an error
    if (vehicleData.verification_status !== 'pending') {
      return NextResponse.json(
        { error: `Vehicle is already ${vehicleData.verification_status}` },
        { status: 400 }
      );
    }
    
    if (approve) {
      // Approve the vehicle
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          is_verified: true,
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: userId,
          verification_notes: notes || null
        })
        .eq('id', vehicleId);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to approve vehicle', details: updateError.message },
          { status: 500 }
        );
      }
      
      // After vehicle is verified, update referral if applicable
      if (vehicleData && vehicleData.shop_id) {
        // Get the shop's referrer_id and is_verified status
        const { data: shop, error: shopError } = await supabase
          .from('rental_shops')
          .select('referrer_id, is_verified')
          .eq('id', vehicleData.shop_id)
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
            .eq('shop_id', vehicleData.shop_id);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Vehicle has been approved successfully'
      });
    } else {
      // Reject the vehicle - mark as rejected instead of deleting
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
        .eq('id', vehicleId);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reject vehicle', details: updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Vehicle has been rejected'
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