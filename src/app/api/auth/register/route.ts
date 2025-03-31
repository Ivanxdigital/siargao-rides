import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const { userId, email, firstName, lastName, role } = await request.json()

    console.log(`Creating user record for ${email} with role ${role}`)

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
      // If we fail to create the user record, we should delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
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