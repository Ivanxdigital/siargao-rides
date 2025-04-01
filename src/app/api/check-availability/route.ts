import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { bikeId, startDate, endDate } = await request.json();

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

    // Check if the bike exists
    const { data: bike, error: bikeError } = await supabase
      .from('motorcycles')
      .select('id, available_for_rent')
      .eq('id', bikeId)
      .single();

    if (bikeError || !bike) {
      return NextResponse.json(
        { error: 'Bike not found' },
        { status: 404 }
      );
    }

    // Check if the bike is available for rent
    if (!bike.available_for_rent) {
      return NextResponse.json(
        { error: 'Bike is not available for rent' },
        { status: 409 }
      );
    }

    // Check for overlapping bookings
    // Query rentals table to find any bookings that overlap with the requested dates
    const { data: overlappingBookings, error: bookingError } = await supabase
      .from('rentals')
      .select('id, start_date, end_date, status')
      .eq('motorcycle_id', bikeId)
      .or(`status.eq.pending,status.eq.confirmed`)
      .or(
        `and(start_date.lte.${parsedEndDate.toISOString()},end_date.gte.${parsedStartDate.toISOString()})`
      );

    if (bookingError) {
      return NextResponse.json(
        { error: 'Failed to check availability', details: bookingError.message },
        { status: 500 }
      );
    }

    // If there are overlapping bookings, the bike is not available
    const isAvailable = !overlappingBookings || overlappingBookings.length === 0;

    return NextResponse.json({
      available: isAvailable,
      overlappingBookings: !isAvailable ? overlappingBookings : null,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 