import { NextResponse } from "next/server";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";

export async function DELETE(
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
    
    // Determine which table to delete from
    const tableName = vehicle.vehicle_type_id ? "vehicles" : "bikes";
    const imagesTableName = vehicle.vehicle_type_id ? "vehicle_images" : "bike_images";
    const imagesForeignKey = vehicle.vehicle_type_id ? "vehicle_id" : "bike_id";
    
    // Delete vehicle images first (related records)
    const { error: imagesError } = await supabase
      .from(imagesTableName)
      .delete()
      .eq(imagesForeignKey, vehicleId);
    
    if (imagesError) {
      console.error(`Error deleting ${imagesTableName}:`, imagesError);
      return NextResponse.json(
        { error: `Failed to delete vehicle images from ${imagesTableName}` },
        { status: 500 }
      );
    }
    
    // Delete the vehicle
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq("id", vehicleId);
    
    if (deleteError) {
      console.error(`Error deleting from ${tableName}:`, deleteError);
      return NextResponse.json(
        { error: `Failed to delete vehicle from ${tableName}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 