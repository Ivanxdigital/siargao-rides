"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bike, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/trackEvent";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  // Add user intent toggle (tourist or shop_owner)
  const [userIntent, setUserIntent] = useState<"tourist" | "shop_owner">("tourist");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const { register, signInWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // Preserve intent from dedicated business entry points
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const intentParam = params.get("intent");
    if (intentParam === "shop_owner") setUserIntent("shop_owner");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setApiError("");
    setIsLoading(true);
    trackEvent("auth_started", { method: "email", intent: userIntent });

    // Validate passwords match
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Password strength validation
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // No need to store in localStorage anymore since we're using metadata
      // Pass the intent to the register function
      const { error } = await register(email, password, firstName, lastName, userIntent, userIntent);
      if (error) {
        setApiError(error.message || "An error occurred during registration");
      } else {
        // If registration is successful and user is shop_owner, send onboarding email
        if (userIntent === "shop_owner") {
          try {
            // Send onboarding email
            const response = await fetch('/api/send-onboarding-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                firstName,
              }),
            });

            if (!response.ok) {
              console.error('Failed to send onboarding email:', await response.text());
            }
          } catch (emailError) {
            console.error('Error sending onboarding email:', emailError);
            // Don't block the registration flow on email error
          }
        }
        // The redirect happens in the register function in AuthContext
      }
    } catch (err) {
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setFormError("");
    setApiError("");
    setGoogleLoading(true);
    trackEvent("auth_started", { method: "google", intent: userIntent });

    try {
      const { error } = await signInWithGoogle(userIntent);

      if (error) {
        setApiError(error.message || "Failed to sign up with Google");
      }
      // No need to handle success case since the user will be redirected
    } catch (err) {
      setApiError("An unexpected error occurred. Please try again.");
      console.error("Google sign-up error:", err);
    } finally {
      setGoogleLoading(false);
    }
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
                  Join Siargao Rides
                </Badge>
                <motion.h1
                  className="text-3xl font-bold"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Create an Account
                </motion.h1>
                <motion.p
                  className="text-gray-300 mt-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  Join Siargao Rides to find or list motorbikes for rent
                </motion.p>
              </motion.div>

              {(apiError || formError) && (
                <motion.div
                  className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-md mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {formError || apiError}
                </motion.div>
              )}

              <motion.form
                className="space-y-6"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                {/* User Intent Toggle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.85 }}
                  className="mb-6"
                >
                  <label className="block text-sm font-medium mb-3 text-gray-200 text-center">
                    I want to:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserIntent("tourist")}
                      className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                        userIntent === "tourist"
                          ? "bg-primary/20 border-primary border-2 ring-1 ring-primary/50"
                          : "bg-gray-800/50 border border-gray-700 hover:bg-gray-700/30"
                      }`}
                    >
                      <Bike className={`w-8 h-8 mb-2 ${userIntent === "tourist" ? "text-primary" : "text-gray-400"}`} />
                      <span className={`font-medium ${userIntent === "tourist" ? "text-primary" : "text-gray-300"}`}>
                        Rent Vehicles
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserIntent("shop_owner")}
                      className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                        userIntent === "shop_owner"
                          ? "bg-primary/20 border-primary border-2 ring-1 ring-primary/50"
                          : "bg-gray-800/50 border border-gray-700 hover:bg-gray-700/30"
                      }`}
                    >
                      <Store className={`w-8 h-8 mb-2 ${userIntent === "shop_owner" ? "text-primary" : "text-gray-400"}`} />
                      <span className={`font-medium ${userIntent === "shop_owner" ? "text-primary" : "text-gray-300"}`}>
                        List My Vehicles
                      </span>
                    </button>
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <motion.div
                    className="grid grid-cols-2 gap-4"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                  >
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium mb-1 text-gray-200">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                        placeholder="John"
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium mb-1 text-gray-200">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                        placeholder="Doe"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-200">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      placeholder="you@example.com"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                  >
                    <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-200">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      placeholder="••••••••"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Must be at least 8 characters long
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                  >
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-200">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      placeholder="••••••••"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.3 }}
                  >
                    <p className="text-sm text-gray-400">
                      {userIntent === "tourist"
                        ? "Create an account to rent motorbikes in Siargao."
                        : "Create an account to list your vehicles for rent in Siargao."}
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Sign Up"} {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </motion.div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-800/50 px-2 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={googleLoading || isLoading}
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
                        Sign up with Google
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.p
                  className="text-xs text-center text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.6 }}
                >
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="font-medium text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                  .
                </motion.p>
              </motion.form>

              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.7 }}
              >
                <p className="text-sm text-gray-300">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="font-medium text-primary hover:text-primary/80">
                    Sign in
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
