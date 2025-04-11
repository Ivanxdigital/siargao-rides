import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // This endpoint should be called by a cron job to process auto-cancellations
    const supabase = createRouteHandlerClient({ cookies });
    
    // Call the database function to process auto-cancellations
    const { data, error } = await supabase.rpc('process_auto_cancellations');
    
    if (error) {
      console.error('Error processing auto-cancellations:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    // Get count of auto-cancelled bookings
    const { data: cancelledBookings, error: countError } = await supabase
      .from('rentals')
      .select('id')
      .eq('auto_cancel_processed', true)
      .eq('cancellation_reason', 'Auto-cancelled due to no-show');
      
    if (countError) {
      console.error('Error counting auto-cancelled bookings:', countError);
    }
    
    const cancelledCount = cancelledBookings?.length || 0;
    
    return NextResponse.json({
      success: true,
      message: 'Auto-cancellation processing completed successfully',
      cancelledCount
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
