"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { 
  User,
  Session,
  createClientComponentClient
} from '@supabase/auth-helpers-nextjs';
import { useRouter } from "next/navigation";

interface VerificationResult {
  error: any;
  success: boolean;
  details?: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  resendVerificationEmail: (email: string) => Promise<VerificationResult>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  register: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  resendVerificationEmail: async () => ({ error: null, success: false, details: null }),
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      
      // Check if user is admin
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        setIsAdmin(role === 'admin');
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        // Check if user is admin
        if (session?.user) {
          const role = session.user.user_metadata?.role;
          setIsAdmin(role === 'admin');
        } else {
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);
    
    if (!error) {
      router.push("/dashboard");
      router.refresh();
    }
    
    return { error };
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string,
    role: string
  ) => {
    setIsLoading(true);
    
    try {
      // Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Create a record in our users table via API route
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: authData.user.id,
            email,
            firstName,
            lastName,
            role,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create user record');
        }
      }
      
      setIsLoading(false);
      router.push("/verify-email");
      return { error: null };
    } catch (error) {
      setIsLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (!error) {
      router.push("/sign-in");
    }

    return { error };
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      console.log(`Attempting to send verification email to: ${email}`);
      
      // First check if the email exists in our system
      const { data: userExists, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking if user exists:', checkError);
        return { 
          error: { message: `Error verifying email address: ${checkError.message}` }, 
          success: false,
          details: null
        };
      }
      
      if (!userExists) {
        console.warn(`Email address ${email} not found in our system`);
        return { 
          error: { message: 'Email address not found in our system' }, 
          success: false, 
          details: null
        };
      }
      
      // Attempt to resend the verification email
      const { error, data } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Supabase auth.resend error:', error);
        return { 
          error, 
          success: false,
          details: {
            message: error.message,
            status: error.status || 'unknown',
            requestTime: new Date().toISOString()
          } 
        };
      }
      
      console.log('Verification email resend successful:', data);
      return { 
        error: null, 
        success: true,
        details: {
          email,
          timestamp: new Date().toISOString(),
          provider: 'supabase',
        } 
      };
    } catch (error) {
      console.error('Unexpected error in resendVerificationEmail:', error);
      return { 
        error, 
        success: false, 
        details: {
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.name : 'Unknown',
          errorDetail: error instanceof Error ? error.message : String(error)
        }
      };
    }
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
    register,
    resetPassword,
    updatePassword,
    resendVerificationEmail,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 