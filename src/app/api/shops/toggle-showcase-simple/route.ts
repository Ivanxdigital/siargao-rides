import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';

// POST /api/shops/toggle-showcase-simple
export async function POST(request: Request) {
  try {
    const { shop_id } = await request.json();

    if (!shop_id) {
      return NextResponse.json({ error: 'Missing shop_id parameter' }, { status: 400 });
    }

    // Get the shop first
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('rental_shops')
      .select('id, name, is_showcase')
      .eq('id', shop_id)
      .single();
    
    if (shopError || !shopData) {
      console.error("Error fetching shop data:", shopError);
      return NextResponse.json(
        { error: 'Shop not found', details: shopError?.message }, 
        { status: 404 }
      );
    }
    
    // Toggle the is_showcase value
    const newShowcaseStatus = !shopData.is_showcase;
    console.log(`[SIMPLE] Toggling shop ${shop_id} showcase status from ${shopData.is_showcase} to ${newShowcaseStatus}`);
    
    // Update the shop directly
    const { data, error } = await supabaseAdmin
      .from('rental_shops')
      .update({
        is_showcase: newShowcaseStatus
      })
      .eq('id', shop_id)
      .select('id, name, is_showcase');
      
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

    return NextResponse.json({
      success: true,
      message: `Shop showcase mode ${newShowcaseStatus ? 'enabled' : 'disabled'} successfully`,
      shop: data[0] || { id: shop_id, is_showcase: newShowcaseStatus }
    });

  } catch (error) {
    console.error('Error in toggle-showcase-simple API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 