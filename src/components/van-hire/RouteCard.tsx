"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Clock, Users, ArrowRight, Star, Zap, Shield, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RouteInfo {
  id: string
  title: string
  description?: string
  pickup: {
    name: string
    description?: string
    icon?: string
  }
  dropoff: {
    name: string
    description?: string
    icon?: string
  }
  pricing: {
    basePrice: number
    currency: string
    priceNote?: string
  }
  duration: {
    estimated: number // minutes
    note?: string
  }
  distance: {
    km: number
    route?: string
  }
  features: string[]
  popularity?: 'high' | 'medium' | 'low'
  tags?: string[]
  availability: 'available' | 'limited' | 'unavailable'
}

interface RouteCardProps {
  route: RouteInfo
  isSelected?: boolean
  onSelect: (routeId: string) => void
  showDetails?: boolean
  variant?: 'default' | 'compact' | 'featured'
}

export default function RouteCard({
  route,
  isSelected = false,
  onSelect,
  showDetails = true,
  variant = 'default'
}: RouteCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getPopularityColor = (popularity?: string) => {
    switch (popularity) {
      case 'high':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-500/20 text-green-400'
      case 'limited':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'unavailable':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available':
        return <CheckCircle className="h-3 w-3" />
      case 'limited':
        return <Clock className="h-3 w-3" />
      case 'unavailable':
        return <div className="h-3 w-3 rounded-full bg-red-400" />
      default:
        return null
    }
  }

  if (variant === 'compact') {
    return (
      <Card
        className={`cursor-pointer transition-all duration-300 ${
          isSelected
            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
            : 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'
        }`}
        onClick={() => onSelect(route.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="font-medium text-sm">{route.title}</h3>
              <div className="flex gap-3 mt-1 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {route.duration.estimated}min
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {route.distance.km}km
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {route.pricing.currency}{route.pricing.basePrice}
              </div>
              <Badge className={`text-xs ${getAvailabilityColor(route.availability)}`}>
                {route.availability}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'featured') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          className={`cursor-pointer transition-all duration-500 ${
            isSelected
              ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl shadow-primary/20'
              : 'border-zinc-600 hover:border-primary/50 hover:shadow-lg'
          } ${route.popularity === 'high' ? 'ring-2 ring-yellow-500/30' : ''}`}
          onClick={() => onSelect(route.id)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{route.title}</h3>
                  {route.popularity === 'high' && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
                {route.description && (
                  <p className="text-sm text-white/70">{route.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary mb-1">
                  {route.pricing.currency}{route.pricing.basePrice}
                </div>
                {route.pricing.priceNote && (
                  <p className="text-xs text-white/60">{route.pricing.priceNote}</p>
                )}
              </div>
            </div>

            {/* Route Visual */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-zinc-800/50 rounded-lg">
              <div className="text-center flex-1">
                <div className="text-2xl mb-1">{route.pickup.icon || '📍'}</div>
                <div className="font-medium text-sm">{route.pickup.name}</div>
                {route.pickup.description && (
                  <div className="text-xs text-white/60">{route.pickup.description}</div>
                )}
              </div>
              
              <div className="flex flex-col items-center">
                <ArrowRight className="h-5 w-5 text-primary" />
                <div className="text-xs text-white/60 mt-1">{route.distance.km}km</div>
              </div>
              
              <div className="text-center flex-1">
                <div className="text-2xl mb-1">{route.dropoff.icon || '📍'}</div>
                <div className="font-medium text-sm">{route.dropoff.name}</div>
                {route.dropoff.description && (
                  <div className="text-xs text-white/60">{route.dropoff.description}</div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {route.duration.estimated} minutes
                  {route.duration.note && <span className="text-white/60"> {route.duration.note}</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm">Up to 8 passengers</span>
              </div>
            </div>

            {/* Features */}
            {route.features.length > 0 && showDetails && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Included Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  {route.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                {route.features.length > 4 && (
                  <p className="text-xs text-white/60 mt-2">
                    +{route.features.length - 4} more features
                  </p>
                )}
              </div>
            )}

            {/* Tags */}
            {route.tags && route.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {route.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Availability & Action */}
            <div className="flex justify-between items-center">
              <Badge className={`${getAvailabilityColor(route.availability)}`}>
                {getAvailabilityIcon(route.availability)}
                <span className="ml-1 capitalize">{route.availability}</span>
              </Badge>
              
              <Button
                className={`${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary border border-primary/20'
                } hover:bg-primary hover:text-white transition-all duration-300`}
                disabled={route.availability === 'unavailable'}
              >
                {isSelected ? 'Selected' : 'Select Route'}
                {!isSelected && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-300 group ${
          isSelected
            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
            : 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'
        }`}
        onClick={() => onSelect(route.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {route.title}
              </h3>
              {route.description && (
                <p className="text-sm text-white/70 mt-1">{route.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary">
                {route.pricing.currency}{route.pricing.basePrice}
              </div>
              {route.pricing.priceNote && (
                <p className="text-xs text-white/60">{route.pricing.priceNote}</p>
              )}
            </div>
          </div>

          {/* Route Info */}
          <div className="flex items-center justify-between mb-3 p-2 bg-zinc-800/30 rounded">
            <div className="text-sm">
              <span className="font-medium">{route.pickup.name}</span>
              <ArrowRight className="inline mx-2 h-3 w-3" />
              <span className="font-medium">{route.dropoff.name}</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex gap-4 text-sm text-white/70 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {route.duration.estimated}min
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {route.distance.km}km
            </span>
            <Badge className={`text-xs ${getAvailabilityColor(route.availability)}`}>
              {route.availability}
            </Badge>
          </div>

          {/* Action Button */}
          <Button
            className={`w-full ${
              isSelected
                ? 'bg-primary text-white'
                : 'bg-primary/10 text-primary border border-primary/20'
            } hover:bg-primary hover:text-white transition-all duration-300`}
            disabled={route.availability === 'unavailable'}
          >
            {isSelected ? 'Route Selected' : 'Select This Route'}
            {!isSelected && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}