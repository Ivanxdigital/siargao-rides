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
    const { email, password, firstName, lastName, role } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!role || !['tourist', 'shop_owner', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "tourist", "shop_owner", or "admin"' },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth Admin API
    console.log('Creating auth user with email:', email);

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Bypass email verification
      user_metadata: {
        role,
        created_by: session.user.id,
        created_at: new Date().toISOString()
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    // Create user record in database
    const userData = {
      id: authUser.user.id,
      email,
      first_name: firstName || '',
      last_name: lastName || '',
      role,
    };

    const { data: newUser, error: dbError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (dbError) {
      console.error('Error creating user record:', dbError);
      
      // Try to delete the auth user if the database operation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      } catch (deleteError) {
        console.error('Error deleting auth user after database error:', deleteError);
      }

      return NextResponse.json(
        { error: `Failed to create user record: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      }
    });

  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 