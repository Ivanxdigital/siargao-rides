import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { vehicleId, startDate, endDate } = await request.json();

    // Validate input
    if (!vehicleId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, startDate, endDate' },
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

    // Check if the vehicle exists and is generally available
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, is_available')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Check if the vehicle is generally available for rent
    if (!vehicle.is_available) {
      return NextResponse.json({
        available: false,
        reason: 'Vehicle is not available for rent',
      });
    }

    // Use our database function to check for booking conflicts
    const { data, error } = await supabase
      .rpc('check_vehicle_availability', {
        vehicle_id: vehicleId,
        start_date: parsedStartDate.toISOString().split('T')[0],
        end_date: parsedEndDate.toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error checking availability:', error);
      return NextResponse.json(
        { error: 'Failed to check availability', details: error.message },
        { status: 500 }
      );
    }

    // Get any overlapping bookings for reference if not available
    let overlappingBookings = null;
    
    if (!data) {
      const { data: bookings, error: bookingsError } = await supabase
        .from('rentals')
        .select('id, start_date, end_date, status')
        .eq('vehicle_id', vehicleId)
        .in('status', ['pending', 'confirmed'])
        .or(
          `and(start_date.lte.${parsedEndDate.toISOString()},end_date.gte.${parsedStartDate.toISOString()})`
        );
      
      if (!bookingsError) {
        overlappingBookings = bookings;
      }
    }

    return NextResponse.json({
      available: data === true,
      overlappingBookings: !data ? overlappingBookings : null,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 