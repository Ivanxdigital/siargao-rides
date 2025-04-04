import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { vehicleIds, startDate, endDate } = await request.json();

    // Validate input
    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0 || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: vehicleIds (array), startDate, endDate' },
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

    // Format dates for the query
    const formattedStartDate = parsedStartDate.toISOString().split('T')[0];
    const formattedEndDate = parsedEndDate.toISOString().split('T')[0];

    // First, get all vehicles that are generally available
    const { data: availableVehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, name')
      .eq('is_available', true)
      .in('id', vehicleIds);

    if (vehicleError) {
      console.error('Error fetching vehicles:', vehicleError);
      return NextResponse.json(
        { error: 'Failed to fetch vehicles' },
        { status: 500 }
      );
    }

    // If no vehicles are generally available, return empty result
    if (!availableVehicles || availableVehicles.length === 0) {
      return NextResponse.json({
        availabilityMap: {},
        availableVehicleIds: []
      });
    }

    // Create a map of available vehicle IDs
    const availableVehicleMap = availableVehicles.reduce((map, vehicle) => {
      map[vehicle.id] = { name: vehicle.name, available: false }; // Set to false initially
      return map;
    }, {});

    // Now check booking availability for each vehicle using our function
    const availabilityPromises = availableVehicles.map(async (vehicle) => {
      const { data, error } = await supabase
        .rpc('check_vehicle_availability', {
          vehicle_id: vehicle.id,
          start_date: formattedStartDate,
          end_date: formattedEndDate
        });

      if (error) {
        console.error(`Error checking availability for vehicle ${vehicle.id}:`, error);
        return { vehicleId: vehicle.id, available: false };
      }

      return { vehicleId: vehicle.id, available: data === true };
    });

    // Wait for all availability checks to complete
    const availabilityResults = await Promise.all(availabilityPromises);

    // Update the availability map with results
    availabilityResults.forEach(result => {
      if (availableVehicleMap[result.vehicleId]) {
        availableVehicleMap[result.vehicleId].available = result.available;
      }
    });

    // Create a list of vehicle IDs that are available for the requested dates
    const availableVehicleIds = availabilityResults
      .filter(result => result.available)
      .map(result => result.vehicleId);

    return NextResponse.json({
      availabilityMap: availableVehicleMap,
      availableVehicleIds
    });
  } catch (error) {
    console.error('Error checking batch availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 