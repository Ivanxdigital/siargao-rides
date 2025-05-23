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
    
    // Get the vehicle to check ownership
    const { data: vehicle, error: vehicleError } = await supabase
      .from("bikes")
      .select("*, rental_shops(owner_id)")
      .eq("id", vehicleId)
      .single();
      
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
    
    // Delete vehicle images first (related records)
    const { error: imagesError } = await supabase
      .from("bike_images")
      .delete()
      .eq("bike_id", vehicleId);
    
    if (imagesError) {
      console.error("Error deleting vehicle images:", imagesError);
      return NextResponse.json(
        { error: "Failed to delete vehicle images" },
        { status: 500 }
      );
    }
    
    // Delete the vehicle
    const { error: deleteError } = await supabase
      .from("bikes")
      .delete()
      .eq("id", vehicleId);
    
    if (deleteError) {
      console.error("Error deleting vehicle:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete vehicle" },
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