import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// POST /api/shops/admin-set-active
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { shop_id, is_active } = await request.json();

    if (!shop_id) {
      return NextResponse.json({ error: 'Missing shop_id parameter' }, { status: 400 });
    }

    if (is_active === undefined) {
      return NextResponse.json({ error: 'Missing is_active parameter' }, { status: 400 });
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

    // Check if user is admin
    const userRole = userData.user.user_metadata?.role || null;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can use this endpoint' }, { status: 403 });
    }

    // Get the shop first
    const { data: shopData, error: shopError } = await supabase
      .from('rental_shops')
      .select('id, name, is_active, subscription_status, subscription_end_date')
      .eq('id', shop_id)
      .single();
    
    if (shopError || !shopData) {
      return NextResponse.json(
        { error: 'Shop not found' }, 
        { status: 404 }
      );
    }
    
    // Also set subscription status appropriately
    const updateData: {
      is_active: boolean;
      updated_at: string;
      subscription_status?: string;
      subscription_end_date?: string;
      subscription_start_date?: string;
    } = {
      is_active: is_active,
      updated_at: new Date().toISOString()
    };
    
    // Update subscription status based on is_active
    if (is_active) {
      updateData.subscription_status = 'active';
      
      // Set default subscription dates if not present
      if (!shopData.subscription_end_date) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 days from now
        updateData.subscription_end_date = endDate.toISOString();
      }
      
      if (!shopData.subscription_start_date) {
        updateData.subscription_start_date = new Date().toISOString();
      }
    } else {
      updateData.subscription_status = 'inactive';
    }

    // Force update the shop using multiple methods to bypass caching
    const { data, error } = await supabase
      .from('rental_shops')
      .update(updateData)
      .eq('id', shop_id)
      .select();
      
    if (error) {
      console.error("Error updating shop active status:", error);
      return NextResponse.json(
        { error: 'Failed to update shop status' }, 
        { status: 500 }
      );
    }
    
    // Force a second update to refresh any caches
    const rpcResponse = await supabase.rpc('admin_refresh_shop', {
      p_shop_id: shop_id,
      p_is_active: is_active
    });
    
    return NextResponse.json({
      success: true,
      message: `Shop ${is_active ? 'activated' : 'deactivated'} successfully`,
      shop: data[0],
      rpc_result: rpcResponse
    });

  } catch (error) {
    console.error('Error in admin-set-active API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 