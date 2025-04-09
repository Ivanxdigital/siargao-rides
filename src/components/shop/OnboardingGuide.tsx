import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Car,
  Image as ImageIcon,
  MapPin,
  Instagram,
  Phone,
  ChevronRight,
  Info,
  FileText,
  Megaphone,
  Facebook
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface OnboardingGuideProps {
  shopHasVehicles: boolean;
  shopHasLogo: boolean;
  shopHasBanner: boolean;
  shopHasDescription: boolean;
  shopHasLocation: boolean;
  shopHasContactInfo: boolean;
  shopId?: string;
  onDismiss?: () => void;
  subscriptionStatus?: 'active' | 'inactive' | 'expired';
}

export function OnboardingGuide({
  shopHasVehicles = false,
  shopHasLogo = false,
  shopHasBanner = false,
  shopHasDescription = false,
  shopHasLocation = false,
  shopHasContactInfo = false,
  shopId,
  onDismiss,
  subscriptionStatus = 'active',
}: Partial<OnboardingGuideProps>) {
  // State to track if guide has been dismissed locally
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if device is mobile
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Function to handle dismissing the guide
  const handleDismiss = () => {
    setIsDismissed(true);
    // Save dismissal to localStorage to persist across sessions
    if (shopId) {
      localStorage.setItem(`onboarding_dismissed_${shopId}`, 'true');
    }
    // Call parent onDismiss if provided
    if (onDismiss) {
      onDismiss();
    }
  };

  // Check if guide was previously dismissed
  useEffect(() => {
    if (shopId) {
      const wasDismissed = localStorage.getItem(`onboarding_dismissed_${shopId}`) === 'true';
      setIsDismissed(wasDismissed);
    }
  }, [shopId]);
  // Calculate completion percentage
  const totalSteps = 6; // Total number of steps to complete
  const completedSteps = [
    shopHasVehicles,
    shopHasLogo,
    shopHasBanner,
    shopHasDescription,
    shopHasLocation,
    shopHasContactInfo
  ].filter(Boolean).length;

  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  // If guide is dismissed permanently, don't render anything
  // Note: We're not returning null here anymore since we want to support toggling

  return (
    <motion.div
      className="bg-gradient-to-br from-black to-gray-900 border border-primary/20 rounded-xl p-4 sm:p-6 shadow-lg overflow-hidden relative w-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Removed the dismiss button since we now have a toggle button */}

      <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Shop Setup Guide</h2>
          <div className="text-sm text-white/60">
            <span className="text-primary font-semibold">{completionPercentage}%</span> Complete
          </div>
        </div>

        <div className="w-full bg-white/10 rounded-full h-2 mb-4">
          <motion.div
            className="bg-gradient-to-r from-primary to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <p className="text-white/70 text-sm md:text-base">
          Welcome to Siargao Rides! Complete these steps to set up your shop and start receiving bookings.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full"
        variants={containerVariants}
      >
        {/* Add Vehicles Step */}
        <motion.div
          className={cn(
            "relative overflow-hidden bg-black/50 backdrop-blur-sm border rounded-xl p-5 group transition-all duration-300",
            shopHasVehicles
              ? "border-green-500/30 shadow-sm shadow-green-500/10"
              : "border-white/10 hover:border-primary/30"
          )}
          variants={itemVariants}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              shopHasVehicles ? "bg-green-500/20" : "bg-primary/20"
            )}>
              {shopHasVehicles ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <Car size={20} className="text-primary" />
              )}
            </div>
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              shopHasVehicles
                ? "bg-green-500/20 text-green-400"
                : "bg-primary/20 text-primary"
            )}>
              {shopHasVehicles ? "Completed" : "Recommended"}
            </span>
          </div>

          <h3 className="text-lg font-semibold mb-1 text-white">
            {shopHasVehicles ? "Vehicles Added" : "Add Your Vehicles"}
          </h3>

          <p className="text-white/70 text-sm mb-4">
            {shopHasVehicles
              ? "Great job! You've added vehicles to your shop. You can add more anytime."
              : "Add motorcycles, cars, or tuktuks to your shop so tourists can find and rent them."}
          </p>

          <div className="mt-auto">
            <Button asChild variant={shopHasVehicles ? "outline" : "default"} size="sm" className="group">
              <Link href="/dashboard/vehicles/add" className="flex items-center">
                {shopHasVehicles ? "Add More Vehicles" : "Add Your First Vehicle"}
                <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          <div className={cn(
            "absolute top-2 right-2 h-16 w-16 opacity-10",
            shopHasVehicles ? "text-green-500" : "text-primary"
          )}>
            <Car className="h-full w-full" />
          </div>
        </motion.div>

        {/* Shop Logo and Banner Step */}
        <motion.div
          className={cn(
            "relative overflow-hidden bg-black/50 backdrop-blur-sm border rounded-xl p-5 group transition-all duration-300",
            (shopHasLogo && shopHasBanner)
              ? "border-green-500/30 shadow-sm shadow-green-500/10"
              : "border-white/10 hover:border-primary/30"
          )}
          variants={itemVariants}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              (shopHasLogo && shopHasBanner) ? "bg-green-500/20" : "bg-primary/20"
            )}>
              {(shopHasLogo && shopHasBanner) ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <ImageIcon size={20} className="text-primary" />
              )}
            </div>
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              (shopHasLogo && shopHasBanner)
                ? "bg-green-500/20 text-green-400"
                : "bg-primary/20 text-primary"
            )}>
              {(shopHasLogo && shopHasBanner) ? "Completed" : "Important"}
            </span>
          </div>

          <h3 className="text-lg font-semibold mb-1 text-white">
            {(shopHasLogo && shopHasBanner) ? "Images Added" : "Upload Shop Images"}
          </h3>

          <p className="text-white/70 text-sm mb-4">
            {(shopHasLogo && shopHasBanner)
              ? "Your shop logo and banner look great! They help create a strong brand presence."
              : "Upload a logo and banner for your shop to create a professional appearance."}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {!shopHasLogo && (
              <span className="text-xs bg-black/40 border border-white/10 px-2 py-1 rounded-full text-white/60">
                Logo {shopHasLogo ? "✓" : "✗"}
              </span>
            )}
            {!shopHasBanner && (
              <span className="text-xs bg-black/40 border border-white/10 px-2 py-1 rounded-full text-white/60">
                Banner {shopHasBanner ? "✓" : "✗"}
              </span>
            )}
          </div>

          <div className="mt-auto">
            <Button asChild variant={(shopHasLogo && shopHasBanner) ? "outline" : "default"} size="sm" className="group">
              <Link href="/dashboard/shop" className="flex items-center">
                {(shopHasLogo && shopHasBanner) ? "Update Images" : "Upload Images"}
                <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          <div className={cn(
            "absolute top-2 right-2 h-16 w-16 opacity-10",
            (shopHasLogo && shopHasBanner) ? "text-green-500" : "text-primary"
          )}>
            <ImageIcon className="h-full w-full" />
          </div>
        </motion.div>

        {/* Shop Description Step */}
        <motion.div
          className={cn(
            "relative overflow-hidden bg-black/50 backdrop-blur-sm border rounded-xl p-5 group transition-all duration-300",
            shopHasDescription
              ? "border-green-500/30 shadow-sm shadow-green-500/10"
              : "border-white/10 hover:border-primary/30"
          )}
          variants={itemVariants}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              shopHasDescription ? "bg-green-500/20" : "bg-primary/20"
            )}>
              {shopHasDescription ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <FileText size={20} className="text-primary" />
              )}
            </div>
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              shopHasDescription
                ? "bg-green-500/20 text-green-400"
                : "bg-primary/20 text-primary"
            )}>
              {shopHasDescription ? "Completed" : "Important"}
            </span>
          </div>

          <h3 className="text-lg font-semibold mb-1 text-white">
            {shopHasDescription ? "Description Added" : "Add Shop Description"}
          </h3>

          <p className="text-white/70 text-sm mb-4">
            {shopHasDescription
              ? "Your shop description helps tourists understand what you offer and why they should choose you."
              : "Write a compelling description of your shop, highlighting your services and unique offerings."}
          </p>

          <div className="mt-auto">
            <Button asChild variant={shopHasDescription ? "outline" : "default"} size="sm" className="group">
              <Link href="/dashboard/shop" className="flex items-center">
                {shopHasDescription ? "Update Description" : "Add Description"}
                <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          <div className={cn(
            "absolute top-2 right-2 h-16 w-16 opacity-10",
            shopHasDescription ? "text-green-500" : "text-primary"
          )}>
            <FileText className="h-full w-full" />
          </div>
        </motion.div>

        {/* Shop Location Step */}
        <motion.div
          className={cn(
            "relative overflow-hidden bg-black/50 backdrop-blur-sm border rounded-xl p-5 group transition-all duration-300",
            shopHasLocation
              ? "border-green-500/30 shadow-sm shadow-green-500/10"
              : "border-white/10 hover:border-primary/30"
          )}
          variants={itemVariants}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              shopHasLocation ? "bg-green-500/20" : "bg-primary/20"
            )}>
              {shopHasLocation ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <MapPin size={20} className="text-primary" />
              )}
            </div>
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              shopHasLocation
                ? "bg-green-500/20 text-green-400"
                : "bg-primary/20 text-primary"
            )}>
              {shopHasLocation ? "Completed" : "Important"}
            </span>
          </div>

          <h3 className="text-lg font-semibold mb-1 text-white">
            {shopHasLocation ? "Location Added" : "Add Shop Location"}
          </h3>

          <p className="text-white/70 text-sm mb-4">
            {shopHasLocation
              ? "Your shop's location helps tourists find you easily and plan their rental pick-up."
              : "Specify your shop's location on Siargao to help tourists find you easily."}
          </p>

          <div className="mt-auto">
            <Button asChild variant={shopHasLocation ? "outline" : "default"} size="sm" className="group">
              <Link href="/dashboard/shop" className="flex items-center">
                {shopHasLocation ? "Update Location" : "Add Location"}
                <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          <div className={cn(
            "absolute top-2 right-2 h-16 w-16 opacity-10",
            shopHasLocation ? "text-green-500" : "text-primary"
          )}>
            <MapPin className="h-full w-full" />
          </div>
        </motion.div>

        {/* Contact Information Step */}
        <motion.div
          className={cn(
            "relative overflow-hidden bg-black/50 backdrop-blur-sm border rounded-xl p-5 group transition-all duration-300 sm:col-span-2",
            shopHasContactInfo
              ? "border-green-500/30 shadow-sm shadow-green-500/10"
              : "border-white/10 hover:border-primary/30"
          )}
          variants={itemVariants}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              shopHasContactInfo ? "bg-green-500/20" : "bg-primary/20"
            )}>
              {shopHasContactInfo ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <Phone size={20} className="text-primary" />
              )}
            </div>
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              shopHasContactInfo
                ? "bg-green-500/20 text-green-400"
                : "bg-primary/20 text-primary"
            )}>
              {shopHasContactInfo ? "Completed" : "Important"}
            </span>
          </div>

          <h3 className="text-lg font-semibold mb-1 text-white">
            {shopHasContactInfo ? "Contact Info Added" : "Add Contact Information"}
          </h3>

          <p className="text-white/70 text-sm mb-3">
            {shopHasContactInfo
              ? "Your contact information allows tourists to reach you directly with questions."
              : "Add your contact details so tourists can reach you directly with questions."}
          </p>

          {!shopHasContactInfo && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center text-xs bg-black/40 border border-white/10 px-2 py-1 rounded-full text-white/60">
                <Phone size={12} className="mr-1" /> Phone
              </span>
              <span className="flex items-center text-xs bg-black/40 border border-white/10 px-2 py-1 rounded-full text-white/60">
                <Instagram size={12} className="mr-1" /> Instagram
              </span>
              <span className="flex items-center text-xs bg-black/40 border border-white/10 px-2 py-1 rounded-full text-white/60">
                <Facebook size={12} className="mr-1" /> Facebook
              </span>
              <span className="flex items-center text-xs bg-black/40 border border-white/10 px-2 py-1 rounded-full text-white/60">
                <Megaphone size={12} className="mr-1" /> WhatsApp
              </span>
            </div>
          )}

          <div className="mt-auto">
            <Button asChild variant={shopHasContactInfo ? "outline" : "default"} size="sm" className="group">
              <Link href="/dashboard/shop" className="flex items-center">
                {shopHasContactInfo ? "Update Contact Info" : "Add Contact Info"}
                <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          <div className={cn(
            "absolute top-2 right-2 h-16 w-16 opacity-10",
            shopHasContactInfo ? "text-green-500" : "text-primary"
          )}>
            <Phone className="h-full w-full" />
          </div>
        </motion.div>
      </motion.div>

      {/* Subscription Status Warning - Only show if not active */}
      {subscriptionStatus !== 'active' && (
        <motion.div
          className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3"
          variants={itemVariants}
        >
          <div className="shrink-0 h-8 w-8 bg-amber-500/20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-white mb-1">Subscription {subscriptionStatus === 'expired' ? 'Expired' : 'Inactive'}</h4>
            <p className="text-sm text-white/70 mb-2">
              Your shop subscription is {subscriptionStatus === 'expired' ? 'expired' : 'inactive'}. Some features may be limited until you {subscriptionStatus === 'expired' ? 'renew your subscription' : 'activate your subscription'}.
            </p>
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30">
                <Link href="/dashboard/subscription" className="flex items-center">
                  {subscriptionStatus === 'expired' ? 'Renew Subscription' : 'Activate Subscription'}
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Help Box */}
      <motion.div
        className="mt-4 sm:mt-6 bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start gap-2 sm:gap-3 w-full"
        variants={itemVariants}
      >
        <div className="shrink-0 h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
          <Info size={18} className="text-primary" />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">Need Help?</h4>
          <p className="text-sm text-white/70 mb-2">
            Having trouble setting up your shop? Check out our guides or contact our support team.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="outline" size="sm" className="text-xs border-primary/20 hover:bg-primary/10 w-full sm:w-auto">
              <Link href="/help" className="flex items-center justify-center w-full">
                View Guides
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-xs border-primary/20 hover:bg-primary/10 w-full sm:w-auto">
              <Link href="/contact" className="flex items-center justify-center w-full">
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}