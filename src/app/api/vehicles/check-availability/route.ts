import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  console.log("Check availability API called");
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { vehicleId, startDate, endDate } = await request.json();

    console.log("Checking availability for:", { vehicleId, startDate, endDate });

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

    // Check if the vehicle exists and is available
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, is_available')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      console.log("Vehicle not found:", vehicleError);
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

    console.log("Vehicle found and available, checking for booking conflicts");

    // Use our enhanced database function to check for booking conflicts
    try {
      // Format dates consistently for the RPC call
      const formattedStartDate = parsedStartDate.toISOString().split('T')[0]; 
      const formattedEndDate = parsedEndDate.toISOString().split('T')[0];
      
      console.log("Calling RPC with formatted dates:", {
        vehicle_id: vehicleId,
        start_date: formattedStartDate,
        end_date: formattedEndDate
      });
      
      const { data, error } = await supabase
        .rpc('check_vehicle_availability', {
          vehicle_id: vehicleId,
          start_date: formattedStartDate,
          end_date: formattedEndDate
        });

      if (error) {
        console.error('Error in RPC function:', error);
        throw error;
      }

      console.log("RPC availability result:", data);
      
      return NextResponse.json({
        available: data === true,
        message: data === true ? 'Vehicle is available' : 'Vehicle is not available for selected dates'
      });

    } catch (rpcError) {
      console.error("RPC function error:", rpcError);
      
      // Fallback to direct availability check
      console.log("RPC function failed, using direct query as fallback");
      
      const { data: conflicts, error: conflictError } = await supabase
        .from('rentals')
        .select('id, start_date, end_date, status')
        .eq('vehicle_id', vehicleId)
        .in('status', ['pending', 'confirmed'])
        .gte('end_date', parsedStartDate.toISOString())
        .lte('start_date', parsedEndDate.toISOString());

      if (conflictError) {
        console.error("Fallback query error:", conflictError);
        return NextResponse.json(
          { error: 'Unable to check availability' },
          { status: 500 }
        );
      }

      const isAvailable = !conflicts || conflicts.length === 0;
      
      return NextResponse.json({
        available: isAvailable,
        fallback: true,
        message: isAvailable 
          ? "Vehicle is available (fallback check)" 
          : "Vehicle is not available for selected dates",
        conflicts: isAvailable ? null : conflicts
      });
    }
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as any).message },
      { status: 500 }
    );
  }
}