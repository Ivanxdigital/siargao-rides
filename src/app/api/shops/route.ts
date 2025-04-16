import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import { sendAdminNotification } from '@/lib/notifications';
import { verificationDocumentsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const shopData = await request.json();

    console.log('API: Creating shop with data:', JSON.stringify(shopData, null, 2));

    // Verify that the user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email') // We only need to verify the user exists
      .eq('id', shopData.owner_id)
      .single();

    if (userError || !userData) {
      console.error('API: User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // We're not checking email_confirmed_at since it doesn't exist in your schema
    // Instead, we'll trust that if the user is in the database, they're valid

    // Validate verification_documents if present
    if (shopData.verification_documents) {
      const validation = verificationDocumentsSchema.safeParse(shopData.verification_documents);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0]?.message || "Invalid verification documents" },
          { status: 400 }
        );
      }
      shopData.verification_documents = validation.data;
    }

    // Insert the shop data
    const { data, error } = await supabaseAdmin
      .from('rental_shops')
      .insert({
        ...shopData,
        is_verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('API: Error creating shop:', error);
      console.error('API: Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('API: Shop created successfully:', data);

    // Send notification to admins about the new shop
    try {
      await sendAdminNotification(data.id);
      console.log('API: Admin notification sent for new shop');
    } catch (notificationError) {
      // Don't fail the request if notification fails
      console.error('API: Error sending admin notification:', notificationError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error creating shop:', error);
    if (error instanceof Error) {
      console.error('API: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}