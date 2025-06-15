"use client";

import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Shield, 
  Star,
  HelpCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VerificationStatus = 'pending_verification' | 'active' | 'rejected';

interface VerificationBadgeProps {
  status: VerificationStatus;
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function VerificationBadge({ 
  status, 
  isVerified, 
  size = 'md', 
  showText = true,
  className = ""
}: VerificationBadgeProps) {
  
  // Size configurations
  const sizeConfig = {
    sm: {
      icon: "h-3 w-3",
      text: "text-xs",
      padding: "px-2 py-1"
    },
    md: {
      icon: "h-4 w-4",
      text: "text-sm",
      padding: "px-3 py-1.5"
    },
    lg: {
      icon: "h-5 w-5",
      text: "text-base",
      padding: "px-4 py-2"
    }
  };

  const config = sizeConfig[size];

  // Verified shop (admin approved)
  if (status === 'active' && isVerified) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 ${config.padding} ${className}`}
            >
              <CheckCircle2 className={`${config.icon} mr-1.5`} />
              {showText && <span className={config.text}>Verified</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">✅ Verified Shop</p>
              <p className="text-xs">Documents verified by Siargao Rides</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Pending verification (unverified but active)
  if (status === 'pending_verification' || (status === 'active' && !isVerified)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 ${config.padding} ${className}`}
            >
              <Clock className={`${config.icon} mr-1.5`} />
              {showText && <span className={config.text}>Pending Verification</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">⏳ Pending Verification</p>
              <p className="text-xs">Shop is active but documents not yet verified</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Rejected
  if (status === 'rejected') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="destructive" 
              className={`bg-red-100 text-red-800 border-red-300 hover:bg-red-200 ${config.padding} ${className}`}
            >
              <AlertTriangle className={`${config.icon} mr-1.5`} />
              {showText && <span className={config.text}>Verification Required</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">❌ Verification Required</p>
              <p className="text-xs">Please contact support to resolve issues</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default fallback
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${config.padding} ${className}`}
          >
            <HelpCircle className={`${config.icon} mr-1.5`} />
            {showText && <span className={config.text}>Unknown Status</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Status unclear - please contact support</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Premium badge for highly rated verified shops
interface PremiumBadgeProps {
  rating?: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PremiumBadge({ 
  rating, 
  reviewCount, 
  size = 'md',
  className = ""
}: PremiumBadgeProps) {
  const sizeConfig = {
    sm: { icon: "h-3 w-3", text: "text-xs", padding: "px-2 py-1" },
    md: { icon: "h-4 w-4", text: "text-sm", padding: "px-3 py-1.5" },
    lg: { icon: "h-5 w-5", text: "text-base", padding: "px-4 py-2" }
  };

  const config = sizeConfig[size];

  // Only show for shops with high ratings and sufficient reviews
  if (!rating || !reviewCount || rating < 4.5 || reviewCount < 10) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300 hover:from-yellow-200 hover:to-orange-200 ${config.padding} ${className}`}
          >
            <Star className={`${config.icon} mr-1.5 fill-current`} />
            <span className={config.text}>Top Rated</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">⭐ Top Rated Shop</p>
            <p className="text-xs">{rating}/5 stars from {reviewCount}+ reviews</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Combined badge component that shows appropriate badges
interface ShopBadgesProps {
  status: VerificationStatus;
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ShopBadges({
  status,
  isVerified,
  rating,
  reviewCount,
  size = 'md',
  className = ""
}: ShopBadgesProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <VerificationBadge 
        status={status} 
        isVerified={isVerified} 
        size={size} 
      />
      <PremiumBadge 
        rating={rating} 
        reviewCount={reviewCount} 
        size={size} 
      />
    </div>
  );
}