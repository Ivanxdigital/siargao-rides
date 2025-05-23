import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { differenceInCalendarDays } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Parse request body
    const {
      vehicleId,
      vehicleTypeId,
      startDate,
      endDate,
      deliveryOptionId,
      paymentMethodId,
      guestInfo,
      totalPrice
    } = await request.json();

    // Validate input
    if (!vehicleId || !vehicleTypeId || !startDate || !endDate || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If user is not authenticated and no guest info provided
    if (!userId && !guestInfo) {
      return NextResponse.json(
        { error: 'Authentication required or guest information needed' },
        { status: 401 }
      );
    }

    // Parse dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Validate dates
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (parsedStartDate >= parsedEndDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Check if vehicle exists and get shop_id
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, name, price_per_day, shop_id')
      .eq('id', vehicleId)
      .eq('vehicle_type_id', vehicleTypeId)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Check vehicle availability
    const { data: overlappingBookings } = await supabase
      .from('rentals')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('vehicle_type_id', vehicleTypeId)
      .or(`status.eq.pending,status.eq.confirmed`)
      .or(
        `and(rentals.start_date.lte.${parsedEndDate.toISOString()},rentals.end_date.gte.${parsedStartDate.toISOString()})`
      );

    if (overlappingBookings && overlappingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Vehicle is not available for the selected dates' },
        { status: 409 }
      );
    }

    // Calculate rental days and price
    const days = differenceInCalendarDays(parsedEndDate, parsedStartDate);
    const rentalPrice = vehicle.price_per_day * days;

    // Get delivery fee if option selected
    let deliveryFee = 0;
    if (deliveryOptionId) {
      const { data: deliveryOption } = await supabase
        .from('delivery_options')
        .select('fee')
        .eq('id', deliveryOptionId)
        .single();

      deliveryFee = deliveryOption?.fee || 0;
    }

    // Calculate final price
    const calculatedTotalPrice = rentalPrice + deliveryFee;

    // Verify the price
    if (totalPrice && Math.abs(calculatedTotalPrice - totalPrice) > 0.01) {
      return NextResponse.json(
        {
          error: 'Price verification failed',
          expected: calculatedTotalPrice,
          received: totalPrice
        },
        { status: 400 }
      );
    }

    // Create booking record
    const bookingData = {
      vehicle_id: vehicleId,
      vehicle_type_id: vehicleTypeId,
      shop_id: vehicle.shop_id,
      user_id: userId || null,
      start_date: parsedStartDate.toISOString(),
      end_date: parsedEndDate.toISOString(),
      total_price: calculatedTotalPrice,
      status: 'pending',
      payment_method_id: paymentMethodId,
      delivery_option_id: deliveryOptionId || null,
      guest_email: guestInfo?.email || null,
      guest_name: guestInfo?.name || null,
      guest_phone: guestInfo?.phone || null
    };

    const { data: booking, error: bookingError } = await supabase
      .from('rentals')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking', details: bookingError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    console.error('Error in create-booking API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}