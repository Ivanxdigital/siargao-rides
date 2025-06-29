import { NextRequest, NextResponse } from 'next/server';
import { twilioService, TwilioService } from '@/lib/sms';

// Test endpoint for SMS functionality (only for development/testing)
export async function POST(request: NextRequest) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      );
    }

    const { phoneNumber, shopId } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if Twilio is configured
    if (!twilioService.isAvailable()) {
      return NextResponse.json(
        { error: 'Twilio service is not configured. Please add Twilio credentials to environment variables.' },
        { status: 503 }
      );
    }

    // Create a test message
    const testMessage = TwilioService.createBookingMessage({
      customerName: 'Test Customer',
      vehicleName: 'Test Vehicle',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      bookingId: 'test-booking-' + Date.now()
    });

    console.log('Sending test SMS to:', phoneNumber);
    console.log('Test message:', testMessage);

    // Send the test SMS
    const result = await twilioService.sendBookingNotification({
      to: phoneNumber,
      message: testMessage,
      shopId: shopId || 'test-shop-id',
      rentalId: 'test-rental-' + Date.now()
    });

    if (result.success) {
      console.log('Test SMS sent successfully:', result.messageId);
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Test SMS sent successfully'
      });
    } else {
      console.error('Failed to send test SMS:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to send SMS',
          details: result.error,
          errorCode: result.errorCode
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in test SMS endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}