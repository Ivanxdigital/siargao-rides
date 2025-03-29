import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with the service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables for Supabase admin client');
}

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(request: Request) {
  try {
    // Parse the request body
    const { shopId, approve } = await request.json();
    
    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }
    
    // Get the shop to find the owner ID
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('rental_shops')
      .select('owner_id')
      .eq('id', shopId)
      .single();
    
    if (shopError) {
      console.error('Error finding shop:', shopError);
      return NextResponse.json(
        { error: shopError.message },
        { status: 500 }
      );
    }
    
    if (approve) {
      // Update shop to be verified
      const { error: updateError } = await supabaseAdmin
        .from('rental_shops')
        .update({
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId);
      
      if (updateError) {
        console.error('Error updating shop:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
      
      // Update user metadata to set role to shop_owner
      const { error: userError } = await supabaseAdmin
        .auth.admin.updateUserById(
          shop.owner_id,
          {
            user_metadata: { role: 'shop_owner' }
          }
        );
      
      if (userError) {
        console.error('Error updating user role:', userError);
        return NextResponse.json(
          { error: userError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, message: 'Shop approved successfully' });
    } else {
      // Delete the shop if not approved
      const { error: deleteError } = await supabaseAdmin
        .from('rental_shops')
        .delete()
        .eq('id', shopId);
      
      if (deleteError) {
        console.error('Error deleting shop:', deleteError);
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, message: 'Shop rejected successfully' });
    }
  } catch (error) {
    console.error('Error handling shop verification:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 