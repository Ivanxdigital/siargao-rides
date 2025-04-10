import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting process-deposit-payout API call');
    const supabase = createServerComponentClient({ cookies });

    // Get the current authenticated user using the secure method
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const userId = user?.id;
    console.log('User ID:', userId);

    if (userError) {
      console.error('Error getting authenticated user:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is an admin from user metadata
    if (user.user_metadata?.role !== 'admin') {
      console.log('User is not an admin. User metadata:', user.user_metadata);
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const { rentalId, reason } = await request.json();

    console.log('Request data:', { rentalId, reason });

    // Validate input
    if (!rentalId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing rental ID' },
        { status: 400 }
      );
    }

    // Check if rental exists
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select(`
        id,
        shop_id,
        deposit_required,
        deposit_paid,
        deposit_amount,
        deposit_payment_id,
        status
      `)
      .eq('id', rentalId)
      .single();

    if (rentalError || !rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Check if deposit is required and paid
    if (!rental.deposit_required || !rental.deposit_paid) {
      return NextResponse.json(
        { error: 'No deposit available for payout' },
        { status: 400 }
      );
    }

    // Check if rental status is appropriate for payout (no-show or cancelled)
    if (rental.status !== 'no_show' && rental.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Rental status does not qualify for deposit payout' },
        { status: 400 }
      );
    }

    // Get shop owner's payment details
    const { data: shop, error: shopError } = await supabase
      .from('rental_shops')
      .select('id, owner_id, name')
      .eq('id', rental.shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get shop owner's payment details
    const { data: shopOwner, error: shopOwnerError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, payment_details')
      .eq('id', shop.owner_id)
      .single();

    if (shopOwnerError || !shopOwner) {
      return NextResponse.json(
        { error: 'Shop owner not found' },
        { status: 404 }
      );
    }

    // Check if shop owner has payment details
    if (!shopOwner.payment_details) {
      return NextResponse.json(
        { error: 'Shop owner has no payment details' },
        { status: 400 }
      );
    }

    // Create payout record
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from('deposit_payouts')
      .insert({
        rental_id: rental.id,
        shop_id: shop.id,
        amount: rental.deposit_amount,
        status: 'pending',
        reason: reason || 'Customer no-show',
        processed_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout record:', payoutError);
      return NextResponse.json(
        { error: 'Failed to create payout record', details: payoutError.message },
        { status: 500 }
      );
    }

    // Update rental to mark deposit as processed
    const { error: updateError } = await supabaseAdmin
      .from('rentals')
      .update({
        deposit_processed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', rentalId);

    if (updateError) {
      console.error('Error updating rental:', updateError);
      return NextResponse.json(
        { error: 'Failed to update rental', details: updateError.message },
        { status: 500 }
      );
    }

    // Add entry to booking history
    await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: rentalId,
        event_type: 'deposit_payout',
        status: 'processed',
        notes: `Deposit payout processed for ${reason || 'customer no-show'}`,
        created_by: userId,
        created_at: new Date().toISOString()
      });

    console.log('Deposit payout processed successfully for rental:', rentalId);

    return NextResponse.json({
      success: true,
      message: 'Deposit payout processed successfully',
      payout: payout
    });
  } catch (error: any) {
    console.error('Error in process-deposit-payout API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
