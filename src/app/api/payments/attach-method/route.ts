import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { attachPaymentMethod } from '@/lib/paymongo';
import { format, eachDayOfInterval } from 'date-fns';

/**
 * Block dates for a confirmed booking
 */
async function blockDatesForBooking(supabase: unknown, rentalId: string) {
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
    const { error: blockError } = await supabase
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Get the current authenticated user using the secure method
    const { error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting authenticated user:', userError);
      // Continue anyway, as guest checkout might be allowed
    }

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
      .select('id, rental_id, is_deposit, metadata')
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

    // Check if this is a deposit payment
    // Since the is_deposit column might not exist, we check the metadata field
    // PayMongo stores all metadata values as strings
    const isDeposit = paymentRecord.metadata &&
                     (paymentRecord.metadata.is_deposit === true ||
                      paymentRecord.metadata.is_deposit === 'true');

    // Update rental payment status based on payment intent status
    if (paymentIntent.attributes.status === 'succeeded') {
      if (isDeposit) {
        // Update rental record for deposit payment
        await supabase
          .from('rentals')
          .update({
            deposit_paid: true,
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.rental_id);

        // Block dates for the booking since deposit is paid
        await blockDatesForBooking(supabase, paymentRecord.rental_id);
      } else {
        // Update rental record for full payment
        await supabase
          .from('rentals')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            payment_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.rental_id);

        // Block dates for the booking since payment is complete
        await blockDatesForBooking(supabase, paymentRecord.rental_id);
      }
    } else if (paymentIntent.attributes.status === 'awaiting_payment_method') {
      // Payment failed
      if (isDeposit) {
        await supabase
          .from('rentals')
          .update({
            deposit_paid: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.rental_id);
      } else {
        await supabase
          .from('rentals')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString()
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
  } catch (error: unknown) {
    console.error('Error in attach-method API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
