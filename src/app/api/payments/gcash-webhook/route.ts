import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPaymentFromSource } from '@/lib/paymongo-ewallet';
import { blockDatesForBooking } from '@/lib/bookings';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('GCash webhook received');
    
    // Get the raw request body
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    
    console.log('Webhook payload type:', payload.data.attributes.type);
    
    // Check if this is a source.chargeable event
    if (payload.data.attributes.type !== 'source.chargeable') {
      console.log('Not a source.chargeable event, ignoring');
      return NextResponse.json({ received: true });
    }
    
    // Extract source data
    const sourceData = payload.data.attributes.data;
    const sourceId = sourceData.id;
    
    console.log('Processing source.chargeable event for source:', sourceId);
    
    // Get the source from our database
    const { data: sourceRecord, error: sourceError } = await supabase
      .from('paymongo_sources')
      .select('id, rental_id, amount, status')
      .eq('source_id', sourceId)
      .single();
      
    if (sourceError || !sourceRecord) {
      console.error('Source not found in database:', sourceError);
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }
    
    console.log('Found source record:', sourceRecord);
    
    // Get the rental information
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, user_id, shop_id, vehicle_id, vehicle_name, total_price, status, payment_status')
      .eq('id', sourceRecord.rental_id)
      .single();
      
    if (rentalError || !rental) {
      console.error('Rental not found:', rentalError);
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }
    
    console.log('Found rental:', rental.id);
    
    // Check if this is a deposit payment or full payment
    const isDeposit = sourceRecord.amount === 300; // 300 PHP deposit
    
    // Create a payment from the source
    try {
      console.log('Creating payment from source...');
      const payment = await createPaymentFromSource(
        sourceId,
        sourceRecord.amount,
        `${isDeposit ? 'Deposit' : 'Full'} payment for Rental #${rental.id}`
      );
      
      console.log('Payment created:', payment.id);
      
      // Store payment in database
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('paymongo_payments')
        .insert({
          payment_id: payment.id,
          rental_id: rental.id,
          source_id: sourceId,
          amount: sourceRecord.amount,
          status: payment.attributes.status,
          payment_type: isDeposit ? 'deposit' : 'full'
        })
        .select()
        .single();
        
      if (paymentError) {
        console.error('Error storing payment:', paymentError);
      } else {
        console.log('Payment stored:', paymentRecord.id);
      }
      
      // Fetch rental with user information for better notifications
      console.log('Fetching rental with user information for notifications');
      const { data: rentalWithUser, error: rentalUserError } = await supabase
        .from('rentals')
        .select(`
          id, 
          user_id,
          shop_id,
          vehicle_name,
          users(first_name, last_name, email)
        `)
        .eq('id', rental.id)
        .single();
      
      if (rentalUserError) {
        console.error('Error fetching rental with user information:', rentalUserError);
      } else {
        console.log('Found rental with shop_id:', rentalWithUser?.shop_id);
      }
      
      // Create customer name for notifications
      let customerName = 'Customer';
      if (rentalWithUser?.users) {
        const firstName = rentalWithUser.users.first_name || '';
        const lastName = rentalWithUser.users.last_name || '';
        customerName = `${firstName} ${lastName}`.trim() || 'Customer';
        console.log('Created customer name:', customerName);
      } else {
        console.log('No user information found, using default customer name');
        
        // Fallback: Try to get user information directly
        if (rentalWithUser?.user_id) {
          console.log('Trying to get user information directly');
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', rentalWithUser.user_id)
            .single();
            
          if (!userError && userData) {
            const firstName = userData.first_name || '';
            const lastName = userData.last_name || '';
            customerName = `${firstName} ${lastName}`.trim() || 'Customer';
            console.log('Created customer name from direct user query:', customerName);
          } else if (userError) {
            console.error('Error getting user information directly:', userError);
          }
        }
      }
      
      // Update the source status
      await supabase
        .from('paymongo_sources')
        .update({
          status: 'chargeable'
        })
        .eq('source_id', sourceId);
      
      // Update rental based on payment type
      if (isDeposit) {
        console.log('Processing deposit payment for rental:', rental.id);
        const { error: updateError } = await supabase
          .from('rentals')
          .update({
            deposit_paid: true,
            status: 'confirmed',
            customer_name: customerName,
            updated_at: new Date().toISOString()
          })
          .eq('id', rental.id);
        
        if (updateError) {
          console.error('Error updating rental for deposit payment:', updateError);
        } else {
          console.log('Deposit payment marked as paid for rental:', rental.id);
        }
        
        // Block dates for the booking since deposit is paid
        await blockDatesForBooking(rental.id);
      } else {
        console.log('Processing full payment for rental:', rental.id);
        const { error: updateError } = await supabase
          .from('rentals')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            customer_name: customerName,
            payment_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', rental.id);
        
        if (updateError) {
          console.error('Error updating rental for full payment:', updateError);
        } else {
          console.log('Full payment marked as paid for rental:', rental.id);
        }
        
        // Block dates for the booking since payment is complete
        await blockDatesForBooking(rental.id);
      }
      
      return NextResponse.json({ success: true });
    } catch (paymentError: any) {
      console.error('Error creating payment from source:', paymentError);
      
      // Update the source status to failed
      await supabase
        .from('paymongo_sources')
        .update({
          status: 'failed'
        })
        .eq('source_id', sourceId);
      
      return NextResponse.json(
        { error: 'Failed to create payment', details: paymentError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in GCash webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
