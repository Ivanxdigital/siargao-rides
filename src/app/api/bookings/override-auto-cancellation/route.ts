import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }
    
    // Get the booking to verify shop ownership
    const { data: booking, error: bookingError } = await supabase
      .from('rentals')
      .select('id, shop_id, shop:rental_shops(owner_id)')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the shop owner or an admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      return NextResponse.json(
        { error: 'Error fetching user data' },
        { status: 500 }
      );
    }
    
    const isAdmin = user?.role === 'admin';
    const isShopOwner = booking.shop?.owner_id === session.user.id;
    
    if (!isAdmin && !isShopOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to override this booking' },
        { status: 403 }
      );
    }
    
    // Update the booking to override auto-cancellation
    const { error: updateError } = await supabase
      .from('rentals')
      .update({
        shop_owner_override: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to override auto-cancellation', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Add to booking history
    await supabase
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        event_type: 'override',
        status: 'confirmed',
        notes: 'Auto-cancellation overridden by shop owner',
        created_by: session.user.id,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      success: true,
      message: 'Auto-cancellation overridden successfully'
    });
    
  } catch (error: unknown) {
    console.error('Error overriding auto-cancellation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
