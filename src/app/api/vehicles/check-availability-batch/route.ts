import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

type RentalVehicle = {
  id: string;
  name: string;
};

type AvailabilityResult = {
  vehicleId: string;
  available: boolean;
  error?: string;
};

type AvailabilityMap = {
  [key: string]: {
    name: string;
    available: boolean;
    error?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Parse the request body with better error handling
    let requestData;
    try {
      requestData = await request.json();
    } catch (error: any) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }
    
    const { vehicleIds, startDate, endDate } = requestData;

    // Log the received request data
    console.log('Received availability check request:', { 
      vehicleIdsCount: vehicleIds?.length,
      startDate,
      endDate
    });

    // Validate input with more detailed error messages
    if (!vehicleIds) {
      return NextResponse.json(
        { error: 'Missing required field: vehicleIds' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(vehicleIds)) {
      return NextResponse.json(
        { error: 'vehicleIds must be an array' },
        { status: 400 }
      );
    }
    
    if (vehicleIds.length === 0) {
      return NextResponse.json(
        { error: 'vehicleIds array is empty' },
        { status: 400 }
      );
    }
    
    if (!startDate) {
      return NextResponse.json(
        { error: 'Missing required field: startDate' },
        { status: 400 }
      );
    }
    
    if (!endDate) {
      return NextResponse.json(
        { error: 'Missing required field: endDate' },
        { status: 400 }
      );
    }

    // Parse dates to ensure correct format
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Check if the dates are valid
    if (isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate format' },
        { status: 400 }
      );
    }
    
    if (isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid endDate format' },
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

    console.log(`Checking availability for ${vehicleIds.length} vehicles from ${formattedStartDate} to ${formattedEndDate}`);

    // First, get all vehicles that are generally available
    const { data: availableVehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, name')
      .eq('is_available', true)
      .in('id', vehicleIds);

    if (vehicleError) {
      console.error('Error fetching vehicles:', vehicleError);
      return NextResponse.json(
        { error: `Failed to fetch vehicles: ${vehicleError.message}` },
        { status: 500 }
      );
    }

    // If no vehicles are generally available, return empty result
    if (!availableVehicles || availableVehicles.length === 0) {
      console.log('No generally available vehicles found');
      return NextResponse.json({
        availabilityMap: {},
        availableVehicleIds: []
      });
    }

    console.log(`Found ${availableVehicles.length} generally available vehicles`);

    // Check if the check_vehicle_availability function exists
    try {
      const { data: functionExists, error: functionCheckError } = await supabase.rpc(
        'check_vehicle_availability',
        {
          vehicle_id: availableVehicles[0].id,
          start_date: formattedStartDate,
          end_date: formattedEndDate
        }
      );

      if (functionCheckError) {
        // If the function doesn't exist or there's an error, log it but continue with a fallback
        console.error('Error calling check_vehicle_availability function, will use fallback:', functionCheckError);
        
        // Fallback: check for bookings directly in the rentals table and also check for blocked dates
        const availableVehicleIds: string[] = [];
        
        for (const vehicle of availableVehicles) {
          // Check if there are any overlapping bookings for this vehicle
          const { data: bookings, error: bookingsError } = await supabase
            .from('rentals')
            .select('id')
            .eq('vehicle_id', vehicle.id)
            .in('status', ['pending', 'confirmed'])
            .or(`start_date.lte.${formattedEndDate},end_date.gte.${formattedStartDate}`);
            
          if (bookingsError) {
            console.error(`Error checking bookings for vehicle ${vehicle.id}:`, bookingsError);
            continue;
          }
          
          // Check if there are any blocked dates for this vehicle in the date range
          const { data: blockedDates, error: blockedError } = await supabase
            .from('vehicle_blocked_dates')
            .select('id')
            .eq('vehicle_id', vehicle.id)
            .gte('date', formattedStartDate)
            .lte('date', formattedEndDate);
            
          if (blockedError) {
            console.error(`Error checking blocked dates for vehicle ${vehicle.id}:`, blockedError);
            continue;
          }
          
          // If no overlapping bookings and no blocked dates, the vehicle is available
          if ((!bookings || bookings.length === 0) && (!blockedDates || blockedDates.length === 0)) {
            availableVehicleIds.push(vehicle.id);
          }
        }
        
        console.log(`Fallback check found ${availableVehicleIds.length} available vehicles`);
        
        return NextResponse.json({
          availabilityMap: availableVehicles.reduce((map: AvailabilityMap, vehicle: RentalVehicle) => {
            map[vehicle.id] = { 
              name: vehicle.name, 
              available: availableVehicleIds.includes(vehicle.id)
            };
            return map;
          }, {}),
          availableVehicleIds
        });
      }
    } catch (error) {
      console.error('Exception checking if check_vehicle_availability function exists:', error);
      // Continue with normal flow if this check itself fails
    }

    // Create a map of available vehicle IDs
    const availableVehicleMap = availableVehicles.reduce((map: AvailabilityMap, vehicle: RentalVehicle) => {
      map[vehicle.id] = { name: vehicle.name, available: false }; // Set to false initially
      return map;
    }, {});

    // Now check booking availability for each vehicle using our function
    const availabilityPromises = availableVehicles.map(async (vehicle: RentalVehicle) => {
      try {
        console.log(`Checking availability for vehicle ${vehicle.id}`);
        
        const { data, error } = await supabase
          .rpc('check_vehicle_availability', {
            vehicle_id: vehicle.id,
            start_date: formattedStartDate,
            end_date: formattedEndDate
          });

        if (error) {
          console.error(`Error checking availability for vehicle ${vehicle.id}:`, error);
          return { vehicleId: vehicle.id, available: false, error: error.message };
        }

        console.log(`Vehicle ${vehicle.id} availability result:`, data);
        return { vehicleId: vehicle.id, available: data === true };
      } catch (error: any) {
        console.error(`Exception checking availability for vehicle ${vehicle.id}:`, error);
        return { 
          vehicleId: vehicle.id, 
          available: false, 
          error: error?.message || 'Unknown error checking availability'
        };
      }
    });

    // Wait for all availability checks to complete with error handling
    let availabilityResults;
    try {
      availabilityResults = await Promise.all(availabilityPromises);
    } catch (error: any) {
      console.error('Error waiting for availability results:', error);
      // Set all vehicles to unavailable in case of error
      availabilityResults = availableVehicles.map((vehicle: RentalVehicle) => ({ 
        vehicleId: vehicle.id, 
        available: false,
        error: error?.message || 'Promise.all failed' 
      }));
    }

    // Update the availability map with results
    availabilityResults.forEach((result: AvailabilityResult) => {
      if (availableVehicleMap[result.vehicleId]) {
        availableVehicleMap[result.vehicleId].available = result.available;
        if (result.error) {
          availableVehicleMap[result.vehicleId].error = result.error;
        }
      }
    });

    // Create a list of vehicle IDs that are available for the requested dates
    const availableVehicleIds = availabilityResults
      .filter(result => result.available)
      .map(result => result.vehicleId);

    console.log(`Found ${availableVehicleIds.length} vehicles available for the requested dates`);

    // Return a well-structured response
    return NextResponse.json({
      availabilityMap: availableVehicleMap,
      availableVehicleIds,
      metadata: {
        totalVehicles: availableVehicles.length,
        availableVehicles: availableVehicleIds.length,
        dateRange: {
          start: formattedStartDate,
          end: formattedEndDate
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error checking batch availability:', error);
    return NextResponse.json(
      { 
        error: `Internal server error: ${error?.message || 'Unknown error'}`,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
} 