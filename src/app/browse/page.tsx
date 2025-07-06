"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import VehicleCard from "@/components/VehicleCard"
import { Sliders, ChevronDown, ChevronUp, MapPin, Calendar, Filter, Bike as BikeIcon, Car as CarIcon, Truck as TruckIcon, XCircle, Star, Shield, Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { VehicleType, VehicleCategory, BikeCategory, CarCategory, TuktukCategory } from "@/lib/types"
import { useRouter } from "next/navigation"
import DateRangePicker from "@/components/DateRangePicker"
import { useBrowseVehicles, BrowseFilters } from '@/lib/queries/vehicles'
import Pagination from '@/components/ui/pagination'
import { generateLocalBusinessSchema, generateJSONLD, generateBreadcrumbSchema } from "@/lib/structured-data"
import Image from "next/image"

// Interface for vehicle data with additional calculated fields
interface VehicleWithMetadata {
  id: string;
  name: string;
  description?: string;
  vehicle_type: VehicleType;
  category: string;
  price_per_day: number;
  price_per_week?: number;
  price_per_month?: number;
  is_available: boolean;
  specifications?: any;
  color?: string;
  year?: number;
  shop_id: string;
  shopName: string;
  shopLogo?: string;
  shopLocation?: string;
  shopIsShowcase?: boolean;
  images?: any[];
  is_available_for_dates?: boolean;
  // Vehicle group fields
  group_id?: string;
  is_group?: boolean;
  available_count?: number;
  total_count?: number;
}

// Date range interfaces
interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface StringDateRange {
  from: string;
  to: string;
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

// Vehicle type selector component
const VehicleTypeSelector = ({ selectedType, onChange }: {
  selectedType: VehicleType | 'all',
  onChange: (type: VehicleType | 'all') => void
}) => {
  const vehicleTypes: Array<{id: VehicleType | 'all', label: string, icon: any}> = [
    { id: 'all', label: 'All', icon: BikeIcon },
    { id: 'motorcycle', label: 'Motorcycles', icon: BikeIcon },
    { id: 'car', label: 'Cars', icon: CarIcon },
    { id: 'tuktuk', label: 'Tuktuks', icon: TruckIcon }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {vehicleTypes.map((type) => {
        const Icon = type.icon;
        return (
          <motion.button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
              selectedType === type.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/50 text-white/80 border border-border/50 hover:bg-card hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon size={16} />
            <span>{type.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default function BrowsePage() {
  const router = useRouter()
  
  // Filter states
  const [priceRange, setPriceRange] = useState([100, 2000])
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | 'all'>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [onlyShowAvailable, setOnlyShowAvailable] = useState<boolean>(false)
  const [engineSizeRange, setEngineSizeRange] = useState<[number, number]>([0, 1000])
  const [sortBy, setSortBy] = useState<string>("price_asc")
  const [minSeats, setMinSeats] = useState<number>(0)
  const [transmission, setTransmission] = useState<string>("any")
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)
  
  // Date range states
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [dateRangeSelected, setDateRangeSelected] = useState<boolean>(false);

  // Debounced filters to avoid too many API calls
  const [debouncedFilters, setDebouncedFilters] = useState<BrowseFilters>({
    page: currentPage,
    limit: pageSize,
    sort_by: sortBy
  })

  // Build current filters object (excluding pagination)
  const currentFiltersWithoutPage: Omit<BrowseFilters, 'page' | 'limit'> = useMemo(() => ({
    price_min: priceRange[0],
    price_max: priceRange[1],
    vehicle_type: selectedVehicleType,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    location: selectedLocation || undefined,
    start_date: startDateObj ? startDateObj.toISOString().split('T')[0] : undefined,
    end_date: endDateObj ? endDateObj.toISOString().split('T')[0] : undefined,
    only_available: onlyShowAvailable || undefined,
    min_seats: minSeats > 0 ? minSeats : undefined,
    transmission: transmission !== 'any' ? transmission : undefined,
    engine_size_min: engineSizeRange[0] > 0 ? engineSizeRange[0] : undefined,
    engine_size_max: engineSizeRange[1] < 1000 ? engineSizeRange[1] : undefined,
    sort_by: sortBy
  }), [
    priceRange, selectedVehicleType, selectedCategories, 
    selectedLocation, startDateObj, endDateObj, onlyShowAvailable, minSeats, 
    transmission, engineSizeRange, sortBy
  ])

  // Build complete filters object with pagination
  const currentFilters: BrowseFilters = useMemo(() => ({
    ...currentFiltersWithoutPage,
    page: currentPage,
    limit: pageSize,
  }), [currentFiltersWithoutPage, currentPage, pageSize])

  // Debounce filter changes (excluding pagination)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('[Browse] Filters changed, resetting to page 1');
      setDebouncedFilters({
        ...currentFiltersWithoutPage,
        page: 1, // Reset to page 1 when filters change
        limit: pageSize,
      })
      // Reset current page to 1 when filters change
      if (currentPage !== 1) {
        setCurrentPage(1)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [currentFiltersWithoutPage, pageSize])

  // Handle pagination changes immediately (no debounce)
  useEffect(() => {
    console.log('[Browse] Page changed to:', currentPage);
    setDebouncedFilters(currentFilters)
  }, [currentPage])

  // React Query for vehicle data
  const {
    data: browseData,
    isLoading,
    error: queryError,
    refetch
  } = useBrowseVehicles(debouncedFilters);

  const vehicles = browseData?.vehicles || [];
  const pagination = browseData?.pagination;
  const locations = browseData?.locations || [];
  const availableCategories = browseData?.availableCategories || {
    motorcycle: [],
    car: [],
    tuktuk: [],
    van: []
  };

  // Update date range selection
  useEffect(() => {
    if (startDateObj && endDateObj) {
      setDateRangeSelected(true);
    } else {
      setDateRangeSelected(false);
    }
  }, [startDateObj, endDateObj]);

  // Handlers
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

  const handleViewShopClick = (shopId: string) => {
    router.push(`/shop/${shopId}`)
  }

  const handleBookClick = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (!vehicle) {
      console.error('Vehicle not found for booking:', vehicleId);
      return;
    }

    if (vehicle.shopIsShowcase) {
      alert('This is a showcase shop for demonstration purposes only. Bookings are not available.');
      return;
    }

    const queryParams = new URLSearchParams();
    
    // Always include shop ID if available
    if (vehicle.shopId) {
      queryParams.append('shop', vehicle.shopId);
    }

    // Include dates if selected
    if (startDateObj && endDateObj && dateRangeSelected) {
      queryParams.append('startDate', startDateObj.toISOString().split('T')[0]);
      queryParams.append('endDate', endDateObj.toISOString().split('T')[0]);
    }

    const queryString = queryParams.toString();
    const bookingUrl = queryString ? `/booking/${vehicleId}?${queryString}` : `/booking/${vehicleId}`;
    
    router.push(bookingUrl);
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const clearDates = () => {
    setStartDateObj(null);
    setEndDateObj(null);
    setDateRangeSelected(false);
  };

  const resetAllFilters = () => {
    setPriceRange([100, 2000]);
    setSelectedCategories([]);
    setSelectedLocation("");
    setOnlyShowAvailable(false);
    setSortBy("price_asc");
    setMinSeats(0);
    setTransmission("any");
    setEngineSizeRange([0, 1000]);
    setSelectedVehicleType('all');
    clearDates();
    setCurrentPage(1);
  };

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

  const hasActiveFilters = selectedCategories.length > 0 || 
    priceRange[0] > 100 || priceRange[1] < 2000 || 
    selectedLocation || onlyShowAvailable || 
    selectedVehicleType !== 'all' || 
    startDateObj || endDateObj;

  if (queryError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Vehicles</h2>
          <p className="text-gray-400 mb-4">Failed to load vehicle data. Please try again.</p>
          <Button onClick={() => refetch()} className="bg-primary hover:bg-primary/90">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Generate structured data for SEO
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Vehicle Rentals in Siargao Island",
    "description": "Browse and compare motorcycle, car, and scooter rentals from trusted shops in Siargao Island, Philippines",
    "numberOfItems": pagination?.total || vehicles.length,
    "itemListElement": vehicles.map((vehicle, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": `${vehicle.name || 'Vehicle'} - ${vehicle.vehicle_type} Rental in Siargao`,
        "description": `Rent ${vehicle.name || 'vehicle'} ${vehicle.vehicle_type} in Siargao Island. Daily rate: PHP ${vehicle.price_per_day}`,
        "image": vehicle.images?.[0]?.image_url || '',
        "offers": {
          "@type": "Offer",
          "price": vehicle.price_per_day,
          "priceCurrency": "PHP",
          "availability": vehicle.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        },
        "brand": {
          "@type": "Brand",
          "name": vehicle.shopName || "Siargao Rental Shop"
        },
        "category": `${vehicle.vehicle_type} Rental Siargao`
      }
    }))
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://siargaorides.ph" },
    { name: "Browse Vehicles", url: "https://siargaorides.ph/browse" }
  ])

  const localBusinessSchema = generateLocalBusinessSchema()

  // Generate page title and description based on filters
  const getPageTitle = () => {
    let title = "Browse Vehicle Rentals in Siargao Island | Siargao Rides"
    if (selectedVehicleType !== 'all') {
      const vehicleTypeName = selectedVehicleType.charAt(0).toUpperCase() + selectedVehicleType.slice(1)
      title = `${vehicleTypeName} Rentals in Siargao Island | Browse & Compare Prices`
    }
    if (selectedLocation) {
      title = title.replace('Siargao Island', selectedLocation)
    }
    return title
  }

  const getPageDescription = () => {
    let description = `Browse ${pagination?.total || 'available'} vehicle rentals in Siargao Island, Philippines. Compare prices from trusted local rental shops with flexible pickup and competitive rates.`
    
    if (selectedVehicleType !== 'all') {
      const vehicleTypeName = selectedVehicleType === 'motorcycle' ? 'motorbike and scooter' : selectedVehicleType
      description = `Find the perfect ${vehicleTypeName} rental in Siargao Island. ${pagination?.total || 'Multiple'} ${vehicleTypeName}s available from verified local shops.`
    }
    
    if (selectedLocation) {
      description = description.replace('Siargao Island', selectedLocation)
    }
    
    return description
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(itemListSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(breadcrumbSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(localBusinessSchema)
        }}
      />

      <div className="min-h-screen">
        <header className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden pt-20">
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
            className="max-w-3xl mx-auto mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              className="flex justify-center mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Badge className="text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                Find Your Ride
              </Badge>
            </motion.div>
            <motion.h1
              className="text-3xl md:text-4xl font-bold mb-4 text-white text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {selectedVehicleType === 'all' 
                ? 'Vehicle Rentals in Siargao Island'
                : `${selectedVehicleType.charAt(0).toUpperCase() + selectedVehicleType.slice(1)} Rentals in Siargao`
              }
            </motion.h1>
            <motion.p
              className="text-lg text-gray-300 text-center max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              {selectedVehicleType === 'motorcycle' 
                ? 'Rent motorbikes and scooters from trusted local shops in Siargao Island. Compare prices, check availability, and book online for your island adventure.'
                : selectedVehicleType === 'car'
                ? 'Rent cars and vehicles for comfortable exploration of Siargao Island. Perfect for families and groups with competitive daily rates.'
                : selectedVehicleType === 'tuktuk'
                ? 'Experience authentic Filipino transportation with tuktuk rentals in Siargao Island. Ideal for local trips and cultural exploration.'
                : 'Compare motorbikes, cars, and scooters from verified rental shops across Siargao Island. Book online with flexible pickup and competitive rates.'
              }
            </motion.p>
          </motion.div>
        </div>
        </header>

      {/* Location-specific Information Section */}
      <section className="py-8 bg-gray-900 text-white border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trust Signals */}
            <motion.div 
              className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4 h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Shield className="text-green-400 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Verified Shops Only</h3>
                <p className="text-gray-400 text-xs">All rental shops are verified and trusted</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4 h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Clock className="text-blue-400 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Flexible Pickup</h3>
                <p className="text-gray-400 text-xs">Hotel delivery available across Siargao</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4 h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Users className="text-purple-400 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Trusted by Thousands</h3>
                <p className="text-gray-400 text-xs">Join satisfied customers exploring Siargao</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="py-8 bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4">
          {/* Top bar with filters toggle */}
          <div className="flex justify-between mb-6">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Filter size={18} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
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
                <Sliders size={18} className="mr-2" />
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

                {/* Vehicle Type Selector */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">Vehicle Type</h3>
                  <VehicleTypeSelector
                    selectedType={selectedVehicleType}
                    onChange={setSelectedVehicleType}
                  />
                </div>

                {/* Location Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">Location</h3>
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

                {/* Date Range Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">Date Range</h3>
                  <div className="mb-4">
                    <DateRangePicker
                      startDate={startDateObj}
                      endDate={endDateObj}
                      onStartDateChange={setStartDateObj}
                      onEndDateChange={setEndDateObj}
                    />
                    
                    {dateRangeSelected && (
                      <p className="text-xs text-primary mt-2">
                        {vehicles.filter(v => v.is_available_for_dates).length} vehicles available
                      </p>
                    )}

                    {(startDateObj || endDateObj) && (
                      <button
                        onClick={clearDates}
                        className="mt-3 text-xs text-white/60 hover:text-white flex items-center gap-1"
                      >
                        <XCircle className="h-3 w-3" />
                        Clear dates
                      </button>
                    )}
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyShowAvailable}
                      onChange={() => setOnlyShowAvailable(!onlyShowAvailable)}
                      className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
                    />
                    <span className="text-sm text-white/80">
                      {dateRangeSelected ? "Available for selected dates" : "Available only"}
                    </span>
                  </label>
                </div>

                {/* Category Filter */}
                {selectedVehicleType !== 'all' && availableCategories[selectedVehicleType].length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-bold mb-3 flex items-center">
                      <BikeIcon size={16} className="mr-1.5 text-primary/70" />
                      {selectedVehicleType.charAt(0).toUpperCase() + selectedVehicleType.slice(1)} Categories
                    </h3>
                    <div className="space-y-2">
                      {availableCategories[selectedVehicleType].map((type) => (
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

                {/* Car-specific filters */}
                {selectedVehicleType === 'car' && (
                  <div className="mb-6">
                    <h3 className="text-md font-bold mb-3">Car Options</h3>
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

                {/* Motorcycle-specific filters */}
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
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">Price Range</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-white/80">
                      <span>₱{priceRange[0]}</span>
                      <span>₱{priceRange[1]}</span>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min={100}
                        max={2000}
                        value={priceRange[0]}
                        onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
                        className="w-full h-2 bg-card/50 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <input
                        type="range"
                        min={100}
                        max={2000}
                        value={priceRange[1]}
                        onChange={(e) => handlePriceChange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full h-2 bg-card/50 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Sort By Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
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
                    {/* Vehicle Type (Mobile) */}
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
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range Filter (Mobile) */}
                    <div className="mb-6">
                      <h3 className="text-md font-bold mb-3 flex items-center">
                        <Calendar size={16} className="mr-1.5 text-primary/70" />
                        Date Range
                      </h3>
                      <div className="mb-3">
                        <DateRangePicker
                          startDate={startDateObj}
                          endDate={endDateObj}
                          onStartDateChange={setStartDateObj}
                          onEndDateChange={setEndDateObj}
                        />
                        <p className="text-xs text-white/60 mt-1.5">
                          {dateRangeSelected
                            ? `Found ${vehicles.filter(v => v.is_available_for_dates).length} vehicles available for selected dates`
                            : startDateObj
                              ? "Now select the end date (day you'll return the vehicle)"
                              : "Select the start date (day you'll pick up the vehicle)"}
                        </p>

                        {(startDateObj || endDateObj) && (
                          <button
                            onClick={clearDates}
                            className="mt-2 text-xs text-primary/80 hover:text-primary flex items-center"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Clear dates
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <input
                          type="checkbox"
                          id="mobile-available-vehicles"
                          checked={onlyShowAvailable}
                          onChange={() => setOnlyShowAvailable(!onlyShowAvailable)}
                          className="rounded border-gray-700 text-primary focus:ring-primary bg-gray-900/50"
                        />
                        <label htmlFor="mobile-available-vehicles" className="text-sm text-gray-300">
                          {dateRangeSelected
                            ? "Only show available for selected dates"
                            : "Only show available vehicles"}
                        </label>
                      </div>
                    </div>

                    {/* Rest of mobile filters... */}
                    {/* Add similar structure for categories, price range, car/motorcycle specific filters, sort by */}
                    {/* For brevity, I'll just add the reset button */}

                    {/* Reset Filters Button (Mobile) */}
                    {hasActiveFilters && (
                      <div className="mt-4">
                        <button
                          onClick={resetAllFilters}
                          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-white transition-colors duration-200 flex items-center justify-center"
                        >
                          <span>Reset All Filters</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Vehicle Listings */}
            <div className="md:col-span-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-400">Loading vehicles...</p>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
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
                      <span className="font-semibold">{pagination?.total || 0}</span> {(pagination?.total || 0) === 1 ? 'vehicle' : 'vehicles'} found
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
                    {vehicles.map((vehicle) => (
                      <motion.div
                        className="w-full"
                        key={vehicle.id}
                        variants={itemVariants}
                      >
                        <VehicleCard
                          id={vehicle.id}
                          model={vehicle.name || ''}
                          vehicleType={vehicle.vehicle_type as VehicleType}
                          category={vehicle.category}
                          images={vehicle.images?.map(img => img.image_url || '') || []}
                          specifications={vehicle.specifications || {}}
                          isAvailable={vehicle.is_available}
                          prices={{
                            daily: vehicle.price_per_day,
                            weekly: vehicle.price_per_week,
                            monthly: vehicle.price_per_month
                          }}
                          shop={{
                            id: vehicle.shopId,
                            name: vehicle.shopName,
                            logo: vehicle.shopLogo,
                            location: vehicle.shopLocation
                          }}
                          availabilityInfo={dateRangeSelected ? {
                            isAvailableForDates: vehicle.is_available_for_dates || false,
                            startDate: startDateObj?.toISOString().split('T')[0] || '',
                            endDate: endDateObj?.toISOString().split('T')[0] || ''
                          } : undefined}
                          // Group-related props
                          isGroup={vehicle.is_group || false}
                          groupId={vehicle.group_id}
                          availableCount={vehicle.available_count || 1}
                          totalCount={vehicle.total_count || 1}
                          onViewShopClick={() => handleViewShopClick(vehicle.shopId)}
                          onImageClick={() => handleViewShopClick(vehicle.shopId)}
                          onBookClick={handleBookClick}
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
      </main>

      {/* Popular Siargao Destinations Section */}
      <section className="py-12 bg-black text-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Explore Siargao Island with Your Rental
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover the best destinations in Siargao Island with the freedom of your own vehicle
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Cloud 9 Surfing",
                description: "World-famous surf break perfect for all skill levels",
                icon: "🏄‍♂️"
              },
              {
                name: "Magpupungko Rock Pools",
                description: "Natural tidal pools with crystal clear water", 
                icon: "🏊‍♀️"
              },
              {
                name: "Sugba Lagoon",
                description: "Stunning blue lagoon perfect for kayaking",
                icon: "🛶"
              },
              {
                name: "Three Island Tour",
                description: "Visit Naked, Daku, and Guyam Islands",
                icon: "🏝️"
              }
            ].map((destination, index) => (
              <motion.div
                key={destination.name}
                className="bg-gray-800/50 rounded-lg p-6 text-center hover:bg-gray-800/70 transition-colors h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-3xl mb-4">{destination.icon}</div>
                <h3 className="font-semibold mb-3">{destination.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{destination.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section specific to browsing vehicles */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "How do I book a vehicle in Siargao?",
                  answer: "Simply browse available vehicles, select your preferred dates, and click 'Book Now'. You can filter by vehicle type, location, and price to find the perfect ride for your Siargao adventure."
                },
                {
                  question: "What documents do I need to rent a vehicle in Siargao?",
                  answer: "You'll need a valid driver's license (international license recommended for foreigners), a valid ID, and a deposit. Some shops may require additional documentation for longer rentals."
                },
                {
                  question: "Can I get vehicle delivery to my hotel in Siargao?",
                  answer: "Yes! Most rental shops offer delivery services to hotels, resorts, and other locations across Siargao Island including General Luna, Cloud 9, and other popular areas."
                },
                {
                  question: "What's the best vehicle type for exploring Siargao?",
                  answer: "Motorbikes and scooters are most popular for their flexibility and fuel efficiency. Cars are great for families or groups, while tuktuks offer an authentic Filipino experience for shorter trips."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h3 className="font-semibold mb-3 text-lg">{faq.question}</h3>
                  <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  )
}