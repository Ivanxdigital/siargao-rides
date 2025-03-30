import { NextResponse } from "next/server";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bikeId: string }> }
) {
  try {
    const { bikeId } = await params;
    
    if (!bikeId) {
      return NextResponse.json(
        { error: "Bike ID is required" },
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
    
    // Get the bike to check ownership
    const { data: bike, error: bikeError } = await supabase
      .from("bikes")
      .select("*, rental_shops(owner_id)")
      .eq("id", bikeId)
      .single();
      
    if (bikeError) {
      return NextResponse.json(
        { error: "Failed to fetch bike" },
        { status: 500 }
      );
    }
    
    if (!bike) {
      return NextResponse.json(
        { error: "Bike not found" },
        { status: 404 }
      );
    }
    
    // Verify that the user owns the shop that owns the bike
    if (bike.rental_shops.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this bike" },
        { status: 403 }
      );
    }
    
    // Delete bike images first (related records)
    const { error: imagesError } = await supabase
      .from("bike_images")
      .delete()
      .eq("bike_id", bikeId);
    
    if (imagesError) {
      console.error("Error deleting bike images:", imagesError);
      return NextResponse.json(
        { error: "Failed to delete bike images" },
        { status: 500 }
      );
    }
    
    // Delete the bike
    const { error: deleteError } = await supabase
      .from("bikes")
      .delete()
      .eq("id", bikeId);
    
    if (deleteError) {
      console.error("Error deleting bike:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete bike" },
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