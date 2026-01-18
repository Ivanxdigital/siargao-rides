"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, Bike, Car, Truck } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { motion } from "framer-motion"
import { VehicleType } from "@/lib/types"
import { ShopTrustBadge } from "@/components/shop/ShopTrustBadge"

interface RentalShopCardProps {
  id: string
  name: string
  username?: string
  images: string[]
  startingPrice?: number
  rating?: number
  reviewCount: number
  availableBikes?: number
  totalBikes?: number
  location?: string
  vehicleTypes?: VehicleType[]
  isVerified?: boolean
  onClick?: () => void
}

const RentalShopCard = ({
  id,
  name,
  username,
  images,
  startingPrice,
  rating,
  reviewCount,
  availableBikes,
  totalBikes,
  location,
  vehicleTypes = ['motorcycle'],
  isVerified,
  onClick
}: RentalShopCardProps) => {
  const fallbackImage = "https://placehold.co/600x400/1e3b8a/white?text=Shop+Image"
  
  // Generate shop URL - prioritize username over ID
  const getShopUrl = () => {
    return username ? `/shop/${username}` : `/shop/${id}`
  }
  
  return (
    <motion.div 
      className="group bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 h-full flex flex-col"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Shop Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={images?.[0] || fallbackImage}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Trust badge */}
        {typeof isVerified === "boolean" && (
          <div className="absolute top-4 left-4">
            <ShopTrustBadge isVerified={isVerified} />
          </div>
        )}
        
        {/* Minimal rating overlay */}
        {rating !== undefined && (
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-white">{rating.toFixed(1)}</span>
          </div>
        )}
        
        {/* Clean vehicle type indicators */}
        {vehicleTypes && vehicleTypes.length > 0 && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            {vehicleTypes.includes('motorcycle') && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-2">
                <Bike size={16} className="text-white" />
              </div>
            )}
            {vehicleTypes.includes('car') && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-2">
                <Car size={16} className="text-white" />
              </div>
            )}
            {vehicleTypes.includes('tuktuk') && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-2">
                <Truck size={16} className="text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shop Details - More spacious and clean */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">{name}</h3>
          
          {/* Location with better spacing */}
          {location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin size={14} className="mr-2" />
              <span className="text-sm">{location}</span>
            </div>
          )}
        </div>
        
        {/* Cleaner pricing display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary">
              ₱{startingPrice ? startingPrice.toFixed(0) : '---'}
            </span>
            <span className="text-sm text-muted-foreground">/day</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {startingPrice ? 'Starting from' : 'Price not available'}
          </p>
        </div>
        
        {/* Simplified vehicle availability */}
        {(availableBikes !== undefined && totalBikes !== undefined) && (
          <div className="mb-6 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{availableBikes}</span> of {totalBikes} vehicles available
          </div>
        )}

        {/* Clean CTA button */}
        <div className="mt-auto">
          {onClick ? (
            <Button onClick={onClick} className="w-full h-11 text-sm font-medium" variant="default">
              View Shop
            </Button>
          ) : (
            <Button asChild className="w-full h-11 text-sm font-medium" variant="default">
              <Link href={getShopUrl()}>
                View Shop
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default RentalShopCard
