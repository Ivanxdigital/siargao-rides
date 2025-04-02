import { NextResponse } from "next/server";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params;
    
    if (!vehicleId) {
      return NextResponse.json(
        { error: "Vehicle ID is required" },
        { status: 400 }
      );
    }
    
    // Parse the request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    // Validate the request body
    if (typeof requestBody.is_available !== 'boolean') {
      return NextResponse.json(
        { error: "is_available field is required and must be a boolean" },
        { status: 400 }
      );
    }

    // Create a Supabase client
    const supabase = createServerComponentClient({ cookies });
    
    // Check if the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Try to fetch from vehicles table first
    let vehicle;
    let vehicleError;
    
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, rental_shops(owner_id)")
        .eq("id", vehicleId)
        .single();
        
      vehicle = data;
      vehicleError = error;
    } catch (error) {
      // If we reach this catch block, continue to try the bikes table
      console.log("Error fetching from vehicles table, trying bikes table:", error);
    }
    
    // If vehicle not found in vehicles table, try bikes table (for backward compatibility)
    if (!vehicle) {
      const { data, error } = await supabase
        .from("bikes")
        .select("*, rental_shops(owner_id)")
        .eq("id", vehicleId)
        .single();
        
      vehicle = data;
      vehicleError = error;
    }
    
    if (vehicleError) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle" },
        { status: 500 }
      );
    }
    
    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }
    
    // Verify that the user owns the shop that owns the vehicle
    if (vehicle.rental_shops.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this vehicle" },
        { status: 403 }
      );
    }
    
    // Determine which table to update
    const tableName = vehicle.vehicle_type_id ? "vehicles" : "bikes";
    
    // Update the vehicle availability
    const { data, error: updateError } = await supabase
      .from(tableName)
      .update({ is_available: requestBody.is_available })
      .eq("id", vehicleId)
      .select()
      .single();
    
    if (updateError) {
      console.error(`Error updating ${tableName} availability:`, updateError);
      return NextResponse.json(
        { error: `Failed to update vehicle availability in ${tableName}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, vehicle: data });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 