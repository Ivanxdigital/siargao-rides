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
      try {
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
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
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
    try {
      console.log(`Attempting to sign in with email: ${email}`);
      
      // Track retry attempts with exponential backoff
      let attempts = 0;
      const maxRetries = 1; // Reduce to only 1 retry to avoid excessive attempts
      let lastError: any = null;
      
      // Try up to maxRetries times with exponential backoff
      while (attempts <= maxRetries) {
        try {
          // Add a longer initial delay that increases with each previous failure
          const initialDelay = attempts === 0 ? 300 : 2000;
          await new Promise(resolve => setTimeout(resolve, initialDelay));
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          console.log("Auth response:", { 
            session: data?.session ? "exists" : "null", 
            user: data?.user ? "exists" : "null",
            error: error ? { 
              message: error.message, 
              status: error.status, 
              name: error.name 
            } : "none" 
          });
          
          // If successful or non-retriable error, break out of the retry loop
          if (!error || error.status !== 429) {
            lastError = error;
            break;
          }
          
          // If we hit rate limit and have retries left, wait with exponential backoff
          lastError = error;
          attempts++;
          
          if (attempts <= maxRetries) {
            // More aggressive exponential backoff: 5s for the first retry
            const backoffTime = 5000;
            console.log(`Rate limit hit, retrying in ${backoffTime}ms (attempt ${attempts}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        } catch (retryError) {
          // For unexpected errors, stop retrying
          lastError = retryError;
          break;
        }
      }
      
      // Process the final result after all retries
      if (lastError) {
        console.error("Sign in error after retries:", lastError);
        
        // Handle rate limit errors specifically
        if (
          (typeof lastError.message === 'string' && (
            lastError.message.toLowerCase().includes("rate limit") || 
            lastError.message.toLowerCase().includes("request rate limit reached") ||
            lastError.message.toLowerCase().includes("too many requests")
          )) || 
          lastError.status === 429
        ) {
          console.warn("Rate limit reached during sign-in attempt");
          return { 
            error: {
              message: "Too many sign-in attempts. Please wait before trying again.",
              code: "over_request_rate_limit",
              status: 429
            } 
          };
        }
        
        // Handle invalid credentials
        if (lastError.message?.includes("Invalid login credentials")) {
          console.warn("Invalid login credentials");
          return {
            error: {
              message: "The email or password you entered is incorrect.",
              code: "invalid_credentials",
              status: lastError.status
            }
          };
        }
        
        // General error handling
        return { 
          error: {
            message: lastError.message || "Authentication failed",
            code: lastError.name || "auth_error",
            status: lastError.status || 400
          } 
        };
      }
      
      // Check if we have a valid session
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        console.log("Sign in successful, redirecting to dashboard");
        router.push("/dashboard");
        router.refresh();
        return { error: null };
      } 
      
      // No session but also no error
      console.warn("Sign in response had no session and no error");
      return { 
        error: {
          message: "Unable to sign in. Please try again.",
          code: "no_session",
          status: 400
        }
      };
    } catch (err) {
      console.error("Unexpected sign in error:", err);
      return { 
        error: {
          message: err instanceof Error ? err.message : "An unexpected error occurred during sign in",
          code: "unexpected_error",
          status: 500,
          details: err instanceof Error ? err.stack : String(err)
        } 
      };
    } finally {
      setIsLoading(false);
    }
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