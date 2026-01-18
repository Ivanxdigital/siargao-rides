"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Store, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/trackEvent";

export default function ListYourVehiclesPage() {
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    trackEvent("business_auth_started", { method: "google" });
    try {
      const { error } = await signInWithGoogle("shop_owner");
      if (error) setError(error.message || "Failed to continue with Google");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to continue with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <section className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden min-h-screen">
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <div className="text-center mb-8">
                <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                  For Rental Businesses
                </Badge>
                <h1 className="text-3xl font-bold">List your vehicles on Siargao Rides</h1>
                <p className="text-gray-300 mt-2">
                  Get listed in under a minute. Start unverified, get verified later.
                </p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-md mb-6">
                  {error}
                </div>
              )}

              <div className="grid gap-3 mb-8">
                <div className="flex items-start gap-3 text-sm text-gray-200">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Fast onboarding</p>
                    <p className="text-gray-300">Publish your shop and first vehicle quickly (photos/docs optional).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-200">
                  <Store className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Instant visibility</p>
                    <p className="text-gray-300">Your listings can appear publicly with an Unverified badge.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-200">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Get verified later</p>
                    <p className="text-gray-300">Upload documents when ready to earn a Verified badge and improve trust.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleGoogle}
                  className="w-full bg-white text-black hover:bg-white/90"
                  disabled={googleLoading}
                >
                  {googleLoading ? "Connecting to Google..." : "Continue with Google"}
                </Button>

                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/sign-up?intent=shop_owner">
                    Use email instead
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <p className="text-sm text-center text-gray-300 mt-4">
                  Already have an account?{" "}
                  <Link href="/sign-in?intent=shop_owner" className="text-primary hover:text-primary/80 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
