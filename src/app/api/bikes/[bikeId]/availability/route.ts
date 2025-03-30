import { NextResponse } from "next/server";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: { bikeId: string } }
) {
  try {
    const bikeId = params.bikeId;
    
    if (!bikeId) {
      return NextResponse.json(
        { error: "Bike ID is required" },
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
    
    // Get the bike to check ownership
    const { data: bike, error: bikeError } = await supabase
      .from("bikes")
      .select("*, shops(owner_id)")
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
    if (bike.shops.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this bike" },
        { status: 403 }
      );
    }
    
    // Update the bike availability
    const { data, error: updateError } = await supabase
      .from("bikes")
      .update({ is_available: requestBody.is_available })
      .eq("id", bikeId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating bike availability:", updateError);
      return NextResponse.json(
        { error: "Failed to update bike availability" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, bike: data });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 