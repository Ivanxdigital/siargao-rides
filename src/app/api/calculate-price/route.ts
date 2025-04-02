import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { differenceInCalendarDays } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { vehicleId, vehicleTypeId, startDate, endDate, deliveryOptionId } = await request.json();

    // Validate input
    if (!vehicleId || !vehicleTypeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, vehicleTypeId, startDate, endDate' },
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

    // Get vehicle details with price per day
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

    // Calculate number of rental days
    const days = differenceInCalendarDays(parsedEndDate, parsedStartDate);
    
    if (days <= 0) {
      return NextResponse.json(
        { error: 'Rental period must be at least 1 day' },
        { status: 400 }
      );
    }

    // Calculate rental price
    const rentalPrice = vehicle.price_per_day * days;

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
        dailyRate: vehicle.price_per_day,
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