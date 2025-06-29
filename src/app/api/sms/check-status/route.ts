import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms';

// API endpoint to manually trigger SMS status checks
// Useful for Semaphore since they may not support webhooks
export async function POST(request: NextRequest) {
  try {
    // Check if the request is from an authorized source
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SMS_STATUS_CHECK_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!authHeader || !apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting SMS status check...');
    
    // Run the bulk status check
    await smsService.checkPendingMessageStatuses();
    
    console.log('SMS status check completed');

    return NextResponse.json({ 
      success: true,
      message: 'SMS status check completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in SMS status check:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking the status of the endpoint
export async function GET() {
  return NextResponse.json({ 
    message: 'SMS status check endpoint is ready',
    service: smsService.isAvailable() ? 'available' : 'not configured',
    timestamp: new Date().toISOString()
  });
}