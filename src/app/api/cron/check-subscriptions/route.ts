import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // This is a webhook handler for testing the expiration flow
    // In production, this would be triggered by a cron job
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Call the function to check expired subscriptions
    const { data, error } = await supabase.rpc('check_expired_subscriptions');
    
    if (error) {
      console.error('Error checking subscriptions:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    // Get count of expired shops
    const { data: expiredShops, error: countError } = await supabase
      .from('rental_shops')
      .select('id')
      .eq('subscription_status', 'expired');
      
    if (countError) {
      console.error('Error counting expired shops:', countError);
    }
    
    const expiredCount = expiredShops?.length || 0;
    
    return NextResponse.json({
      success: true,
      message: 'Subscription check completed successfully',
      expiredCount
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