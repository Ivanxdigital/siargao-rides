"use client";

import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShopTrustBadgeProps {
  isVerified: boolean;
  size?: "sm" | "md";
  showText?: boolean;
  className?: string;
}

export function ShopTrustBadge({
  isVerified,
  size = "sm",
  showText = true,
  className = "",
}: ShopTrustBadgeProps) {
  const sizeConfig = {
    sm: { icon: "h-3 w-3", text: "text-xs", padding: "px-2 py-1" },
    md: { icon: "h-4 w-4", text: "text-sm", padding: "px-3 py-1.5" },
  } as const;

  const config = sizeConfig[size];

  if (isVerified) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={`bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200 ${config.padding} ${className}`}
            >
              <ShieldCheck className={`${config.icon} mr-1.5`} />
              {showText && <span className={config.text}>Verified</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">✅ Verified Shop</p>
              <p className="text-xs">Verified by Siargao Rides</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={`bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 ${config.padding} ${className}`}
          >
            <ShieldAlert className={`${config.icon} mr-1.5`} />
            {showText && <span className={config.text}>Unverified</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">⚠️ Unverified Shop</p>
            <p className="text-xs">Not yet verified by Siargao Rides</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

