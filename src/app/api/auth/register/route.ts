import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const { userId, email, firstName, lastName, role } = await request.json()

    console.log(`Creating user record for ${email} with role ${role}, userId: ${userId}`)
    
    // Check if user already exists in our public.users table
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()
      
    if (checkError) {
      console.error('Error checking for existing user:', checkError)
    }
    
    if (existingUser) {
      console.log(`User with email ${email} already exists in public.users table:`, existingUser)
      // If user exists but with different ID, this is a problem
      if (existingUser.id !== userId) {
        console.error(`ID mismatch: Auth user ID ${userId} vs existing user ID ${existingUser.id}`)
        return NextResponse.json({ 
          error: 'Email already in use with different credentials',
          details: 'This email is associated with another account'
        }, { status: 409 })
      } else {
        // User already exists with the same ID, this might be a retry - return success
        console.log(`User already exists with correct ID, returning success`)
        return NextResponse.json({ success: true })
      }
    }

    // Create a record in our users table using admin client
    const { error: dbError, data } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: role,
      })
      .select()

    if (dbError) {
      console.error('Error creating user record:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      })
      
      // Check for role constraint violation
      if (dbError.message?.includes('violates check constraint')) {
        console.error(`Role constraint violation: ${role} is not a valid role`)
        return NextResponse.json({ 
          error: 'Invalid user role',
          details: 'The specified role is not allowed. Must be one of: tourist, shop_owner, admin'
        }, { status: 422 })
      }
      
      // If we fail to create the user record, we should delete the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId)
        console.log(`Deleted auth user with ID ${userId} after database error`)
      } catch (deleteError) {
        console.error('Failed to delete auth user after database error:', deleteError)
      }
      
      return NextResponse.json({ 
        error: 'Database error saving new user',
        details: dbError.message
      }, { status: 500 })
    }

    console.log('User record created successfully:', data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in register route:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 