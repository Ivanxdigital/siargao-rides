"use client"

import { useState, useEffect } from "react"
import RentalShopCard from "@/components/RentalShopCard"
import { Sliders, ChevronDown, ChevronUp, MapPin, Calendar, Filter, Bike as BikeIcon, Car as CarIcon, Truck as TruckIcon } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { motion, AnimatePresence } from "framer-motion"
import { getShops, getBikes, getVehicles, getVehicleTypes } from "@/lib/api"
import { RentalShop, Vehicle, VehicleType, VehicleCategory, BikeCategory, CarCategory, TuktukCategory } from "@/lib/types"

// Interface for shop data with additional calculated fields
interface ShopWithMetadata extends RentalShop {
  startingPrice: number;
  rating: number;
  reviewCount: number;
  vehicleTypes: VehicleType[];
  motorcycles: { count: number, types: BikeCategory[], minPrice: number, available: number };
  cars: { count: number, types: CarCategory[], minPrice: number, available: number };
  tuktuks: { count: number, types: TuktukCategory[], minPrice: number, available: number };
  totalVehicles: number;
  availableVehicles: number;
  images: string[];
}

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

// New component for vehicle type selection
const VehicleTypeSelector = ({ selectedType, onChange }: { 
  selectedType: VehicleType | 'all', 
  onChange: (type: VehicleType | 'all') => void 
}) => {
  const vehicleTypes: Array<{id: VehicleType | 'all', label: string, icon: any}> = [
    { id: 'all', label: 'All Vehicles', icon: BikeIcon },
    { id: 'motorcycle', label: 'Motorcycles', icon: BikeIcon },
    { id: 'car', label: 'Cars', icon: CarIcon },
    { id: 'tuktuk', label: 'Tuktuks', icon: TruckIcon }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {vehicleTypes.map((type) => {
        const Icon = type.icon;
        return (
          <motion.button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
              selectedType === type.id 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-800'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Icon size={14} />
            <span>{type.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default function BrowsePage() {
  const [priceRange, setPriceRange] = useState([100, 2000])
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | 'all'>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shops, setShops] = useState<ShopWithMetadata[]>([])
  const [availableCategories, setAvailableCategories] = useState<Record<VehicleType, string[]>>({
    motorcycle: [],
    car: [],
    tuktuk: []
  })
  const [error, setError] = useState<string | null>(null)
  
  // New filter states
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [locations, setLocations] = useState<string[]>([])
  const [onlyShowAvailable, setOnlyShowAvailable] = useState<boolean>(false)
  const [engineSizeRange, setEngineSizeRange] = useState<[number, number]>([0, 1000])
  const [sortBy, setSortBy] = useState<string>("price_asc")
  
  // Car-specific filters
  const [minSeats, setMinSeats] = useState<number>(0)
  const [transmission, setTransmission] = useState<string>("any")

  // Fetch shops and vehicles data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch shops from Supabase
        const shopsData = await getShops()
        
        if (!shopsData || shopsData.length === 0) {
          setShops([])
          setIsLoading(false)
          return
        }
        
        // For now we'll continue using getBikes for backward compatibility
        // In a real implementation, we'd use getVehicles() instead
        const vehiclesData = await getBikes()
        
        // Process shop data with vehicles
        const enhancedShops: ShopWithMetadata[] = shopsData.map(shop => {
          // Filter vehicles for this shop
          const shopVehicles = vehiclesData.filter(vehicle => vehicle.shop_id === shop.id)
          
          // Calculate starting price (lowest price among vehicles)
          const startingPrice = shopVehicles.length > 0 
            ? Math.min(...shopVehicles.map(vehicle => vehicle.price_per_day))
            : 0
          
          // For now, treat all vehicles as motorcycles for backward compatibility
          // In a real implementation, we'd separate them by vehicle type
          const motorcycleTypes = Array.from(new Set(shopVehicles.map(vehicle => vehicle.category))) as BikeCategory[]
          
          // Calculate available vehicles count
          const availableVehicles = shopVehicles.filter(vehicle => vehicle.is_available).length
          
          // Collect images from vehicles for this shop (or use placeholders)
          const images = shopVehicles.length > 0 && shopVehicles.some(vehicle => vehicle.images && vehicle.images.length > 0)
            ? shopVehicles
                .flatMap(vehicle => vehicle.images || [])
                .filter(img => img.is_primary)
                .map(img => img.image_url)
            : [`https://placehold.co/600x400/1e3b8a/white?text=${encodeURIComponent(shop.name)}`]
          
          // For now, simulate having different vehicle types
          // In a real implementation, we'd use data from the vehicles table
          return {
            ...shop,
            startingPrice,
            rating: 4.5, // Placeholder
            reviewCount: 0, // Placeholder
            vehicleTypes: ['motorcycle'] as VehicleType[], // For now, only motorcycles
            motorcycles: {
              count: shopVehicles.length,
              types: motorcycleTypes,
              minPrice: startingPrice,
              available: availableVehicles
            },
            cars: {
              count: 0, // Placeholder
              types: [] as CarCategory[],
              minPrice: 0,
              available: 0
            },
            tuktuks: {
              count: 0, // Placeholder
              types: [] as TuktukCategory[],
              minPrice: 0,
              available: 0
            },
            totalVehicles: shopVehicles.length,
            availableVehicles,
            images
          }
        })
        
        // Gather all unique categories by vehicle type
        const allCategories: Record<VehicleType, string[]> = {
          motorcycle: Array.from(new Set(enhancedShops.flatMap(shop => 
            shop.motorcycles.types))),
          car: [], // In real implementation, these would be populated
          tuktuk: [] // In real implementation, these would be populated
        }
        
        // Gather all unique locations
        const allLocations = Array.from(
          new Set(enhancedShops.map(shop => shop.city))
        )
        
        setShops(enhancedShops)
        setAvailableCategories(allCategories)
        setLocations(allLocations)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching shop data:', err)
        setError('Failed to load shops. Please try again later.')
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  const toggleBikeType = (type: string) => {
    if (selectedCategories.includes(type)) {
      setSelectedCategories(selectedCategories.filter(t => t !== type))
    } else {
      setSelectedCategories([...selectedCategories, type])
    }
  }

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value)
  }
  
  const handleEngineSizeChange = (value: [number, number]) => {
    setEngineSizeRange(value)
  }

  // Apply filters
  const filteredShops = shops.filter(shop => {
    // Price filter
    if (shop.startingPrice < priceRange[0] || shop.startingPrice > priceRange[1]) {
      return false
    }
    
    // Vehicle type filter
    if (selectedVehicleType !== 'all' && !shop.vehicleTypes.includes(selectedVehicleType)) {
      return false
    }
    
    // Category filter - only apply if there are selected categories and a vehicle type is selected
    if (selectedCategories.length > 0 && selectedVehicleType !== 'all') {
      // Check if shop has any of the selected categories for the current vehicle type
      switch (selectedVehicleType) {
        case 'motorcycle':
          if (!shop.motorcycles.types.some(type => selectedCategories.includes(type))) {
            return false
          }
          break;
        case 'car':
          if (!shop.cars.types.some(type => selectedCategories.includes(type))) {
            return false
          }
          break;
        case 'tuktuk':
          if (!shop.tuktuks.types.some(type => selectedCategories.includes(type))) {
            return false
          }
          break;
      }
    }
    
    // Rating filter
    if (shop.rating < minRating) {
      return false
    }
    
    // Location filter
    if (selectedLocation && shop.city !== selectedLocation) {
      return false
    }
    
    // Availability filter
    if (onlyShowAvailable) {
      if (selectedVehicleType === 'all') {
        if (shop.availableVehicles === 0) {
          return false
        }
      } else {
        // Check availability for the specific vehicle type
        switch (selectedVehicleType) {
          case 'motorcycle':
            if (shop.motorcycles.available === 0) return false;
            break;
          case 'car':
            if (shop.cars.available === 0) return false;
            break;
          case 'tuktuk':
            if (shop.tuktuks.available === 0) return false;
            break;
        }
      }
    }
    
    // Vehicle-specific filters
    if (selectedVehicleType === 'car' && minSeats > 0) {
      // Filter shops that don't have cars with enough seats
      // In a real implementation, this would filter based on car specifications
      return true; // Placeholder - would actually check car seats
    }
    
    if (selectedVehicleType === 'car' && transmission !== 'any') {
      // Filter shops that don't have cars with the selected transmission
      // In a real implementation, this would filter based on car specifications
      return true; // Placeholder - would actually check transmission
    }
    
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case "price_asc":
        return a.startingPrice - b.startingPrice
      case "price_desc":
        return b.startingPrice - a.startingPrice
      case "rating_desc":
        return b.rating - a.rating
      case "availability":
        return b.availableVehicles - a.availableVehicles
      default:
        return 0
    }
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
              Browse Vehicle Rentals
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
                {(selectedCategories.length > 0 || minRating > 0 || selectedLocation || onlyShowAvailable) && (
                  <Badge className="ml-2 bg-primary/20 text-primary text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <motion.div
                animate={{ rotate: showFilters ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </motion.div>
            </motion.button>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            {/* Filters Panel (Desktop & Mobile) */}
            <motion.div 
              className="md:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {/* Desktop filters (always visible) */}
              <div className="hidden md:block sticky top-20 p-4 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Filter size={18} className="mr-2 text-primary" />
                  Filters
                </h2>
                
                {/* Vehicle Type Selector */}
                <div className="mb-6">
                  <h3 className="text-md font-bold mb-3 flex items-center">
                    <BikeIcon size={16} className="mr-1.5 text-primary/70" />
                    Vehicle Type
                  </h3>
                  <VehicleTypeSelector
                    selectedType={selectedVehicleType}
                    onChange={setSelectedVehicleType}
                  />
                </div>
                
                {/* Location Filter */}
                <div className="mb-6">
                  <h3 className="text-md font-bold mb-3 flex items-center">
                    <MapPin size={16} className="mr-1.5 text-primary/70" />
                    Location
                  </h3>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-gray-800/80 text-white border border-gray-700 rounded-md p-2 text-sm"
                  >
                    <option value="">All Locations</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Availability Filter */}
                <div className="mb-6">
                  <h3 className="text-md font-bold mb-3 flex items-center">
                    <Calendar size={16} className="mr-1.5 text-primary/70" />
                    Availability
                  </h3>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="available-vehicles" 
                      checked={onlyShowAvailable}
                      onChange={() => setOnlyShowAvailable(!onlyShowAvailable)}
                      className="rounded border-gray-700 text-primary focus:ring-primary bg-gray-900/50"
                    />
                    <label htmlFor="available-vehicles" className="text-sm text-gray-300">
                      Only show available vehicles
                    </label>
                  </div>
                </div>
                
                {/* Category Filter - show categories based on selected vehicle type */}
                {selectedVehicleType !== 'all' && (
                  <div className="mb-6">
                    <h3 className="text-md font-bold mb-3 flex items-center">
                      <BikeIcon size={16} className="mr-1.5 text-primary/70" />
                      {selectedVehicleType.charAt(0).toUpperCase() + selectedVehicleType.slice(1)} Categories
                    </h3>
                    <div className="space-y-2">
                      {availableCategories[selectedVehicleType as VehicleType].map((type) => (
                        <BikeTypeCheckbox 
                          key={type}
                          type={type.replace('_', ' ')}
                          checked={selectedCategories.includes(type)}
                          onChange={() => toggleBikeType(type)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Car-specific filters - only show when 'car' is selected */}
                {selectedVehicleType === 'car' && (
                  <div className="mb-6">
                    <h3 className="text-md font-bold mb-3">Car Options</h3>
                    
                    {/* Seats filter */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Minimum Seats</h4>
                      <select
                        value={minSeats}
                        onChange={(e) => setMinSeats(parseInt(e.target.value))}
                        className="w-full bg-gray-800/80 text-white border border-gray-700 rounded-md p-2 text-sm"
                      >
                        <option value={0}>Any</option>
                        <option value={2}>2+ seats</option>
                        <option value={4}>4+ seats</option>
                        <option value={5}>5+ seats</option>
                        <option value={7}>7+ seats</option>
                      </select>
                    </div>
                    
                    {/* Transmission filter */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Transmission</h4>
                      <select
                        value={transmission}
                        onChange={(e) => setTransmission(e.target.value)}
                        className="w-full bg-gray-800/80 text-white border border-gray-700 rounded-md p-2 text-sm"
                      >
                        <option value="any">Any</option>
                        <option value="automatic">Automatic</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Motorcycle-specific filters - only show when 'motorcycle' is selected */}
                {selectedVehicleType === 'motorcycle' && (
                  <div className="mb-6">
                    <h3 className="text-md font-bold mb-3">Engine Size</h3>
                    <div className="px-2">
                      <div className="flex justify-between mb-2 text-sm">
                        <span>{engineSizeRange[0]}cc</span>
                        <span>{engineSizeRange[1]}cc</span>
                      </div>
                      <input 
                        type="range"
                        min={0}
                        max={1000}
                        value={engineSizeRange[0]}
                        onChange={(e) => handleEngineSizeChange([parseInt(e.target.value), engineSizeRange[1]])}
                        className="w-full mb-2 accent-primary"
                      />
                      <input 
                        type="range"
                        min={0}
                        max={1000}
                        value={engineSizeRange[1]}
                        onChange={(e) => handleEngineSizeChange([engineSizeRange[0], parseInt(e.target.value)])}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                )}
                
                {/* Price Range Filter */}
                <div className="mb-6">
                  <h3 className="text-md font-bold mb-3">Price Range</h3>
                  <div className="px-2">
                    <div className="flex justify-between mb-2 text-sm">
                      <span>₱{priceRange[0]}</span>
                      <span>₱{priceRange[1]}</span>
                    </div>
                    <input 
                      type="range"
                      min={100}
                      max={2000}
                      value={priceRange[0]}
                      onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full mb-2 accent-primary"
                    />
                    <input 
                      type="range"
                      min={100}
                      max={2000}
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
                
                {/* Minimum Rating Filter */}
                <div className="mb-6">
                  <h3 className="text-md font-bold mb-3">Minimum Rating</h3>
                  <div className="px-2">
                    <div className="flex justify-between mb-2 text-sm">
                      <span>0</span>
                      <span>5</span>
                    </div>
                    <input 
                      type="range"
                      min={0}
                      max={5}
                      step={0.5}
                      value={minRating}
                      onChange={(e) => setMinRating(parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="mt-2 text-center text-sm font-medium py-1 px-2 rounded bg-gray-800/50 border border-gray-700">
                      {minRating} stars & up
                    </div>
                  </div>
                </div>
                
                {/* Sort By Filter */}
                <div className="mb-6">
                  <h3 className="text-md font-bold mb-3">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-gray-800/80 text-white border border-gray-700 rounded-md p-2 text-sm"
                  >
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating_desc">Highest Rated</option>
                    <option value="availability">Most Available Bikes</option>
                  </select>
                </div>
                
                {/* Reset Filters Button */}
                {(selectedCategories.length > 0 || minRating > 0 || priceRange[0] > 100 || priceRange[1] < 2000 || selectedLocation || onlyShowAvailable) ? (
                  <div className="mt-4">
                    <button 
                      onClick={() => {
                        setPriceRange([100, 2000])
                        setSelectedCategories([])
                        setMinRating(0)
                        setSelectedLocation("")
                        setOnlyShowAvailable(false)
                        setSortBy("price_asc")
                      }}
                      className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-white transition-colors duration-200 flex items-center justify-center"
                    >
                      <span>Reset All Filters</span>
                    </button>
                  </div>
                ) : null}
              </div>
              
              {/* Mobile filters (expandable) */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    key="mobile-filters"
                    variants={filterVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="md:hidden overflow-hidden mb-6"
                  >
                    {/* Location Filter (Mobile) */}
                    <div className="mb-6">
                      <h3 className="text-md font-bold mb-3 flex items-center">
                        <MapPin size={16} className="mr-1.5 text-primary/70" />
                        Location
                      </h3>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full bg-gray-800/80 text-white border border-gray-700 rounded-md p-2 text-sm"
                      >
                        <option value="">All Locations</option>
                        {locations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Availability Filter (Mobile) */}
                    <div className="mb-6">
                      <h3 className="text-md font-bold mb-3 flex items-center">
                        <Calendar size={16} className="mr-1.5 text-primary/70" />
                        Availability
                      </h3>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="mobile-available-vehicles" 
                          checked={onlyShowAvailable}
                          onChange={() => setOnlyShowAvailable(!onlyShowAvailable)}
                          className="rounded border-gray-700 text-primary focus:ring-primary bg-gray-900/50"
                        />
                        <label htmlFor="mobile-available-vehicles" className="text-sm text-gray-300">
                          Only show available vehicles
                        </label>
                      </div>
                    </div>
                    
                    {/* Vehicle Type (Mobile) */}
                    <div className="mb-6">
                      <h3 className="text-md font-bold mb-3 flex items-center">
                        <BikeIcon size={16} className="mr-1.5 text-primary/70" />
                        Vehicle Type
                      </h3>
                      <div className="space-y-2">
                        {Object.keys(availableCategories).map((type) => (
                          <BikeTypeCheckbox 
                            key={type}
                            type={type.replace('_', ' ')}
                            checked={selectedCategories.includes(type)}
                            onChange={() => toggleBikeType(type)}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Price Range (Mobile) */}
                    <div className="mb-6">
                      <h3 className="text-md font-bold mb-3">Price Range</h3>
                      <div className="px-2">
                        <div className="flex justify-between mb-2 text-sm">
                          <span>₱{priceRange[0]}</span>
                          <span>₱{priceRange[1]}</span>
                        </div>
                        <input 
                          type="range"
                          min={100}
                          max={2000}
                          value={priceRange[0]}
                          onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
                          className="w-full mb-2 accent-primary"
                        />
                        <input 
                          type="range"
                          min={100}
                          max={2000}
                          value={priceRange[1]}
                          onChange={(e) => handlePriceChange([priceRange[0], parseInt(e.target.value)])}
                          className="w-full accent-primary"
                        />
                      </div>
                    </div>
                    
                    {/* Minimum Rating (Mobile) */}
                    <div className="mb-6">
                      <h3 className="text-md font-bold mb-3">Minimum Rating</h3>
                      <div className="px-2">
                        <div className="flex justify-between mb-2 text-sm">
                          <span>0</span>
                          <span>5</span>
                        </div>
                        <input 
                          type="range"
                          min={0}
                          max={5}
                          step={0.5}
                          value={minRating}
                          onChange={(e) => setMinRating(parseFloat(e.target.value))}
                          className="w-full accent-primary"
                        />
                        <div className="mt-2 text-center text-sm font-medium py-1 px-2 rounded bg-gray-800/50 border border-gray-700">
                          {minRating} stars & up
                        </div>
                      </div>
                    </div>
                    
                    {/* Sort By (Mobile) */}
                    <div className="mb-6">
                      <h3 className="text-md font-bold mb-3">Sort By</h3>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-gray-800/80 text-white border border-gray-700 rounded-md p-2 text-sm"
                      >
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating_desc">Highest Rated</option>
                        <option value="availability">Most Available Bikes</option>
                      </select>
                    </div>
                    
                    {/* Reset Filters Button (Mobile) */}
                    {(selectedCategories.length > 0 || minRating > 0 || priceRange[0] > 100 || priceRange[1] < 2000 || selectedLocation || onlyShowAvailable) ? (
                      <div className="mt-4">
                        <button 
                          onClick={() => {
                            setPriceRange([100, 2000])
                            setSelectedCategories([])
                            setMinRating(0)
                            setSelectedLocation("")
                            setOnlyShowAvailable(false)
                            setSortBy("price_asc")
                          }}
                          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-white transition-colors duration-200 flex items-center justify-center"
                        >
                          <span>Reset All Filters</span>
                        </button>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Shop Listings */}
            <div className="md:col-span-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-400">Loading shops...</p>
                </div>
              ) : error ? (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
                  <p className="text-red-400">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-md text-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredShops.length === 0 ? (
                <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">No shops found</h3>
                  <p className="text-gray-400 mb-4">Try adjusting your filters to see more results</p>
                  <button 
                    onClick={() => {
                      setPriceRange([100, 2000])
                      setSelectedCategories([])
                      setMinRating(0)
                      setSelectedLocation("")
                      setOnlyShowAvailable(false)
                      setSortBy("price_asc")
                    }}
                    className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-md text-sm"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-300">
                      <span className="font-semibold">{filteredShops.length}</span> {filteredShops.length === 1 ? 'shop' : 'shops'} found
                    </p>
                    <Badge className="bg-primary/10 text-xs text-primary border-primary/20 py-1">
                      {(selectedCategories.length > 0 || minRating > 0 || selectedLocation || onlyShowAvailable) 
                        ? `Filters applied` 
                        : 'No filters applied'}
                    </Badge>
                  </div>
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {filteredShops.map((shop) => (
                      <motion.div key={shop.id} variants={itemVariants} className="h-full">
                        <RentalShopCard
                          id={shop.id}
                          name={shop.name}
                          images={shop.images}
                          startingPrice={shop.startingPrice}
                          rating={shop.rating}
                          reviewCount={shop.reviewCount}
                          availableBikes={shop.availableVehicles}
                          totalBikes={shop.totalVehicles}
                          location={shop.city}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 