import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting update-deposit-status API call');
    const supabase = createServerComponentClient({ cookies });

    // Get the current authenticated user using the secure method
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
    const { rentalId } = await request.json();

    console.log('Request data:', { rentalId });

    // Validate input
    if (!rentalId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing rental ID' },
        { status: 400 }
      );
    }

    // Check if rental exists and belongs to the user
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, user_id, deposit_required, deposit_paid')
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
        { success: true, message: 'Deposit is already paid' }
      );
    }

    // Update rental to mark deposit as paid
    const { error: updateError } = await supabaseAdmin
      .from('rentals')
      .update({
        deposit_paid: true,
        status: 'confirmed', // Update status to confirmed once deposit is paid
        updated_at: new Date().toISOString()
      })
      .eq('id', rentalId);

    if (updateError) {
      console.error('Error updating deposit status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update deposit status', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('Deposit status updated successfully for rental:', rentalId);

    return NextResponse.json({
      success: true,
      message: 'Deposit status updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error in update-deposit-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
