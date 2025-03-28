"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"tourist" | "shop_owner">("tourist");
  const [formError, setFormError] = useState("");
  
  const { register, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError("");
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    
    // Password strength validation
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      return;
    }
    
    await register(email, password, firstName, lastName, role);
  };

  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="bg-card shadow-md rounded-lg p-8 border border-border">
        <h1 className="text-2xl font-bold mb-6 text-center">Create an Account</h1>
        
        {(error || formError) && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-6">
            {formError || error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 rounded-md border border-input bg-background"
                placeholder="John"
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 rounded-md border border-input bg-background"
                placeholder="Doe"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md border border-input bg-background"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-md border border-input bg-background"
              placeholder="••••••••"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must be at least 8 characters long
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-md border border-input bg-background"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Account Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="tourist"
                  checked={role === "tourist"}
                  onChange={() => setRole("tourist")}
                  className="mr-2"
                />
                Tourist (Rent bikes)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="shop_owner"
                  checked={role === "shop_owner"}
                  onChange={() => setRole("shop_owner")}
                  className="mr-2"
                />
                Shop Owner (List bikes)
              </label>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 