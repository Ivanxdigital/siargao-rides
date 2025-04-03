import { NextResponse } from "next/server";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";

interface VehicleSpecifications {
  features: string[];
  engine_size?: string;
  seats?: number;
  transmission?: string;
  [key: string]: any; // Allow any additional properties
}

export async function PUT(
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
    
    // Parse the request body
    const vehicleData = await request.json();
    
    // Fetch the vehicle to ensure it exists and the user owns it
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
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
    
    // Prepare the vehicle update data
    const vehicleToUpdate: {
      name: string;
      description: string;
      vehicle_type_id: string;
      category_id: string;
      price_per_day: number;
      is_available: boolean;
      color: string | null;
      year: number | null;
      specifications: VehicleSpecifications;
    } = {
      name: vehicleData.name,
      description: vehicleData.description || '',
      vehicle_type_id: vehicleData.vehicle_type_id,
      category_id: vehicleData.category_id,
      price_per_day: vehicleData.price_per_day,
      is_available: vehicleData.is_available,
      color: vehicleData.color || null,
      year: vehicleData.year || null,
      specifications: {
        features: vehicleData.features || []
      }
    };
    
    // Add vehicle-specific data to specifications
    if (vehicleData.engine_size) {
      vehicleToUpdate.specifications.engine_size = vehicleData.engine_size;
    }
    
    if (vehicleData.seats) {
      vehicleToUpdate.specifications.seats = vehicleData.seats;
    }
    
    if (vehicleData.transmission) {
      vehicleToUpdate.specifications.transmission = vehicleData.transmission;
    }
    
    // Update the vehicle in the database
    const { error: updateError } = await supabase
      .from("vehicles")
      .update(vehicleToUpdate)
      .eq("id", vehicleId);
    
    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update vehicle", details: updateError.message },
        { status: 500 }
      );
    }
    
    // Handle image updates if provided
    if (vehicleData.images && vehicleData.images.length > 0) {
      // First, get the existing vehicle images
      const { data: existingImages } = await supabase
        .from("vehicle_images")
        .select("id")
        .eq("vehicle_id", vehicleId);
      
      const existingImageIds = existingImages?.map(img => img.id) || [];
      const updatedImageIds = vehicleData.images
        .filter(img => img.id)
        .map(img => img.id);
      
      // Identify images to delete (existing but not in the updated list)
      const imagesToDelete = existingImageIds.filter(id => !updatedImageIds.includes(id));
      
      // Delete removed images
      if (imagesToDelete.length > 0) {
        await supabase
          .from("vehicle_images")
          .delete()
          .in("id", imagesToDelete);
      }
      
      // Process each image from the request
      for (const image of vehicleData.images) {
        if (image.id) {
          // Update existing image
          await supabase
            .from("vehicle_images")
            .update({
              image_url: image.image_url || image.url,
              is_primary: image.is_primary
            })
            .eq("id", image.id);
        } else {
          // Insert new image
          await supabase
            .from("vehicle_images")
            .insert({
              vehicle_id: vehicleId,
              image_url: image.image_url || image.url,
              is_primary: image.is_primary
            });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Vehicle updated successfully"
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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