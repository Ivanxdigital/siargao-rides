import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format, eachDayOfInterval } from 'date-fns';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { rentalId } = await request.json();

    if (!rentalId) {
      return NextResponse.json(
        { error: 'Missing rental ID' },
        { status: 400 }
      );
    }

    // Get the rental details
    const { data: rental, error: rentalError } = await supabaseAdmin
      .from('rentals')
      .select('id, vehicle_id, start_date, end_date, status, payment_method_id, payment_status, deposit_required, deposit_paid')
      .eq('id', rentalId)
      .single();

    if (rentalError || !rental) {
      console.error('Error fetching rental:', rentalError);
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Check if the rental is confirmed
    // For cash payments, we need to check if deposit is paid
    // For online payments, we need to check if payment status is paid
    const isCashPayment = rental.payment_method_id === '0bea770f-c0c2-4510-a22f-e42fc122eb9c'; // Cash payment method ID
    
    const shouldBlockDates = 
      (isCashPayment && rental.deposit_required && rental.deposit_paid) || // Cash payment with deposit paid
      (!isCashPayment && rental.payment_status === 'paid'); // Online payment with payment completed

    if (!shouldBlockDates) {
      return NextResponse.json(
        { error: 'Rental is not confirmed or payment/deposit not completed' },
        { status: 400 }
      );
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
    const { data: existingBlocks, error: existingBlocksError } = await supabaseAdmin
      .from('vehicle_blocked_dates')
      .select('date')
      .eq('vehicle_id', rental.vehicle_id)
      .in('date', formattedDates.map(d => d.date));

    if (existingBlocksError) {
      console.error('Error checking existing blocked dates:', existingBlocksError);
      return NextResponse.json(
        { error: 'Failed to check existing blocked dates' },
        { status: 500 }
      );
    }

    // Filter out dates that are already blocked
    const existingBlockDates = existingBlocks.map(block => block.date);
    const newBlockedDates = formattedDates.filter(date => !existingBlockDates.includes(date.date));

    if (newBlockedDates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All dates are already blocked',
        blockedDates: []
      });
    }

    // Insert the dates into vehicle_blocked_dates
    const { data: blockedDates, error: blockError } = await supabaseAdmin
      .from('vehicle_blocked_dates')
      .insert(newBlockedDates)
      .select();

    if (blockError) {
      console.error('Error blocking dates:', blockError);
      return NextResponse.json(
        { error: 'Failed to block dates', details: blockError.message },
        { status: 500 }
      );
    }

    // Add entry to booking history
    await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: rental.id,
        event_type: 'dates_blocked',
        status: 'completed',
        notes: `Blocked ${newBlockedDates.length} dates for this booking`,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: `Successfully blocked ${newBlockedDates.length} dates`,
      blockedDates: blockedDates
    });
  } catch (error: unknown) {
    console.error('Error in block-dates API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
