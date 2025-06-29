import { NextRequest, NextResponse } from 'next/server';
import { twilioService } from '@/lib/sms';
import twilio from 'twilio';

// Twilio webhook to update SMS delivery status
export async function POST(request: NextRequest) {
  try {
    // Get the webhook data
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    console.log('Twilio status webhook received:', data);

    // Verify webhook signature if auth token is configured
    if (process.env.TWILIO_AUTH_TOKEN) {
      const twilioSignature = request.headers.get('X-Twilio-Signature') || '';
      const url = request.url;
      
      // Convert FormData to object for validation
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        twilioSignature,
        url,
        params
      );

      if (!isValid) {
        console.error('Invalid Twilio webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        );
      }
    }

    // Extract relevant fields
    const messageSid = data.MessageSid as string;
    const messageStatus = data.MessageStatus as string;
    const errorCode = data.ErrorCode as string | undefined;
    const errorMessage = data.ErrorMessage as string | undefined;

    if (!messageSid || !messageStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Map Twilio status to our status
    let mappedStatus: 'delivered' | 'failed' | 'undelivered' = 'undelivered';
    
    switch (messageStatus.toLowerCase()) {
      case 'delivered':
        mappedStatus = 'delivered';
        break;
      case 'failed':
      case 'undelivered':
        mappedStatus = messageStatus.toLowerCase() as 'failed' | 'undelivered';
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
    await twilioService.updateMessageStatus(
      messageSid,
      mappedStatus,
      errorCode,
      errorMessage
    );

    console.log(`Updated SMS status for ${messageSid} to ${mappedStatus}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing Twilio status webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}