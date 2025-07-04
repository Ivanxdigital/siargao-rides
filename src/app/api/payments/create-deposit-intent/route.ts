import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { createPaymentIntent, convertAmountToCents } from '@/lib/paymongo';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting create-deposit-intent API call');
    const supabase = createServerComponentClient({ cookies });

    // Get the current authenticated user using the secure method
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const userId = user?.id;
    console.log('User ID:', userId);

    if (userError) {
      console.error('Error getting authenticated user:', userError);
      return NextResponse.json(
        { error: 'Authentication required for deposit payments' },
        { status: 401 }
      );
    }

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
      .select('id, user_id, shop_id, vehicle_id, vehicle_type_id, deposit_required, deposit_amount, deposit_paid, status')
      .eq('id', rentalId)
      .single();

    if (rentalError || !rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Verify that the rental belongs to the authenticated user
    if (rental.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this rental' },
        { status: 403 }
      );
    }

    // Check if deposit is required
    if (!rental.deposit_required) {
      return NextResponse.json(
        { error: 'Deposit is not required for this booking' },
        { status: 400 }
      );
    }

    // Check if deposit is already paid
    if (rental.deposit_paid) {
      return NextResponse.json(
        { error: 'Deposit is already paid for this booking' },
        { status: 400 }
      );
    }

    // Convert amount to cents for PayMongo
    const amountInCents = convertAmountToCents(amount);
    console.log('Amount in cents:', amountInCents);

    // Create payment intent with PayMongo
    console.log('Creating PayMongo deposit payment intent...');
    let paymentIntent;
    try {
      // Flatten metadata - PayMongo doesn't support nested objects
      const flatMetadata = {
        rental_id: rentalId,
        user_id: userId,
        is_deposit: 'true', // Use string instead of boolean
        // Add any other metadata as flat key-value pairs
        ...Object.entries(metadata).reduce((acc, [key, value]) => {
          // Convert any nested objects to string
          acc[key] = typeof value === 'object' ? JSON.stringify(value) : value;
          return acc;
        }, {})
      };

      console.log('Flattened metadata for PayMongo:', flatMetadata);

      paymentIntent = await createPaymentIntent(
        amountInCents,
        description || `Deposit Payment for Rental #${rentalId}`,
        flatMetadata
      );
      console.log('PayMongo deposit payment intent created:', paymentIntent.id);
    } catch (paymongoError) {
      console.error('Error creating PayMongo deposit payment intent:', paymongoError);
      return NextResponse.json(
        { error: 'Failed to create PayMongo deposit payment intent', details: paymongoError.message },
        { status: 500 }
      );
    }

    // Store payment intent in database using admin client to bypass RLS
    console.log('Storing deposit payment intent in database...');
    // Check if the is_deposit column exists in the paymongo_payments table
    // If not, we'll store the deposit information in the metadata field
    const { data: paymongoPayment, error: paymentError } = await supabaseAdmin
      .from('paymongo_payments')
      .insert({
        rental_id: rentalId,
        payment_intent_id: paymentIntent.id,
        client_key: paymentIntent.attributes.client_key,
        amount: amount,
        currency: 'PHP',
        status: paymentIntent.attributes.status,
        // Store deposit information in metadata as flat structure
        metadata: {
          ...metadata,
          is_deposit: 'true' // Use string instead of boolean for consistency
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error storing deposit payment intent:', paymentError);
      return NextResponse.json(
        { error: 'Failed to store deposit payment intent', details: paymentError.message },
        { status: 500 }
      );
    }

    console.log('Deposit payment intent stored successfully:', paymongoPayment.id);

    // Update rental with deposit payment intent ID
    await supabaseAdmin
      .from('rentals')
      .update({
        deposit_payment_id: paymongoPayment.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', rentalId);

    console.log('Rental updated with deposit payment ID');

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
  } catch (error: unknown) {
    console.error('Error in create-deposit-intent API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
