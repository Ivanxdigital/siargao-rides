"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Clock } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";

// Rate limit tracking
const RATE_LIMIT_KEY = "siargao_auth_rate_limit";
const RATE_LIMIT_DURATION = 300; // Increase to 5 minutes (300 seconds)
const MAX_ATTEMPTS = 2; // Reduce to 2 attempts before cooling down
const DEBOUNCE_TIMEOUT = 2000; // Increase to 2 seconds

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blocked: boolean;
  blockedUntil: number;
}

const getDefaultRateLimitState = (): RateLimitState => ({
  attempts: 0,
  lastAttempt: 0,
  blocked: false,
  blockedUntil: 0
});

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(getDefaultRateLimitState());
  const { signIn } = useAuth();
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  // Load rate limit state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedState = localStorage.getItem(RATE_LIMIT_KEY);
        if (storedState) {
          const parsedState: RateLimitState = JSON.parse(storedState);
          
          // Check if we're still in a blocked state
          if (parsedState.blocked && parsedState.blockedUntil > Date.now()) {
            setIsRateLimited(true);
            setCooldownTimer(Math.ceil((parsedState.blockedUntil - Date.now()) / 1000));
            setRateLimitState(parsedState);
          } else if (parsedState.blocked) {
            // Reset if the block period has expired
            resetRateLimit();
          } else {
            setRateLimitState(parsedState);
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

  const updateRateLimitState = (isError: boolean, isRateLimitError: boolean) => {
    const now = Date.now();
    
    // If this is a rate limit error, block immediately with a longer cooldown
    if (isRateLimitError) {
      const blockedUntil = now + (RATE_LIMIT_DURATION * 1000 * 3); // Triple the cooldown time for rate limit errors (15 minutes)
      const newState: RateLimitState = {
        attempts: rateLimitState.attempts + 1,
        lastAttempt: now,
        blocked: true,
        blockedUntil
      };
      
      setRateLimitState(newState);
      setIsRateLimited(true);
      setCooldownTimer(RATE_LIMIT_DURATION * 3);
      
      return;
    }
    
    // If it's another error, increment attempts
    if (isError) {
      // Check if we need to reset attempts (if last attempt was long ago)
      const attemptAge = now - rateLimitState.lastAttempt;
      const resetThreshold = RATE_LIMIT_DURATION * 1000 * 2; // 2x the rate limit period
      
      let newAttempts = 0;
      if (attemptAge < resetThreshold) {
        newAttempts = rateLimitState.attempts + 1;
      } else {
        newAttempts = 1; // Reset counter if it's been a while
      }
      
      // Check if we've reached max attempts
      if (newAttempts >= MAX_ATTEMPTS) {
        const blockedUntil = now + (RATE_LIMIT_DURATION * 1000);
        setRateLimitState({
          attempts: newAttempts,
          lastAttempt: now,
          blocked: true,
          blockedUntil
        });
        setIsRateLimited(true);
        setCooldownTimer(RATE_LIMIT_DURATION);
      } else {
        setRateLimitState({
          attempts: newAttempts,
          lastAttempt: now,
          blocked: false,
          blockedUntil: 0
        });
      }
    } else {
      // Success - reset the counter
      resetRateLimit();
    }
  };

  const isRateLimitError = (error: any): boolean => {
    // More comprehensive check for rate limit errors
    if (!error) return false;
    
    const errorMsg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    return (
      errorMsg.includes("rate limit") || 
      errorMsg.includes("request rate limit reached") ||
      errorMsg.includes("too many requests") ||
      errorMsg.includes("too many login attempts") ||
      error.status === 429 ||
      error.code === "over_request_rate_limit" ||
      error.code === "too_many_requests"
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
          
          // Enhanced rate limit detection
          const isRateLimitErr = isRateLimitError(signInError);
          updateRateLimitState(true, isRateLimitErr);
          
          if (isRateLimitErr) {
            setError("Too many sign-in attempts. Please wait before trying again.");
          } else {
            setError(signInError.message || "Failed to sign in. Please check your credentials.");
          }
        } else {
          // If login successful, reset rate limit counter
          updateRateLimitState(false, false);
        }
      } catch (err) {
        console.error("Unexpected error during sign-in:", err);
        
        // Check if the error is a rate limit error
        const isRateLimitErr = err instanceof Error && isRateLimitError(err);
        updateRateLimitState(true, isRateLimitErr);
        
        if (isRateLimitErr) {
          setError("Too many sign-in attempts. Please wait before trying again.");
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
        isSubmittingRef.current = false;
      }
    }, DEBOUNCE_TIMEOUT);
  };

  const getErrorMessage = () => {
    if (isRateLimited) {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Too many sign-in attempts. Please wait before trying again.</p>
          </div>
          <div className="text-sm font-medium text-center">
            You can try again in {cooldownTimer} seconds
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