import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    const { shopId } = await request.json();

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('rental_shops')
      .update({ is_verified: true })
      .eq('id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error verifying shop:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // After shop is verified, update referral if applicable
    if (data && data.referrer_id) {
      // Check if the shop has at least one verified vehicle
      const { data: vehicles } = await supabaseAdmin
        .from('vehicles')
        .select('id')
        .eq('shop_id', shopId)
        .eq('is_verified', true);
      const hasVerifiedVehicle = vehicles && vehicles.length > 0;

      // Update the referral record
      await supabaseAdmin
        .from('referrals')
        .update({
          shop_verified: true,
          status: hasVerifiedVehicle ? 'completed' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('referrer_id', data.referrer_id)
        .eq('shop_id', shopId);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { shopId, approve } = await request.json();

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // If rejecting, we'll delete the shop application
    if (approve === false) {
      const { error: deleteError } = await supabaseAdmin
        .from('rental_shops')
        .delete()
        .eq('id', shopId);

      if (deleteError) {
        console.error('Error rejecting shop:', deleteError);
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Shop application rejected' });
    }

    // Get the shop data with owner information
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('rental_shops')
      .select('*, users:owner_id(*)')
      .eq('id', shopId)
      .single();

    if (shopError) {
      console.error('Error fetching shop data:', shopError);
      return NextResponse.json(
        { error: shopError.message },
        { status: 500 }
      );
    }

    // If approving, update is_verified to true
    // SUBSCRIPTION SYSTEM DISABLED: Immediately activate all verified shops
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 5); // Set 5 years from now
    
    const { data, error } = await supabaseAdmin
      .from('rental_shops')
      .update({
        is_verified: true,
        // SUBSCRIPTION SYSTEM DISABLED: All shops get immediate free access
        subscription_status: 'active',
        is_active: true,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: endDate.toISOString()
      })
      .eq('id', shopId)
      .select()
      .single();

    if (error) {
      console.error('Error approving shop:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get the owner's id
    const ownerId = shopData.owner_id;

    // Update the role in the users table if it's not already set
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({ role: 'shop_owner' })
      .eq('id', ownerId);

    if (userUpdateError) {
      console.error('Error updating user role in database:', userUpdateError);
      // We'll continue despite this error since the shop is already approved
    }

    // Update the owner's user metadata in auth
    const { data: userData, error: userGetError } = await supabaseAdmin.auth.admin.getUserById(
      ownerId
    );

    if (userGetError) {
      console.error('Error fetching user data:', userGetError);
      // Continue despite this error
    }

    // Get existing metadata or empty object if none exists
    const existingMetadata = userData?.user?.user_metadata || {};

    // Update the owner's user metadata in auth, preserving existing fields
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      ownerId,
      {
        user_metadata: {
          ...existingMetadata,  // Preserve existing metadata
          role: 'shop_owner',   // Add or update role field
          has_shop: true        // Set has_shop flag to true
        }
      }
    );

    if (authUpdateError) {
      console.error('Error updating user metadata in auth:', authUpdateError);
      // We'll continue despite this error since the shop is already approved
    }

    // Send verification email to shop owner
    try {
      const emailResponse = await fetch(new URL('/api/shops/send-verification-email', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId
        })
      });

      if (!emailResponse.ok) {
        console.error('Error sending verification email:', await emailResponse.text());
      } else {
        console.log('Verification email sent successfully to shop owner');
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue execution even if email fails - the shop is still approved
    }

    // After shop is verified, update referral if applicable
    if (data && data.referrer_id) {
      // Check if the shop has at least one verified vehicle
      const { data: vehicles } = await supabaseAdmin
        .from('vehicles')
        .select('id')
        .eq('shop_id', shopId)
        .eq('is_verified', true);
      const hasVerifiedVehicle = vehicles && vehicles.length > 0;

      // Update the referral record
      await supabaseAdmin
        .from('referrals')
        .update({
          shop_verified: true,
          status: hasVerifiedVehicle ? 'completed' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('referrer_id', data.referrer_id)
        .eq('shop_id', shopId);
    }

    return NextResponse.json({
      ...data,
      user_role_updated: !userUpdateError && !authUpdateError,
      message: 'Shop approved and owner role updated to shop_owner',
      email_sent: true
    });
  } catch (error) {
    console.error('Unexpected error in PATCH:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}