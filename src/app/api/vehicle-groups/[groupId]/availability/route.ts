import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { GroupAvailabilityRequest } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const groupId = params.groupId;
    
    // Parse request body
    const { start_date, end_date }: GroupAvailabilityRequest = await request.json();
    
    // Validate dates
    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'start_date must be before end_date' },
        { status: 400 }
      );
    }
    
    // Check group availability
    const { data: availability, error: availabilityError } = await supabase
      .rpc('check_group_availability', {
        p_group_id: groupId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0]
      });
    
    if (availabilityError) {
      console.error('Error checking group availability:', availabilityError);
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      );
    }
    
    const result = availability[0];
    
    // Get vehicle details for available vehicles
    let vehicleDetails = [];
    if (result.available_vehicles && result.available_vehicles.length > 0) {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, name, group_index, individual_identifier')
        .in('id', result.available_vehicles)
        .order('group_index');
      
      if (vehiclesError) {
        console.error('Error fetching vehicle details:', vehiclesError);
      } else {
        vehicleDetails = vehicles || [];
      }
    }
    
    // Calculate next available dates for unavailable vehicles
    const nextAvailableDates = await getNextAvailableDates(
      supabase,
      groupId,
      result.available_vehicles || [],
      endDate
    );
    
    return NextResponse.json({
      group_id: groupId,
      start_date: start_date,
      end_date: end_date,
      total_vehicles: result.total_count,
      available_count: result.available_count,
      available_vehicles: vehicleDetails.map(v => ({
        id: v.id,
        identifier: v.individual_identifier || `${v.name} #${v.group_index}`,
        next_available_date: nextAvailableDates[v.id]
      }))
    });
  } catch (error) {
    console.error('Error in POST /api/vehicle-groups/[groupId]/availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getNextAvailableDates(
  supabase: any,
  groupId: string,
  availableVehicleIds: string[],
  searchStartDate: Date
): Promise<Record<string, string | undefined>> {
  const nextAvailableDates: Record<string, string | undefined> = {};
  
  // Get all vehicles in the group
  const { data: allVehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('group_id', groupId);
  
  if (!allVehicles) return nextAvailableDates;
  
  // For unavailable vehicles, find their next available date
  const unavailableVehicles = allVehicles
    .filter(v => !availableVehicleIds.includes(v.id))
    .map(v => v.id);
  
  for (const vehicleId of unavailableVehicles) {
    // Get all bookings and blocked dates for this vehicle
    const [rentalsResult, blockedDatesResult] = await Promise.all([
      supabase
        .from('rentals')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicleId)
        .in('status', ['pending', 'confirmed'])
        .gte('end_date', searchStartDate.toISOString())
        .order('end_date'),
      
      supabase
        .from('vehicle_blocked_dates')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicleId)
        .gte('end_date', searchStartDate.toISOString())
        .order('end_date')
    ]);
    
    const allBlockedPeriods = [
      ...(rentalsResult.data || []),
      ...(blockedDatesResult.data || [])
    ].sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
    
    if (allBlockedPeriods.length > 0) {
      const lastBlockedDate = new Date(allBlockedPeriods[allBlockedPeriods.length - 1].end_date);
      lastBlockedDate.setDate(lastBlockedDate.getDate() + 1);
      nextAvailableDates[vehicleId] = lastBlockedDate.toISOString().split('T')[0];
    }
  }
  
  return nextAvailableDates;
}