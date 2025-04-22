import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/admin';

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
    // This section would need to be customized based on your database schema
    // Here's a simple example deleting from a 'profiles' table
    try {
      // Check for and handle related data (bookings, shops, etc.)
      // E.g., delete or reassign bookings and other user data

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
        message: 'User deleted successfully'
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