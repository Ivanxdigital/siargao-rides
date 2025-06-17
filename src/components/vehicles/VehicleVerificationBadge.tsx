"use client";

import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  FileText,
  AlertTriangle,
  HelpCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VerificationStatus = 'verified' | 'pending' | 'documents_needed' | 'rejected';

interface VehicleVerificationBadgeProps {
  isVerified: boolean;
  verificationStatus: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function VehicleVerificationBadge({ 
  isVerified, 
  verificationStatus,
  size = 'md', 
  showText = true,
  className = ""
}: VehicleVerificationBadgeProps) {
  
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

  // Verified vehicle
  if (isVerified) {
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
              <p className="font-medium">✅ Verified Vehicle</p>
              <p className="text-xs">Documents verified by admin</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Pending verification (has documents)
  if (verificationStatus === 'pending') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200 ${config.padding} ${className}`}
            >
              <Clock className={`${config.icon} mr-1.5`} />
              {showText && <span className={config.text}>Pending Review</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">⏳ Pending Review</p>
              <p className="text-xs">Documents submitted, awaiting admin review</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Documents needed (quick listed without docs)
  if (verificationStatus === 'documents_needed') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 ${config.padding} ${className}`}
            >
              <FileText className={`${config.icon} mr-1.5`} />
              {showText && <span className={config.text}>Docs Needed</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">📄 Documents Needed</p>
              <p className="text-xs">Upload registration & insurance to get verified</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Rejected
  if (verificationStatus === 'rejected') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="destructive" 
              className={`bg-red-100 text-red-800 border-red-300 hover:bg-red-200 ${config.padding} ${className}`}
            >
              <AlertTriangle className={`${config.icon} mr-1.5`} />
              {showText && <span className={config.text}>Rejected</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">❌ Verification Rejected</p>
              <p className="text-xs">Please contact support for details</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default/unknown status
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${config.padding} ${className}`}
          >
            <HelpCircle className={`${config.icon} mr-1.5`} />
            {showText && <span className={config.text}>Unknown</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Unknown verification status</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Component to show on vehicle cards for customers
export function VehicleStatusIndicator({ 
  isVerified, 
  verificationStatus,
  className = ""
}: Omit<VehicleVerificationBadgeProps, 'size' | 'showText'>) {
  
  if (isVerified) {
    return (
      <div className={`flex items-center text-emerald-600 ${className}`}>
        <CheckCircle2 className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Verified</span>
      </div>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <div className={`flex items-center text-teal-600 ${className}`}>
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm">Under Review</span>
      </div>
    );
  }

  if (verificationStatus === 'documents_needed') {
    return (
      <div className={`flex items-center text-amber-600 ${className}`}>
        <FileText className="h-4 w-4 mr-1" />
        <span className="text-sm">Unverified</span>
      </div>
    );
  }

  return null; // Don't show anything for rejected or unknown status on public view
}