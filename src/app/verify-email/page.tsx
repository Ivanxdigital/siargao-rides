"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyEmailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Email verification is disabled - redirect everyone to dashboard
    // If user is already authenticated or if they're not loading, redirect to dashboard
    if (!isLoading) {
      router.push("/dashboard");
    }
  }, [isLoading, router]);

  // Show loading while redirecting
  if (!isLoading) {
    return null; // Component will redirect before rendering
  }

  return (
    <div className="pt-24">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card shadow-md rounded-lg p-8 border border-border text-center">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>

          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          
          <p className="text-muted-foreground mb-6">
            Taking you to your dashboard...
          </p>
        </div>
      </div>
    </div>
  );
} 