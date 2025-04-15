import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/admin';
import { v4 as uuidv4 } from 'uuid';

// Generate a random password
function generateRandomPassword(length = 10) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Generate a random email with a consistent pattern
function generateTestEmail(role: string) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  // Use gmail.com domain which is more likely to be accepted by Supabase Auth
  return `test.${role}.${timestamp}.${randomString}@gmail.com`;
}

export async function POST(request: Request) {
  try {
    // Verify the user is authenticated and is an admin
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    console.log('Session user:', session?.user?.id);
    console.log('User metadata:', session?.user?.user_metadata);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in first' },
        { status: 401 }
      );
    }

    // Special case for Ivan's account
    if (session.user.email === 'ivanxdigital@gmail.com') {
      console.log('Special access granted for Ivan\'s account');
      // Continue with the request
    } else {
      // Check if user is admin from user metadata
      const userRole = session.user.user_metadata?.role;
      const isAdmin = userRole === 'admin';

      // Also check the role in the users table as a fallback
      if (!isAdmin) {
        console.log('User role from metadata:', userRole);
        console.log('Checking role in users table as fallback...');

        // Use admin client to check the role in the users table
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!userError && userData && userData.role === 'admin') {
          console.log('User is admin based on users table role');
          // User is admin based on the users table
        } else {
          return NextResponse.json(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
          );
        }
      }
    }

    // Get request body
    const { role, emailPrefix } = await request.json();

    // Validate role
    if (!role || !['tourist', 'shop_owner'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "tourist" or "shop_owner"' },
        { status: 400 }
      );
    }

    // Generate email and password
    const timestamp = Date.now();
    const email = emailPrefix
      ? `test.${emailPrefix}.${timestamp}@gmail.com`
      : generateTestEmail(role);
    const password = generateRandomPassword();

    console.log('Generated email for test account:', email);

    // Create user with Supabase Auth Admin API
    console.log('Creating auth user with email:', email);

    let authUser;
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // This bypasses email verification
        user_metadata: {
          role,
          is_test_account: true,
          created_by: session.user.id,
          created_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Error creating auth user:', error);
        return NextResponse.json(
          { error: `Failed to create auth user: ${error.message}` },
          { status: 500 }
        );
      }

      authUser = data;
      console.log('Auth user created successfully:', authUser.user.id);
    } catch (authCreateError) {
      console.error('Exception during auth user creation:', authCreateError);
      return NextResponse.json(
        { error: `Failed to create auth user: ${authCreateError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Check if user already exists in the database
    let dbUser;

    try {
      console.log('Checking if user already exists in the database with ID:', authUser.user.id);
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, role')
        .eq('id', authUser.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is the code for 'no rows returned'
        console.log('Error checking for existing user:', checkError);
      }

      if (existingUser) {
        console.log('User already exists in the database, using existing record:', existingUser);
        dbUser = existingUser;

        // Update the role if it's different
        if (existingUser.role !== role) {
          console.log(`Updating user role from ${existingUser.role} to ${role}`);
          const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('users')
            .update({ role: role })
            .eq('id', authUser.user.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating user role:', updateError);
          } else if (updatedUser) {
            console.log('User role updated successfully');
            dbUser = updatedUser;
          }
        }
      } else {
        // Create user record in the database
        console.log('Creating new user record in the database');
        const userData = {
          id: authUser.user.id,
          email: email,
          first_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          last_name: `User ${Math.floor(Math.random() * 1000)}`,
          role: role,
        };

        console.log('User data to insert:', userData);

        // Try to create the user record
        try {
          const { data: newUser, error: dbError } = await supabaseAdmin
            .from('users')
            .insert(userData)
            .select()
            .single();

          if (dbError) {
            console.error('Error creating user record:', dbError);
            throw dbError;
          }

          console.log('User record created successfully:', newUser);
          dbUser = newUser;
        } catch (insertError) {
          console.error('Exception during user record creation:', insertError);

          // Check if the user already exists (might have been created in a race condition)
          console.log('Checking again if user exists after insert error');
          const { data: existingUserRetry } = await supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name, role')
            .eq('id', authUser.user.id)
            .single();

          if (existingUserRetry) {
            console.log('User found on retry, using existing record:', existingUserRetry);
            dbUser = existingUserRetry;
          } else {
            // If there was an error creating the user record and it doesn't exist, delete the auth user
            console.log('Deleting auth user due to database error');
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);

            return NextResponse.json(
              { error: `Failed to create user record: ${insertError.message || 'Unknown error'}` },
              { status: 500 }
            );
          }
        }
      }
    } catch (dbOperationError) {
      console.error('Unexpected error during database operations:', dbOperationError);

      // Try to delete the auth user if there was an error
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      } catch (deleteError) {
        console.error('Error deleting auth user after database error:', deleteError);
      }

      return NextResponse.json(
        { error: `Unexpected error: ${dbOperationError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Return the created user with credentials
    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        email,
        password, // Include password for testing purposes
        role,
        first_name: dbUser?.first_name || `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        last_name: dbUser?.last_name || `User ${Math.floor(Math.random() * 1000)}`,
      }
    });

  } catch (error) {
    console.error('Error creating test account:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
