"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Filter, ChevronDown, MapPin, Star, Users, Shield, 
  Check
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SurfSchoolFilters, SurfSchoolLocation, SkillLevel } from "@/lib/types"

interface SurfSchoolMobileFiltersProps {
  filters: SurfSchoolFilters
  onFiltersChange: (filters: SurfSchoolFilters) => void
  availableLocations: SurfSchoolLocation[]
  priceRange: { min: number; max: number }
  className?: string
}

const SurfSchoolMobileFilters = ({
  filters,
  onFiltersChange,
  availableLocations,
  priceRange,
  className = ""
}: SurfSchoolMobileFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false)
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

  const applyFilters = () => {
    handlePriceChange()
    setIsOpen(false)
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

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.location) count++
    if (filters.skill_levels?.length) count++
    if (filters.price_min || filters.price_max) count++
    if (filters.verified_only) count++
    if (filters.min_rating) count++
    if (filters.search) count++
    return count
  }

  const skillLevels: { id: SkillLevel; label: string; description: string }[] = [
    { id: 'beginner', label: 'Beginner Friendly', description: 'Perfect for first-time surfers' },
    { id: 'intermediate', label: 'Intermediate', description: 'For surfers with some experience' },
    { id: 'advanced', label: 'Advanced', description: 'Expert coaching and techniques' }
  ]

  const filterVariants = {
    closed: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    open: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div className={`md:hidden ${className}`}>
      {/* Filter Toggle Button */}
      <motion.button
        className="w-full flex items-center justify-between bg-card/30 backdrop-blur-xl border border-border/30 rounded-xl p-4 text-white shadow-lg mb-6"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.98 }}
        whileHover={{ 
          borderColor: "rgba(45, 212, 191, 0.5)",
          backgroundColor: "rgba(var(--color-card), 0.5)"
        }}
      >
        <div className="flex items-center">
          <Filter size={20} className="mr-3 text-primary/70" />
          <span className="font-medium">Filters & Sort</span>
          {hasActiveFilters && (
            <Badge className="ml-3 bg-primary/20 text-primary text-xs px-2 py-1 border-primary/30">
              {getActiveFilterCount()} active
            </Badge>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-primary/70"
        >
          <ChevronDown size={22} />
        </motion.div>
      </motion.button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-filters"
            variants={filterVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden mb-6 bg-card/30 backdrop-blur-xl rounded-xl border border-border/30 shadow-lg"
          >
            <div className="p-6 space-y-8">
              {/* Location Filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-white">
                  <MapPin size={18} className="text-primary/70" />
                  Location
                </h3>
                <select
                  value={filters.location || ''}
                  onChange={(e) => handleLocationChange(e.target.value as SurfSchoolLocation | '')}
                  className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors touch-manipulation"
                >
                  <option value="">All Locations</option>
                  {availableLocations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Skill Level Filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-white flex items-center gap-2">
                  <Users size={18} className="text-primary/70" />
                  Skill Level
                </h3>
                <div className="space-y-3">
                  {skillLevels.map((level) => (
                    <motion.label
                      key={level.id}
                      className="flex items-start gap-4 cursor-pointer p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors touch-manipulation"
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.skill_levels?.includes(level.id) || false}
                          onChange={() => handleSkillLevelChange(level.id)}
                          className="w-5 h-5 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50 transition-colors"
                        />
                        {filters.skill_levels?.includes(level.id) && (
                          <Check size={14} className="absolute top-0.5 left-0.5 text-primary pointer-events-none" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-base font-medium text-white/90">
                          {level.label}
                        </span>
                        <p className="text-sm text-white/60 mt-1">
                          {level.description}
                        </p>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-white flex items-center gap-2">
                  💰 Price Range
                </h3>
                <div className="space-y-4">
                  <div className="px-4 py-3 bg-card/50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-base text-white/80">₱{priceMin.toLocaleString()}</span>
                      <span className="text-base text-white/80">₱{priceMax.toLocaleString()}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        step={100}
                        value={priceMin}
                        onChange={(e) => setPriceMin(Number(e.target.value))}
                        className="w-full h-3 bg-border/30 rounded-lg appearance-none cursor-pointer slider-thumb"
                      />
                      <input
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        step={100}
                        value={priceMax}
                        onChange={(e) => setPriceMax(Number(e.target.value))}
                        className="w-full h-3 bg-transparent rounded-lg appearance-none cursor-pointer slider-thumb absolute top-0"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-white/60 text-center">
                    Prices shown are per hour
                  </div>
                </div>
              </div>

              {/* Minimum Rating Filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-white flex items-center gap-2">
                  <Star size={18} className="text-primary/70" />
                  Minimum Rating
                </h3>
                <div className="space-y-3">
                  {[4.5, 4.0, 3.5, 0].map((rating) => (
                    <motion.label
                      key={rating}
                      className="flex items-center gap-4 cursor-pointer p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors touch-manipulation"
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="radio"
                        name="min_rating"
                        checked={filters.min_rating === rating || (rating === 0 && !filters.min_rating)}
                        onChange={() => handleMinRatingChange(rating)}
                        className="w-5 h-5 border-border/50 text-primary focus:ring-primary/20 bg-card/50"
                      />
                      <div className="flex items-center gap-2">
                        {rating > 0 ? (
                          <>
                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-base text-white/90">{rating}+ stars</span>
                          </>
                        ) : (
                          <span className="text-base text-white/90">All ratings</span>
                        )}
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Verified Only Filter */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-white flex items-center gap-2">
                  <Shield size={18} className="text-primary/70" />
                  Verification
                </h3>
                <motion.label
                  className="flex items-center gap-4 cursor-pointer p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors touch-manipulation"
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="checkbox"
                    checked={filters.verified_only || false}
                    onChange={(e) => handleVerifiedOnlyChange(e.target.checked)}
                    className="w-5 h-5 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
                  />
                  <span className="text-base text-white/90">
                    Show verified instructors only
                  </span>
                </motion.label>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-white">Sort By</h3>
                <select
                  value={filters.sort_by || 'rating_desc'}
                  onChange={(e) => handleSortChange(e.target.value as SurfSchoolFilters['sort_by'])}
                  className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors touch-manipulation"
                >
                  <option value="rating_desc">Highest Rated</option>
                  <option value="price_asc">Lowest Price First</option>
                  <option value="price_desc">Highest Price First</option>
                  <option value="experience_desc">Most Experience</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border/30">
                {hasActiveFilters && (
                  <motion.button
                    onClick={resetFilters}
                    className="flex-1 px-6 py-4 bg-gray-800/70 hover:bg-gray-800 rounded-lg text-base text-white font-medium transition-colors touch-manipulation"
                    whileTap={{ scale: 0.98 }}
                  >
                    Reset Filters
                  </motion.button>
                )}
                <motion.button
                  onClick={applyFilters}
                  className="flex-1 px-6 py-4 bg-primary hover:bg-primary/90 rounded-lg text-base text-white font-medium transition-colors touch-manipulation"
                  whileTap={{ scale: 0.98 }}
                >
                  Apply Filters
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2DD4BF;
          cursor: pointer;
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2DD4BF;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}

export default SurfSchoolMobileFilters