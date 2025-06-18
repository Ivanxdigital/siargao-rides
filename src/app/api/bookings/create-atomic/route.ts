import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 Atomic booking request started');
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('❌ Unauthorized booking attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      vehicleId,
      shopId,
      startDate,
      endDate,
      totalPrice,
      bookingData
    } = await request.json();

    console.log('📝 Booking request:', {
      vehicleId,
      shopId,
      userId: session.user.id,
      startDate,
      endDate,
      totalPrice
    });

    // Validate required fields
    if (!vehicleId || !shopId || !startDate || !endDate || !totalPrice) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call the atomic booking function
    const { data, error } = await supabase
      .rpc('create_booking_atomically', {
        p_vehicle_id: vehicleId,
        p_user_id: session.user.id,
        p_shop_id: shopId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_total_price: totalPrice,
        p_booking_data: bookingData
      });

    if (error) {
      console.error('Error calling atomic booking function:', error);
      return NextResponse.json(
        { error: 'Failed to create booking', details: error.message },
        { status: 500 }
      );
    }

    const result = data[0]; // RPC returns an array with one result

    if (!result.success) {
      // Handle business logic errors from the function
      const statusCode = result.error_code === 'BOOKING_CONFLICT' ? 409 : 400;
      
      console.log(`❌ Booking failed: ${result.error_code} - ${result.error_message}`);
      
      return NextResponse.json({
        error: result.error_message,
        error_code: result.error_code
      }, { status: statusCode });
    }

    // Success - fetch the complete booking data to return
    const { data: bookingDetails, error: fetchError } = await supabase
      .from('rentals')
      .select(`
        *,
        vehicles(name, category, price_per_day),
        rental_shops(name, email),
        users(email)
      `)
      .eq('id', result.booking_id)
      .single();

    if (fetchError) {
      console.error('Error fetching booking details:', fetchError);
      // Still return success since booking was created
      const duration = Date.now() - startTime;
      console.log(`✅ Booking created (partial): ${result.booking_id} in ${duration}ms`);
      
      return NextResponse.json({
        success: true,
        booking: { id: result.booking_id },
        message: 'Booking created successfully'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Booking created successfully: ${result.booking_id} in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      booking: bookingDetails,
      message: 'Booking created successfully'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 Atomic booking API error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}