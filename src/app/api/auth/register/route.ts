import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const { userId, email, firstName, lastName, role } = await request.json()

    // Create a record in our users table using admin client
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: role,
      })

    if (dbError) {
      console.error('Error creating user record:', dbError)
      // If we fail to create the user record, we should delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in register route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 