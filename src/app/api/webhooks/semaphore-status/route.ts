import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms';

// Semaphore webhook to update SMS delivery status
// Note: Semaphore may not support webhooks, this is prepared for future compatibility
export async function POST(request: NextRequest) {
  try {
    // Get the webhook data
    const body = await request.json();
    
    console.log('Semaphore status webhook received:', body);

    // Extract relevant fields (adjust based on Semaphore's actual webhook format)
    const messageId = body.message_id || body.id;
    const messageStatus = body.status || body.delivery_status;
    const errorCode = body.error_code;
    const errorMessage = body.error_message;

    if (!messageId || !messageStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Map Semaphore status to our status
    let mappedStatus: 'delivered' | 'failed' | 'undelivered' = 'undelivered';
    
    switch (messageStatus.toLowerCase()) {
      case 'delivered':
      case 'success':
        mappedStatus = 'delivered';
        break;
      case 'failed':
      case 'error':
        mappedStatus = 'failed';
        break;
      case 'undelivered':
      case 'pending':
        mappedStatus = 'undelivered';
        break;
      case 'sent':
      case 'queued':
      case 'sending':
        // These are intermediate statuses, we don't need to update
        return NextResponse.json({ success: true });
      default:
        console.log(`Unknown message status: ${messageStatus}`);
        return NextResponse.json({ success: true });
    }

    // Update the message status in our database
    await smsService.updateMessageStatus(
      messageId,
      mappedStatus,
      errorCode,
      errorMessage
    );

    console.log(`Updated SMS status for ${messageId} to ${mappedStatus}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing Semaphore status webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing webhook configuration
export async function GET() {
  return NextResponse.json({ 
    message: 'Semaphore webhook endpoint is ready',
    timestamp: new Date().toISOString()
  });
}