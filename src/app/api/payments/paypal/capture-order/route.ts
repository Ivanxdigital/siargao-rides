import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { capturePayPalOrder, getPayPalPaymentStatus, extractCaptureId } from '@/lib/paypal';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting PayPal capture-order API call');
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
    const { orderId } = await request.json();

    console.log('Request data:', { orderId });

    // Validate input
    if (!orderId) {
      console.log('Missing required field: orderId');
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }

    // Find the PayPal payment record
    const { data: paypalPayment, error: paymentError } = await supabase
      .from('paypal_payments')
      .select('*, rentals!paypal_payments_rental_id_fkey(id, user_id, status, payment_status)')
      .eq('order_id', orderId)
      .single();

    if (paymentError || !paypalPayment) {
      console.error('PayPal payment not found:', paymentError);
      return NextResponse.json(
        { error: 'PayPal payment not found' },
        { status: 404 }
      );
    }

    // Verify that the rental belongs to the authenticated user or is a guest booking
    const rental = paypalPayment.rentals;
    if (rental.user_id && rental.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this payment' },
        { status: 403 }
      );
    }

    // Check if payment is already captured
    if (paypalPayment.capture_id) {
      console.log('Payment already captured:', paypalPayment.capture_id);
      return NextResponse.json({
        success: true,
        already_captured: true,
        order: {
          id: paypalPayment.order_id,
          capture_id: paypalPayment.capture_id,
          status: paypalPayment.status
        }
      });
    }

    // Capture the PayPal order
    console.log('Capturing PayPal order...');
    let capturedOrder;
    try {
      capturedOrder = await capturePayPalOrder(orderId);
      console.log('PayPal order captured successfully:', capturedOrder.id);
    } catch (captureError) {
      console.error('Error capturing PayPal order:', captureError);
      
      // Update payment status to failed
      await supabaseAdmin
        .from('paypal_payments')
        .update({
          status: 'FAILED',
          metadata: {
            ...paypalPayment.metadata,
            capture_error: captureError.message,
            capture_attempted_at: new Date().toISOString()
          }
        })
        .eq('id', paypalPayment.id);

      return NextResponse.json(
        { error: 'Failed to capture PayPal payment', details: captureError.message },
        { status: 400 }
      );
    }

    // Extract capture information
    const captureId = extractCaptureId(capturedOrder);
    const paymentStatus = getPayPalPaymentStatus(capturedOrder);

    // Update PayPal payment record with capture details
    const { error: updateError } = await supabaseAdmin
      .from('paypal_payments')
      .update({
        capture_id: captureId,
        status: capturedOrder.status,
        metadata: {
          ...paypalPayment.metadata,
          captured_order: capturedOrder,
          captured_at: new Date().toISOString()
        }
      })
      .eq('id', paypalPayment.id);

    if (updateError) {
      console.error('Error updating PayPal payment:', updateError);
      // Don't fail the request since capture was successful
    }

    // Update rental payment status
    const rentalPaymentStatus = paymentStatus === 'paid' ? 'paid' : 'pending';
    const { error: rentalUpdateError } = await supabaseAdmin
      .from('rentals')
      .update({
        payment_status: rentalPaymentStatus
      })
      .eq('id', rental.id);

    if (rentalUpdateError) {
      console.error('Error updating rental payment status:', rentalUpdateError);
      // Don't fail the request since capture was successful
    }

    console.log('PayPal capture completed successfully');

    return NextResponse.json({
      success: true,
      order: {
        id: capturedOrder.id,
        status: capturedOrder.status,
        capture_id: captureId,
        payment_status: paymentStatus
      }
    });
  } catch (error: unknown) {
    console.error('Error in PayPal capture-order API:', error);

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