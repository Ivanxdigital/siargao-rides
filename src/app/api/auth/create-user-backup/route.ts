import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST() {
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
    
    const user = session.user;
    console.log('Backup method - Creating user record for:', user.id, user.email);
    
    // Super simplified approach - just try to create the record with minimal fields
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating user record (backup method):', error);
      return NextResponse.json(
        { error: `Failed to create user record: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'User record created successfully using backup method',
      userId: data.id
    });
    
  } catch (error) {
    console.error('Unexpected error creating user record (backup):', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 