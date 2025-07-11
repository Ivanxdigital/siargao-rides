import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { BookingConfirmationEmail } from '@/emails/BookingConfirmationEmail';
import { ShopNotificationEmail } from '@/emails/ShopNotificationEmail';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { twilioService, TwilioService } from '@/lib/sms';

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;
const isDevMode = process.env.NODE_ENV === 'development';
// Fallback email for development/testing purposes
// const fallbackEmail = 'support@siargaorides.ph';

// Log the presence of the API key (without revealing it)
console.log('Resend API key status:', resendApiKey ?
  `Present (starts with ${resendApiKey.substring(0, 3)}...)` :
  'MISSING - emails will fail');
console.log('Environment:', isDevMode ? 'Development' : 'Production');

if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}
const resend = new Resend(resendApiKey);

// Define validation schema that matches the email component interfaces
const bookingEmailSchema = z.object({
  booking: z.object({
    id: z.string(),
    confirmation_code: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    total_price: z.number(),
    status: z.string(),
    payment_status: z.string(),
    payment_method_id: z.string().optional(),
    deposit_required: z.boolean().optional(),
    deposit_amount: z.number().optional(),
    delivery_address: z.string().nullable().optional(),
    contact_info: z.any().optional(),
  }),
  user: z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
    email: z.string(),
  }),
  shop: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone_number: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    owner_name: z.string().nullable().optional(),
  }),
});

// Types that match our email component interfaces
type BookingData = {
  id: string;
  confirmation_code: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  payment_status: string;
  payment_method_id?: string;
  deposit_required?: boolean;
  deposit_amount?: number;
  contact_info?: unknown;
  delivery_address?: string | null;
};

type UserData = {
  id: string;
  name?: string | null;
  email: string;
};

type ShopData = {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  address?: string | null;
  owner_name?: string | null;
};

export async function POST(request: Request) {
  console.log('Received email sending request');
  try {
    // Parse and validate request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const result = bookingEmailSchema.safeParse(body);
    if (!result.success) {
      console.error('Validation error:', JSON.stringify(result.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { booking, user, shop } = result.data;
    console.log('Parsed data - booking:', booking.id, 'user:', user.id, 'shop:', shop.id);

    // Prepare safe data objects that match the email component interfaces
    const safeBooking: BookingData = {
      id: booking.id,
      confirmation_code: booking.confirmation_code,
      start_date: booking.start_date,
      end_date: booking.end_date,
      total_price: booking.total_price,
      status: booking.status,
      payment_status: booking.payment_status,
      payment_method_id: booking.payment_method_id,
      deposit_required: booking.deposit_required,
      deposit_amount: booking.deposit_amount,
      delivery_address: booking.delivery_address,
      contact_info: booking.contact_info,
    };

    const safeUser: UserData = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const safeShop: ShopData = {
      id: shop.id,
      name: shop.name,
      email: shop.email,
      phone_number: shop.phone_number,
      address: shop.address,
      owner_name: shop.owner_name,
    };

    // Before sending emails, verify all required data is present and valid

    // Verify user email
    if (!safeUser.email || !safeUser.email.includes('@')) {
      console.error('Invalid or missing user email:', safeUser.email);
      return NextResponse.json(
        { error: 'Invalid user email address', email: safeUser.email },
        { status: 400 }
      );
    }

    // Verify shop email
    if (!safeShop.email || !safeShop.email.includes('@')) {
      console.error('Invalid or missing shop email:', safeShop.email);
      return NextResponse.json(
        { error: 'Invalid shop email address', email: safeShop.email },
        { status: 400 }
      );
    }

    // Verify booking has necessary data for emails
    if (!safeBooking.confirmation_code || !safeBooking.id) {
      console.error('Missing required booking data:', safeBooking);
      return NextResponse.json(
        { error: 'Missing required booking data for email' },
        { status: 400 }
      );
    }

    // Inside POST function before sending emails
    console.log('Ready to send emails with Resend API key:', resendApiKey ? 'API key is set' : 'API key is missing');

    // Update customer email sending
    let customerEmailResult;
    try {
      // Send to the actual customer email since domain is verified
      const customerEmail = safeUser.email;
      console.log(`Sending customer email to: ${customerEmail}`);

      customerEmailResult = await resend.emails.send({
        from: 'Siargao Rides <support@siargaorides.ph>',
        to: customerEmail,
        subject: `Booking Confirmation #${safeBooking.confirmation_code}`,
        headers: {
          'X-Entity-Ref-ID': uuid(),
        },
        react: BookingConfirmationEmail({
          booking: safeBooking,
          user: safeUser,
          shop: safeShop
        }) as React.ReactElement,
      });
      console.log('Customer email result:', JSON.stringify(customerEmailResult));
    } catch (error) {
      console.error('Error sending customer email:', error);
      // Improve error handling by extracting useful information
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', { name: error.name, message: error.message, stack: error.stack });
      } else {
        console.error('Error details (non-Error object):', JSON.stringify(error, null, 2));
      }
      customerEmailResult = { error: { message: errorMessage } };
    }

    // Update shop email sending
    let shopEmailResult;
    try {
      // Send to the actual shop email since domain is verified
      const shopEmail = safeShop.email;
      console.log(`Sending shop email to: ${shopEmail}`);

      shopEmailResult = await resend.emails.send({
        from: 'Siargao Rides <support@siargaorides.ph>',
        to: shopEmail,
        subject: `New Booking Request #${safeBooking.confirmation_code}`,
        headers: {
          'X-Entity-Ref-ID': uuid(),
        },
        react: ShopNotificationEmail({
          booking: safeBooking,
          user: safeUser,
          shop: safeShop
        }) as React.ReactElement,
      });
      console.log('Shop email result:', JSON.stringify(shopEmailResult));
    } catch (error) {
      console.error('Error sending shop email:', error);
      // Improve error handling by extracting useful information
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', { name: error.name, message: error.message, stack: error.stack });
      } else {
        console.error('Error details (non-Error object):', JSON.stringify(error, null, 2));
      }
      shopEmailResult = { error: { message: errorMessage } };
    }

    // Send SMS notification to shop owner if phone number is available
    let smsResult = { success: false, error: 'No phone number available' };
    if (safeShop.phone_number && twilioService.isAvailable()) {
      console.log(`Attempting to send SMS to shop owner at ${safeShop.phone_number}`);
      
      // Try to get vehicle name from booking object or use confirmation code as fallback
      let vehicleName = 'Vehicle';
      if (body.vehicleName) {
        vehicleName = body.vehicleName;
      } else if (body.vehicle && body.vehicle.name) {
        vehicleName = body.vehicle.name;
      } else {
        vehicleName = `Booking #${safeBooking.confirmation_code}`;
      }
      
      const smsMessage = TwilioService.createBookingMessage({
        customerName: safeUser.name || safeUser.email.split('@')[0],
        vehicleName: vehicleName,
        startDate: safeBooking.start_date,
        endDate: safeBooking.end_date,
        bookingId: safeBooking.id
      });

      smsResult = await twilioService.sendBookingNotification({
        to: safeShop.phone_number,
        message: smsMessage,
        shopId: safeShop.id,
        rentalId: safeBooking.id
      });

      if (smsResult.success) {
        console.log('SMS sent successfully to shop owner');
      } else {
        console.error('Failed to send SMS:', smsResult.error);
      }
    } else {
      console.log('SMS not sent - no phone number or Twilio not configured');
    }

    // Update error handling for partial success
    if (customerEmailResult.error || shopEmailResult.error || !smsResult.success) {
      const errors: string[] = [];
      if (customerEmailResult.error) errors.push(`Customer email: ${customerEmailResult.error.message}`);
      if (shopEmailResult.error) errors.push(`Shop email: ${shopEmailResult.error.message}`);
      if (!smsResult.success && safeShop.phone_number) errors.push(`Shop SMS: ${smsResult.error}`);

      console.error('Notification errors:', errors);

      // Check for common email sending issues
      const isResendIssue = errors.some(err =>
        err.includes('domain not verified') ||
        err.includes('Recipient domain not allowed') ||
        err.includes('You can only send testing emails to your own email address')
      );

      if (isResendIssue) {
        console.log('Resend configuration issue detected');
        return NextResponse.json({
          status: 'email_configuration_issue',
          message: 'Emails failed due to Resend configuration issues.',
          solution: 'Check that your domain is properly verified in Resend dashboard and that DNS records are correctly set up.',
          originalRecipients: {
            customer: safeUser.email,
            shop: safeShop.email
          },
          errors,
          smsStatus: smsResult.success ? 'sent' : 'failed'
        }, { status: 207 });
      } else {
        return NextResponse.json({
          status: 'partial_success',
          message: 'Some notifications failed to send',
          errors,
          smsStatus: smsResult.success ? 'sent' : 'failed'
        }, { status: 207 });
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Booking notifications sent successfully',
      customerEmailId: customerEmailResult.id,
      shopEmailId: shopEmailResult.id,
      smsMessageId: smsResult.messageId || null
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in send-booking-email route:', error);
    // Improve error handling for the main catch block
    let errorMessage = 'Unknown error occurred';
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
      console.error('Error details:', errorDetails);
    } else if (typeof error === 'object' && error !== null) {
      try {
        errorDetails = JSON.stringify(error);
        console.error('Error details (object):', errorDetails);
      } catch (jsonError) {
        console.error('Error could not be stringified:', jsonError);
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to send booking emails',
        message: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}