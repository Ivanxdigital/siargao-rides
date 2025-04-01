import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { differenceInCalendarDays } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { bikeId, startDate, endDate, deliveryOptionId } = await request.json();

    // Validate input
    if (!bikeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: bikeId, startDate, endDate' },
        { status: 400 }
      );
    }

    // Parse dates to ensure correct format
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Check if the dates are valid
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if the date range is valid (start date before end date)
    if (parsedStartDate >= parsedEndDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Get bike details with daily rate
    const { data: bike, error: bikeError } = await supabase
      .from('motorcycles')
      .select('id, model, daily_rate, shop_id')
      .eq('id', bikeId)
      .single();

    if (bikeError || !bike) {
      return NextResponse.json(
        { error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Calculate number of rental days
    const days = differenceInCalendarDays(parsedEndDate, parsedStartDate);
    
    if (days <= 0) {
      return NextResponse.json(
        { error: 'Rental period must be at least 1 day' },
        { status: 400 }
      );
    }

    // Calculate rental price
    const rentalPrice = bike.daily_rate * days;

    // Get delivery fee if a delivery option was selected
    let deliveryFee = 0;
    if (deliveryOptionId) {
      const { data: deliveryOption, error: deliveryError } = await supabase
        .from('delivery_options')
        .select('fee')
        .eq('id', deliveryOptionId)
        .single();

      if (deliveryError || !deliveryOption) {
        return NextResponse.json(
          { error: 'Delivery option not found' },
          { status: 404 }
        );
      }

      deliveryFee = deliveryOption.fee || 0;
    }

    // Calculate total price
    const totalPrice = rentalPrice + deliveryFee;

    return NextResponse.json({
      breakdown: {
        dailyRate: bike.daily_rate,
        days: days,
        rentalPrice: rentalPrice,
        deliveryFee: deliveryFee,
      },
      totalPrice: totalPrice,
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 