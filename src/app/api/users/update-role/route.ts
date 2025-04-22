import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const { role } = requestData

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - No active session' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Update the user's role in the users table
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json(
        { error: `Failed to update user role: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User role updated successfully',
      data
    })
  } catch (error) {
    console.error('Error in update-role API route:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 