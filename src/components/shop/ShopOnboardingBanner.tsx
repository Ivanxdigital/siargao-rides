"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { SIARGAO_LOCATIONS } from "@/lib/constants";
import {
  ChevronDown,
  ChevronUp,
  Save,
  Upload,
  X,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Define validation schema for the form
const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^(\+?63|0)?[0-9]{10}$/, "Please enter a valid Philippine phone number (e.g., +639123456789 or 09123456789)"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  referral: z.string().optional(),
  description: z.string().min(20, "Description must be at least 20 characters").max(500, "Description must be less than 500 characters"),
  location_area: z.string().min(2, "Location area must be at least 2 characters"),
  whatsapp: z.string().optional(),
  facebook_url: z.string().optional(),
  instagram_url: z.string().optional(),
  phone_number: z.string().optional(),
});

// Type for the form data
type FormData = z.infer<typeof formSchema>;

interface ShopOnboardingBannerProps {
  onComplete?: () => void;
}

export function ShopOnboardingBanner({ onComplete }: ShopOnboardingBannerProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [governmentId, setGovernmentId] = useState<File | null>(null);
  const [governmentIdPreview, setGovernmentIdPreview] = useState<string | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);

  // Check if device is mobile
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Check if banner was previously collapsed
  useEffect(() => {
    const savedState = localStorage.getItem("shop_onboarding_collapsed");
    if (savedState === "true") {
      setIsExpanded(false);
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem("shop_onboarding_collapsed", (!newState).toString());
  };

  // Form validation with React Hook Form
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Validate on change
    defaultValues: {
      fullName: user ? `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() : "",
      shopName: "",
      email: user?.email || "",
      phone: "",
      address: "",
      referral: "",
      description: "",
      location_area: "",
      whatsapp: "",
      facebook_url: "",
      instagram_url: "",
      phone_number: ""
    }
  });

  // Function to validate file
  const validateFile = (file: File | null, required: boolean): true | string => {
    if (!file && required) {
      return "This file is required";
    }

    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return "File size must be less than 5MB";
      }

      // Check file type (only images and PDFs)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return "File must be an image (JPEG, PNG, GIF) or PDF";
      }
    }

    return true;
  };

  // Function to validate referral code or email
  const validateReferral = async (referral: string): Promise<string | null> => {
    if (!referral) return null;

    try {
      const supabase = createClientComponentClient();

      // Check if it's a valid referral code
      const { data: referrerData, error: referrerError } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${referral},referral_code.eq.${referral}`)
        .single();

      if (referrerError || !referrerData) {
        return null;
      }

      return referrerData.id;
    } catch (error) {
      console.error('Error validating referral:', error);
      return null;
    }
  };

  // Handle file change for government ID
  const handleGovernmentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setGovernmentId(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGovernmentIdPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setGovernmentIdPreview(null);
    }
  };



  // Form submission handler with React Hook Form
  const handleFormSubmit = hookFormSubmit(async (data) => {
    if (!user) {
      setError("You must be logged in to register a shop");
      return;
    }

    setIsSubmitting(true);
    setReferralError(null);
    setError(null);

    let resolvedReferrerId: string | null = null;
    if (data.referral) {
      resolvedReferrerId = await validateReferral(data.referral.trim());
      if (!resolvedReferrerId) {
        setReferralError('Invalid referral code or email.');
        setIsSubmitting(false);
        return;
      }
      setReferrerId(resolvedReferrerId);
    }

    // Validate government ID
    const governmentIdValidation = validateFile(governmentId, true);
    if (governmentIdValidation !== true) {
      setError(governmentIdValidation);
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClientComponentClient();

      // Upload government ID
      let governmentIdUrl = '';
      if (governmentId) {
        const { data: govIdData, error: govIdError } = await supabase.storage
          .from('shop-documents')
          .upload(`${user.id}/government-id/${governmentId.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`, governmentId);

        if (govIdError) {
          console.error('Error uploading government ID:', govIdError);
          setError('Failed to upload government ID. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('shop-documents')
          .getPublicUrl(govIdData.path);

        governmentIdUrl = publicUrlData.publicUrl;
      }

      // Set business permit URL to empty string (no longer required)
      const businessPermitUrl = '';

      // Create shop record
      const shopData = {
        owner_id: user.id,
        name: data.shopName,
        description: data.description,
        address: data.address,
        city: 'Siargao',
        phone_number: data.phone,
        whatsapp: data.whatsapp || null,
        email: data.email,
        location_area: data.location_area,
        facebook_url: data.facebook_url || null,
        instagram_url: data.instagram_url || null,
        phone_number: data.phone_number || null,
        referrer_id: resolvedReferrerId,
        verification_documents: {
          government_id: governmentIdUrl,
          business_permit: businessPermitUrl
        },
        status: 'pending_verification'
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
        throw new Error(errorData.error || 'Failed to create shop');
      }

      // Success
      toast.success('Shop registration submitted successfully! Your shop is now pending verification.');
      setIsSubmitted(true);
      setIsPendingVerification(true);

      // Update user's has_shop status in Supabase
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            has_shop: true
          }
        });

        if (updateError) {
          console.error("Error updating user metadata:", updateError);
        } else {
          console.log("Updated user metadata: has_shop set to true");
        }
      } catch (updateErr) {
        console.error("Error updating user metadata:", updateErr);
      }

      // Update user's has_shop status in local state
      if (onComplete) {
        onComplete();
      }

      // Collapse the banner after a short delay
      setTimeout(() => {
        setIsExpanded(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting shop registration:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  });

  // Banner variants for animation
  const bannerVariants = {
    expanded: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    collapsed: {
      height: isMobile ? "80px" : "60px",
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  // Determine if the banner should be visible
  const shouldShowBanner = user &&
                          user.user_metadata?.role === 'shop_owner' &&
                          user.user_metadata?.has_shop !== true;

  return (
    <motion.div
      className={`w-full bg-gradient-to-r from-blue-900/90 to-indigo-900/90 rounded-lg overflow-hidden shadow-lg mb-8 border border-blue-700/30 ${shouldShowBanner ? 'block' : 'hidden'}`}
      initial="expanded"
      animate={isExpanded ? "expanded" : "collapsed"}
      variants={bannerVariants}
    >
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3">
          {isPendingVerification ? (
            <Clock className="h-5 w-5 text-amber-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-blue-400" />
          )}
          <h2 className="text-lg font-semibold text-white">
            {isPendingVerification
              ? "Shop Verification Pending"
              : "Complete Your Shop Setup"}
          </h2>
        </div>
        <button
          className="text-white/80 hover:text-white transition-colors"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Content - Only visible when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 sm:px-6 pb-6"
          >
            {isPendingVerification ? (
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium text-amber-300 mb-2">Verification in Progress</h3>
                <p className="text-white/80">
                  Your shop registration has been submitted and is awaiting verification by our team.
                  This usually takes 1-2 business days. You'll receive an email once your shop is verified.
                </p>
              </div>
            ) : (
              <>
                <p className="text-white/80 mb-6">
                  Complete the form below to register your shop on Siargao Rides.
                  Once submitted, our team will verify your information before your shop goes live.
                </p>

                {error && (
                  <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
                    <p className="text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shop Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white mb-2">Shop Information</h3>

                      <div>
                        <Label htmlFor="shopName" className="text-white">Shop Name *</Label>
                        <Input
                          id="shopName"
                          placeholder="Your shop name"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          {...register("shopName")}
                        />
                        {errors.shopName && (
                          <p className="text-red-400 text-sm mt-1">{errors.shopName.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-white">Shop Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your shop and services (min 20 characters)"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                          {...register("description")}
                        />
                        {errors.description && (
                          <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="address" className="text-white">Address *</Label>
                        <Input
                          id="address"
                          placeholder="Shop address"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          {...register("address")}
                        />
                        {errors.address && (
                          <p className="text-red-400 text-sm mt-1">{errors.address.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="location_area" className="text-white">Location Area *</Label>
                        <select
                          id="location_area"
                          className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-md h-10 px-3"
                          {...register("location_area")}
                        >
                          <option value="" className="bg-gray-900">Select a location</option>
                          {/* Using shared locations from constants */}
                          {SIARGAO_LOCATIONS.map((location) => (
                            <option key={location} value={location} className="bg-gray-900">
                              {location}
                            </option>
                          ))}
                        </select>
                        {errors.location_area && (
                          <p className="text-red-400 text-sm mt-1">{errors.location_area.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white mb-2">Contact Information</h3>

                      <div>
                        <Label htmlFor="fullName" className="text-white">Owner's Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="Your full name"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          {...register("fullName")}
                        />
                        {errors.fullName && (
                          <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-white">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Your email address"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-white">Phone Number *</Label>
                        <Input
                          id="phone"
                          placeholder="+639123456789 or 09123456789"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          {...register("phone")}
                        />
                        {errors.phone && (
                          <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="whatsapp" className="text-white">WhatsApp (optional)</Label>
                        <Input
                          id="whatsapp"
                          placeholder="WhatsApp number"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          {...register("whatsapp")}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="facebook_url" className="text-white">Facebook (optional)</Label>
                          <Input
                            id="facebook_url"
                            placeholder="Facebook URL"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            {...register("facebook_url")}
                          />
                        </div>

                        <div>
                          <Label htmlFor="instagram_url" className="text-white">Instagram (optional)</Label>
                          <Input
                            id="instagram_url"
                            placeholder="Instagram URL"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            {...register("instagram_url")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Documents */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white mb-2">Verification Documents</h3>

                    <div>
                      <Label htmlFor="governmentId" className="text-white">Government ID *</Label>
                      <div className="mt-2">
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="governmentId"
                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                              governmentIdPreview ? 'border-green-500/50 bg-green-900/10' : 'border-gray-600 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            {governmentIdPreview ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                {governmentId?.type.includes('image') ? (
                                  <img
                                    src={governmentIdPreview}
                                    alt="Government ID Preview"
                                    className="max-h-28 max-w-full object-contain"
                                  />
                                ) : (
                                  <div className="flex items-center text-green-400">
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    <span>PDF Document Selected</span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGovernmentId(null);
                                    setGovernmentIdPreview(null);
                                  }}
                                  className="absolute top-1 right-1 bg-red-900/80 text-white rounded-full p-1 hover:bg-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-400">
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-400">
                                  PNG, JPG, GIF or PDF (max 5MB)
                                </p>
                              </div>
                            )}
                            <input
                              id="governmentId"
                              type="file"
                              className="hidden"
                              accept="image/png,image/jpeg,image/gif,application/pdf"
                              onChange={handleGovernmentIdChange}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-white/60 mt-2">
                          Please upload a valid government ID (e.g., Driver's License, Passport, PhilID)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Referral */}
                  <div>
                    <Label htmlFor="referral" className="text-white">Referral Code (optional)</Label>
                    <Input
                      id="referral"
                      placeholder="Enter referral code or email"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      {...register("referral")}
                    />
                    {referralError && (
                      <p className="text-red-400 text-sm mt-1">{referralError}</p>
                    )}
                    <p className="text-xs text-white/60 mt-2">
                      If someone referred you to Siargao Rides, please enter their referral code or email
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                      disabled={isSubmitting || !isValid}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Save className="mr-2 h-4 w-4" />
                          Submit Shop Registration
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
