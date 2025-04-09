import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { attachPaymentMethod } from '@/lib/paymongo';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
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
      .select('id, rental_id')
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

    // Update rental payment status based on payment intent status
    if (paymentIntent.attributes.status === 'succeeded') {
      await supabase
        .from('rentals')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_date: new Date().toISOString()
        })
        .eq('id', paymentRecord.rental_id);
    } else if (paymentIntent.attributes.status === 'awaiting_payment_method') {
      // Payment failed
      await supabase
        .from('rentals')
        .update({
          payment_status: 'failed'
        })
        .eq('id', paymentRecord.rental_id);
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
