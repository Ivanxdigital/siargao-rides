import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// We need to initialize Supabase with the service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('API routes environment check:');
console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables for Supabase admin client');
}

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Parse the request body
    const shopData = await request.json();
    
    console.log('API: Creating shop with data:', JSON.stringify(shopData, null, 2));
    console.log('API: Using Supabase URL:', supabaseUrl);
    console.log('API: Service key exists:', !!supabaseServiceKey);
    
    if (!supabaseServiceKey) {
      console.error('API: Missing Supabase service role key');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
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