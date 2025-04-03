"use client"

import Image from "next/image"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Bike, Car, Truck } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "./ui/Badge"
import { Button } from "./ui/Button"
import { VehicleType } from "@/lib/types"
import { VehicleDetailsDisplay } from "./VehicleDetailsDisplay"

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
  shop?: {
    id: string
    name: string
    logo?: string
    location?: string
  }
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
  shop,
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

  return (
    <motion.div 
      className="bg-card rounded-lg overflow-hidden border border-border shadow-sm h-full flex flex-col"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Gallery */}
      <div className="relative h-48 w-full">
        {images.length > 0 ? (
          <Image
            src={images[currentImageIndex] || '/placeholder.jpg'}
            alt={model}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">No image available</p>
          </div>
        )}

        {/* Vehicle Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-black/50 backdrop-blur-sm">
            <div className="flex items-center">
              {getVehicleIcon()}
              <span className="capitalize">{vehicleType}</span>
            </div>
          </Badge>
        </div>

        {/* Navigation Arrows - only show if multiple images */}
        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
            
            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <span 
                  key={index} 
                  className={`block w-1.5 h-1.5 rounded-full ${
                    index === currentImageIndex 
                      ? 'bg-primary' 
                      : 'bg-background/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Availability Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            variant={isAvailable ? 'available' : 'unavailable'} 
            className="px-3 py-1 text-xs font-bold shadow-lg"
          >
            {isAvailable ? 'Available' : 'Not Available'}
          </Badge>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-medium text-foreground mb-1">{model}</h3>
        
        {category && (
          <p className="text-sm text-muted-foreground mb-3">{category.replace('_', ' ')}</p>
        )}

        {/* Vehicle-specific details */}
        {specifications && (
          <div className="mb-3">
            <VehicleDetailsDisplay 
              vehicleType={vehicleType} 
              specifications={specifications}
              size="sm"
              variant="grid"
              showLabels={false}
            />
          </div>
        )}

        {/* Pricing */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Daily:</span>
            <span className="font-medium">₱{prices.daily}</span>
          </div>
          
          {prices.weekly && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Weekly:</span>
              <span className="font-medium">₱{prices.weekly}</span>
            </div>
          )}
          
          {prices.monthly && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monthly:</span>
              <span className="font-medium">₱{prices.monthly}</span>
            </div>
          )}
        </div>

        {/* Shop information */}
        {shop && (
          <div className="mb-4 mt-auto">
            <div className="flex items-center space-x-2 border-t border-border pt-3">
              <div className="w-8 h-8 relative rounded-full overflow-hidden bg-muted flex-shrink-0">
                {shop.logo ? (
                  <Image 
                    src={shop.logo} 
                    alt={shop.name} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-medium text-xs">
                    {shop.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{shop.name}</p>
                {shop.location && (
                  <p className="text-xs text-muted-foreground truncate">{shop.location}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Book/Inquire Button */}
        {isAvailable && onBookClick && (
          <Button
            className="w-full"
            onClick={() => onBookClick(id)}
          >
            Book Now
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default VehicleCard 