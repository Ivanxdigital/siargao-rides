import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// PATCH: Toggle shop visibility
export async function PATCH(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    // Check if user is authenticated and is admin
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!session || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const shopId = params.shopId;
    const { is_active } = await request.json();

    // Validate shop exists
    const { data: existingShop, error: fetchError } = await supabaseAdmin
      .from('rental_shops')
      .select('id, name, is_active, owner_id')
      .eq('id', shopId)
      .single();

    if (fetchError || !existingShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Update shop visibility
    const { data: updatedShop, error: updateError } = await supabaseAdmin
      .from('rental_shops')
      .update({
        is_active: is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', shopId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating shop visibility:', updateError);
      return NextResponse.json(
        { error: 'Failed to update shop visibility', details: updateError.message },
        { status: 500 }
      );
    }

    // Update user metadata
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      existingShop.owner_id,
      {
        user_metadata: {
          shop_active: is_active
        }
      }
    );

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Don't fail the request, just log the error
    }

    // Log the visibility change
    console.log(`Shop ${shopId} visibility changed to ${is_active ? 'active' : 'inactive'} by admin ${user.id}`);

    return NextResponse.json({
      shop: updatedShop,
      message: `Shop ${is_active ? 'activated' : 'deactivated'} successfully`,
      previousState: existingShop.is_active,
      newState: is_active
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/shops/[shopId]/visibility:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}