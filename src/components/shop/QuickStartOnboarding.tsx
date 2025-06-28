"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SIARGAO_LOCATIONS } from "@/lib/constants";
import {
  ChevronRight,
  ChevronLeft,
  Store,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  Sparkles
} from "lucide-react";

// Step 1 Schema - Minimal required fields
const step1Schema = z.object({
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  phone: z.string().regex(/^(\+?63|0)?[0-9]{10}$/, "Please enter a valid Philippine phone number"),
});

// Step 2 Schema - Basic details
const step2Schema = z.object({
  location_area: z.string().min(2, "Location area is required"),
  description: z.string().min(10, "Description must be at least 10 characters").max(200, "Keep it under 200 characters for now"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface QuickStartOnboardingProps {
  onComplete?: () => void;
}

export function QuickStartOnboarding({ onComplete }: QuickStartOnboardingProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  // Step 1 form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
    defaultValues: {
      shopName: "",
      phone: ""
    }
  });

  // Step 2 form
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    mode: "onChange",
    defaultValues: {
      location_area: "",
      description: ""
    }
  });

  // Handle Step 1 submission
  const handleStep1Submit = step1Form.handleSubmit(async (data) => {
    setStep1Data(data);
    setCurrentStep(2);
  });

  // Handle Step 2 submission (final)
  const handleStep2Submit = step2Form.handleSubmit(async (data) => {
    if (!user || !step1Data) {
      toast.error("Something went wrong. Please refresh and try again.");
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      console.log('Shop creation already in progress, ignoring...');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClientComponentClient();

      // Create shop record with minimal data
      const shopData = {
        owner_id: user.id,
        name: step1Data.shopName,
        description: data.description,
        address: `${data.location_area}, Siargao`, // Basic address for now
        city: 'Siargao',
        phone_number: step1Data.phone,
        email: user.email,
        location_area: data.location_area,
        status: 'pending_verification', // Unverified but can list vehicles
        is_verified: false,
        is_active: true, // Active so they can use the platform
        verification_documents: {
          government_id: '', // Will be uploaded later
          business_permit: ''
        }
      };

      // Submit to API
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shopData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific duplicate shop error
        if (response.status === 409 && errorData.type === 'duplicate_shop') {
          toast.error("You already have a shop registered. Only one shop per account is allowed.");
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create shop');
      }

      // Update user's has_shop status
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          has_shop: true
        }
      });

      if (updateError) {
        console.error("Error updating user metadata:", updateError);
        // Don't fail the entire process if metadata update fails
      } else {
        console.log("Successfully updated user metadata: has_shop = true");
      }

      // Force a session refresh to get the updated metadata
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Error refreshing session:", refreshError);
      } else {
        console.log("Session refreshed successfully");
      }

      toast.success("🎉 Welcome to Siargao Rides! You can now start listing your vehicles.");
      
      // Enhanced coordination: verify shop exists before calling onComplete
      const verifyAndComplete = async () => {
        try {
          // Verify the shop was actually created and is accessible
          // Add explicit is_active filter to help with RLS policy matching
          const { data: verifyShop, error: verifyError } = await supabase
            .from("rental_shops")
            .select("id, name")
            .eq("owner_id", user.id)
            .eq("is_active", true)  // Explicit filter to match RLS policy
            .single();

          if (verifyShop && !verifyError) {
            console.log("Shop creation verified:", verifyShop);
            if (onComplete) {
              onComplete();
            }
          } else {
            console.warn("Shop verification failed, analyzing error...", {
              error: verifyError,
              code: verifyError?.code,
              message: verifyError?.message,
              details: verifyError?.details
            });
            
            // Check if this is a timing/permission issue (406 or auth-related)
            const isTimingIssue = verifyError?.code === 'PGRST116' || 
                                 verifyError?.message?.includes('406') ||
                                 verifyError?.message?.includes('permission') ||
                                 verifyError?.message?.includes('not found');
            
            if (isTimingIssue) {
              console.log("Detected timing/RLS issue. Retrying with longer delay...");
              // Use exponential backoff for timing issues
              setTimeout(async () => {
                const { data: retryShop, error: retryError } = await supabase
                  .from("rental_shops")
                  .select("id, name")
                  .eq("owner_id", user.id)
                  .eq("is_active", true)
                  .single();
                
                if (retryShop && !retryError) {
                  console.log("Shop creation verified on retry:", retryShop);
                  if (onComplete) {
                    onComplete();
                  }
                } else {
                  console.error("Shop verification failed after retry:", retryError);
                  // For persistent failures, proceed anyway - dashboard has its own retry logic
                  console.log("Proceeding to dashboard - it has additional retry mechanisms");
                  if (onComplete) {
                    onComplete();
                  }
                }
              }, 3000); // Longer delay for timing issues
            } else {
              // For non-timing errors, retry once quickly then proceed
              console.log("Non-timing error detected, quick retry then proceed");
              setTimeout(async () => {
                const { data: retryShop, error: retryError } = await supabase
                  .from("rental_shops")
                  .select("id, name")
                  .eq("owner_id", user.id)
                  .eq("is_active", true)
                  .single();
                
                // Always proceed regardless of retry result for non-timing errors
                if (retryShop && !retryError) {
                  console.log("Shop creation verified on quick retry:", retryShop);
                }
                if (onComplete) {
                  onComplete();
                }
              }, 1000);
            }
          }
        } catch (err) {
          console.error("Unexpected error during shop verification:", err);
          // Always call onComplete to let the dashboard handle the issue
          if (onComplete) {
            onComplete();
          }
        }
      };

      // Adaptive delay based on session refresh success - longer delays for JWT propagation
      const delay = refreshError ? 4000 : 3000; // Increased delays for JWT token propagation
      console.log(`Waiting ${delay}ms before verifying shop creation (allowing for JWT propagation)...`);
      
      setTimeout(verifyAndComplete, delay);

    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  });

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="w-full max-w-md mx-auto bg-black/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-xl hover:border-primary/20 transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-4 bg-black/40 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Quick Setup</h2>
            <p className="text-sm text-white/80">Get started in 2 minutes</p>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 flex space-x-2">
          <div className={`h-2 flex-1 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-white/20'}`} />
          <div className={`h-2 flex-1 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-white/20'}`} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 min-h-[300px] relative overflow-hidden">
        <AnimatePresence mode="wait" custom={currentStep}>
          {currentStep === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Let's start with the basics</h3>
                <p className="text-white/70 text-sm">Just your shop name and phone number</p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <Label htmlFor="shopName" className="text-white text-sm font-medium">
                    Shop Name
                  </Label>
                  <Input
                    id="shopName"
                    placeholder="e.g., Island Riders, Siargao Motors"
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-teal-400"
                    {...step1Form.register("shopName")}
                  />
                  {step1Form.formState.errors.shopName && (
                    <p className="text-red-400 text-xs mt-1">{step1Form.formState.errors.shopName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="phone"
                      placeholder="09123456789"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-teal-400"
                      {...step1Form.register("phone")}
                    />
                  </div>
                  {step1Form.formState.errors.phone && (
                    <p className="text-red-400 text-xs mt-1">{step1Form.formState.errors.phone.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 mt-6"
                  disabled={!step1Form.formState.isValid}
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              custom={2}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Where are you located?</h3>
                <p className="text-white/70 text-sm">Help customers find you easily</p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div>
                  <Label htmlFor="location_area" className="text-white text-sm font-medium">
                    Location Area
                  </Label>
                  <select
                    id="location_area"
                    className="mt-1 w-full bg-white/10 border-white/20 text-white rounded-md h-10 px-3 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                    {...step2Form.register("location_area")}
                  >
                    <option value="" className="bg-gray-900">Select your area</option>
                    {SIARGAO_LOCATIONS.map((location) => (
                      <option key={location} value={location} className="bg-gray-900">
                        {location}
                      </option>
                    ))}
                  </select>
                  {step2Form.formState.errors.location_area && (
                    <p className="text-red-400 text-xs mt-1">{step2Form.formState.errors.location_area.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-white text-sm font-medium">
                    Quick Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Rent motorcycles and cars for exploring Siargao..."
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-orange-400 min-h-[80px] resize-none"
                    {...step2Form.register("description")}
                  />
                  {step2Form.formState.errors.description && (
                    <p className="text-red-400 text-xs mt-1">{step2Form.formState.errors.description.message}</p>
                  )}
                  <p className="text-white/50 text-xs mt-1">You can expand this later</p>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    type="button"
                    onClick={goBack}
                    variant="outline"
                    className="flex-1 border-white/30 text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-300 hover:shadow-lg"
                    disabled={!step2Form.formState.isValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start Listing!
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-black/20 border-t border-white/10">
        <p className="text-white/60 text-xs text-center">
          You can add more details and upload documents later to get verified
        </p>
      </div>
    </div>
  );
}