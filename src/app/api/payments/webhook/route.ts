import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addDays, format, eachDayOfInterval } from 'date-fns';
import { verifyWebhookSignature } from '@/lib/paymongo';

// Initialize Supabase client with service role for webhook processing
// This is necessary because webhooks don't have cookies for auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Get the raw request body
    const rawBody = await request.text();

    // Get the signature from headers
    const signature = request.headers.get('paymongo-signature');

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    // Verify the signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!webhookSecret || !signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      // In development, log but don't reject if signature verification fails
      if (signature && webhookSecret) {
        const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
        console.log(`Webhook signature verification: ${isValid ? 'Valid' : 'Invalid'} (development mode)`);
      } else {
        console.log('Skipping webhook signature verification in development mode');
      }
    }

    const payload = JSON.parse(rawBody);

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
    .select('id, rental_id, is_deposit, metadata')
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

  // Check if this is a deposit payment
  // Since the is_deposit column might not exist, we check the metadata field
  // PayMongo stores all metadata values as strings
  const isDeposit = paymentRecord.metadata &&
                   (paymentRecord.metadata.is_deposit === true ||
                    paymentRecord.metadata.is_deposit === 'true');

  console.log('Payment webhook: Fetching rental with user information for better notifications');
  // Fetch rental with user information for better notifications
  const { data: rentalWithUser, error: rentalUserError } = await supabase
    .from('rentals')
    .select(`
      id,
      user_id,
      shop_id,
      vehicle_name,
      users(first_name, last_name, email)
    `)
    .eq('id', paymentRecord.rental_id)
    .single();

  if (rentalUserError) {
    console.error('Payment webhook: Error fetching rental with user information:', rentalUserError);
  } else {
    console.log('Payment webhook: Found rental with shop_id:', rentalWithUser?.shop_id);
  }

  // Create customer name for notifications
  let customerName = 'Customer';
  if (rentalWithUser?.users) {
    const firstName = rentalWithUser.users.first_name || '';
    const lastName = rentalWithUser.users.last_name || '';
    customerName = `${firstName} ${lastName}`.trim() || 'Customer';
    console.log('Payment webhook: Created customer name:', customerName);
  } else {
    console.log('Payment webhook: No user information found, using default customer name');

    // Fallback: Try to get user information directly
    if (rentalWithUser?.user_id) {
      console.log('Payment webhook: Trying to get user information directly');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', rentalWithUser.user_id)
        .single();

      if (!userError && userData) {
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        customerName = `${firstName} ${lastName}`.trim() || 'Customer';
        console.log('Payment webhook: Created customer name from direct user query:', customerName);
      } else if (userError) {
        console.error('Payment webhook: Error getting user information directly:', userError);
      }
    }
  }

  if (isDeposit) {
    console.log('Payment webhook: Processing deposit payment for rental:', paymentRecord.rental_id);
    // Update rental record for deposit payment
    const { error: updateError } = await supabase
      .from('rentals')
      .update({
        deposit_paid: true,
        status: 'confirmed',
        customer_name: customerName,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.rental_id);

    if (updateError) {
      console.error('Payment webhook: Error updating rental for deposit payment:', updateError);
    } else {
      console.log('Payment webhook: Deposit payment marked as paid for rental:', paymentRecord.rental_id);
    }

    // Block dates for the booking since deposit is paid
    await blockDatesForBooking(paymentRecord.rental_id);
  } else {
    console.log('Payment webhook: Processing full payment for rental:', paymentRecord.rental_id);
    // Update rental record for full payment
    const { error: updateError } = await supabase
      .from('rentals')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        customer_name: customerName,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.rental_id);

    if (updateError) {
      console.error('Payment webhook: Error updating rental for full payment:', updateError);
    } else {
      console.log('Payment webhook: Full payment marked as paid for rental:', paymentRecord.rental_id);
    }

    // Block dates for the booking since payment is complete
    await blockDatesForBooking(paymentRecord.rental_id);
  }
}

/**
 * Block dates for a confirmed booking
 */
async function blockDatesForBooking(rentalId: string) {
  try {
    console.log('Blocking dates for rental:', rentalId);

    // Get the rental details
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, vehicle_id, start_date, end_date')
      .eq('id', rentalId)
      .single();

    if (rentalError || !rental) {
      console.error('Error fetching rental for blocking dates:', rentalError);
      return;
    }

    // Generate all dates between start_date and end_date
    const startDate = new Date(rental.start_date);
    const endDate = new Date(rental.end_date);

    const dateRange = eachDayOfInterval({
      start: startDate,
      end: endDate
    });

    // Format dates for database (YYYY-MM-DD)
    const formattedDates = dateRange.map(date => ({
      vehicle_id: rental.vehicle_id,
      date: format(date, 'yyyy-MM-dd'),
      reason: `Booked (Rental #${rental.id})`
    }));

    // Check if any dates are already blocked
    const { data: existingBlocks, error: existingBlocksError } = await supabase
      .from('vehicle_blocked_dates')
      .select('date')
      .eq('vehicle_id', rental.vehicle_id)
      .in('date', formattedDates.map(d => d.date));

    if (existingBlocksError) {
      console.error('Error checking existing blocked dates:', existingBlocksError);
      return;
    }

    // Filter out dates that are already blocked
    const existingBlockDates = existingBlocks.map(block => block.date);
    const newBlockedDates = formattedDates.filter(date => !existingBlockDates.includes(date.date));

    if (newBlockedDates.length === 0) {
      console.log('All dates are already blocked for rental:', rentalId);
      return;
    }

    // Insert the dates into vehicle_blocked_dates
    const { data: blockedDates, error: blockError } = await supabase
      .from('vehicle_blocked_dates')
      .insert(newBlockedDates)
      .select();

    if (blockError) {
      console.error('Error blocking dates for rental:', blockError);
      return;
    }

    console.log(`Successfully blocked ${newBlockedDates.length} dates for rental:`, rentalId);

    // Add entry to booking history
    await supabase
      .from('booking_history')
      .insert({
        booking_id: rentalId,
        event_type: 'dates_blocked',
        status: 'completed',
        notes: `Blocked ${newBlockedDates.length} dates for this booking`,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error in blockDatesForBooking:', error);
  }
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
    .select('id, rental_id, is_deposit, metadata')
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

  // Check if this is a deposit payment
  // Since the is_deposit column might not exist, we check the metadata field
  // PayMongo stores all metadata values as strings
  const isDeposit = paymentRecord.metadata &&
                   (paymentRecord.metadata.is_deposit === true ||
                    paymentRecord.metadata.is_deposit === 'true');

  if (isDeposit) {
    // Update rental record for failed deposit payment
    await supabase
      .from('rentals')
      .update({
        deposit_paid: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.rental_id);

    console.log('Deposit payment marked as failed for rental:', paymentRecord.rental_id);
  } else {
    // Update rental record for failed full payment
    await supabase
      .from('rentals')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.rental_id);

    console.log('Full payment marked as failed for rental:', paymentRecord.rental_id);
  }
}
