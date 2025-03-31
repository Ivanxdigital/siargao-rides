"use client";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is a shop owner
    if (user.user_metadata?.role !== "shop_owner") {
      return NextResponse.json(
        { error: "Only shop owners can add bikes" },
        { status: 403 }
      );
    }
    
    // Get the shop ID for this user
    const { data: shopData, error: shopError } = await supabase
      .from("rental_shops")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    
    if (shopError || !shopData) {
      return NextResponse.json(
        { error: "No shop found for this user" },
        { status: 404 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.price_per_day) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Add the bike
    const bikeData = {
      name: body.name,
      description: body.description || "",
      category: body.category,
      price_per_day: body.price_per_day,
      price_per_week: body.price_per_week || null,
      price_per_month: body.price_per_month || null,
      is_available: body.is_available !== undefined ? body.is_available : true,
      specifications: body.specifications || {},
      shop_id: shopData.id
    };
    
    const { data: bike, error: bikeError } = await supabase
      .from("bikes")
      .insert(bikeData)
      .select()
      .single();
    
    if (bikeError) {
      console.error("Error adding bike:", bikeError);
      return NextResponse.json(
        { error: "Failed to add bike" },
        { status: 500 }
      );
    }
    
    // Add bike images if any
    if (body.images && body.images.length > 0) {
      const imageInserts = body.images.map((img: any, index: number) => ({
        bike_id: bike.id,
        image_url: img.url,
        is_primary: index === 0 || img.is_primary
      }));
      
      const { error: imageError } = await supabase
        .from("bike_images")
        .insert(imageInserts);
      
      if (imageError) {
        console.error("Error adding bike images:", imageError);
        // We don't return error here since the bike was created successfully
      }
    }
    
    return NextResponse.json(
      { message: "Bike added successfully", bike },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/bikes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 