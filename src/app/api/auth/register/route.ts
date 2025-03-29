import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize service role client
const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { userId, email, firstName, lastName, role } = await request.json()

    // Create a record in our users table using service role client
    const { error: dbError } = await serviceRoleClient
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
      await serviceRoleClient.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in register route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 