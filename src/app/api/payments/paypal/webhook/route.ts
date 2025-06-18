import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayPalWebhookSignature, getPayPalPaymentStatus, extractCaptureId } from '@/lib/paypal';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';

export async function POST(request: NextRequest) {
  try {
    console.log('PayPal webhook received');

    // Get raw body for signature verification
    const body = await request.text();
    const webhookEvent = JSON.parse(body);

    console.log('Webhook event type:', webhookEvent.event_type);
    console.log('Webhook resource type:', webhookEvent.resource_type);

    // Extract headers for signature verification
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Verify webhook signature if webhook ID is configured
    if (PAYPAL_WEBHOOK_ID) {
      console.log('Verifying PayPal webhook signature...');
      try {
        const isValid = await verifyPayPalWebhookSignature(body, headers, PAYPAL_WEBHOOK_ID);
        if (!isValid) {
          console.error('Invalid PayPal webhook signature');
          return NextResponse.json(
            { error: 'Invalid webhook signature' },
            { status: 401 }
          );
        }
        console.log('Webhook signature verified successfully');
      } catch (verificationError) {
        console.error('Error verifying webhook signature:', verificationError);
        return NextResponse.json(
          { error: 'Webhook verification failed' },
          { status: 401 }
        );
      }
    } else {
      console.warn('PAYPAL_WEBHOOK_ID not configured, skipping signature verification');
    }

    // Handle different webhook event types
    switch (webhookEvent.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(webhookEvent);
        break;
      
      case 'CHECKOUT.ORDER.COMPLETED':
        await handleOrderCompleted(webhookEvent);
        break;
      
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handleCaptureCompleted(webhookEvent);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await handleCaptureFailed(webhookEvent);
        break;
      
      default:
        console.log('Unhandled webhook event type:', webhookEvent.event_type);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleOrderApproved(webhookEvent: any) {
  try {
    console.log('Processing ORDER.APPROVED webhook');
    const orderId = webhookEvent.resource.id;

    // Find the PayPal payment record
    const { data: paypalPayment, error } = await supabaseAdmin
      .from('paypal_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error || !paypalPayment) {
      console.error('PayPal payment not found for order:', orderId);
      return;
    }

    // Update payment status to approved
    await supabaseAdmin
      .from('paypal_payments')
      .update({
        status: 'APPROVED',
        metadata: {
          ...paypalPayment.metadata,
          webhook_events: [
            ...(paypalPayment.metadata?.webhook_events || []),
            {
              event_type: webhookEvent.event_type,
              timestamp: new Date().toISOString(),
              data: webhookEvent.resource
            }
          ]
        }
      })
      .eq('id', paypalPayment.id);

    console.log('Order approved status updated for:', orderId);
  } catch (error) {
    console.error('Error handling ORDER.APPROVED:', error);
  }
}

async function handleOrderCompleted(webhookEvent: any) {
  try {
    console.log('Processing ORDER.COMPLETED webhook');
    const orderId = webhookEvent.resource.id;
    const order = webhookEvent.resource;

    // Find the PayPal payment record
    const { data: paypalPayment, error } = await supabaseAdmin
      .from('paypal_payments')
      .select('*, rentals!paypal_payments_rental_id_fkey(id)')
      .eq('order_id', orderId)
      .single();

    if (error || !paypalPayment) {
      console.error('PayPal payment not found for order:', orderId);
      return;
    }

    const captureId = extractCaptureId(order);
    const paymentStatus = getPayPalPaymentStatus(order);

    // Update PayPal payment record
    await supabaseAdmin
      .from('paypal_payments')
      .update({
        capture_id: captureId,
        status: order.status,
        metadata: {
          ...paypalPayment.metadata,
          completed_order: order,
          webhook_events: [
            ...(paypalPayment.metadata?.webhook_events || []),
            {
              event_type: webhookEvent.event_type,
              timestamp: new Date().toISOString(),
              data: order
            }
          ]
        }
      })
      .eq('id', paypalPayment.id);

    // Update rental payment status
    if (paymentStatus === 'paid') {
      await supabaseAdmin
        .from('rentals')
        .update({ payment_status: 'paid' })
        .eq('id', paypalPayment.rental_id);
    }

    console.log('Order completed status updated for:', orderId);
  } catch (error) {
    console.error('Error handling ORDER.COMPLETED:', error);
  }
}

async function handleCaptureCompleted(webhookEvent: any) {
  try {
    console.log('Processing CAPTURE.COMPLETED webhook');
    const captureId = webhookEvent.resource.id;
    const capture = webhookEvent.resource;

    // Find PayPal payment by capture ID or order ID in metadata
    const { data: paypalPayments, error } = await supabaseAdmin
      .from('paypal_payments')
      .select('*, rentals!paypal_payments_rental_id_fkey(id)')
      .or(`capture_id.eq.${captureId},metadata->>paypal_order_id.eq.${capture.supplementary_data?.related_ids?.order_id}`);

    if (error || !paypalPayments || paypalPayments.length === 0) {
      console.error('PayPal payment not found for capture:', captureId);
      return;
    }

    const paypalPayment = paypalPayments[0];

    // Update PayPal payment record
    await supabaseAdmin
      .from('paypal_payments')
      .update({
        capture_id: captureId,
        status: 'COMPLETED',
        metadata: {
          ...paypalPayment.metadata,
          capture_completed: capture,
          webhook_events: [
            ...(paypalPayment.metadata?.webhook_events || []),
            {
              event_type: webhookEvent.event_type,
              timestamp: new Date().toISOString(),
              data: capture
            }
          ]
        }
      })
      .eq('id', paypalPayment.id);

    // Update rental payment status to paid
    await supabaseAdmin
      .from('rentals')
      .update({ payment_status: 'paid' })
      .eq('id', paypalPayment.rental_id);

    console.log('Capture completed status updated for:', captureId);
  } catch (error) {
    console.error('Error handling CAPTURE.COMPLETED:', error);
  }
}

async function handleCaptureFailed(webhookEvent: any) {
  try {
    console.log('Processing CAPTURE FAILED webhook');
    const captureId = webhookEvent.resource.id;
    const capture = webhookEvent.resource;

    // Find PayPal payment by capture ID
    const { data: paypalPayments, error } = await supabaseAdmin
      .from('paypal_payments')
      .select('*, rentals!paypal_payments_rental_id_fkey(id)')
      .eq('capture_id', captureId);

    if (error || !paypalPayments || paypalPayments.length === 0) {
      console.error('PayPal payment not found for failed capture:', captureId);
      return;
    }

    const paypalPayment = paypalPayments[0];

    // Update PayPal payment record with failure info
    await supabaseAdmin
      .from('paypal_payments')
      .update({
        status: 'FAILED',
        metadata: {
          ...paypalPayment.metadata,
          capture_failed: capture,
          webhook_events: [
            ...(paypalPayment.metadata?.webhook_events || []),
            {
              event_type: webhookEvent.event_type,
              timestamp: new Date().toISOString(),
              data: capture
            }
          ]
        }
      })
      .eq('id', paypalPayment.id);

    // Update rental payment status to cancelled
    await supabaseAdmin
      .from('rentals')
      .update({ payment_status: 'cancelled' })
      .eq('id', paypalPayment.rental_id);

    console.log('Capture failed status updated for:', captureId);
  } catch (error) {
    console.error('Error handling CAPTURE FAILED:', error);
  }
}