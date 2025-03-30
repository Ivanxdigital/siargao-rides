"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  // Always set role to "tourist" by default, no longer changeable by user
  const role: "tourist" = "tourist";
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setApiError("");
    setIsLoading(true);
    
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
      // Always register with "tourist" role
      const { error } = await register(email, password, firstName, lastName, role);
      if (error) {
        setApiError(error.message || "An error occurred during registration");
      }
    } catch (err) {
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
                  Join Siargao Rides
                </Badge>
                <h1 className="text-3xl font-bold">Create an Account</h1>
                <p className="text-gray-300 mt-2">
                  Join Siargao Rides to find or list motorbikes for rent
                </p>
              </div>
              
              {(apiError || formError) && (
                <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-md mb-6">
                  {formError || apiError}
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  
                  <div>
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
                  </div>
                  
                  <div>
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
                  </div>
                  
                  <div>
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
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">
                      Create an account to rent motorbikes. Want to list your bikes? You can register as a shop owner from your dashboard after signing up.
                    </p>
                  </div>
                </div>
                
                <div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm flex items-center justify-center" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Sign Up"} {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
                
                <p className="text-xs text-center text-gray-400">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="font-medium text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-300">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="font-medium text-primary hover:text-primary/80">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 