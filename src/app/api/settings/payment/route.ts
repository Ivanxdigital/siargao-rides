import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/settings/payment - Get payment settings
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get current session to check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch payment settings from system_settings table
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'payment_settings')
      .single();

    if (error) {
      console.error('Error fetching payment settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: data.value });
  } catch (error: any) {
    console.error('Error in GET /api/settings/payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/settings/payment - Update payment settings (admin only)
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    // Get current session to check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = userData.user.user_metadata?.role || null;
    const isAdmin = userRole === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can update payment settings' }, { status: 403 });
    }

    // Validate input
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Update payment settings
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        value: body
        // Let Supabase handle the updated_at timestamp
      })
      .eq('key', 'payment_settings')
      .select();

    if (error) {
      console.error('Error updating payment settings:', error);
      return NextResponse.json(
        { error: 'Failed to update payment settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment settings updated successfully',
      settings: data[0].value
    });
  } catch (error: any) {
    console.error('Error in POST /api/settings/payment:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Internal server error', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
