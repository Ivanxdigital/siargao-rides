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
  Bike as BikeIcon, Car as CarIcon, Truck as TruckIcon,
  Shield, Clock, Users, Award, CheckCircle, Zap
} from "lucide-react"
import { useRouter } from "next/navigation"
import { generateRentalShopSchema, generateFAQSchema, generateBreadcrumbSchema, generateJSONLD } from "@/lib/structured-data"
import { generateShopsMetadata } from "./metadata"

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

  // FAQ data for SEO
  const faqData = [
    {
      question: "Which rental shops in Siargao are most trusted?",
      answer: "All rental shops on Siargao Rides are verified and trusted. Look for shops with high ratings, verified badges, and positive customer reviews. We only list licensed operators with proven track records."
    },
    {
      question: "Do rental shops in Siargao offer vehicle delivery?",
      answer: "Yes, most rental shops offer delivery services to hotels, resorts, and locations across Siargao Island including General Luna, Cloud 9, and other popular areas. Filter by 'Offers delivery' to find shops with this service."
    },
    {
      question: "How do I contact rental shops directly?",
      answer: "Each shop listing shows contact options including phone numbers and WhatsApp. Many shops offer instant WhatsApp communication for quick booking and inquiries about availability and rates."
    },
    {
      question: "What makes a rental shop verified on Siargao Rides?",
      answer: "Verified shops have completed our verification process including business license checks, insurance verification, and customer service standards. They maintain high ratings and follow our quality guidelines."
    }
  ];

  // Generate structured data for current listings
  const shopsStructuredData = shops.map(shop => 
    generateRentalShopSchema(shop, shop.average_rating, shop.review_count)
  );

  const faqStructuredData = generateFAQSchema(faqData);
  const breadcrumbStructuredData = generateBreadcrumbSchema([
    { name: "Home", url: "https://siargaorides.ph" },
    { name: "Browse", url: "https://siargaorides.ph/browse" },
    { name: "Rental Shops", url: "https://siargaorides.ph/browse/shops" }
  ]);
  
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(faqStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(breadcrumbStructuredData)
        }}
      />
      {shops.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJSONLD({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Vehicle Rental Shops in Siargao Island",
              "description": "Directory of trusted vehicle rental shops in Siargao Island, Philippines",
              "numberOfItems": pagination?.total || shops.length,
              "itemListElement": shops.map((shop, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": shopsStructuredData[index]
              }))
            })
          }}
        />
      )}
    
    <div className="min-h-screen">
      {/* SEO-Optimized Hero Section */}
      <motion.section
        className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden pt-20"
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

        <div className="container mx-auto px-4 py-12 relative z-10 pt-20">
          <motion.div
            className="max-w-4xl mx-auto mb-8 text-center"
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
                Verified Rental Companies
              </Badge>
            </motion.div>
            <motion.h1
              className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {selectedLocation 
                ? `Best Vehicle Rental Shops in ${selectedLocation}` 
                : 'Best Vehicle Rental Shops in Siargao Island'
              }
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              Discover {pagination?.total || shops.length} trusted motorbike rental companies, car hire shops, and vehicle rental businesses in Siargao. 
              Compare verified operators with excellent ratings, competitive prices, and reliable service.
            </motion.p>
            
            {/* Key Stats */}
            <motion.div 
              className="flex flex-wrap justify-center gap-6 mt-8 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span>100% Verified Shops</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <span>Top Rated Companies</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <span>Island-wide Delivery</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Trust Signals Section */}
      <section className="py-8 bg-gray-900 text-white border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div 
              className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-4 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Shield className="text-green-400 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Verified Companies</h3>
                <p className="text-gray-400 text-xs">Licensed & insured rental shops only</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-4 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <Award className="text-yellow-400 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Top Rated Shops</h3>
                <p className="text-gray-400 text-xs">4+ star average customer ratings</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-4 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <Zap className="text-purple-400 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Instant Booking</h3>
                <p className="text-gray-400 text-xs">WhatsApp & direct contact available</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-4 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <Users className="text-blue-400 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Local Expertise</h3>
                <p className="text-gray-400 text-xs">Island experts with local knowledge</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
            className="md:hidden mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <motion.button
              className="w-full flex items-center justify-between bg-card/30 backdrop-blur-xl border border-border/30 rounded-xl p-4 text-white shadow-lg"
              onClick={() => setShowFilters(!showFilters)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ 
                borderColor: "rgba(var(--color-primary), 0.5)",
                backgroundColor: "rgba(var(--color-card), 0.5)"
              }}
            >
              <div className="flex items-center">
                <Filter size={20} className="mr-3 text-primary/70" />
                <span className="font-medium">Filters & Sort</span>
                {hasActiveFilters && (
                  <Badge className="ml-3 bg-primary/20 text-primary text-xs px-2 py-1">
                    {Object.values({
                      location: selectedLocation,
                      vehicleTypes: selectedVehicleTypes.length,
                      verified: verifiedOnly,
                      delivery: offersDelivery,
                      whatsapp: hasWhatsapp,
                      rating: minRating > 0
                    }).filter(Boolean).length} active
                  </Badge>
                )}
              </div>
              <motion.div
                animate={{ rotate: showFilters ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-primary/70"
              >
                <ChevronDown size={22} />
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
                    className="md:hidden overflow-hidden mb-6 bg-card/30 backdrop-blur-xl rounded-xl border border-border/30 p-6 shadow-lg"
                  >
                    {/* Mobile filter content with improved touch targets */}
                    <div className="space-y-8">
                      {/* Location */}
                      <div>
                        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-white">
                          <MapPin size={18} className="text-primary/70" />
                          Location
                        </h3>
                        <select
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                          className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors touch-manipulation"
                        >
                          <option value="">All Locations</option>
                          {locations.map((location) => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </div>

                      {/* Vehicle Types */}
                      <div>
                        <h3 className="text-base font-semibold mb-4 text-white">Vehicle Types</h3>
                        <div className="space-y-3">
                          {[
                            { id: 'motorcycle', label: 'Motorcycles', icon: BikeIcon },
                            { id: 'car', label: 'Cars', icon: CarIcon },
                            { id: 'tuktuk', label: 'Tuktuks', icon: TruckIcon }
                          ].map((type) => {
                            const Icon = type.icon;
                            return (
                              <motion.label
                                key={type.id}
                                className="flex items-center gap-4 cursor-pointer p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors touch-manipulation"
                                whileTap={{ scale: 0.98 }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedVehicleTypes.includes(type.id as VehicleType)}
                                  onChange={() => {
                                    const currentTypes = selectedVehicleTypes;
                                    if (currentTypes.includes(type.id as VehicleType)) {
                                      setSelectedVehicleTypes(currentTypes.filter(t => t !== type.id));
                                    } else {
                                      setSelectedVehicleTypes([...currentTypes, type.id as VehicleType]);
                                    }
                                  }}
                                  className="w-5 h-5 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
                                />
                                <div className="flex items-center gap-3">
                                  <Icon size={18} className="text-white/60" />
                                  <span className="text-base text-white/90">{type.label}</span>
                                </div>
                              </motion.label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <h3 className="text-base font-semibold mb-4 text-white">Services & Features</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'verified', label: 'Verified shops only', checked: verifiedOnly, onChange: setVerifiedOnly, icon: Shield },
                            { key: 'delivery', label: 'Offers delivery', checked: offersDelivery, onChange: setOffersDelivery, icon: Package },
                            { key: 'whatsapp', label: 'WhatsApp available', checked: hasWhatsapp, onChange: setHasWhatsapp, icon: MessageCircle }
                          ].map((service) => {
                            const Icon = service.icon;
                            return (
                              <motion.label
                                key={service.key}
                                className="flex items-center gap-4 cursor-pointer p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors touch-manipulation"
                                whileTap={{ scale: 0.98 }}
                              >
                                <input
                                  type="checkbox"
                                  checked={service.checked}
                                  onChange={(e) => service.onChange(e.target.checked)}
                                  className="w-5 h-5 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
                                />
                                <div className="flex items-center gap-3">
                                  <Icon size={18} className="text-white/60" />
                                  <span className="text-base text-white/90">{service.label}</span>
                                </div>
                              </motion.label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rating */}
                      <div>
                        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-white">
                          <Star size={18} className="text-primary/70" />
                          Minimum Rating
                        </h3>
                        <select
                          value={minRating}
                          onChange={(e) => setMinRating(parseFloat(e.target.value))}
                          className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors touch-manipulation"
                        >
                          <option value="0">All ratings</option>
                          <option value="4">4+ stars</option>
                          <option value="3">3+ stars</option>
                          <option value="2">2+ stars</option>
                        </select>
                      </div>

                      {/* Sort */}
                      <div>
                        <h3 className="text-base font-semibold mb-4 text-white">Sort By</h3>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-4 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors touch-manipulation"
                        >
                          <option value="rating_desc">Highest Rated</option>
                          <option value="vehicles_desc">Most Vehicles</option>
                          <option value="price_asc">Lowest Price First</option>
                          <option value="price_desc">Highest Price First</option>
                          <option value="newest">Newest First</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-border/30">
                        {hasActiveFilters && (
                          <motion.button
                            onClick={resetAllFilters}
                            className="flex-1 px-6 py-4 bg-gray-800/70 hover:bg-gray-800 rounded-lg text-base text-white font-medium transition-colors touch-manipulation"
                            whileTap={{ scale: 0.98 }}
                          >
                            Reset Filters
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => setShowFilters(false)}
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
                  {/* Results Header */}
                  <motion.div 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-card/20 backdrop-blur-sm rounded-xl border border-border/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div>
                      <p className="text-white font-medium text-lg">
                        <span className="text-primary">{pagination?.total || 0}</span> {(pagination?.total || 0) === 1 ? 'rental shop' : 'rental shops'} found
                      </p>
                      {pagination && pagination.total > pagination.limit && (
                        <p className="text-sm text-gray-400 mt-1">
                          Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {hasActiveFilters && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 text-sm">
                          {Object.values({
                            location: selectedLocation,
                            vehicleTypes: selectedVehicleTypes.length,
                            verified: verifiedOnly,
                            delivery: offersDelivery,
                            whatsapp: hasWhatsapp,
                            rating: minRating > 0
                          }).filter(Boolean).length} filters active
                        </Badge>
                      )}
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-sm text-gray-300">All verified</span>
                    </div>
                  </motion.div>

                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
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
                    <motion.div 
                      className="mt-10 flex justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/30 p-6 shadow-lg">
                        <Pagination
                          currentPage={pagination.page}
                          totalPages={pagination.totalPages}
                          onPageChange={handlePageChange}
                        />
                        <p className="text-center text-sm text-gray-400 mt-4">
                          Page {pagination.page} of {pagination.totalPages} • {pagination.total} total shops
                        </p>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section for SEO */}
      <section className="py-12 bg-black text-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Frequently Asked Questions About Rental Shops
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Everything you need to know about choosing and booking with vehicle rental shops in Siargao Island
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqData.map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-800/50 rounded-xl p-6 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="font-semibold mb-3 text-lg text-white">{faq.question}</h3>
                  <p className="text-gray-300 leading-relaxed text-sm">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
            
            {/* Call to Action */}
            <motion.div 
              className="text-center mt-10 p-8 bg-gradient-to-r from-primary/20 to-purple-900/20 rounded-xl border border-primary/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-3">Ready to Explore Siargao?</h3>
              <p className="text-gray-300 mb-6">Choose from trusted rental shops and start your island adventure today</p>
              <Button 
                onClick={() => router.push('/browse')}
                className="bg-teal-600 hover:bg-teal-700 focus:bg-teal-700 text-white font-semibold tracking-wide px-10 py-4 md:px-8 md:py-3 rounded-lg border border-teal-500/30 shadow-lg hover:shadow-xl focus:ring-4 focus:ring-teal-500/20 focus:outline-none transition-all duration-200"
              >
                Browse Vehicles
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  )
}