import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for webhook processing
// This is necessary because webhooks don't have cookies for auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Get the raw request body
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    
    // Verify the webhook signature (in production, you should implement this)
    // const signature = request.headers.get('paymongo-signature');
    // if (!verifyWebhookSignature(rawBody, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }
    
    // Process the webhook event
    const event = payload.data;
    const eventType = event.attributes.type;
    
    console.log('Received PayMongo webhook:', eventType);
    
    if (eventType === 'payment.paid') {
      await handlePaymentPaid(event);
    } else if (eventType === 'payment.failed') {
      await handlePaymentFailed(event);
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle payment.paid event
 */
async function handlePaymentPaid(event: any) {
  const paymentData = event.attributes.data;
  const paymentIntentId = paymentData.attributes.payment_intent_id;
  
  // Find the payment record
  const { data: paymentRecord } = await supabase
    .from('paymongo_payments')
    .select('id, rental_id')
    .eq('payment_intent_id', paymentIntentId)
    .single();
  
  if (!paymentRecord) {
    console.error('Payment record not found for intent:', paymentIntentId);
    return;
  }
  
  // Update payment record
  await supabase
    .from('paymongo_payments')
    .update({
      status: 'paid',
      payment_method_type: paymentData.attributes.source?.type || 'unknown',
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentRecord.id);
  
  // Update rental record
  await supabase
    .from('rentals')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      payment_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentRecord.rental_id);
  
  console.log('Payment marked as paid for rental:', paymentRecord.rental_id);
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(event: any) {
  const paymentData = event.attributes.data;
  const paymentIntentId = paymentData.attributes.payment_intent_id;
  const errorMessage = paymentData.attributes.last_payment_error?.message || 'Payment failed';
  
  // Find the payment record
  const { data: paymentRecord } = await supabase
    .from('paymongo_payments')
    .select('id, rental_id')
    .eq('payment_intent_id', paymentIntentId)
    .single();
  
  if (!paymentRecord) {
    console.error('Payment record not found for intent:', paymentIntentId);
    return;
  }
  
  // Update payment record
  await supabase
    .from('paymongo_payments')
    .update({
      status: 'failed',
      last_error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentRecord.id);
  
  // Update rental record
  await supabase
    .from('rentals')
    .update({
      payment_status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentRecord.rental_id);
  
  console.log('Payment marked as failed for rental:', paymentRecord.rental_id);
}
