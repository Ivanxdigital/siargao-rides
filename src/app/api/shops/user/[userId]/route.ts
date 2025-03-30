import { NextResponse } from "next/server";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create a Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Get shops owned by the user
    const { data: shops, error } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", userId);

    if (error) {
      console.error("Error fetching shops:", error);
      return NextResponse.json(
        { error: "Failed to fetch shops" },
        { status: 500 }
      );
    }

    return NextResponse.json({ shops });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 