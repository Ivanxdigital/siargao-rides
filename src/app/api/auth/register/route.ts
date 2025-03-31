import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/admin'

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
      }
    } catch (testErr) {
      console.error('Error testing admin client access:', testErr);
    }
    
    // Check if user exists in public.users using a raw SQL query (bypassing RLS)
    const { data: existingUser, error: checkError } = await supabaseAdmin.rpc(
      'check_if_user_exists', 
      { user_email: email }
    );
    
    if (checkError) {
      console.error('Error checking for existing user:', checkError)
      return NextResponse.json({ 
        error: 'Error checking for existing user',
        details: checkError.message
      }, { status: 500 })
    }
    
    if (existingUser && existingUser.length > 0) {
      console.log(`User with email ${email} already exists in public.users table:`, existingUser)
      if (existingUser[0].id !== userId) {
        console.error(`ID mismatch: Auth user ID ${userId} vs existing user ID ${existingUser[0].id}`)
        return NextResponse.json({ 
          error: 'Email already in use',
          details: 'This email is associated with another account'
        }, { status: 409 })
      } else {
        console.log(`User already exists with correct ID, returning success`)
        return NextResponse.json({ success: true })
      }
    }

    // Create user record using a direct insert (bypassing RLS)
    const { error: dbError, data: newUser } = await supabaseAdmin.rpc(
      'create_user_record',
      { 
        user_id: userId,
        user_email: email,
        first_name: firstName || '',
        last_name: lastName || '',
        user_role: role
      }
    );

    if (dbError) {
      console.error('Error creating user record:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      })
      
      // Handle specific error cases
      if (dbError.message?.includes('violates check constraint')) {
        return NextResponse.json({ 
          error: 'Invalid user role',
          details: `Role must be one of: ${validRoles.join(', ')}`
        }, { status: 422 })
      }
      
      if (dbError.code === '23505') { // unique_violation
        return NextResponse.json({ 
          error: 'Duplicate user',
          details: 'A user with this email already exists'
        }, { status: 409 })
      }
      
      if (dbError.code === '23503') { // foreign_key_violation
        // Try to delete the auth user since we couldn't create the database record
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId)
          console.log(`Deleted auth user ${userId} after database error`)
        } catch (deleteError) {
          console.error('Failed to delete auth user after database error:', deleteError)
        }
        
        return NextResponse.json({ 
          error: 'Database error',
          details: 'Failed to create user record'
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: 'Database error',
        details: dbError.message
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