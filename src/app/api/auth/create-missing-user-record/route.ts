import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

interface UserRecord {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export async function POST(request: Request) {
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
    console.log('Creating user record for:', user.id, user.email);
    
    // Check if user already exists in our users table to avoid duplicates
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User record already exists', user: existingUser },
        { status: 200 }
      );
    }
    
    // Extract user data from request body or use defaults
    const { firstName, lastName, role } = await request.json();
    
    // Check the table schema from Supabase
    try {
      const { error: schemaError } = await supabaseAdmin.rpc('get_column_info', { 
        target_table: 'users' 
      });
      
      if (schemaError) {
        console.error('Error getting schema info using RPC:', schemaError);
      }
    } catch {
      console.log('RPC method not available, will use basic insert instead');
    }
    
    // Create a minimal user record with only required fields
    // This avoids issues with schema mismatches
    const userRecord: UserRecord = {
      id: user.id,
      email: user.email
    };
    
    // Only add optional fields if provided
    if (firstName) userRecord.first_name = firstName;
    if (lastName) userRecord.last_name = lastName;
    
    // Only add role if present in request
    if (role) {
      // Try to match role column name - could be 'role' or something else
      userRecord.role = role;
    }
    
    console.log('Attempting to insert user record with:', userRecord);
    
    // Create the user record
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userRecord)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user record:', error);
      return NextResponse.json(
        { error: `Failed to create user record: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'User record created successfully',
      user: data
    });
    
  } catch (error) {
    console.error('Unexpected error creating user record:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 