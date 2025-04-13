import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';

// POST /api/shops/toggle-showcase
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

    // Check if user is admin
    const userRole = userData.user.user_metadata?.role || null;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can use this endpoint' }, { status: 403 });
    }

    // Get the shop first to check current showcase status - use admin client
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('rental_shops')
      .select('id, name, is_showcase')
      .eq('id', shop_id)
      .single();
    
    if (shopError || !shopData) {
      console.error("Error fetching shop data:", shopError);
      return NextResponse.json(
        { 
          error: 'Shop not found',
          details: shopError?.message 
        }, 
        { status: 404 }
      );
    }
    
    // Toggle the is_showcase value
    const newShowcaseStatus = !shopData.is_showcase;
    console.log(`Toggling shop ${shop_id} showcase status from ${shopData.is_showcase} to ${newShowcaseStatus}`);
    
    // Update the shop using the admin client
    const { data, error } = await supabaseAdmin
      .from('rental_shops')
      .update({
        is_showcase: newShowcaseStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', shop_id)
      .select('*')  // Select all fields to ensure we get complete data
      .single();    // Get a single record to avoid array wrapping
      
    if (error) {
      console.error("Error updating shop showcase status:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to update shop showcase status', 
          details: error.message,
          code: error.code
        }, 
        { status: 500 }
      );
    }
    
    // In case we didn't get the data back, get it explicitly
    if (!data) {
      const { data: refreshedData, error: refreshError } = await supabaseAdmin
        .from('rental_shops')
        .select('*')
        .eq('id', shop_id)
        .single();
        
      if (refreshError || !refreshedData) {
        console.error("Error retrieving updated shop data:", refreshError);
        return NextResponse.json(
          { 
            error: 'Updated shop but failed to retrieve updated data',
            showcase_status: newShowcaseStatus,  // At least return the new status
            details: refreshError?.message,
            code: refreshError?.code
          }, 
          { status: 500 }
        );
      }
      
      // Return the refreshed data
      return NextResponse.json({
        success: true,
        message: `Shop showcase mode ${newShowcaseStatus ? 'enabled' : 'disabled'} successfully`,
        shop: refreshedData
      });
    }
    
    // Return the data from the update if we got it
    return NextResponse.json({
      success: true,
      message: `Shop showcase mode ${newShowcaseStatus ? 'enabled' : 'disabled'} successfully`,
      shop: data
    });

  } catch (error) {
    console.error('Error in toggle-showcase API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 