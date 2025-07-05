import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { createGCashSource } from '@/lib/paymongo-ewallet';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting create-gcash-source API call');
    const supabase = createServerComponentClient({ cookies });

    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const userId = user?.id;
    console.log('User ID:', userId);

    if (userError) {
      console.error('Error getting authenticated user:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const {
      rentalId,
      amount,
      description,
      successUrl,
      failureUrl,
      billingInfo
    } = await request.json();

    console.log('Request data:', { rentalId, amount, description, successUrl, failureUrl });

    // Validate input
    if (!rentalId || !amount || !successUrl || !failureUrl || !billingInfo) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if rental exists and belongs to the user
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, user_id, shop_id, vehicle_id, total_price, status, payment_status')
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

    // Create GCash source with PayMongo
    console.log('Creating GCash source...');
    let source;
    try {
      source = await createGCashSource(
        amount,
        description || `Payment for Rental #${rentalId}`,
        successUrl,
        failureUrl,
        billingInfo
      );
      console.log('GCash source created:', source.id);
    } catch (paymongoError: unknown) {
      console.error('Error creating GCash source:', paymongoError);
      return NextResponse.json(
        { error: 'Failed to create GCash source', details: paymongoError instanceof Error ? paymongoError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Check if the paymongo_sources table exists
    try {
      const { error: tableCheckError } = await supabase
        .from('paymongo_sources')
        .select('*', { count: 'exact', head: true });

      if (tableCheckError) {
        console.error('Error checking paymongo_sources table:', tableCheckError);

        // If table doesn't exist, create it
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS paymongo_sources (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            source_id TEXT NOT NULL,
            rental_id UUID NOT NULL REFERENCES rentals(id),
            amount DECIMAL(10, 2) NOT NULL,
            checkout_url TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;

        // Execute the SQL to create the table
        await supabaseAdmin.rpc('pgcrypto_extensions', {});
        await supabaseAdmin.rpc('execute_sql', { sql: createTableSQL });
      }

      console.log('paymongo_sources table exists or was created');
    } catch (tableError: unknown) {
      console.error('Exception checking paymongo_sources table:', tableError);
      // Continue anyway, we'll try to insert the record
    }

    // Store source in database using admin client to bypass RLS
    console.log('Storing source in database using admin client...');
    try {
      const { data: paymongoSource, error: sourceError } = await supabaseAdmin
        .from('paymongo_sources')
        .insert({
          source_id: source.id,
          rental_id: rentalId,
          amount: amount,
          checkout_url: source.attributes.redirect.checkout_url,
          status: source.attributes.status
        })
        .select()
        .single();

      if (sourceError) {
        console.error('Error storing source:', sourceError);
        return NextResponse.json(
          { error: 'Failed to store source', details: sourceError.message },
          { status: 500 }
        );
      }

      if (!paymongoSource) {
        console.error('No source data returned after insert');
        return NextResponse.json(
          { error: 'Failed to store source', details: 'No data returned after insert' },
          { status: 500 }
        );
      }

      console.log('Source stored successfully:', paymongoSource.id);
      return NextResponse.json({
        success: true,
        source: {
          id: paymongoSource.id,
          source_id: source.id,
          checkout_url: source.attributes.redirect.checkout_url,
          status: source.attributes.status
        }
      });
    } catch (storeError: unknown) {
      console.error('Exception storing source:', storeError);
      return NextResponse.json(
        { error: 'Failed to store source', details: storeError instanceof Error ? storeError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Update rental payment status using admin client
    try {
      await supabaseAdmin
        .from('rentals')
        .update({
          payment_source_id: source.id,
          payment_status: 'pending'
        })
        .eq('id', rentalId);

      console.log('Rental payment status updated successfully');
    } catch (updateError: unknown) {
      console.error('Error updating rental payment status:', updateError);
      // We don't return an error here since the source was already created and stored
    }
  } catch (error: unknown) {
    console.error('Error in create-gcash-source API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
