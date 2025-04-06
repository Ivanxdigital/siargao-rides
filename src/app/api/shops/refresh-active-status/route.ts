import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// POST /api/shops/refresh-active-status
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { shop_id } = await request.json();

    if (!shop_id) {
      return NextResponse.json({ error: 'Missing shop_id parameter' }, { status: 400 });
    }

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

    const userRole = userData.user.user_metadata?.role || null;
    const isAdmin = userRole === 'admin';

    // Get the shop
    const { data: shopData, error: shopError } = await supabase
      .from('rental_shops')
      .select('id, is_active, subscription_status, subscription_end_date, owner_id')
      .eq('id', shop_id)
      .single();

    if (shopError || !shopData) {
      return NextResponse.json(
        { error: 'Shop not found' }, 
        { status: 404 }
      );
    }

    // Check authorization - must be admin or shop owner
    if (!isAdmin && shopData.owner_id !== userData.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to refresh this shop' }, 
        { status: 403 }
      );
    }

    // Check if subscription is active and end date is in the future
    const isSubscriptionActive = 
      shopData.subscription_status === 'active' && 
      shopData.subscription_end_date && 
      new Date(shopData.subscription_end_date) > new Date();

    // Update shop active status if needed
    if (isSubscriptionActive !== shopData.is_active) {
      const { data: updateResult, error: updateError } = await supabase
        .from('rental_shops')
        .update({ 
          is_active: isSubscriptionActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', shop_id)
        .select('id, name, is_active, subscription_status');

      if (updateError) {
        console.error("Error updating shop active status:", updateError);
        return NextResponse.json(
          { error: 'Failed to update shop status' }, 
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Shop status refreshed',
        previous_status: shopData.is_active,
        current_status: isSubscriptionActive,
        shop: updateResult[0]
      });
    }

    // No update needed
    return NextResponse.json({
      success: true,
      message: 'Shop status already up-to-date',
      status: shopData.is_active
    });

  } catch (error) {
    console.error('Error in refresh shop status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 