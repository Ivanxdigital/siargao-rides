import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// PATCH: Update shop details
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
    const updateData = await request.json();

    // Remove fields that shouldn't be updated directly
    const {
      id,
      owner_id,
      created_at,
      updated_at,
      owner,
      stats,
      ...allowedUpdates
    } = updateData;

    // Validate shop exists
    const { data: existingShop, error: fetchError } = await supabaseAdmin
      .from('rental_shops')
      .select('id')
      .eq('id', shopId)
      .single();

    if (fetchError || !existingShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Update the shop
    const { data: updatedShop, error: updateError } = await supabaseAdmin
      .from('rental_shops')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', shopId)
      .select(`
        *,
        owner:users!rental_shops_owner_id_fkey (
          id,
          email,
          first_name,
          last_name,
          phone_number,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating shop:', updateError);
      return NextResponse.json(
        { error: 'Failed to update shop', details: updateError.message },
        { status: 500 }
      );
    }

    // Update user metadata if shop owner status changed
    if ('is_active' in allowedUpdates || 'is_verified' in allowedUpdates) {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        updatedShop.owner_id,
        {
          user_metadata: {
            shop_active: updatedShop.is_active,
            shop_verified: updatedShop.is_verified
          }
        }
      );

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      shop: updatedShop,
      message: 'Shop updated successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/shops/[shopId]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a shop
export async function DELETE(
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

    // Get shop details before deletion
    const { data: shop, error: fetchError } = await supabaseAdmin
      .from('rental_shops')
      .select('id, owner_id, name')
      .eq('id', shopId)
      .single();

    if (fetchError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Check if shop has active rentals
    const { count: activeRentalsCount } = await supabaseAdmin
      .from('rentals')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .in('status', ['pending', 'confirmed']);

    if (activeRentalsCount && activeRentalsCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete shop with active rentals',
          details: `This shop has ${activeRentalsCount} active rental(s). Please complete or cancel them first.`
        },
        { status: 400 }
      );
    }

    // Start a transaction-like operation
    // Delete in order to handle foreign key constraints

    // 1. Delete reviews
    const { error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('shop_id', shopId);

    if (reviewsError) {
      console.error('Error deleting reviews:', reviewsError);
      return NextResponse.json(
        { error: 'Failed to delete shop reviews', details: reviewsError.message },
        { status: 500 }
      );
    }

    // 2. Delete vehicle images
    const { data: vehicles } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('shop_id', shopId);

    if (vehicles && vehicles.length > 0) {
      const vehicleIds = vehicles.map(v => v.id);
      const { error: imagesError } = await supabaseAdmin
        .from('vehicle_images')
        .delete()
        .in('vehicle_id', vehicleIds);

      if (imagesError) {
        console.error('Error deleting vehicle images:', imagesError);
      }
    }

    // 3. Delete vehicles
    const { error: vehiclesError } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('shop_id', shopId);

    if (vehiclesError) {
      console.error('Error deleting vehicles:', vehiclesError);
      return NextResponse.json(
        { error: 'Failed to delete shop vehicles', details: vehiclesError.message },
        { status: 500 }
      );
    }

    // 4. Delete rentals (only completed/cancelled ones should remain)
    const { error: rentalsError } = await supabaseAdmin
      .from('rentals')
      .delete()
      .eq('shop_id', shopId);

    if (rentalsError) {
      console.error('Error deleting rentals:', rentalsError);
      // Don't fail here, as we might want to keep rental history
    }

    // 5. Delete the shop
    const { error: deleteError } = await supabaseAdmin
      .from('rental_shops')
      .delete()
      .eq('id', shopId);

    if (deleteError) {
      console.error('Error deleting shop:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete shop', details: deleteError.message },
        { status: 500 }
      );
    }

    // 6. Update user's has_shop status
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({ has_shop: false })
      .eq('id', shop.owner_id);

    if (userUpdateError) {
      console.error('Error updating user has_shop status:', userUpdateError);
      // Don't fail the request
    }

    // 7. Update user metadata
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      shop.owner_id,
      {
        user_metadata: {
          has_shop: false,
          shop_active: false,
          shop_verified: false
        }
      }
    );

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Don't fail the request
    }

    return NextResponse.json({
      message: 'Shop deleted successfully',
      deletedShop: {
        id: shop.id,
        name: shop.name
      }
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/shops/[shopId]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}