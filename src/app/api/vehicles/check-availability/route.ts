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

    console.log("Checking if vehicle exists in vehicles table");
    
    // First check if the vehicle exists in the vehicles table
    let vehicle = null;
    let vehicleError = null;
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, is_available')
        .eq('id', vehicleId)
        .single();
        
      vehicle = data;
      vehicleError = error;
    } catch (e) {
      console.error("Error querying vehicles table:", e);
    }
    
    // If not in vehicles table, check the bikes table (for backward compatibility)
    if (vehicleError || !vehicle) {
      console.log("Vehicle not found in vehicles table, checking bikes table");
      try {
        const { data, error } = await supabase
          .from('bikes')
          .select('id, is_available')
          .eq('id', vehicleId)
          .single();
          
        vehicle = data;
        vehicleError = error;
      } catch (e) {
        console.error("Error querying bikes table:", e);
      }
    }

    // Vehicle not found in either table
    if (vehicleError || !vehicle) {
      console.log("Vehicle not found in either table");
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Check if the vehicle is generally available for rent
    if (!(vehicle as any).is_available) {
      return NextResponse.json({
        available: false,
        reason: 'Vehicle is not available for rent',
      });
    }

    console.log("Vehicle found and is_available=true, checking for rental conflicts");

    // First, check directly for any conflicting rentals
    let directBookings: any[] = [];
    let directError = null;
    
    try {
      // Try with a properly formatted OR query
      const result = await supabase
        .from('rentals')
        .select('id, start_date, end_date, status, vehicle_id, bike_id')
        .or(`vehicle_id.eq.${vehicleId},bike_id.eq.${vehicleId}`)
        .in('status', ['pending', 'confirmed']);
        
      directBookings = result.data || [];
      directError = result.error;
    } catch (err) {
      console.error("Exception querying rentals directly:", err);
      
      // If that fails, try separate queries and combine results
      try {
        console.log("Trying alternate query approach");
        
        // First check vehicle_id
        const vehicleResult = await supabase
          .from('rentals')
          .select('id, start_date, end_date, status, vehicle_id, bike_id')
          .eq('vehicle_id', vehicleId)
          .in('status', ['pending', 'confirmed']);
          
        // Then check bike_id  
        const bikeResult = await supabase
          .from('rentals')
          .select('id, start_date, end_date, status, vehicle_id, bike_id')
          .eq('bike_id', vehicleId)
          .in('status', ['pending', 'confirmed']);
          
        // Combine results (avoiding duplicates by id)  
        const allBookings = [...(vehicleResult.data || [])];
        
        if (bikeResult.data) {
          bikeResult.data.forEach(bikeBooking => {
            if (!allBookings.some(b => b.id === bikeBooking.id)) {
              allBookings.push(bikeBooking);
            }
          });
        }
        
        directBookings = allBookings;
        directError = vehicleResult.error || bikeResult.error;
      } catch (fallbackErr) {
        console.error("Both query approaches failed:", fallbackErr);
      }
    }
      
    if (directError) {
      console.error("Error querying rentals directly:", directError);
    } else {
      console.log("Found bookings for this vehicle:", directBookings);
      
      // Check for overlapping bookings
      const formattedStartDate = parsedStartDate;
      const formattedEndDate = parsedEndDate;
      
      const overlappingBookings = directBookings.filter(booking => {
        try {
          const bookingStart = new Date(booking.start_date);
          const bookingEnd = new Date(booking.end_date);
          
          return (
            (bookingStart <= formattedEndDate && bookingEnd >= formattedStartDate)
          );
        } catch (err) {
          console.error("Error comparing booking dates:", err, booking);
          return false;
        }
      });
      
      if (overlappingBookings.length > 0) {
        console.log("Found overlapping bookings:", overlappingBookings);
        return NextResponse.json({
          available: false,
          overlappingBookings: overlappingBookings,
          directCheck: true
        });
      } else if (directBookings.length > 0) {
        console.log("Found bookings but none overlap with requested dates");
      } else {
        console.log("No bookings found for this vehicle");
        // If we've confirmed there are no bookings, we can safely return available
        return NextResponse.json({
          available: true,
          directCheck: true,
          message: "No bookings found for this vehicle"
        });
      }
    }

    // Use our database function to check for booking conflicts as a backup
    // But only if we didn't already determine availability through direct checks
    console.log("Using RPC function to check availability");
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
      
      // If we get false from RPC but our direct checks suggest availability,
      // trust our direct checks instead
      if (data === false) {
        if (directBookings.length === 0) {
          console.warn("RPC says not available but no direct bookings found - overriding to available");
          return NextResponse.json({
            available: true,
            warning: "RPC function returned false but no direct bookings found",
          });
        }
        
        // Double-check if there are actually conflicting dates
        const formattedStart = parsedStartDate;
        const formattedEnd = parsedEndDate;
        
        const conflicts = directBookings.filter(booking => {
          try {
            const bookingStart = new Date(booking.start_date);
            const bookingEnd = new Date(booking.end_date);
            
            return (
              (bookingStart <= formattedEnd && bookingEnd >= formattedStart)
            );
          } catch (err) {
            return false;
          }
        });
        
        if (conflicts.length === 0) {
          console.warn("RPC says not available but detailed check shows no conflicts - overriding to available");
          return NextResponse.json({
            available: true,
            warning: "RPC function returned false but detailed check shows no conflicts",
          });
        }
      }

      // Trust the RPC result
      return NextResponse.json({
        available: data === true,
        // Include overlapping bookings for additional context if not available
        overlappingBookings: data === false ? directBookings : null,
      });
    } catch (rpcError) {
      console.error("RPC function error:", rpcError);
      
      // Fallback to direct check result if RPC fails
      console.log("RPC function failed, using direct bookings check as fallback");
      
      if (directBookings.length === 0) {
        // If no bookings at all, vehicle is definitely available
        return NextResponse.json({
          available: true,
          fallback: true,
          message: "Using fallback availability check - no bookings found"
        });
      }
      
      // Check for conflicts manually
      const conflicts = directBookings.filter(booking => {
        try {
          const bookingStart = new Date(booking.start_date);
          const bookingEnd = new Date(booking.end_date);
          
          return (
            (bookingStart <= parsedEndDate && bookingEnd >= parsedStartDate)
          );
        } catch (err) {
          return false;
        }
      });
      
      return NextResponse.json({
        available: conflicts.length === 0,
        fallback: true,
        message: "Using fallback availability check due to RPC error",
        conflicts: conflicts.length > 0 ? conflicts : null
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