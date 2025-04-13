import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ShopVerificationEmail } from '@/components/ShopVerificationEmail';
import { supabaseAdmin } from '@/lib/admin';
import { v4 as uuid } from 'uuid';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    // Parse request body
    const { shopId } = await req.json();

    if (!shopId) {
      return NextResponse.json({
        error: 'Shop ID is required'
      }, { status: 400 });
    }

    // Get shop details including owner
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('rental_shops')
      .select(`
        *,
        owner:owner_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', shopId)
      .single();

    if (shopError) {
      console.error('Error fetching shop details:', shopError);
      return NextResponse.json({
        error: 'Failed to fetch shop details'
      }, { status: 500 });
    }

    if (!shop) {
      return NextResponse.json({
        error: 'Shop not found'
      }, { status: 404 });
    }

    // Get owner email and name
    const ownerEmail = shop.owner.email;
    const ownerName = `${shop.owner.first_name || ''} ${shop.owner.last_name || ''}`.trim() || 'Shop Owner';

    if (!ownerEmail) {
      return NextResponse.json({
        error: 'Owner email not found'
      }, { status: 400 });
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Siargao Rides <support@siargaorides.ph>',
      to: ownerEmail,
      subject: `Congratulations! Your ${shop.name} shop is now verified`,
      replyTo: 'siargaorides@gmail.com',
      headers: {
        'X-Entity-Ref-ID': uuid(), // For tracking/avoiding duplicates
      },
      react: ShopVerificationEmail({
        shopName: shop.name,
        ownerName: ownerName,
        shopId: shop.id
      }) as React.ReactElement,
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      data
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      error: 'Failed to process request'
    }, { status: 500 });
  }
}