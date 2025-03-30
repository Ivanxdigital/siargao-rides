"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, AlertCircle, Bug, Clock } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Rate limit tracking
const RATE_LIMIT_KEY = "siargao_auth_rate_limit";
const RATE_LIMIT_DURATION = 60; // 60 seconds
const MAX_ATTEMPTS = 3; // Max attempts before cooling down

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
  const [debugMode, setDebugMode] = useState(false);
  const [debugResponse, setDebugResponse] = useState<any>(null);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(getDefaultRateLimitState());
  const { signIn } = useAuth();

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
    
    // If this is a rate limit error, block immediately
    if (isRateLimitError) {
      const blockedUntil = now + (RATE_LIMIT_DURATION * 1000);
      const newState: RateLimitState = {
        attempts: rateLimitState.attempts + 1,
        lastAttempt: now,
        blocked: true,
        blockedUntil
      };
      
      setRateLimitState(newState);
      setIsRateLimited(true);
      setCooldownTimer(RATE_LIMIT_DURATION);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if rate limited
    if (isRateLimited) {
      setError("You're temporarily blocked from signing in. Please wait for the cooldown to expire.");
      return;
    }
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      console.log("Submitting sign-in form...");
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        console.log("Sign-in error:", signInError);
        
        // Check specifically for rate limit errors
        const isRateLimitError = 
          signInError.message?.includes("rate limit") || 
          signInError.code === "over_request_rate_limit" ||
          signInError.status === 429;
          
        updateRateLimitState(true, isRateLimitError);
        
        if (isRateLimitError) {
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
      setError("An unexpected error occurred. Please try again.");
      updateRateLimitState(true, false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug function that directly calls Supabase
  const handleDebugSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password for debugging.");
      return;
    }
    
    // Allow debug attempts even when rate limited
    setDebugResponse(null);
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClientComponentClient();
      console.log("Debug: Attempting direct Supabase sign-in");
      
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("Debug: Direct Supabase response", response);
      setDebugResponse(response);
      
      if (response.error) {
        setError(`Debug Error: ${response.error.message}`);
        
        // Check for rate limiting in debug mode too
        if (
          response.error.message?.includes("rate limit") ||
          response.error.status === 429
        ) {
          console.warn("Debug: Rate limit detected via direct API call");
        }
      } else if (response.data.session) {
        setError(null);
        setDebugResponse({
          ...response,
          debug_message: "Authentication successful! Session found."
        });
      } else {
        setError("Debug: No error but also no session returned.");
      }
    } catch (err) {
      console.error("Debug: Unexpected error", err);
      setError(`Debug Exception: ${err instanceof Error ? err.message : String(err)}`);
      setDebugResponse({error: err});
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
    if (debugMode) {
      setDebugResponse(null);
    }
  };

  const clearRateLimit = () => {
    resetRateLimit();
    setError("Rate limit data cleared. You can try signing in again.");
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
    <div className="min-h-screen pt-20">
      <section className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden min-h-screen">
        {/* Background with overlay gradient */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="text-center mb-6">
                <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                  Welcome Back
                </Badge>
                <h1 className="text-3xl font-bold">Sign In</h1>
                <p className="text-gray-300 mt-2">
                  Sign in to your Siargao Rides account
                </p>
              </div>

              {(error || isRateLimited) && (
                <div className={`${isRateLimited ? "bg-amber-900/20 border-amber-800 text-amber-300" : "bg-red-900/20 border-red-800 text-red-300"} border px-4 py-3 rounded-md mb-6`}>
                  {getErrorMessage()}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
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
                      disabled={isRateLimited && !debugMode}
                    />
                  </div>

                  <div>
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
                      disabled={isRateLimited && !debugMode}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 bg-gray-900 border-gray-700 rounded focus:ring-primary text-primary"
                      disabled={isRateLimited && !debugMode}
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/forgot-password" className={`font-medium text-primary hover:text-primary/80 ${isRateLimited && !debugMode ? 'pointer-events-none opacity-70' : ''}`}>
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm flex items-center justify-center" 
                    disabled={(isLoading || isRateLimited) && !debugMode}
                  >
                    {isLoading ? "Signing in..." : isRateLimited ? `Wait ${cooldownTimer}s` : "Sign in"} 
                    {!isLoading && !isRateLimited && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-300">
                  Don't have an account?{" "}
                  <Link href="/sign-up" className="font-medium text-primary hover:text-primary/80">
                    Sign up
                  </Link>
                </p>
              </div>
              
              {/* Debug section */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <button 
                  onClick={toggleDebugMode}
                  className="flex items-center space-x-1 text-xs text-gray-400 hover:text-primary"
                >
                  <Bug size={14} />
                  <span>{debugMode ? "Hide Debug Mode" : "Debug Mode"}</span>
                </button>
                
                {debugMode && (
                  <div className="mt-4 space-y-4">
                    <h3 className="text-sm font-medium text-gray-300">Troubleshooting Tools</h3>
                    
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        onClick={handleDebugSignIn}
                        variant="outline"
                        className="flex-1 text-xs border-gray-700 bg-gray-900/50 hover:bg-gray-800"
                        disabled={isLoading}
                      >
                        Direct Supabase Sign-in
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={clearRateLimit}
                        variant="outline"
                        className="text-xs border-gray-700 bg-gray-900/50 hover:bg-gray-800"
                      >
                        Clear Rate Limit
                      </Button>
                    </div>
                    
                    {rateLimitState && debugMode && (
                      <div className="mt-2 text-xs text-gray-400">
                        <div>Attempts: {rateLimitState.attempts}</div>
                        <div>Blocked: {rateLimitState.blocked ? "Yes" : "No"}</div>
                        {rateLimitState.blocked && (
                          <div>Blocked until: {new Date(rateLimitState.blockedUntil).toLocaleTimeString()}</div>
                        )}
                      </div>
                    )}
                    
                    {debugResponse && (
                      <div className="mt-4 p-3 bg-gray-900/50 border border-gray-700 rounded-md text-xs overflow-auto max-h-48">
                        <pre className="text-gray-300 whitespace-pre-wrap break-words">{JSON.stringify(debugResponse, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 