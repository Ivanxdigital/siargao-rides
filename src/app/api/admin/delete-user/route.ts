import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/admin';
import { Database } from '@/lib/database.types';

export async function POST(request: Request) {
  try {
    // Verify the user is authenticated and is an admin
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in first' },
        { status: 401 }
      );
    }

    // Check if user is admin from user metadata or database role
    const userMetadataRole = session.user.user_metadata?.role;
    let isAdmin = userMetadataRole === 'admin';

    // If not admin from metadata, check the database role
    if (!isAdmin) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user role:', userError);
        return NextResponse.json(
          { error: 'Failed to verify admin status' },
          { status: 500 }
        );
      }

      isAdmin = userData?.role === 'admin';
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse the request body
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if the user to delete exists and is not an admin
    const { data: userToDelete, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userCheckError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admin users
    if (userToDelete.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Delete the user's data from related tables first
    try {
      // Check if the user is a shop owner
      const { data: shops, error: shopsError } = await supabaseAdmin
        .from('rental_shops')
        .select('id')
        .eq('owner_id', userId);

      if (shopsError) {
        console.error('Error checking for user shops:', shopsError);
        return NextResponse.json(
          { error: `Failed to check for user shops: ${shopsError.message}` },
          { status: 500 }
        );
      }

      // If the user is a shop owner, we need to delete all related data
      if (shops && shops.length > 0) {
        console.log(`User ${userId} is a shop owner with ${shops.length} shops. Deleting related data...`);

        // Get all shop IDs
        const shopIds = shops.map(shop => shop.id);

        // For each shop, delete all related data
        for (const shopId of shopIds) {
          console.log(`Processing shop ${shopId}...`);

          // 1. Delete all vehicle images for vehicles in this shop
          const { data: vehicles, error: vehiclesError } = await supabaseAdmin
            .from('vehicles')
            .select('id')
            .eq('shop_id', shopId);

          if (vehiclesError) {
            console.error(`Error fetching vehicles for shop ${shopId}:`, vehiclesError);
            return NextResponse.json(
              { error: `Failed to fetch vehicles: ${vehiclesError.message}` },
              { status: 500 }
            );
          }

          if (vehicles && vehicles.length > 0) {
            const vehicleIds = vehicles.map(vehicle => vehicle.id);

            // Delete vehicle images
            const { error: imagesError } = await supabaseAdmin
              .from('vehicle_images')
              .delete()
              .in('vehicle_id', vehicleIds);

            if (imagesError) {
              console.error(`Error deleting vehicle images:`, imagesError);
              return NextResponse.json(
                { error: `Failed to delete vehicle images: ${imagesError.message}` },
                { status: 500 }
              );
            }

            // Delete vehicle blocked dates
            const { error: blockedDatesError } = await supabaseAdmin
              .from('vehicle_blocked_dates')
              .delete()
              .in('vehicle_id', vehicleIds);

            if (blockedDatesError) {
              console.error(`Error deleting vehicle blocked dates:`, blockedDatesError);
              return NextResponse.json(
                { error: `Failed to delete vehicle blocked dates: ${blockedDatesError.message}` },
                { status: 500 }
              );
            }

            // Delete vehicle reviews
            const { error: reviewsError } = await supabaseAdmin
              .from('vehicle_reviews')
              .delete()
              .in('vehicle_id', vehicleIds);

            if (reviewsError) {
              console.error(`Error deleting vehicle reviews:`, reviewsError);
              return NextResponse.json(
                { error: `Failed to delete vehicle reviews: ${reviewsError.message}` },
                { status: 500 }
              );
            }

            // Delete favorites
            const { error: favoritesError } = await supabaseAdmin
              .from('favorites')
              .delete()
              .in('vehicle_id', vehicleIds);

            if (favoritesError) {
              console.error(`Error deleting favorites:`, favoritesError);
              return NextResponse.json(
                { error: `Failed to delete favorites: ${favoritesError.message}` },
                { status: 500 }
              );
            }

            // Delete vehicles
            const { error: deleteVehiclesError } = await supabaseAdmin
              .from('vehicles')
              .delete()
              .in('id', vehicleIds);

            if (deleteVehiclesError) {
              console.error(`Error deleting vehicles:`, deleteVehiclesError);
              return NextResponse.json(
                { error: `Failed to delete vehicles: ${deleteVehiclesError.message}` },
                { status: 500 }
              );
            }
          }

          // 2. Handle rentals/bookings for this shop
          const { data: rentals, error: rentalsError } = await supabaseAdmin
            .from('rentals')
            .select('id')
            .eq('shop_id', shopId);

          if (rentalsError) {
            console.error(`Error fetching rentals for shop ${shopId}:`, rentalsError);
            return NextResponse.json(
              { error: `Failed to fetch rentals: ${rentalsError.message}` },
              { status: 500 }
            );
          }

          if (rentals && rentals.length > 0) {
            const rentalIds = rentals.map(rental => rental.id);

            // Delete booking history
            const { error: bookingHistoryError } = await supabaseAdmin
              .from('booking_history')
              .delete()
              .in('booking_id', rentalIds);

            if (bookingHistoryError) {
              console.error(`Error deleting booking history:`, bookingHistoryError);
              return NextResponse.json(
                { error: `Failed to delete booking history: ${bookingHistoryError.message}` },
                { status: 500 }
              );
            }

            // Delete date change requests
            const { error: dateChangeError } = await supabaseAdmin
              .from('date_change_requests')
              .delete()
              .in('booking_id', rentalIds);

            if (dateChangeError) {
              console.error(`Error deleting date change requests:`, dateChangeError);
              return NextResponse.json(
                { error: `Failed to delete date change requests: ${dateChangeError.message}` },
                { status: 500 }
              );
            }

            // Delete paymongo sources
            const { error: paymongoSourcesError } = await supabaseAdmin
              .from('paymongo_sources')
              .delete()
              .in('rental_id', rentalIds);

            if (paymongoSourcesError) {
              console.error(`Error deleting paymongo sources:`, paymongoSourcesError);
              return NextResponse.json(
                { error: `Failed to delete paymongo sources: ${paymongoSourcesError.message}` },
                { status: 500 }
              );
            }

            // Delete paymongo payments
            const { error: paymongoPaymentsError } = await supabaseAdmin
              .from('paymongo_payments')
              .delete()
              .in('rental_id', rentalIds);

            if (paymongoPaymentsError) {
              console.error(`Error deleting paymongo payments:`, paymongoPaymentsError);
              return NextResponse.json(
                { error: `Failed to delete paymongo payments: ${paymongoPaymentsError.message}` },
                { status: 500 }
              );
            }

            // Delete deposit payouts
            const { error: depositPayoutsError } = await supabaseAdmin
              .from('deposit_payouts')
              .delete()
              .in('rental_id', rentalIds);

            if (depositPayoutsError) {
              console.error(`Error deleting deposit payouts:`, depositPayoutsError);
              return NextResponse.json(
                { error: `Failed to delete deposit payouts: ${depositPayoutsError.message}` },
                { status: 500 }
              );
            }

            // Delete reviews
            const { error: reviewsError } = await supabaseAdmin
              .from('reviews')
              .delete()
              .in('rental_id', rentalIds);

            if (reviewsError) {
              console.error(`Error deleting reviews:`, reviewsError);
              return NextResponse.json(
                { error: `Failed to delete reviews: ${reviewsError.message}` },
                { status: 500 }
              );
            }

            // Delete rentals
            const { error: deleteRentalsError } = await supabaseAdmin
              .from('rentals')
              .delete()
              .in('id', rentalIds);

            if (deleteRentalsError) {
              console.error(`Error deleting rentals:`, deleteRentalsError);
              return NextResponse.json(
                { error: `Failed to delete rentals: ${deleteRentalsError.message}` },
                { status: 500 }
              );
            }
          }

          // 3. Delete shop reviews
          const { error: shopReviewsError } = await supabaseAdmin
            .from('reviews')
            .delete()
            .eq('shop_id', shopId);

          if (shopReviewsError) {
            console.error(`Error deleting shop reviews:`, shopReviewsError);
            return NextResponse.json(
              { error: `Failed to delete shop reviews: ${shopReviewsError.message}` },
              { status: 500 }
            );
          }

          // 4. Delete conversations related to this shop
          const { data: conversations, error: conversationsError } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('shop_id', shopId);

          if (conversationsError) {
            console.error(`Error fetching conversations for shop ${shopId}:`, conversationsError);
            return NextResponse.json(
              { error: `Failed to fetch conversations: ${conversationsError.message}` },
              { status: 500 }
            );
          }

          if (conversations && conversations.length > 0) {
            const conversationIds = conversations.map(conv => conv.id);

            // Delete conversation messages
            const { error: messagesError } = await supabaseAdmin
              .from('conversation_messages')
              .delete()
              .in('conversation_id', conversationIds);

            if (messagesError) {
              console.error(`Error deleting conversation messages:`, messagesError);
              return NextResponse.json(
                { error: `Failed to delete conversation messages: ${messagesError.message}` },
                { status: 500 }
              );
            }

            // Delete conversation participants
            const { error: participantsError } = await supabaseAdmin
              .from('conversation_participants')
              .delete()
              .in('conversation_id', conversationIds);

            if (participantsError) {
              console.error(`Error deleting conversation participants:`, participantsError);
              return NextResponse.json(
                { error: `Failed to delete conversation participants: ${participantsError.message}` },
                { status: 500 }
              );
            }

            // Delete conversations
            const { error: deleteConversationsError } = await supabaseAdmin
              .from('conversations')
              .delete()
              .in('id', conversationIds);

            if (deleteConversationsError) {
              console.error(`Error deleting conversations:`, deleteConversationsError);
              return NextResponse.json(
                { error: `Failed to delete conversations: ${deleteConversationsError.message}` },
                { status: 500 }
              );
            }
          }

          // 5. Delete referrals related to this shop
          const { error: referralsError } = await supabaseAdmin
            .from('referrals')
            .delete()
            .eq('shop_id', shopId);

          if (referralsError) {
            console.error(`Error deleting referrals:`, referralsError);
            return NextResponse.json(
              { error: `Failed to delete referrals: ${referralsError.message}` },
              { status: 500 }
            );
          }
        }

        // 6. Delete all shops owned by this user
        const { error: deleteShopsError } = await supabaseAdmin
          .from('rental_shops')
          .delete()
          .eq('owner_id', userId);

        if (deleteShopsError) {
          console.error('Error deleting shops:', deleteShopsError);
          return NextResponse.json(
            { error: `Failed to delete shops: ${deleteShopsError.message}` },
            { status: 500 }
          );
        }
      }

      // Delete any rentals where the user is a customer
      const { data: userRentals, error: userRentalsError } = await supabaseAdmin
        .from('rentals')
        .select('id')
        .eq('user_id', userId);

      if (userRentalsError) {
        console.error('Error fetching user rentals:', userRentalsError);
        return NextResponse.json(
          { error: `Failed to fetch user rentals: ${userRentalsError.message}` },
          { status: 500 }
        );
      }

      if (userRentals && userRentals.length > 0) {
        const rentalIds = userRentals.map(rental => rental.id);

        // Delete related booking data (similar to above)
        // Delete booking history
        await supabaseAdmin
          .from('booking_history')
          .delete()
          .in('booking_id', rentalIds);

        // Delete date change requests
        await supabaseAdmin
          .from('date_change_requests')
          .delete()
          .in('booking_id', rentalIds);

        // Delete paymongo sources
        await supabaseAdmin
          .from('paymongo_sources')
          .delete()
          .in('rental_id', rentalIds);

        // Delete paymongo payments
        await supabaseAdmin
          .from('paymongo_payments')
          .delete()
          .in('rental_id', rentalIds);

        // Delete deposit payouts
        await supabaseAdmin
          .from('deposit_payouts')
          .delete()
          .in('rental_id', rentalIds);

        // Delete reviews
        await supabaseAdmin
          .from('reviews')
          .delete()
          .in('rental_id', rentalIds);

        // Delete rentals
        const { error: deleteUserRentalsError } = await supabaseAdmin
          .from('rentals')
          .delete()
          .in('id', rentalIds);

        if (deleteUserRentalsError) {
          console.error('Error deleting user rentals:', deleteUserRentalsError);
          return NextResponse.json(
            { error: `Failed to delete user rentals: ${deleteUserRentalsError.message}` },
            { status: 500 }
          );
        }
      }

      // Delete user's favorites
      const { error: deleteFavoritesError } = await supabaseAdmin
        .from('favorites')
        .delete()
        .eq('user_id', userId);

      if (deleteFavoritesError) {
        console.error('Error deleting user favorites:', deleteFavoritesError);
        return NextResponse.json(
          { error: `Failed to delete user favorites: ${deleteFavoritesError.message}` },
          { status: 500 }
        );
      }

      // Delete user's conversation participants
      const { error: deleteParticipantsError } = await supabaseAdmin
        .from('conversation_participants')
        .delete()
        .eq('user_id', userId);

      if (deleteParticipantsError) {
        console.error('Error deleting user conversation participants:', deleteParticipantsError);
        return NextResponse.json(
          { error: `Failed to delete user conversation participants: ${deleteParticipantsError.message}` },
          { status: 500 }
        );
      }

      // Delete the user from the users table
      const { error: deleteUserError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteUserError) {
        console.error('Error deleting user record:', deleteUserError);
        return NextResponse.json(
          { error: `Failed to delete user record: ${deleteUserError.message}` },
          { status: 500 }
        );
      }

      // Delete the user from Auth
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError);
        return NextResponse.json(
          { error: `Failed to delete auth user: ${deleteAuthError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User and all related data deleted successfully'
      });
    } catch (error) {
      console.error('Error during user deletion process:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}