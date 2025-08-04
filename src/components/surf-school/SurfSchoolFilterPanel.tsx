"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Star, Users, Shield, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SurfSchoolFilters, SurfSchoolLocation, SkillLevel } from "@/lib/types"

interface SurfSchoolFilterPanelProps {
  filters: SurfSchoolFilters
  onFiltersChange: (filters: SurfSchoolFilters) => void
  availableLocations: SurfSchoolLocation[]
  priceRange: { min: number; max: number }
  className?: string
}

const SurfSchoolFilterPanel = ({
  filters,
  onFiltersChange,
  availableLocations,
  priceRange,
  className = ""
}: SurfSchoolFilterPanelProps) => {
  const [priceMin, setPriceMin] = useState(filters.price_min || priceRange.min)
  const [priceMax, setPriceMax] = useState(filters.price_max || priceRange.max)

  const handleLocationChange = (location: SurfSchoolLocation | '') => {
    onFiltersChange({
      ...filters,
      location: location || undefined
    })
  }

  const handleSkillLevelChange = (skillLevel: SkillLevel) => {
    const currentLevels = filters.skill_levels || []
    const isSelected = currentLevels.includes(skillLevel)
    
    const newLevels = isSelected
      ? currentLevels.filter(level => level !== skillLevel)
      : [...currentLevels, skillLevel]
    
    onFiltersChange({
      ...filters,
      skill_levels: newLevels.length > 0 ? newLevels : undefined
    })
  }

  const handlePriceChange = () => {
    onFiltersChange({
      ...filters,
      price_min: priceMin !== priceRange.min ? priceMin : undefined,
      price_max: priceMax !== priceRange.max ? priceMax : undefined
    })
  }

  const handleVerifiedOnlyChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      verified_only: checked || undefined
    })
  }

  const handleMinRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      min_rating: rating > 0 ? rating : undefined
    })
  }

  const handleSortChange = (sortBy: SurfSchoolFilters['sort_by']) => {
    onFiltersChange({
      ...filters,
      sort_by: sortBy
    })
  }

  const resetFilters = () => {
    setPriceMin(priceRange.min)
    setPriceMax(priceRange.max)
    onFiltersChange({
      page: 1,
      limit: filters.limit
    })
  }

  const hasActiveFilters = Boolean(
    filters.location || 
    filters.skill_levels?.length || 
    filters.price_min || 
    filters.price_max || 
    filters.verified_only || 
    filters.min_rating || 
    filters.search
  )

  const skillLevels: { id: SkillLevel; label: string; description: string }[] = [
    { id: 'beginner', label: 'Beginner Friendly', description: 'Perfect for first-time surfers' },
    { id: 'intermediate', label: 'Intermediate', description: 'For surfers with some experience' },
    { id: 'advanced', label: 'Advanced', description: 'Expert coaching and techniques' }
  ]

  return (
    <div className={`sticky top-20 p-6 bg-card/30 backdrop-blur-xl rounded-xl border border-border/30 ${className}`}>
      <h2 className="text-xl font-semibold mb-6 text-white">Filters</h2>

      {/* Location Filter */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 text-white/90 flex items-center gap-2">
          <MapPin size={16} className="text-primary/70" />
          Location
        </h3>
        <select
          value={filters.location || ''}
          onChange={(e) => handleLocationChange(e.target.value as SurfSchoolLocation | '')}
          className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
        >
          <option value="">All Locations</option>
          {availableLocations.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>

      {/* Skill Level Filter */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 text-white/90 flex items-center gap-2">
          <Users size={16} className="text-primary/70" />
          Skill Level
        </h3>
        <div className="space-y-3">
          {skillLevels.map((level) => (
            <motion.label
              key={level.id}
              className="flex items-start gap-3 cursor-pointer group"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.skill_levels?.includes(level.id) || false}
                  onChange={() => handleSkillLevelChange(level.id)}
                  className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50 transition-colors"
                />
                {filters.skill_levels?.includes(level.id) && (
                  <Check size={12} className="absolute top-0.5 left-0.5 text-primary pointer-events-none" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white/90 group-hover:text-white">
                  {level.label}
                </span>
                <p className="text-xs text-white/60 mt-0.5">
                  {level.description}
                </p>
              </div>
            </motion.label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 text-white/90 flex items-center gap-2">
          💰 Price Range
        </h3>
        <div className="space-y-4">
          <div className="px-3 py-2 bg-card/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/80">₱{priceMin.toLocaleString()}</span>
              <span className="text-sm text-white/80">₱{priceMax.toLocaleString()}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                step={100}
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                onMouseUp={handlePriceChange}
                className="w-full h-2 bg-border/30 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                step={100}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                onMouseUp={handlePriceChange}
                className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider-thumb absolute top-0"
              />
            </div>
          </div>
          <div className="text-xs text-white/60 text-center">
            Prices shown are per hour
          </div>
        </div>
      </div>

      {/* Minimum Rating Filter */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 text-white/90 flex items-center gap-2">
          <Star size={16} className="text-primary/70" />
          Minimum Rating
        </h3>
        <div className="space-y-2">
          {[4.5, 4.0, 3.5, 0].map((rating) => (
            <motion.label
              key={rating}
              className="flex items-center gap-3 cursor-pointer group"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="radio"
                name="min_rating"
                checked={filters.min_rating === rating || (rating === 0 && !filters.min_rating)}
                onChange={() => handleMinRatingChange(rating)}
                className="w-4 h-4 border-border/50 text-primary focus:ring-primary/20 bg-card/50"
              />
              <div className="flex items-center gap-1">
                {rating > 0 ? (
                  <>
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-white/80">{rating}+ stars</span>
                  </>
                ) : (
                  <span className="text-sm text-white/80">All ratings</span>
                )}
              </div>
            </motion.label>
          ))}
        </div>
      </div>

      {/* Verified Only Filter */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 text-white/90 flex items-center gap-2">
          <Shield size={16} className="text-primary/70" />
          Verification
        </h3>
        <motion.label
          className="flex items-center gap-3 cursor-pointer group"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            type="checkbox"
            checked={filters.verified_only || false}
            onChange={(e) => handleVerifiedOnlyChange(e.target.checked)}
            className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
          />
          <span className="text-sm text-white/80 group-hover:text-white">
            Show verified instructors only
          </span>
        </motion.label>
      </div>

      {/* Sort By */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-4 text-white/90">Sort By</h3>
        <select
          value={filters.sort_by || 'rating_desc'}
          onChange={(e) => handleSortChange(e.target.value as SurfSchoolFilters['sort_by'])}
          className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
        >
          <option value="rating_desc">Highest Rated</option>
          <option value="price_asc">Lowest Price First</option>
          <option value="price_desc">Highest Price First</option>
          <option value="experience_desc">Most Experience</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-border/30">
          <Button
            onClick={resetFilters}
            variant="outline"
            className="w-full bg-card/50 border-border/50 text-white hover:bg-card"
          >
            Clear All Filters
          </Button>
        </div>
      )}

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2DD4BF;
          cursor: pointer;
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2DD4BF;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}

export default SurfSchoolFilterPanel