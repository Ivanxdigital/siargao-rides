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
import { subscribeToBookingNotifications } from '@/lib/notifications';

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
  isSettingUp: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  resendVerificationEmail: (email: string) => Promise<VerificationResult>;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  isSettingUp: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  register: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  resendVerificationEmail: async () => ({ error: null, success: false, details: null }),
  isAdmin: false,
  signInWithGoogle: async () => ({ error: null }),
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
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [notificationSubscription, setNotificationSubscription] = useState<{ unsubscribe: () => void } | null>(null);

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
          
          // Subscribe to booking notifications
          if (!notificationSubscription && session.user.id) {
            const subscription = subscribeToBookingNotifications(session.user.id);
            setNotificationSubscription(subscription);
          }
        } else {
          setIsAdmin(false);
          
          // Unsubscribe from notifications if user is no longer authenticated
          if (notificationSubscription) {
            notificationSubscription.unsubscribe();
            setNotificationSubscription(null);
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        // Check if this is a new user from Google sign-in (or other OAuth)
        if (session?.user) {
          const user = session.user;
          
          // If we have a Google user who doesn't have a role set
          if (
            user.app_metadata.provider === 'google' && 
            (!user.user_metadata?.role || user.user_metadata.role === '')
          ) {
            console.log("New Google user detected, setting up profile with 'tourist' role");
            setIsSettingUp(true);
            
            try {
              // First, update user metadata with tourist role and name info
              const { error: updateError } = await supabase.auth.updateUser({
                data: {
                  role: 'tourist',
                  first_name: user.user_metadata.full_name?.split(' ')[0] || '',
                  last_name: user.user_metadata.full_name?.split(' ').slice(1).join(' ') || '',
                }
              });
              
              if (updateError) {
                console.error("Error updating Google user metadata:", updateError);
                throw updateError;
              }
              
              // Create a record in our users table via API route
              const apiUrl = '/api/auth/register';
              console.log(`Calling API route ${apiUrl} for new Google user:`, {
                userId: user.id,
                email: user.email,
                firstName: user.user_metadata.full_name?.split(' ')[0] || '',
                lastName: user.user_metadata.full_name?.split(' ').slice(1).join(' ') || '',
                role: 'tourist',
              });
              
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  email: user.email,
                  firstName: user.user_metadata.full_name?.split(' ')[0] || '',
                  lastName: user.user_metadata.full_name?.split(' ').slice(1).join(' ') || '',
                  role: 'tourist',
                }),
              });
              
              if (!response.ok) {
                let responseData;
                try {
                  responseData = await response.json();
                } catch (jsonError) {
                  responseData = { error: 'Invalid JSON response' };
                }
                
                // If the record already exists, this isn't necessarily an error
                if (response.status === 409 && responseData.error === 'Duplicate user') {
                  console.log('User record already exists, continuing...');
                } else {
                  console.error('API register route error for Google user:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: responseData
                  });
                  throw new Error(responseData.error || 'Failed to create user record');
                }
              }

              // Refresh the session to get updated metadata
              const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) throw refreshError;
              if (newSession) {
                setSession(newSession);
                setUser(newSession.user);
              }

              // Now redirect to dashboard
              router.push("/dashboard");
            } catch (err) {
              console.error("Error setting up Google user profile:", err);
              router.push("/error?message=Failed to complete user setup");
            } finally {
              setIsSettingUp(false);
            }
          } else {
            // Existing user, just update role but don't redirect
            const role = user.user_metadata?.role;
            setIsAdmin(role === 'admin');
            setIsLoading(false);
            // Removed automatic redirect here to allow users to browse the homepage
          }
          
          // Subscribe to booking notifications if not already subscribed
          if (!notificationSubscription && session.user.id) {
            const subscription = subscribeToBookingNotifications(session.user.id);
            setNotificationSubscription(subscription);
          }
        } else {
          setIsAdmin(false);
          setIsLoading(false);
          
          // Unsubscribe from notifications if user is no longer authenticated
          if (notificationSubscription) {
            notificationSubscription.unsubscribe();
            setNotificationSubscription(null);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      
      // Cleanup notification subscription on unmount
      if (notificationSubscription) {
        notificationSubscription.unsubscribe();
      }
    };
  }, [supabase.auth, router, notificationSubscription]);

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
        console.log("Sign in successful");
        // Don't automatically redirect to dashboard
        // Let the page that called signIn handle any redirections
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
      console.log(`Attempting to register user with email: ${email}, role: ${role}`);
      
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
        console.error('Supabase Auth signup error:', authError);
        
        // Handle specific error cases with better user messages
        if (authError.message?.includes('User already registered')) {
          return { error: { message: 'This email is already registered. Please sign in instead.' } };
        }
        
        if (authError.message?.includes('rate limit')) {
          return { error: { message: 'Too many signup attempts. Please try again later.' } };
        }
        
        // Generic error handling
        throw authError;
      }

      // Log more details after successful auth signup
      console.log('Auth signup success:', {
        userId: authData.user?.id || 'No ID returned',
        confirmationSent: !!authData.user?.confirmation_sent_at,
        userMetadata: JSON.stringify(authData.user?.user_metadata || {})
      });

      if (authData.user) {
        // Create a record in our users table via API route
        try {
          const apiUrl = '/api/auth/register';
          console.log(`Calling API route ${apiUrl} with data:`, {
            userId: authData.user.id,
            email,
            firstName,
            lastName,
            role
          });
          
          const response = await fetch(apiUrl, {
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

          let responseData;
          try {
            responseData = await response.json();
          } catch (jsonError) {
            console.error('Error parsing API response:', jsonError);
            responseData = { error: 'Invalid JSON response' };
          }
          
          if (!response.ok) {
            console.error('API register route error:', {
              status: response.status,
              statusText: response.statusText,
              data: responseData
            });
            
            // If the record already exists, this isn't necessarily an error
            if (response.status === 409 && responseData.error === 'Duplicate user') {
              console.log('User record already exists, continuing...');
            } else {
              throw new Error(responseData.error || responseData.details || 'Failed to create user record');
            }
          } else {
            console.log('User registration complete:', responseData);
          }
        } catch (apiError) {
          console.error('Error creating user record via API:', apiError);
          
          // Only throw if this isn't a duplicate user error (which we can ignore)
          if (!(apiError instanceof Error && apiError.message.includes('Duplicate user'))) {
            throw new Error('Your account was created but profile setup failed. Please contact support.');
          }
        }
        
        setIsLoading(false);
        router.push("/verify-email");
        return { error: null };
      } else {
        console.error('Auth signup succeeded but no user object returned');
        throw new Error('Signup process incomplete. Please try again.');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setIsLoading(false);
      
      // Improve error messaging based on error type/content
      if (error.message?.includes('500')) {
        return { error: { message: 'Server error during registration. Please try again later.' } };
      }
      
      return { error: { 
        message: error.message || 'An error occurred during registration. Please try again.' 
      }};
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

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      console.log("Initiating Google sign-in");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        return { error };
      }
      
      // No error handling needed here since the user will be redirected to Google
      return { error: null };
    } catch (err) {
      console.error("Unexpected Google sign-in error:", err);
      return { 
        error: {
          message: err instanceof Error ? err.message : "An unexpected error occurred during Google sign-in",
          code: "unexpected_error",
          status: 500,
          details: err instanceof Error ? err.stack : String(err)
        } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    isSettingUp,
    signIn,
    signOut,
    register,
    resetPassword,
    updatePassword,
    resendVerificationEmail,
    isAdmin,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 