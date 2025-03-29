import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, userId } = await request.json();
    const supabase = createServerComponentClient({ cookies });
    
    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Log the verification request
    console.log(`Manual verification requested for: ${email} (User ID: ${userId || 'Not provided'})`);
    
    // Record the request in the database
    const { error: insertError } = await supabase
      .from('verification_requests')
      .insert({
        email,
        user_id: userId,
        status: 'pending',
        request_type: 'manual_verification',
        requested_at: new Date().toISOString(),
      });
    
    if (insertError) {
      console.error('Error logging verification request:', insertError);
      return NextResponse.json(
        { error: 'Failed to process verification request' },
        { status: 500 }
      );
    }
    
    // In a production environment, you would:
    // 1. Send an email to the admin team
    // 2. Create a task in admin dashboard
    // 3. Potentially send a confirmation email to user
    
    // For now, we'll just return success
    return NextResponse.json({ 
      success: true,
      message: 'Manual verification request received. Our team will review it shortly.'
    });
    
  } catch (error) {
    console.error('Error in manual verification request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 