"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Pagination from "@/components/ui/pagination"
import RentalShopCard from "@/components/RentalShopCard"
import { useBrowseShops } from "@/lib/queries/shops"
import { BrowseShopsFilters, VehicleType } from "@/lib/types"
import { 
  Filter, MapPin, Star, Package, MessageCircle, 
  ChevronDown, ChevronUp, Search, XCircle,
  Bike as BikeIcon, Car as CarIcon, Truck as TruckIcon
} from "lucide-react"
import { useRouter } from "next/navigation"

// Vehicle type selector component
const VehicleTypeFilter = ({ selectedTypes, onChange }: {
  selectedTypes: VehicleType[],
  onChange: (types: VehicleType[]) => void
}) => {
  const vehicleTypes: Array<{id: VehicleType, label: string, icon: any}> = [
    { id: 'motorcycle', label: 'Motorcycles', icon: BikeIcon },
    { id: 'car', label: 'Cars', icon: CarIcon },
    { id: 'tuktuk', label: 'Tuktuks', icon: TruckIcon }
  ];

  const toggleType = (type: VehicleType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter(t => t !== type))
    } else {
      onChange([...selectedTypes, type])
    }
  }

  return (
    <div className="space-y-3">
      {vehicleTypes.map((type) => {
        const Icon = type.icon;
        return (
          <motion.label
            key={type.id}
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(type.id)}
              onChange={() => toggleType(type.id)}
              className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
            />
            <div className="flex items-center gap-2">
              <Icon size={16} className="text-white/60" />
              <span className="text-sm text-white/80">{type.label}</span>
            </div>
          </motion.label>
        )
      })}
    </div>
  )
}

export default function BrowseShopsPage() {
  const router = useRouter()
  
  // Filter states
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<VehicleType[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false)
  const [offersDelivery, setOffersDelivery] = useState<boolean>(false)
  const [hasWhatsapp, setHasWhatsapp] = useState<boolean>(false)
  const [minRating, setMinRating] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortBy, setSortBy] = useState<BrowseShopsFilters['sort_by']>('rating_desc')
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Build filters object
  const filters: BrowseShopsFilters = useMemo(() => ({
    page: currentPage,
    limit: pageSize,
    sort_by: sortBy,
    location: selectedLocation || undefined,
    vehicle_types: selectedVehicleTypes.length > 0 ? selectedVehicleTypes : undefined,
    verified_only: verifiedOnly || undefined,
    offers_delivery: offersDelivery || undefined,
    has_whatsapp: hasWhatsapp || undefined,
    min_rating: minRating > 0 ? minRating : undefined,
    search: debouncedSearch || undefined,
  }), [
    currentPage, pageSize, sortBy, selectedLocation, selectedVehicleTypes,
    verifiedOnly, offersDelivery, hasWhatsapp, minRating, debouncedSearch
  ])
  
  // Fetch data
  const { data, isLoading, error, refetch } = useBrowseShops(filters)
  
  const shops = data?.shops || []
  const pagination = data?.pagination
  const locations = data?.locations || []
  
  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const resetAllFilters = () => {
    setSelectedLocation("")
    setSelectedVehicleTypes([])
    setVerifiedOnly(false)
    setOffersDelivery(false)
    setHasWhatsapp(false)
    setMinRating(0)
    setSearchQuery("")
    setSortBy('rating_desc')
    setCurrentPage(1)
  }
  
  const hasActiveFilters = selectedLocation || selectedVehicleTypes.length > 0 || 
    verifiedOnly || offersDelivery || hasWhatsapp || minRating > 0 || searchQuery
  
  // Animation variants
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
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Shops</h2>
          <p className="text-gray-400 mb-4">Failed to load shop data. Please try again.</p>
          <Button onClick={() => refetch()} className="bg-primary hover:bg-primary/90">
            Try Again
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
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
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                Discover Rental Shops
              </Badge>
            </motion.div>
            <motion.h1
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              Browse Rental Shops
            </motion.h1>
            <motion.p
              className="text-lg text-gray-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              Find trusted vehicle rental shops across Siargao
            </motion.p>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="py-8 bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
              <input
                type="text"
                placeholder="Search shops by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-card/30 backdrop-blur-xl border border-border/30 rounded-xl text-white placeholder-white/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>
          </div>

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
                <Filter size={18} className="mr-2" />
                <span>Filters</span>
                {hasActiveFilters && (
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
            {/* Filters Panel */}
            <motion.div
              className="md:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {/* Desktop filters */}
              <div className="hidden md:block sticky top-20 p-6 bg-card/30 backdrop-blur-xl rounded-xl border border-border/30">
                <h2 className="text-xl font-semibold mb-6 text-white">Filters</h2>

                {/* Location Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90 flex items-center gap-2">
                    <MapPin size={16} className="text-primary/70" />
                    Location
                  </h3>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <option value="">All Locations</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Types Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">Vehicle Types</h3>
                  <VehicleTypeFilter
                    selectedTypes={selectedVehicleTypes}
                    onChange={setSelectedVehicleTypes}
                  />
                </div>

                {/* Services Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">Services</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
                      />
                      <span className="text-sm text-white/80">Verified shops only</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offersDelivery}
                        onChange={(e) => setOffersDelivery(e.target.checked)}
                        className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
                      />
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-white/60" />
                        <span className="text-sm text-white/80">Offers delivery</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasWhatsapp}
                        onChange={(e) => setHasWhatsapp(e.target.checked)}
                        className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
                      />
                      <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-white/60" />
                        <span className="text-sm text-white/80">WhatsApp available</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90 flex items-center gap-2">
                    <Star size={16} className="text-primary/70" />
                    Minimum Rating
                  </h3>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <option value="0">All ratings</option>
                    <option value="4">4+ stars</option>
                    <option value="3">3+ stars</option>
                    <option value="2">2+ stars</option>
                  </select>
                </div>

                {/* Sort By Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <option value="rating_desc">Highest Rated</option>
                    <option value="vehicles_desc">Most Vehicles</option>
                    <option value="price_asc">Lowest Price First</option>
                    <option value="price_desc">Highest Price First</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <div className="pt-4 border-t border-border/30">
                    <Button
                      onClick={resetAllFilters}
                      variant="outline"
                      className="w-full bg-card/50 border-border/50 text-white hover:bg-card"
                    >
                      Reset Filters
                    </Button>
                  </div>
                )}
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
                    className="md:hidden overflow-hidden mb-6 bg-card/30 backdrop-blur-xl rounded-xl border border-border/30 p-6"
                  >
                    {/* Mobile filter content - same as desktop */}
                    <div className="space-y-6">
                      {/* Location */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <MapPin size={16} className="text-primary/70" />
                          Location
                        </h3>
                        <select
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                          className="w-full bg-gray-800/80 text-white border border-gray-700 rounded-md p-2 text-sm"
                        >
                          <option value="">All Locations</option>
                          {locations.map((location) => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </div>

                      {/* Vehicle Types */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Vehicle Types</h3>
                        <VehicleTypeFilter
                          selectedTypes={selectedVehicleTypes}
                          onChange={setSelectedVehicleTypes}
                        />
                      </div>

                      {/* Services */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Services</h3>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={verifiedOnly}
                              onChange={(e) => setVerifiedOnly(e.target.checked)}
                              className="rounded border-gray-700 text-primary focus:ring-primary bg-gray-900/50"
                            />
                            <span className="text-sm text-gray-300">Verified only</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={offersDelivery}
                              onChange={(e) => setOffersDelivery(e.target.checked)}
                              className="rounded border-gray-700 text-primary focus:ring-primary bg-gray-900/50"
                            />
                            <span className="text-sm text-gray-300">Offers delivery</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={hasWhatsapp}
                              onChange={(e) => setHasWhatsapp(e.target.checked)}
                              className="rounded border-gray-700 text-primary focus:ring-primary bg-gray-900/50"
                            />
                            <span className="text-sm text-gray-300">WhatsApp available</span>
                          </label>
                        </div>
                      </div>

                      {/* Rating */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Star size={16} className="text-primary/70" />
                          Minimum Rating
                        </h3>
                        <select
                          value={minRating}
                          onChange={(e) => setMinRating(parseFloat(e.target.value))}
                          className="w-full bg-gray-800/80 text-white border border-gray-700 rounded-md p-2 text-sm"
                        >
                          <option value="0">All ratings</option>
                          <option value="4">4+ stars</option>
                          <option value="3">3+ stars</option>
                          <option value="2">2+ stars</option>
                        </select>
                      </div>

                      {/* Sort */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Sort By</h3>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full bg-gray-800/80 text-white border border-gray-700 rounded-md p-2 text-sm"
                        >
                          <option value="rating_desc">Highest Rated</option>
                          <option value="vehicles_desc">Most Vehicles</option>
                          <option value="price_asc">Lowest Price First</option>
                          <option value="price_desc">Highest Price First</option>
                          <option value="newest">Newest First</option>
                        </select>
                      </div>

                      {/* Reset */}
                      {hasActiveFilters && (
                        <button
                          onClick={resetAllFilters}
                          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-white transition-colors duration-200"
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
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
              ) : shops.length === 0 ? (
                <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">No shops found</h3>
                  <p className="text-gray-400 mb-4">Try adjusting your filters to see more results</p>
                  <button
                    onClick={resetAllFilters}
                    className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-md text-sm"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-300">
                      <span className="font-semibold">{pagination?.total || 0}</span> {(pagination?.total || 0) === 1 ? 'shop' : 'shops'} found
                      {pagination && pagination.total > pagination.limit && (
                        <span className="text-sm text-gray-400 ml-2">
                          (showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)})
                        </span>
                      )}
                    </p>
                    <Badge className="bg-primary/10 text-xs text-primary border-primary/20 py-1">
                      {hasActiveFilters ? `Filters applied` : 'No filters applied'}
                    </Badge>
                  </div>

                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {shops.map((shop) => (
                      <motion.div
                        key={shop.id}
                        variants={itemVariants}
                        className="w-full"
                      >
                        <RentalShopCard
                          id={shop.id}
                          name={shop.name}
                          username={shop.username}
                          images={shop.images || []}
                          startingPrice={shop.starting_price}
                          rating={shop.average_rating}
                          reviewCount={shop.review_count || 0}
                          location={shop.location_area || shop.city || 'Siargao'}
                          vehicleTypes={shop.vehicle_types || []}
                          onClick={() => router.push(shop.username ? `/shop/${shop.username}` : `/shop/${shop.id}`)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                        className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/30 p-4"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}