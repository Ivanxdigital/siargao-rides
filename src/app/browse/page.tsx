"use client"

import { useState, useEffect } from "react"
import RentalShopCard from "@/components/RentalShopCard"
import { Sliders, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { motion, AnimatePresence } from "framer-motion"

// Temporary mock data for shops
const SHOPS = [
  {
    id: "shop1",
    name: "Island Riders",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=Island+Riders", "https://placehold.co/600x400/1e3b8a/white?text=Island+Riders"],
    startingPrice: 400,
    rating: 4.7,
    reviewCount: 24,
    bikeTypes: ["Scooter", "Semi-automatic"]
  },
  {
    id: "shop2",
    name: "Siargao Wheels",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=Siargao+Wheels", "https://placehold.co/600x400/1e3b8a/white?text=Siargao+Wheels"],
    startingPrice: 350,
    rating: 4.5,
    reviewCount: 18,
    bikeTypes: ["Scooter", "Dirt Bike"]
  },
  {
    id: "shop3",
    name: "Wave Cruisers",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=Wave+Cruisers", "https://placehold.co/600x400/1e3b8a/white?text=Wave+Cruisers"],
    startingPrice: 450,
    rating: 4.8,
    reviewCount: 32,
    bikeTypes: ["Semi-automatic", "Manual"]
  },
  {
    id: "shop4",
    name: "GL Rentals",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=GL+Rentals", "https://placehold.co/600x400/1e3b8a/white?text=GL+Rentals"],
    startingPrice: 380,
    rating: 4.2,
    reviewCount: 12,
    bikeTypes: ["Scooter", "Electric"]
  },
  {
    id: "shop5",
    name: "Surf & Ride",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=Surf+Ride", "https://placehold.co/600x400/1e3b8a/white?text=Surf+Ride"],
    startingPrice: 420,
    rating: 4.6,
    reviewCount: 28,
    bikeTypes: ["Manual", "Dirt Bike"]
  }
]

const BikeTypeCheckbox = ({ type, checked, onChange }: { type: string, checked: boolean, onChange: () => void }) => {
  return (
    <motion.div 
      className="flex items-center space-x-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      whileTap={{ scale: 0.95 }}
    >
      <input 
        type="checkbox" 
        id={`type-${type}`} 
        checked={checked}
        onChange={onChange}
        className="rounded border-gray-700 text-primary focus:ring-primary bg-gray-900/50"
      />
      <label htmlFor={`type-${type}`} className="text-sm text-gray-300">{type}</label>
    </motion.div>
  )
}

export default function BrowsePage() {
  const [priceRange, setPriceRange] = useState([100, 2000])
  const [selectedBikeTypes, setSelectedBikeTypes] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])
  
  const toggleBikeType = (type: string) => {
    if (selectedBikeTypes.includes(type)) {
      setSelectedBikeTypes(selectedBikeTypes.filter(t => t !== type))
    } else {
      setSelectedBikeTypes([...selectedBikeTypes, type])
    }
  }

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value)
  }

  // Apply filters
  const filteredShops = SHOPS.filter(shop => {
    // Price filter
    if (shop.startingPrice < priceRange[0] || shop.startingPrice > priceRange[1]) {
      return false
    }
    
    // Bike type filter
    if (selectedBikeTypes.length > 0) {
      const hasMatchingType = shop.bikeTypes.some(type => 
        selectedBikeTypes.includes(type)
      )
      if (!hasMatchingType) return false
    }
    
    // Rating filter
    if (shop.rating < minRating) {
      return false
    }
    
    return true
  })

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  }

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
    <div className="min-h-screen">
      <motion.section 
        className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Background with overlay gradient */}
        <motion.div 
          className="absolute inset-0 z-0 opacity-20"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30"></div>
        </motion.div>
        
        <div className="container mx-auto px-4 py-12 relative z-10 pt-24">
          <motion.div 
            className="max-w-3xl mx-auto mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              duration: 0.6,
              delay: 0.2
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                Find Your Ride
              </Badge>
            </motion.div>
            <motion.h1 
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              Browse Motorbike Rentals
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              Find the perfect ride for your Siargao adventure
            </motion.p>
          </motion.div>
        </div>
      </motion.section>
      
      <section className="py-8 bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4">
          {/* Mobile Filters Toggle */}
          <motion.div 
            className="md:hidden mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <motion.button 
              className="w-full flex items-center justify-between bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-md p-3 text-white"
              onClick={() => setShowFilters(!showFilters)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ borderColor: "rgba(var(--color-primary), 0.5)" }}
            >
              <div className="flex items-center">
                <Sliders size={18} className="mr-2" />
                <span>Filters</span>
              </div>
              <motion.div
                animate={{ rotate: showFilters ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </motion.div>
            </motion.button>
          </motion.div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar */}
            <AnimatePresence>
              <motion.div 
                className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 h-fit hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <motion.h2 
                  className="text-lg font-semibold mb-4 text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  Filters
                </motion.h2>
                
                {/* Price Range Filter */}
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <h3 className="text-sm font-medium mb-3 text-gray-200">Price Range</h3>
                  {/* This is a placeholder for the slider component */}
                  <div className="mb-2">
                    <div className="h-2 bg-gray-700 rounded-full relative">
                      <motion.div 
                        className="absolute h-full bg-primary rounded-full" 
                        style={{ 
                          left: `${((priceRange[0] - 100) / 1900) * 100}%`, 
                          right: `${100 - ((priceRange[1] - 100) / 1900) * 100}%` 
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>₱{priceRange[0]}</span>
                    <span>₱{priceRange[1]}</span>
                  </div>
                </motion.div>
                
                {/* Bike Type Filter */}
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <h3 className="text-sm font-medium mb-3 text-gray-200">Bike Type</h3>
                  <div className="space-y-2">
                    <BikeTypeCheckbox 
                      type="Scooter" 
                      checked={selectedBikeTypes.includes("Scooter")}
                      onChange={() => toggleBikeType("Scooter")}
                    />
                    <BikeTypeCheckbox 
                      type="Semi-automatic" 
                      checked={selectedBikeTypes.includes("Semi-automatic")}
                      onChange={() => toggleBikeType("Semi-automatic")}
                    />
                    <BikeTypeCheckbox 
                      type="Manual" 
                      checked={selectedBikeTypes.includes("Manual")}
                      onChange={() => toggleBikeType("Manual")}
                    />
                    <BikeTypeCheckbox 
                      type="Dirt Bike" 
                      checked={selectedBikeTypes.includes("Dirt Bike")}
                      onChange={() => toggleBikeType("Dirt Bike")}
                    />
                    <BikeTypeCheckbox 
                      type="Electric" 
                      checked={selectedBikeTypes.includes("Electric")}
                      onChange={() => toggleBikeType("Electric")}
                    />
                  </div>
                </motion.div>
                
                {/* Rating Filter */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <h3 className="text-sm font-medium mb-3 text-gray-200">Minimum Rating</h3>
                  <motion.select 
                    value={minRating}
                    onChange={e => setMinRating(Number(e.target.value))}
                    className="w-full p-2 bg-gray-900/50 border border-gray-700 rounded text-white"
                    whileFocus={{ borderColor: "rgba(var(--color-primary), 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </motion.select>
                </motion.div>
              </motion.div>
            </AnimatePresence>
            
            {/* Shop Listings */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    className="flex justify-center items-center py-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key="loading"
                  >
                    <div className="relative w-12 h-12">
                      <motion.div 
                        className="absolute inset-0 border-t-2 border-primary rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          ease: "linear"
                        }}
                      />
                    </div>
                  </motion.div>
                ) : filteredShops.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    key="results"
                  >
                    {filteredShops.map((shop, index) => (
                      <motion.div 
                        key={shop.id}
                        variants={itemVariants}
                        custom={index}
                      >
                        <RentalShopCard
                          id={shop.id}
                          name={shop.name}
                          images={shop.images}
                          startingPrice={shop.startingPrice}
                          rating={shop.rating}
                          reviewCount={shop.reviewCount}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    key="no-results"
                  >
                    <p className="text-lg text-gray-300">
                      No rental shops match your filters. Try adjusting your criteria.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 