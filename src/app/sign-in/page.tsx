"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message || "Failed to sign in. Please check your credentials.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
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
                  Welcome Back
                </Badge>
                <h1 className="text-3xl font-bold">Sign In</h1>
                <p className="text-gray-300 mt-2">
                  Sign in to your Siargao Rides account
                </p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-md mb-6">
                  {error}
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
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm flex items-center justify-center" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"} {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 