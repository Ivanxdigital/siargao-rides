import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { attachPaymentMethod } from '@/lib/paymongo';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Get the current authenticated user using the secure method
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const userId = user?.id;

    if (userError) {
      console.error('Error getting authenticated user:', userError);
      // Continue anyway, as guest checkout might be allowed
    }

    // Parse request body
    const {
      paymentIntentId,
      paymentMethodId,
      clientKey
    } = await request.json();

    // Validate input
    if (!paymentIntentId || !paymentMethodId || !clientKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('paymongo_payments')
      .select('id, rental_id, is_deposit, metadata')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (paymentError) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Attach payment method to payment intent
    const paymentIntent = await attachPaymentMethod(
      paymentIntentId,
      paymentMethodId,
      clientKey
    );

    // Update payment record
    await supabase
      .from('paymongo_payments')
      .update({
        payment_method_id: paymentMethodId,
        status: paymentIntent.attributes.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id);

    // Check if this is a deposit payment
    // Since the is_deposit column might not exist, we check the metadata field
    const isDeposit = paymentRecord.metadata && paymentRecord.metadata.is_deposit;

    // Update rental payment status based on payment intent status
    if (paymentIntent.attributes.status === 'succeeded') {
      if (isDeposit) {
        // Update rental record for deposit payment
        await supabase
          .from('rentals')
          .update({
            deposit_paid: true,
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.rental_id);
      } else {
        // Update rental record for full payment
        await supabase
          .from('rentals')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            payment_date: new Date().toISOString()
          })
          .eq('id', paymentRecord.rental_id);
      }
    } else if (paymentIntent.attributes.status === 'awaiting_payment_method') {
      // Payment failed
      if (isDeposit) {
        await supabase
          .from('rentals')
          .update({
            deposit_paid: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.rental_id);
      } else {
        await supabase
          .from('rentals')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.rental_id);
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentRecord.id,
        rental_id: paymentRecord.rental_id,
        status: paymentIntent.attributes.status,
        next_action: paymentIntent.attributes.next_action,
        last_payment_error: paymentIntent.attributes.last_payment_error
      }
    });
  } catch (error: any) {
    console.error('Error in attach-method API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
