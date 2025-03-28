import { supabase } from './supabase';
import { User } from './types';

export type AuthUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role: 'tourist' | 'shop_owner' | 'admin';
};

export async function signUp({
  email,
  password,
  firstName,
  lastName,
  role = 'tourist',
}: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'tourist' | 'shop_owner' | 'admin';
}): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    // Sign up with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { 
        user: null, 
        error: 'Verification email sent. Please check your email to confirm your account.' 
      };
    }

    // Create a profile in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
      })
      .select()
      .single();

    if (userError) {
      return { user: null, error: userError.message };
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar_url: userData.avatar_url,
        role: userData.role,
      },
      error: null,
    };
  } catch (error) {
    return { user: null, error: 'An unexpected error occurred during sign up.' };
  }
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!data.user) {
      return { user: null, error: 'No user found.' };
    }

    // Get the user profile from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      return { user: null, error: userError.message };
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar_url: userData.avatar_url,
        role: userData.role,
      },
      error: null,
    };
  } catch (error) {
    return { user: null, error: 'An unexpected error occurred during sign in.' };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (error) {
    return { error: 'An unexpected error occurred during sign out.' };
  }
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: 'An unexpected error occurred while requesting password reset.' };
  }
}

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: 'An unexpected error occurred while updating password.' };
  }
}

export async function updateUserProfile(
  userId: string,
  profile: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    phone_number?: string;
  }
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { user: null, error: error.message };
    }

    return {
      user: {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url,
        role: data.role,
      },
      error: null,
    };
  } catch (error) {
    return { user: null, error: 'An unexpected error occurred while updating profile.' };
  }
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get the user profile from the database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      avatar_url: data.avatar_url,
      role: data.role,
    };
  } catch (error) {
    return null;
  }
} 