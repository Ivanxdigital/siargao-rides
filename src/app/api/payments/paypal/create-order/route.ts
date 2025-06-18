import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { createPayPalOrder, formatPayPalAmount } from '@/lib/paypal';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting PayPal create-order API call');
    const supabase = createServerComponentClient({ cookies });

    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const userId = user?.id;
    console.log('User ID:', userId);

    if (userError) {
      console.error('Error getting authenticated user:', userError);
      // Continue anyway, as guest checkout might be allowed
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
    if (!rentalId) {
      console.log('Missing required field: rentalId');
      return NextResponse.json(
        { error: 'Missing required field: rentalId' },
        { status: 400 }
      );
    }

    if (!amount) {
      console.log('Missing required field: amount');
      return NextResponse.json(
        { error: 'Missing required field: amount' },
        { status: 400 }
      );
    }

    // Type validation
    if (typeof amount !== 'number' || amount <= 0) {
      console.log('Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate rental ID format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rentalId)) {
      console.log('Invalid rental ID format:', rentalId);
      return NextResponse.json(
        { error: 'Invalid rental ID format' },
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

    // Format amount for PayPal (no conversion needed, PayPal handles PHP directly)
    const formattedAmount = formatPayPalAmount(amount);
    console.log('Formatted amount for PayPal:', formattedAmount);

    // Check if the paypal_payments table exists
    try {
      const { count, error: tableCheckError } = await supabase
        .from('paypal_payments')
        .select('*', { count: 'exact', head: true });

      if (tableCheckError) {
        console.error('Error checking paypal_payments table:', tableCheckError);
        return NextResponse.json(
          { error: 'Database table not found', details: tableCheckError.message },
          { status: 500 }
        );
      }

      console.log('paypal_payments table exists, count:', count);
    } catch (tableError) {
      console.error('Exception checking paypal_payments table:', tableError);
      return NextResponse.json(
        { error: 'Database error', details: tableError.message },
        { status: 500 }
      );
    }

    // Create PayPal order
    console.log('Creating PayPal order...');
    let paypalOrder;
    try {
      paypalOrder = await createPayPalOrder(
        amount,
        description || `Payment for Rental #${rentalId}`,
        {
          rental_id: rentalId,
          user_id: userId || 'guest',
          ...metadata
        }
      );
      console.log('PayPal order created:', paypalOrder.id);
    } catch (paypalError) {
      console.error('Error creating PayPal order:', paypalError);
      return NextResponse.json(
        { error: 'Failed to create PayPal order', details: paypalError.message },
        { status: 500 }
      );
    }

    // Store PayPal order in database using admin client to bypass RLS
    console.log('Storing PayPal order in database using admin client...');
    const { data: paypalPayment, error: paymentError } = await supabaseAdmin
      .from('paypal_payments')
      .insert({
        rental_id: rentalId,
        order_id: paypalOrder.id,
        amount: amount,
        currency: 'PHP',
        status: paypalOrder.status,
        metadata: {
          user_id: userId || 'guest',
          paypal_order: paypalOrder,
          ...metadata
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error storing PayPal order:', paymentError);
      return NextResponse.json(
        { error: 'Failed to store PayPal order', details: paymentError.message },
        { status: 500 }
      );
    }

    console.log('PayPal order stored successfully:', paypalPayment.id);

    // Update rental payment status using admin client
    await supabaseAdmin
      .from('rentals')
      .update({
        payment_status: 'pending'
      })
      .eq('id', rentalId);

    console.log('Rental payment status updated successfully');

    // Extract approval URL for frontend redirect
    const approvalUrl = paypalOrder.links?.find(link => link.rel === 'approve')?.href;

    return NextResponse.json({
      success: true,
      order: {
        id: paypalOrder.id,
        status: paypalOrder.status,
        approval_url: approvalUrl,
        payment_id: paypalPayment.id
      }
    });
  } catch (error: any) {
    console.error('Error in PayPal create-order API:', error);

    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production'
      ? 'An error occurred processing your payment'
      : error.message;

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}