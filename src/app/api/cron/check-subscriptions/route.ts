import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // SUBSCRIPTION SYSTEM DISABLED: This endpoint no longer performs expiration checks
    // All shops are now permanently active
    
    return NextResponse.json({
      success: true,
      message: 'Subscription system is disabled - all shops are permanently active',
      expiredCount: 0,
      disabled: true
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method for health check
export async function GET() {
  return NextResponse.json({ status: 'OK' });
} 