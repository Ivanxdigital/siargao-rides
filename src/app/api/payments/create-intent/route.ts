import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createPaymentIntent, convertAmountToCents } from '@/lib/paymongo';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting create-intent API call');
    const supabase = createServerComponentClient({ cookies });

    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    console.log('User ID:', userId);

    // Parse request body
    const {
      rentalId,
      amount,
      description,
      metadata = {}
    } = await request.json();

    console.log('Request data:', { rentalId, amount, description });

    // Validate input
    if (!rentalId || !amount) {
      console.log('Missing required fields');
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
    console.log('Amount in cents:', amountInCents);

    // Check if the paymongo_payments table exists
    try {
      const { count, error: tableCheckError } = await supabase
        .from('paymongo_payments')
        .select('*', { count: 'exact', head: true });

      if (tableCheckError) {
        console.error('Error checking paymongo_payments table:', tableCheckError);
        return NextResponse.json(
          { error: 'Database table not found', details: tableCheckError.message },
          { status: 500 }
        );
      }

      console.log('paymongo_payments table exists, count:', count);
    } catch (tableError) {
      console.error('Exception checking paymongo_payments table:', tableError);
      return NextResponse.json(
        { error: 'Database error', details: tableError.message },
        { status: 500 }
      );
    }

    // Create payment intent with PayMongo
    console.log('Creating PayMongo payment intent...');
    let paymentIntent;
    try {
      paymentIntent = await createPaymentIntent(
        amountInCents,
        description || `Payment for Rental #${rentalId}`,
        {
          rental_id: rentalId,
          user_id: userId || 'guest',
          ...metadata
        }
      );
      console.log('PayMongo payment intent created:', paymentIntent.id);
    } catch (paymongoError) {
      console.error('Error creating PayMongo payment intent:', paymongoError);
      return NextResponse.json(
        { error: 'Failed to create PayMongo payment intent', details: paymongoError.message },
        { status: 500 }
      );
    }

    // Store payment intent in database
    console.log('Storing payment intent in database...');
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

    console.log('Payment intent stored successfully:', paymongoPayment.id);

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
