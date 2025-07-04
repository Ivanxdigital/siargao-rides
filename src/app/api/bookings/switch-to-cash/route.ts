import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get booking ID from query params
    const url = new URL(request.url);
    const bookingId = url.searchParams.get('id');
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the booking belongs to the current user
    const { data: booking, error: bookingError } = await supabase
      .from('rentals')
      .select('id, user_id, shop_id')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    if (booking.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to this booking' },
        { status: 403 }
      );
    }
    
    // Get the cash payment method ID
    const { data: cashPaymentMethod, error: paymentMethodError } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('name', 'Cash on Pickup')
      .single();
    
    if (paymentMethodError || !cashPaymentMethod) {
      // Fallback to a known ID if query fails
      const cashPaymentId = '0bea770f-c0c2-4510-a22f-e42fc122eb9c';
      
      // Update the booking to use cash payment
      await supabase
        .from('rentals')
        .update({
          payment_method_id: cashPaymentId,
          payment_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
    } else {
      // Update the booking to use cash payment
      await supabase
        .from('rentals')
        .update({
          payment_method_id: cashPaymentMethod.id,
          payment_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
    }
    
    // Redirect to the booking confirmation page
    return NextResponse.redirect(new URL(`/booking/confirmation/${bookingId}`, request.url));
  } catch (error: unknown) {
    console.error('Error switching to cash payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
