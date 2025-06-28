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

    // Handle verification_documents if present
    if (shopData.verification_documents) {
      // Ensure all properties are strings, not null
      if (shopData.verification_documents.government_id === null) {
        shopData.verification_documents.government_id = '';
      }
      if (shopData.verification_documents.business_permit === null) {
        shopData.verification_documents.business_permit = '';
      }

      // For initial onboarding, allow empty documents
      const validation = verificationDocumentsSchema.safeParse(shopData.verification_documents);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0]?.message || "Invalid verification documents" },
          { status: 400 }
        );
      }
      shopData.verification_documents = validation.data;
    }

    // Insert the shop data with default status (pending_verification)
    // The badge system will handle showing different UI based on document presence
    const { data, error } = await supabaseAdmin
      .from('rental_shops')
      .insert({
        ...shopData,
        is_verified: false,
        status: 'pending_verification'
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
      
      // Return more specific error codes based on the error type
      if (error.code === '23505') {
        // Check if it's our unique_owner_id constraint
        if (error.message?.includes('unique_owner_id') || error.constraint === 'unique_owner_id') {
          return NextResponse.json(
            { 
              error: 'You already have a shop registered. Only one shop per account is allowed.',
              code: error.code,
              type: 'duplicate_shop'
            },
            { status: 409 }
          );
        }
        // Other unique constraint violations
        return NextResponse.json(
          { error: 'A record with this information already exists.', code: error.code },
          { status: 409 }
        );
      }
      
      const status = error.code === '23503' ? 400 : // Foreign key constraint
                    error.code === '42501' ? 403 : // Insufficient privileges 
                    500; // General server error
      
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }

    console.log('API: Shop created successfully:', data);

    // Update the user's has_shop field to true
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({ has_shop: true })
      .eq('id', shopData.owner_id);

    if (userUpdateError) {
      console.error('API: Error updating user has_shop status:', userUpdateError);
      // Don't fail the request if user update fails
    } else {
      console.log('API: User has_shop status updated to true');

      // Update the user's metadata in auth
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        shopData.owner_id,
        {
          user_metadata: {
            has_shop: true
          }
        }
      );

      if (authUpdateError) {
        console.error('API: Error updating user metadata:', authUpdateError);
        console.error('API: Auth update error details:', {
          code: authUpdateError.code,
          message: authUpdateError.message,
          status: authUpdateError.status
        });
        // Don't fail the request if metadata update fails, but log it for debugging
      } else {
        console.log('API: User metadata updated with has_shop = true');
      }
    }

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