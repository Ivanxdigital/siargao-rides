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
      className="bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col"
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      transition={{ duration: 0.2 }}
    >
      {/* Shop Image */}
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src={images?.[0] || fallbackImage}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium text-white">{rating.toFixed(1)}</span>
          <span className="text-xs text-gray-300">({reviewCount})</span>
        </div>
      </div>

      {/* Shop Details */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-base font-bold text-foreground mb-1 line-clamp-1">{name}</h3>
        
        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-baseline">
            <p className="text-lg font-semibold text-primary">₱{startingPrice}</p>
            <span className="text-xs text-muted-foreground ml-1">/day</span>
          </div>
          <p className="text-xs text-muted-foreground">Starting price</p>
        </div>

        <div className="mt-auto">
          <Button asChild className="w-full text-sm py-1.5" size="sm">
            <Link href={`/shop/${id}`}>
              View Shop
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default RentalShopCard