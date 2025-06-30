"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Mail } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Rate limit tracking with progressive penalties
const RATE_LIMIT_KEY = "siargao_auth_rate_limit";
const BASE_RATE_LIMIT_DURATION = 120; // 2 minutes base cooldown
const MAX_FREE_ATTEMPTS = 3; // 3 free attempts before any penalties
const PROGRESSIVE_PENALTY_ATTEMPTS = 5; // Start 30s penalty at attempt 4-5
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 8; // Total attempts before longer lockout
const SHORT_COOLDOWN = 30; // 30 seconds for early penalties
const SUPABASE_RATE_LIMIT_COOLDOWN = 300; // 5 minutes for actual Supabase rate limits
const RESET_ATTEMPTS_AFTER = 1800000; // Reset counter after 30 minutes (in ms)
const DEBOUNCE_TIMEOUT = 1500; // Reduce to 1.5 seconds for better UX

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blocked: boolean;
  blockedUntil: number;
  penaltyLevel: 'none' | 'short' | 'medium' | 'long';
  lastResetTime: number;
}

const getDefaultRateLimitState = (): RateLimitState => ({
  attempts: 0,
  lastAttempt: 0,
  blocked: false,
  blockedUntil: 0,
  penaltyLevel: 'none',
  lastResetTime: Date.now()
});

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(getDefaultRateLimitState());
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load rate limit state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedState = localStorage.getItem(RATE_LIMIT_KEY);
        if (storedState) {
          const parsedState: RateLimitState = JSON.parse(storedState);

          // Ensure backward compatibility with old state format
          const compatibleState: RateLimitState = {
            attempts: parsedState.attempts || 0,
            lastAttempt: parsedState.lastAttempt || 0,
            blocked: parsedState.blocked || false,
            blockedUntil: parsedState.blockedUntil || 0,
            penaltyLevel: parsedState.penaltyLevel || 'none',
            lastResetTime: parsedState.lastResetTime || Date.now()
          };

          // Check if we should reset due to time passage
          if (shouldResetAttempts(compatibleState, Date.now())) {
            resetRateLimit();
            return;
          }

          // Check if we're still in a blocked state
          if (compatibleState.blocked && compatibleState.blockedUntil > Date.now()) {
            setIsRateLimited(true);
            setCooldownTimer(Math.ceil((compatibleState.blockedUntil - Date.now()) / 1000));
            setRateLimitState(compatibleState);
          } else if (compatibleState.blocked) {
            // Reset if the block period has expired
            resetRateLimit();
          } else {
            setRateLimitState(compatibleState);
          }
        }
      } catch (e) {
        console.error("Error loading rate limit state:", e);
        resetRateLimit();
      }
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  // Reset error when email or password changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [email, password]);

  // Handle the cooldown timer when rate limited
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRateLimited && cooldownTimer > 0) {
      interval = setInterval(() => {
        setCooldownTimer((prev) => {
          if (prev <= 1) {
            setIsRateLimited(false);
            resetRateLimit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRateLimited, cooldownTimer]);

  // Save rate limit state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimitState));
    }
  }, [rateLimitState]);

  const resetRateLimit = () => {
    const newState = getDefaultRateLimitState();
    setRateLimitState(newState);
    setIsRateLimited(false);
    setCooldownTimer(0);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
    }
  };

  const calculatePenalty = (attempts: number, isRateLimitError: boolean): { duration: number, penaltyLevel: 'none' | 'short' | 'medium' | 'long' } => {
    if (isRateLimitError) {
      return { duration: SUPABASE_RATE_LIMIT_COOLDOWN, penaltyLevel: 'long' };
    }

    if (attempts <= MAX_FREE_ATTEMPTS) {
      return { duration: 0, penaltyLevel: 'none' };
    } else if (attempts <= PROGRESSIVE_PENALTY_ATTEMPTS) {
      return { duration: SHORT_COOLDOWN, penaltyLevel: 'short' };
    } else if (attempts < MAX_ATTEMPTS_BEFORE_LOCKOUT) {
      return { duration: BASE_RATE_LIMIT_DURATION, penaltyLevel: 'medium' };
    } else {
      return { duration: BASE_RATE_LIMIT_DURATION * 2, penaltyLevel: 'long' };
    }
  };

  const shouldResetAttempts = (state: RateLimitState, now: number): boolean => {
    // Reset if it's been more than 30 minutes since last reset
    const timeSinceLastReset = now - state.lastResetTime;
    return timeSinceLastReset > RESET_ATTEMPTS_AFTER;
  };

  const updateRateLimitState = (isError: boolean, isRateLimitError: boolean) => {
    const now = Date.now();

    // If this is a rate limit error from Supabase, block immediately
    if (isRateLimitError) {
      const penalty = calculatePenalty(rateLimitState.attempts + 1, true);
      const blockedUntil = now + (penalty.duration * 1000);
      const newState: RateLimitState = {
        attempts: rateLimitState.attempts + 1,
        lastAttempt: now,
        blocked: true,
        blockedUntil,
        penaltyLevel: penalty.penaltyLevel,
        lastResetTime: rateLimitState.lastResetTime
      };

      setRateLimitState(newState);
      setIsRateLimited(true);
      setCooldownTimer(penalty.duration);
      return;
    }

    // Handle other errors with progressive penalties
    if (isError) {
      // Check if we should reset attempts due to time passage
      let currentAttempts = rateLimitState.attempts;
      let lastResetTime = rateLimitState.lastResetTime;
      
      if (shouldResetAttempts(rateLimitState, now)) {
        currentAttempts = 0;
        lastResetTime = now;
      }

      const newAttempts = currentAttempts + 1;
      const penalty = calculatePenalty(newAttempts, false);

      const newState: RateLimitState = {
        attempts: newAttempts,
        lastAttempt: now,
        blocked: penalty.duration > 0,
        blockedUntil: penalty.duration > 0 ? now + (penalty.duration * 1000) : 0,
        penaltyLevel: penalty.penaltyLevel,
        lastResetTime
      };

      setRateLimitState(newState);
      
      if (penalty.duration > 0) {
        setIsRateLimited(true);
        setCooldownTimer(penalty.duration);
      }
    } else {
      // Success - reset the counter
      resetRateLimit();
    }
  };

  const isRateLimitError = (error: any): boolean => {
    // More comprehensive check for rate limit errors from Supabase
    if (!error) return false;

    const errorMsg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    return (
      errorMsg.includes("rate limit") ||
      errorMsg.includes("request rate limit reached") ||
      errorMsg.includes("too many requests") ||
      errorMsg.includes("too many login attempts") ||
      errorMsg.includes("email rate limit exceeded") ||
      error.status === 429 ||
      error.code === "over_request_rate_limit" ||
      error.code === "too_many_requests" ||
      error.code === "email_rate_limit_exceeded"
    );
  };

  const isNetworkError = (error: any): boolean => {
    // Check for network connectivity issues that shouldn't count toward rate limiting
    if (!error) return false;
    
    const errorMsg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    return (
      errorMsg.includes("network error") ||
      errorMsg.includes("fetch failed") ||
      errorMsg.includes("connection failed") ||
      errorMsg.includes("timeout") ||
      errorMsg.includes("offline") ||
      error.code === "NETWORK_ERROR" ||
      error.name === "NetworkError"
    );
  };

  const isCredentialError = (error: any): boolean => {
    // Check for invalid credential errors (wrong password, invalid email, etc.)
    if (!error) return false;
    
    const errorMsg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    return (
      errorMsg.includes("invalid login credentials") ||
      errorMsg.includes("invalid credentials") ||
      errorMsg.includes("email not confirmed") ||
      errorMsg.includes("invalid email or password") ||
      errorMsg.includes("wrong password") ||
      errorMsg.includes("user not found") ||
      error.code === "invalid_credentials"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if already submitting or rate limited
    if (isSubmittingRef.current || isRateLimited) {
      setError("Please wait before trying again.");
      return;
    }

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    // Clear any previous timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    // Set loading state but use debounce to prevent multiple submissions
    setIsLoading(true);
    setError(null);
    isSubmittingRef.current = true;

    // Use a debounce timeout for the actual submission
    submitTimeoutRef.current = setTimeout(async () => {
      try {
        console.log("Submitting sign-in form after debounce...");
        const { error: signInError } = await signIn(email, password);

        if (signInError) {
          console.log("Sign-in error:", signInError);

          // Classify the error type
          const isRateLimitErr = isRateLimitError(signInError);
          const isNetworkErr = isNetworkError(signInError);
          const isCredentialErr = isCredentialError(signInError);

          // Only count toward rate limiting if it's not a network error
          if (!isNetworkErr) {
            updateRateLimitState(true, isRateLimitErr);
          }

          // Provide appropriate error messages
          if (isRateLimitErr) {
            setError(
              "Rate limit reached from Supabase. This happens when there are too many sign-in attempts " +
              "from your location or for this account. Please wait a few minutes before trying again."
            );
          } else if (isNetworkErr) {
            setError(
              "Network connection issue. Please check your internet connection and try again."
            );
          } else if (isCredentialErr) {
            setError(
              "Invalid email or password. Please check your credentials and try again."
            );
          } else {
            setError(signInError.message || "Failed to sign in. Please check your credentials.");
          }
        } else {
          // If login successful, reset rate limit counter
          updateRateLimitState(false, false);
          // Manually redirect to dashboard after successful sign-in
          router.push('/dashboard');
        }
      } catch (err) {
        console.error("Unexpected error during sign-in:", err);

        // Classify the error type
        const isRateLimitErr = err instanceof Error && isRateLimitError(err);
        const isNetworkErr = err instanceof Error && isNetworkError(err);
        
        // Only count toward rate limiting if it's not a network error
        if (!isNetworkErr) {
          updateRateLimitState(true, isRateLimitErr);
        }

        if (isRateLimitErr) {
          setError(
            "Rate limit reached from Supabase. This happens when there are too many sign-in attempts " +
            "from your location or for this account. Please wait a few minutes before trying again."
          );
        } else if (isNetworkErr) {
          setError(
            "Network connection issue. Please check your internet connection and try again."
          );
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
        isSubmittingRef.current = false;
      }
    }, DEBOUNCE_TIMEOUT);
  };

  const handleGoogleSignIn = async () => {
    if (isRateLimited) {
      setError("Please wait before trying again.");
      return;
    }

    try {
      setGoogleLoading(true);
      setError(null);

      const { error } = await signInWithGoogle();

      if (error) {
        console.error("Google sign-in error:", error);
        setError(error.message || "Failed to sign in with Google.");

        // Check if this is a rate limit error
        const isRateLimitErr = isRateLimitError(error);
        updateRateLimitState(true, isRateLimitErr);
      }
      // Note: No need to redirect here as Google OAuth will handle the redirect flow
      // The AuthContext.tsx will handle the post-authentication setup and dashboard redirect
    } catch (err) {
      console.error("Unexpected error during Google sign-in:", err);
      setError("An error occurred during Google sign-in. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const getRemainingAttempts = () => {
    if (rateLimitState.attempts <= MAX_FREE_ATTEMPTS) {
      return MAX_FREE_ATTEMPTS - rateLimitState.attempts;
    }
    return 0;
  };

  const getPenaltyMessage = () => {
    const remainingFree = getRemainingAttempts();
    
    if (remainingFree > 0) {
      return `${remainingFree} attempt${remainingFree === 1 ? '' : 's'} remaining before cooldown`;
    } else if (rateLimitState.attempts <= PROGRESSIVE_PENALTY_ATTEMPTS) {
      return "Next failed attempt will result in a 30-second cooldown";
    } else if (rateLimitState.attempts < MAX_ATTEMPTS_BEFORE_LOCKOUT) {
      return "Next failed attempt will result in a 2-minute cooldown";
    } else {
      return "Account temporarily locked due to multiple failed attempts";
    }
  };

  const getErrorMessage = () => {
    if (isRateLimited) {
      const penaltyType = rateLimitState.penaltyLevel === 'long' && cooldownTimer > 180 
        ? 'Supabase Rate Limit' 
        : 'Too Many Attempts';
        
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{penaltyType}</p>
              {rateLimitState.penaltyLevel === 'long' && cooldownTimer > 180 ? (
                <>
                  <p className="text-sm mt-1">Supabase has temporarily blocked sign-in attempts due to:</p>
                  <ul className="text-sm list-disc pl-5 mt-1 space-y-1">
                    <li>Too many requests from your location</li>
                    <li>High traffic on the authentication service</li>
                    <li>Multiple failed attempts for this account</li>
                  </ul>
                </>
              ) : (
                <p className="text-sm mt-1">
                  Please wait before trying again. This helps prevent abuse and protects your account.
                </p>
              )}
            </div>
          </div>
          <div className="text-sm font-medium text-center mt-2 bg-amber-900/30 py-2 rounded-md border border-amber-800/50">
            Cooldown: <span className="font-mono">{Math.floor(cooldownTimer / 60)}:{(cooldownTimer % 60).toString().padStart(2, '0')}</span> remaining
          </div>
        </div>
      );
    }

    // Show attempt counter for regular errors (if we have attempts but aren't rate limited)  
    if (error && rateLimitState.attempts > 0 && !isRateLimited) {
      return (
        <div className="flex flex-col space-y-2">
          <div>{error}</div>
          <div className="text-xs text-gray-400 text-center">
            {getPenaltyMessage()}
          </div>
        </div>
      );
    }
    
    return error;
  };

  return (
    <motion.div
      className="min-h-screen pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <section className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden min-h-screen">
        {/* Background with overlay gradient */}
        <motion.div
          className="absolute inset-0 z-0 opacity-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30"></div>
        </motion.div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <motion.div
            className="max-w-md mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.1)",
                borderColor: "rgba(79, 70, 229, 0.5)"
              }}
            >
              <motion.div
                className="text-center mb-6"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                  Welcome Back
                </Badge>
                <motion.h1
                  className="text-3xl font-bold"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Sign In
                </motion.h1>
                <motion.p
                  className="text-gray-300 mt-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  Sign in to your Siargao Rides account
                </motion.p>
              </motion.div>

              {(error || isRateLimited) && (
                <motion.div
                  className={`${isRateLimited ? "bg-amber-900/20 border-amber-800 text-amber-300" : "bg-red-900/20 border-red-800 text-red-300"} border px-4 py-3 rounded-md mb-6`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {getErrorMessage()}
                </motion.div>
              )}

              <motion.form
                className="space-y-6"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="space-y-4">
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                  >
                    <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-200">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      placeholder="john@example.com"
                      disabled={isRateLimited}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-200">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      placeholder="••••••••"
                      disabled={isRateLimited}
                    />
                  </motion.div>
                </div>

                <motion.div
                  className="flex items-center justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 bg-gray-900 border-gray-700 rounded focus:ring-primary text-primary"
                      disabled={isRateLimited}
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/forgot-password" className={`font-medium text-primary hover:text-primary/80 ${isRateLimited ? 'pointer-events-none opacity-70' : ''}`}>
                      Forgot your password?
                    </Link>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm flex items-center justify-center"
                    disabled={isLoading || isRateLimited}
                  >
                    {isLoading ? "Signing in..." : isRateLimited ? `Wait ${cooldownTimer}s` : "Sign in"}
                    {!isLoading && !isRateLimited && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </motion.div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || isLoading || isRateLimited}
                    className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 flex items-center justify-center gap-2"
                  >
                    {googleLoading ? (
                      "Connecting to Google..."
                    ) : (
                      <>
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.form>

              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                <p className="text-sm text-gray-300">
                  Don't have an account?{" "}
                  <Link href="/sign-up" className="font-medium text-primary hover:text-primary/80">
                    Sign up
                  </Link>
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}