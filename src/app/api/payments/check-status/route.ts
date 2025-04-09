import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { getPaymentIntent } from '@/lib/paymongo';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Parse request body
    const { paymentIntentId, clientKey } = await request.json();

    // Validate input
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing payment intent ID' },
        { status: 400 }
      );
    }

    // Get payment intent from PayMongo
    const paymentIntent = await getPaymentIntent(paymentIntentId);
    
    // Find the payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('paymongo_payments')
      .select('id, rental_id, status')
      .eq('payment_intent_id', paymentIntentId)
      .single();
    
    if (paymentError) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }
    
    // Check if the rental belongs to the authenticated user
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, user_id')
      .eq('id', paymentRecord.rental_id)
      .single();
    
    if (rentalError) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }
    
    // Verify that the rental belongs to the authenticated user or is a guest booking
    if (rental.user_id && rental.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this rental' },
        { status: 403 }
      );
    }
    
    // Update payment record status if it has changed
    if (paymentIntent.attributes.status !== paymentRecord.status) {
      await supabase
        .from('paymongo_payments')
        .update({
          status: paymentIntent.attributes.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id);
      
      // Update rental payment status if needed
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
        await supabase
          .from('rentals')
          .update({
            payment_status: 'failed'
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
    console.error('Error in check-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
