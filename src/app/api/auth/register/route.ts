import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/admin'
import { PostgrestError } from '@supabase/supabase-js'

// Custom type for database error handling
interface DbError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

export async function POST(request: Request) {
  try {
    const { userId, email, firstName, lastName, role } = await request.json()

    console.log(`Creating user record for ${email} with role ${role}, userId: ${userId}`)
    
    // Validate required fields
    if (!userId || !email || !role) {
      console.error('Missing required fields:', { userId, email, role })
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'userId, email, and role are required'
      }, { status: 400 })
    }

    // Validate role is one of the allowed values
    const validRoles = ['tourist', 'shop_owner', 'admin']
    if (!validRoles.includes(role)) {
      console.error(`Invalid role provided: ${role}. Must be one of: ${validRoles.join(', ')}`)
      return NextResponse.json({ 
        error: 'Invalid user role',
        details: `The specified role '${role}' is not allowed. Must be one of: ${validRoles.join(', ')}`
      }, { status: 422 })
    }

    // For debugging: verify admin client has correct access
    try {
      const { data: testData, error: testError } = await supabaseAdmin.from('users').select('id').limit(1);
      console.log('Admin client access check:', { hasData: !!testData, error: testError?.message });
      
      if (testError) {
        console.error('Supabase Admin client access test failed:', testError);
        // Don't fail here, just log and continue
      }
    } catch (testErr) {
      console.error('Error testing admin client access:', testErr);
      // Don't fail here, just log and continue
    }
    
    // Check if user exists in public.users using a raw SQL query (bypassing RLS)
    // Use a direct query if RPC fails
    let existingUser: any[] = [];
    let checkError: PostgrestError | null = null;
    
    try {
      const result = await supabaseAdmin.rpc('check_if_user_exists', { user_email: email });
      existingUser = result.data || [];
      checkError = result.error;
    } catch (rpcError) {
      console.error('RPC check_if_user_exists failed, falling back to direct query:', rpcError);
      
      // Fallback to direct query
      const { data: directData, error: directError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email);
        
      existingUser = directData || [];
      checkError = directError;
    }
    
    if (checkError) {
      console.error('Error checking for existing user:', checkError);
      // Continue anyway as we'll handle duplicate errors later
    }
    
    if (existingUser && existingUser.length > 0) {
      console.log(`User with email ${email} already exists in public.users table:`, existingUser);
      if (existingUser[0].id !== userId) {
        console.error(`ID mismatch: Auth user ID ${userId} vs existing user ID ${existingUser[0].id}`);
        return NextResponse.json({ 
          error: 'Duplicate user',
          details: 'This email is associated with another account'
        }, { status: 409 })
      } else {
        console.log(`User already exists with correct ID, returning success`);
        return NextResponse.json({ success: true });
      }
    }

    // Try to create user record directly if RPC fails
    let dbError: DbError | null = null;
    let newUser = null;
    
    try {
      // Try RPC first
      const result = await supabaseAdmin.rpc(
        'create_user_record',
        { 
          user_id: userId,
          user_email: email,
          first_name: firstName || '',
          last_name: lastName || '',
          user_role: role
        }
      );
      
      dbError = result.error;
      newUser = result.data;
      
      // If RPC fails, try direct insert
      if (dbError) {
        console.warn('RPC create_user_record failed, attempting direct insert:', dbError);
        
        const directResult = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: email,
            first_name: firstName || '',
            last_name: lastName || '',
            role: role
          })
          .select();
          
        dbError = directResult.error;
        newUser = directResult.data;
      }
    } catch (insertError) {
      console.error('Error in both RPC and direct insert:', insertError);
      dbError = {
        message: insertError instanceof Error ? insertError.message : String(insertError),
        code: 'UNKNOWN_ERROR'
      };
    }

    if (dbError) {
      console.error('Error creating user record:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      });
      
      // Handle specific error cases
      if (dbError.message?.includes('violates check constraint')) {
        return NextResponse.json({ 
          error: 'Invalid user role',
          details: `Role must be one of: ${validRoles.join(', ')}`
        }, { status: 422 })
      }
      
      if (dbError.code === '23505') { // unique_violation
        // Check if this is our user ID
        try {
          const { data: existingRecord } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
            
          if (existingRecord && existingRecord.id === userId) {
            // This user already exists with the same ID, so we can consider this successful
            console.log('User record already exists with matching ID, returning success');
            return NextResponse.json({ success: true });
          }
        } catch (checkErr) {
          console.error('Error checking existing record after unique violation:', checkErr);
        }
        
        return NextResponse.json({ 
          error: 'Duplicate user',
          details: 'A user with this email already exists'
        }, { status: 409 })
      }
      
      if (dbError.code === '23503') { // foreign_key_violation
        // Don't delete the auth user as it might be just a temporary error
        return NextResponse.json({ 
          error: 'Database error',
          details: 'Failed to create user record - foreign key violation'
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: 'Database error',
        details: dbError.message || 'Unknown database error'
      }, { status: 500 })
    }

    console.log('User record created successfully:', newUser)
    return NextResponse.json({ success: true, user: newUser })
    
  } catch (error) {
    console.error('Unexpected error in register route:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 