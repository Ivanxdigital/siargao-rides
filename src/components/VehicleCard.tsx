"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Bike, Car, Truck, Calendar, Users } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { VehicleType } from "@/lib/types"
import { VehicleDetailsDisplay } from "./VehicleDetailsDisplay"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VehicleAvailabilityCalendar } from "./VehicleAvailabilityCalendar"
import { format, parseISO } from "date-fns"

interface VehicleCardProps {
  id: string
  model: string
  vehicleType: VehicleType
  category?: string
  images: string[]
  prices: {
    daily: number
    weekly?: number
    monthly?: number
  }
  isAvailable: boolean
  specifications?: Record<string, any>
  onBookClick?: (vehicleId: string) => void
  onViewShopClick?: () => void
  onImageClick?: () => void
  shop?: {
    id: string
    name: string
    username?: string
    logo?: string
    location?: string
  }
  availabilityInfo?: {
    isAvailableForDates: boolean
    startDate: string
    endDate: string
  }
  // Group-related props
  isGroup?: boolean
  groupId?: string
  availableCount?: number
  totalCount?: number
}

const VehicleCard = ({
  id,
  model,
  vehicleType = 'motorcycle',
  category,
  images,
  prices,
  isAvailable,
  specifications,
  onBookClick,
  onViewShopClick,
  onImageClick,
  shop,
  availabilityInfo,
  isGroup = false,
  groupId,
  availableCount = 1,
  totalCount = 1,
}: VehicleCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Get the appropriate icon based on vehicle type
  const getVehicleIcon = () => {
    switch(vehicleType) {
      case 'car':
        return <Car size={16} className="mr-1 text-blue-400" />
      case 'tuktuk':
        return <Truck size={16} className="mr-1 text-amber-400" />
      case 'motorcycle':
      default:
        return <Bike size={16} className="mr-1 text-primary" />
    }
  }

  // Add this function to format the dates
  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } catch (error) {
      return '';
    }
  };

  return (
    <motion.div
      className="group bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 h-full flex flex-col"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Gallery */}
      <div
        className="relative aspect-[4/3] sm:aspect-[5/4] md:aspect-[4/3] w-full cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onImageClick?.();
        }}
      >
        {images.length > 0 ? (
          <Image
            src={images[currentImageIndex] || '/placeholder.jpg'}
            alt={model}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <p className="text-muted-foreground text-sm">No image available</p>
          </div>
        )}

        {/* Minimal Vehicle Type Badge */}
        <div className="absolute top-4 left-4">
          <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            {getVehicleIcon()}
            <span className="capitalize text-white text-sm font-medium">{vehicleType}</span>
          </div>
        </div>

        {/* Clean Navigation Arrows - only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight size={16} className="text-white" />
            </button>

            {/* Minimal dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`block w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'bg-white'
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Clean Availability Badge */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* Group indicator badge */}
          {isGroup && (
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md bg-purple-600/80 text-white flex items-center gap-1">
              <Users size={14} />
              {availableCount} of {totalCount} units
            </div>
          )}
          
          {/* Availability badge */}
          {availabilityInfo ? (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md ${
              availabilityInfo.isAvailableForDates 
                ? 'bg-green-500/80 text-white' 
                : 'bg-red-500/80 text-white'
            }`}>
              {availabilityInfo.isAvailableForDates ? 'Available' : 'Unavailable'}
            </div>
          ) : (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md ${
              isAvailable && (!isGroup || availableCount > 0)
                ? 'bg-green-500/80 text-white' 
                : 'bg-red-500/80 text-white'
            }`}>
              {isAvailable && (!isGroup || availableCount > 0) ? 'Available' : 'Not Available'}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Details - Cleaner layout */}
      <div className="p-6 flex-grow flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-foreground mb-3">{model}</h3>

          {/* Simplified specifications */}
          {specifications && (
            <div className="mb-4">
              <VehicleDetailsDisplay
                vehicleType={vehicleType}
                specifications={specifications}
                size="sm"
                variant="grid"
                showLabels={false}
              />
            </div>
          )}
        </div>

        {/* Clean pricing display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold text-primary">₱{prices.daily}</span>
            <span className="text-sm text-muted-foreground">/day</span>
          </div>

          {(prices.weekly || prices.monthly) && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              {prices.weekly && (
                <div>Weekly: ₱{prices.weekly}</div>
              )}
              {prices.monthly && (
                <div>Monthly: ₱{prices.monthly}</div>
              )}
            </div>
          )}
        </div>

        {/* Date Range Info - Simplified */}
        {availabilityInfo && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
              <Calendar size={14} />
              Selected Dates
            </div>
            <div className="text-sm text-foreground">
              {formatDateRange(availabilityInfo.startDate, availabilityInfo.endDate)}
            </div>
          </div>
        )}

        {/* Clean shop information */}
        {shop && (
          <div className="mb-6 mt-auto">
            <Link href={shop.username ? `/shop/${shop.username}` : `/shop/${shop.id}`} className="block group">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 group-hover:border-border transition-colors">
                <div className="w-10 h-10 relative rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {shop.logo ? (
                    <Image
                      src={shop.logo}
                      alt={shop.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-sm">
                      {shop.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{shop.name}</p>
                  {shop.location && (
                    <p className="text-xs text-muted-foreground truncate">{shop.location}</p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Clean CTA button */}
        <div className="mt-auto">
          <Button
            className="w-full h-12 text-sm font-medium"
            onClick={() => onBookClick?.(isGroup ? groupId || id : id)}
            disabled={!isAvailable || (isGroup && availableCount === 0)}
          >
            {isGroup ? `Book from ${availableCount} Available` : 'Book Now'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default VehicleCard