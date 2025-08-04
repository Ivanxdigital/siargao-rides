"use client"

import Image from "next/image"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Star, MapPin, User, Users, Shield, MessageCircle, Phone, Instagram, Facebook, Globe } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { SurfSchoolCardProps } from "@/lib/types"

const SurfSchoolCard = ({
  name,
  instructor_name,
  experience_years,
  location,
  images,
  services,
  contact,
  is_verified,
  average_rating,
  review_count,
  starting_price,
  featured_image,
  onContactClick,
  onViewProfileClick
}: SurfSchoolCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Get primary contact method (WhatsApp preferred)
  const getPrimaryContact = () => {
    if (contact.whatsapp) return { type: 'whatsapp', value: contact.whatsapp }
    if (contact.phone_number) return { type: 'phone', value: contact.phone_number }
    if (contact.instagram) return { type: 'instagram', value: contact.instagram }
    if (contact.facebook) return { type: 'facebook', value: contact.facebook }
    if (contact.website) return { type: 'website', value: contact.website }
    return null
  }

  const primaryContact = getPrimaryContact()

  // Get skill levels offered
  const skillLevels = [...new Set(services.map(s => s.skill_level))].filter(level => level !== 'all')
  
  // Format skill levels for display
  const formatSkillLevels = (levels: string[]) => {
    if (levels.length === 0 || services.some(s => s.skill_level === 'all')) return 'All Levels'
    return levels.map(level => level.charAt(0).toUpperCase() + level.slice(1)).join(', ')
  }

  const handleContactClick = () => {
    if (primaryContact && onContactClick) {
      onContactClick(primaryContact.type as 'whatsapp' | 'phone' | 'instagram' | 'facebook' | 'website', primaryContact.value)
    }
  }

  const handleViewProfile = () => {
    if (onViewProfileClick) {
      onViewProfileClick()
    }
  }

  return (
    <motion.div
      className="group bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 h-full flex flex-col"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {images.length > 0 ? (
          <Image
            src={images[currentImageIndex] || featured_image || '/placeholder-surf.jpg'}
            alt={name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <p className="text-muted-foreground text-sm">No image available</p>
          </div>
        )}

        {/* Image Navigation - only show if multiple images */}
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

            {/* Dot indicators */}
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

        {/* Verification Badge */}
        {is_verified && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-emerald-600 text-white border border-emerald-700 flex items-center gap-1">
              <Shield size={12} />
              Verified Instructor
            </Badge>
          </div>
        )}

        {/* Experience Badge */}
        {experience_years && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-tropical-yellow text-background font-semibold">
              {experience_years} Years Experience
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex-grow flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">{name}</h3>
          
          {/* Instructor & Rating */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <User size={14} className="mr-1" />
              <span>Instructor: {instructor_name}</span>
            </div>
            
            {average_rating && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">{average_rating}</span>
                <span className="text-xs text-muted-foreground">({review_count})</span>
              </div>
            )}
          </div>

          {/* Location & Services */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            {location && (
              <div className="flex items-center">
                <MapPin size={14} className="mr-1" />
                <span>{location}</span>
              </div>
            )}
            <div className="flex items-center">
              <Users size={14} className="mr-1" />
              <span>{formatSkillLevels(skillLevels)}</span>
            </div>
          </div>

          {/* Equipment Included indicator */}
          {services.some(s => s.equipment_included) && (
            <div className="text-sm text-muted-foreground">
              🎯 Equipment Included
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold text-primary">
              ₱{starting_price ? starting_price.toLocaleString() : '---'}
            </span>
            <span className="text-sm text-muted-foreground">/hour</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {services.length > 1 ? 'Group Lessons Available' : 'Starting from'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-3">
          {/* Primary Contact Button */}
          {primaryContact && (
            <Button
              onClick={handleContactClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
            >
              {primaryContact.type === 'whatsapp' && <MessageCircle size={16} />}
              {primaryContact.type === 'phone' && <Phone size={16} />}
              {primaryContact.type === 'instagram' && <Instagram size={16} />}
              {primaryContact.type === 'facebook' && <Facebook size={16} />}
              {primaryContact.type === 'website' && <Globe size={16} />}
              Contact via {primaryContact.type === 'whatsapp' ? 'WhatsApp' : 
                         primaryContact.type === 'phone' ? 'Phone' :
                         primaryContact.type === 'instagram' ? 'Instagram' :
                         primaryContact.type === 'facebook' ? 'Facebook' : 'Website'}
            </Button>
          )}

          {/* View Profile Button */}
          <Button
            onClick={handleViewProfile}
            variant="outline"
            className="w-full border-border/50 hover:bg-card hover:border-border"
          >
            View Full Profile
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default SurfSchoolCard