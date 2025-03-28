import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// We need to initialize Supabase with the service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

console.log('API routes environment check:');
console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables for Supabase admin client');
}

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Parse the request body
    const shopData = await request.json();
    
    console.log('Creating shop with data:', JSON.stringify(shopData, null, 2));
    
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
      console.error('Error creating shop:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('Shop created successfully:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 