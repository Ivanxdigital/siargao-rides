import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createPaymentIntent, convertAmountToCents } from '@/lib/paymongo';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Parse request body
    const {
      rentalId,
      amount,
      description,
      metadata = {}
    } = await request.json();

    // Validate input
    if (!rentalId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if rental exists and belongs to the user
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, user_id, shop_id, vehicle_id, vehicle_type_id, total_price, status, payment_status')
      .eq('id', rentalId)
      .single();

    if (rentalError || !rental) {
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

    // Convert amount to cents for PayMongo
    const amountInCents = convertAmountToCents(amount);

    // Create payment intent with PayMongo
    const paymentIntent = await createPaymentIntent(
      amountInCents,
      description || `Payment for Rental #${rentalId}`,
      {
        rental_id: rentalId,
        user_id: userId || 'guest',
        ...metadata
      }
    );

    // Store payment intent in database
    const { data: paymongoPayment, error: paymentError } = await supabase
      .from('paymongo_payments')
      .insert({
        rental_id: rentalId,
        payment_intent_id: paymentIntent.id,
        client_key: paymentIntent.attributes.client_key,
        amount: amount,
        currency: 'PHP',
        status: paymentIntent.attributes.status,
        metadata: metadata
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error storing payment intent:', paymentError);
      return NextResponse.json(
        { error: 'Failed to store payment intent', details: paymentError.message },
        { status: 500 }
      );
    }

    // Update rental payment status
    await supabase
      .from('rentals')
      .update({
        payment_intent_id: paymentIntent.id,
        payment_status: 'pending'
      })
      .eq('id', rentalId);

    return NextResponse.json({
      success: true,
      payment: {
        id: paymongoPayment.id,
        payment_intent_id: paymentIntent.id,
        client_key: paymentIntent.attributes.client_key,
        amount: amount,
        status: paymentIntent.attributes.status
      }
    });
  } catch (error: any) {
    console.error('Error in create-intent API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
