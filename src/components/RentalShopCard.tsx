"use client"

import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { Badge } from "./ui/Badge"
import { Button } from "./ui/Button"
import { motion } from "framer-motion"

interface RentalShopCardProps {
  id: string
  name: string
  images: string[]
  startingPrice: number
  rating: number
  reviewCount: number
}

const RentalShopCard = ({
  id,
  name,
  images,
  startingPrice,
  rating,
  reviewCount,
}: RentalShopCardProps) => {
  const fallbackImage = "https://placehold.co/600x400/1e3b8a/white?text=Shop+Image"
  
  return (
    <motion.div 
      className="bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      {/* Shop Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={images?.[0] || fallbackImage}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      {/* Shop Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-foreground">{name}</h3>
          <div className="flex items-center gap-1">
            <Star size={16} className="text-tropical-yellow fill-tropical-yellow" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Starting from
          </p>
          <p className="text-lg font-semibold text-primary">
            ₱{startingPrice} <span className="text-xs text-muted-foreground">/day</span>
          </p>
        </div>

        {/* Bike Preview Thumbnails - Just showing 2 small previews */}
        <div className="flex gap-2 mb-4">
          {(images || []).slice(0, 2).map((image, index) => (
            <div key={index} className="relative h-14 w-20 rounded-md overflow-hidden">
              <Image
                src={image || fallbackImage}
                alt={`${name} bike ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* View Shop Button */}
        <Button asChild className="w-full">
          <Link href={`/shop/${id}`}>
            View Shop
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}

export default RentalShopCard