"use client"

import { Bike, Car, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { VehicleType } from "@/lib/types"
import { cn } from "@/lib/utils"

interface VehicleTypeBadgeProps {
  type: VehicleType
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg' 
  className?: string
}

const VehicleTypeBadge = ({
  type,
  showLabel = true,
  size = 'md',
  className
}: VehicleTypeBadgeProps) => {
  // Icon sizes based on badge size
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }
  
  // Padding and font size classes based on size
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  }
  
  // Get the appropriate icon based on vehicle type
  const icon = () => {
    switch(type) {
      case 'car':
        return <Car size={iconSizes[size]} className={showLabel ? "mr-1" : ""} />;
      case 'tuktuk':
        return <Truck size={iconSizes[size]} className={showLabel ? "mr-1" : ""} />;
      case 'motorcycle':
      default:
        return <Bike size={iconSizes[size]} className={showLabel ? "mr-1" : ""} />;
    }
  };
  
  // Get the label text based on vehicle type
  const getLabel = () => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <Badge 
      variant={type}
      className={cn(
        "flex items-center", 
        sizeClasses[size],
        className
      )}
    >
      {icon()}
      {showLabel && getLabel()}
    </Badge>
  )
}

export default VehicleTypeBadge 