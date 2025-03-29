import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const shopData = await request.json();
    
    console.log('API: Creating shop with data:', JSON.stringify(shopData, null, 2));

    // Verify that the user exists and has a verified email
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('email_confirmed_at')
      .eq('id', shopData.owner_id)
      .single();

    if (userError || !userData) {
      console.error('API: User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userData.email_confirmed_at) {
      console.error('API: User email not verified');
      return NextResponse.json(
        { error: 'Please verify your email address before registering a shop' },
        { status: 403 }
      );
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