import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Check if user is logged in and is admin or shop owner
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only allow admins or shop owners
    if (user.user_metadata?.role !== "admin" && user.user_metadata?.role !== "shop_owner") {
      return NextResponse.json(
        { error: "Only admins or shop owners can set up storage" },
        { status: 403 }
      );
    }
    
    // Check if the bikes bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return NextResponse.json(
        { error: "Failed to list buckets" },
        { status: 500 }
      );
    }
    
    const bikesBucket = buckets.find(bucket => bucket.name === "bikes");
    
    // Create the bikes bucket if it doesn't exist
    if (!bikesBucket) {
      const { data: bucketData, error: createError } = await supabase
        .storage
        .createBucket("bikes", {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
        });
      
      if (createError) {
        console.error("Error creating bikes bucket:", createError);
        return NextResponse.json(
          { error: "Failed to create bikes bucket" },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { message: "Storage buckets set up successfully", created: ["bikes"] },
        { status: 200 }
      );
    }
    
    // Update the bikes bucket to be public if it exists but isn't public
    if (!bikesBucket.public) {
      const { data: updateData, error: updateError } = await supabase
        .storage
        .updateBucket("bikes", {
          public: true
        });
      
      if (updateError) {
        console.error("Error updating bikes bucket:", updateError);
        return NextResponse.json(
          { error: "Failed to update bikes bucket" },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { message: "Storage buckets updated successfully", updated: ["bikes"] },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { message: "Storage buckets already set up correctly" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error setting up storage buckets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 