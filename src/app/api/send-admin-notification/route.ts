import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { AdminShopNotificationEmail } from '@/emails/AdminShopNotificationEmail';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { supabaseAdmin } from '@/lib/admin';

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;
const isDevMode = process.env.NODE_ENV === 'development';

// Log the presence of the API key (without revealing it)
console.log('Resend API key status:', resendApiKey ?
  `Present (starts with ${resendApiKey.substring(0, 3)}...)` :
  'MISSING - emails will fail');
console.log('Environment:', isDevMode ? 'Development' : 'Production');

if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

const resend = new Resend(resendApiKey);

// Define validation schema for the request body
const notificationSchema = z.object({
  shopId: z.string().uuid('Invalid shop ID format'),
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const result = notificationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: result.error.format()
      }, { status: 400 });
    }

    const { shopId } = result.data;

    // Get shop details including owner information
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('rental_shops')
      .select(`
        *,
        owner:owner_id (
          id,
          email,
          first_name,
          last_name,
          phone_number
        )
      `)
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      console.error('Error fetching shop details:', shopError);
      return NextResponse.json({
        error: 'Failed to fetch shop details',
        details: shopError?.message
      }, { status: 500 });
    }

    // Get admin users to send notifications to
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      return NextResponse.json({
        error: 'Failed to fetch admin users',
        details: adminError.message
      }, { status: 500 });
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.warn('No admin users found to notify');
      return NextResponse.json({
        warning: 'No admin users found to notify'
      }, { status: 200 });
    }

    // Extract admin emails
    const adminEmails = adminUsers.map(admin => admin.email);
    console.log(`Sending admin notification to ${adminEmails.length} admins:`, adminEmails);

    // Send email to all admins
    const { data, error } = await resend.emails.send({
      from: 'Siargao Rides <support@siargaorides.ph>',
      to: adminEmails,
      subject: `New Shop Application: ${shop.name} - Verification Required`,
      headers: {
        'X-Entity-Ref-ID': uuid(), // For tracking/avoiding duplicates
      },
      react: AdminShopNotificationEmail({
        shop,
        owner: shop.owner
      }) as React.ReactElement,
    });

    if (error) {
      console.error('Error sending admin notification email:', error);
      return NextResponse.json({
        error: 'Failed to send notification email',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${adminEmails.length} admin(s)`,
      data
    });
  } catch (error) {
    console.error('Unexpected error in send-admin-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: 'An unexpected error occurred',
      details: errorMessage
    }, { status: 500 });
  }
}
