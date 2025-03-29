import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: Request) {
  try {
    // Get current authenticated user from the session
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in first' },
        { status: 401 }
      );
    }
    
    // Extract userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // If no userId is provided, default to current user
    const userIdToCheck = userId || session.user.id;
    
    console.log('Checking if user record exists for:', userIdToCheck);
    
    // Query the database to check if the user record exists
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userIdToCheck)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking user record:', error);
      return NextResponse.json(
        { error: `Failed to check user record: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Return whether or not the user record exists
    return NextResponse.json({ 
      exists: !!data,
      userId: userIdToCheck
    });
    
  } catch (error) {
    console.error('Unexpected error checking user record:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 