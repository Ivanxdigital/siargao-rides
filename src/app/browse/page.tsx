"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import VehicleCard from "@/components/VehicleCard"
import { Sliders, ChevronDown, ChevronUp, MapPin, Calendar, Filter, Bike as BikeIcon, Car as CarIcon, Truck as TruckIcon, CheckCircle, XCircle, Star, Check, List, LayoutGrid, Bike, Car, Map, Calendar as CalendarIcon, ArrowRight, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { getShops, getBikes, getVehicles, getVehicleTypes } from "@/lib/api"
import { RentalShop, Vehicle, VehicleType, VehicleCategory, BikeCategory, CarCategory, TuktukCategory } from "@/lib/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import DateRangePicker from "@/components/DateRangePicker"
import { parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { useQuery } from '@tanstack/react-query'
import { fetchVehicles } from '@/lib/queries/vehicles'

// Interface for vehicle data with additional calculated fields
interface VehicleWithMetadata extends Vehicle {
  shopName: string;
  shopLogo?: string;
  shopLocation?: string;
  shopId: string;
  shopIsShowcase?: boolean;
  is_available_for_dates?: boolean;
}

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    handleDateRangeChange?: (range: StringDateRange | null) => void;
  }
}

// At the beginning of the file, let's add a few type definitions
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

// New component for vehicle type selection
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
  const [priceRange, setPriceRange] = useState([100, 2000])
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | 'all'>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New filter states
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [onlyShowAvailable, setOnlyShowAvailable] = useState<boolean>(false)
  const [engineSizeRange, setEngineSizeRange] = useState<[number, number]>([0, 1000])
  const [sortBy, setSortBy] = useState<string>("price_asc")

  // Car-specific filters
  const [minSeats, setMinSeats] = useState<number>(0)
  const [transmission, setTransmission] = useState<string>("any")

  // Add date range state variables
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dateRangeSelected, setDateRangeSelected] = useState<boolean>(false);

  // Convert string dates to Date objects for the DateRangePicker
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);

  // Add refs to store the handlers
  const handleDatePickerChangeRef = useRef<(newValue: DateRange | null) => void>(() => {});
  const handleDateRangeChangeRef = useRef<(range: StringDateRange | null) => void>(() => {});

  // Add this somewhere near the other state variables
  const [selectedDates, setSelectedDates] = useState<DateRange | null>(null);

  // New: vehicles with date availability
  const [vehiclesWithAvailability, setVehiclesWithAvailability] = useState<VehicleWithMetadata[] | null>(null);

  // React Query for initial vehicle/shop data
  const {
    data: initialData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['vehicles-initial'],
    queryFn: fetchVehicles,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Use the data from React Query
  const vehicles = initialData?.vehicles || [];
  const locations = initialData?.locations || [];
  const availableCategories = initialData?.availableCategories || {
    motorcycle: [],
    car: [],
    tuktuk: []
  };

  // New useEffect specifically for date range filtering
  useEffect(() => {
    // Only check availability if both dates are present and dateRangeSelected is true
    if (startDate && endDate && dateRangeSelected) {
      const checkAvailabilityForDates = async () => {
        try {
          const supabase = createClientComponentClient();

          // Reset error
          setError(null);

          // Get current vehicles to check
          const currentVehicles = [...vehicles];
          const vehicleIds = currentVehicles.map(v => v.id);
          let availableVehicleIds: string[] = [];

          if (vehicleIds.length === 0) {
            return;
          }

          try {
            // Format dates for API
            const startDateFormatted = new Date(startDate).toISOString().split('T')[0];
            const endDateFormatted = new Date(endDate).toISOString().split('T')[0];

            // Validate dates
            const start = new Date(startDateFormatted);
            const end = new Date(endDateFormatted);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              throw new Error("Invalid date format");
            }

            if (start >= end) {
              throw new Error("Start date must be before end date");
            }

            // Check availability with API
            const response = await fetch('/api/vehicles/check-availability-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vehicleIds,
                startDate: startDateFormatted,
                endDate: endDateFormatted
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to check availability: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
            }

            const availabilityData = await response.json();

            if (availabilityData && Array.isArray(availabilityData.availableVehicleIds)) {
              availableVehicleIds = availabilityData.availableVehicleIds;
            } else {
              throw new Error('Invalid response format from availability check');
            }
          } catch (fetchError) {
            // Fallback - mark all vehicles as available
            availableVehicleIds = vehicleIds;
          }

          // Update availability for all vehicles
          const updatedVehicles = currentVehicles.map(vehicle => ({
            ...vehicle,
            is_available_for_dates: availableVehicleIds.includes(vehicle.id)
          }));
          setVehiclesWithAvailability(updatedVehicles);
        } catch (error) {
          // Optionally set error state
        }
      };

      // Prevent rapid sequential checks by adding a small timeout
      const timeoutId = setTimeout(() => {
        checkAvailabilityForDates();
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      // If no date range, reset to null
      setVehiclesWithAvailability(null);
    }
  }, [startDate, endDate, dateRangeSelected, vehicles]);

  // Use vehiclesWithAvailability if present, otherwise vehicles from React Query
  const vehiclesToDisplay = vehiclesWithAvailability || vehicles;

  // Store functions in refs
  useEffect(() => {
    // Update the local date picker functions to include setSelectedDates
    const handleLocalDatePickerChange = (newValue: DateRange | null) => {
      try {
        console.log("Date picker change:", newValue);

        if (newValue && newValue.from) {
          // If both dates are selected
          if (newValue.to) {
            // Format dates consistently to YYYY-MM-DD
            const formattedStartDate = newValue.from.toISOString().split('T')[0];
            const formattedEndDate = newValue.to.toISOString().split('T')[0];

            console.log(`Setting date range: ${formattedStartDate} to ${formattedEndDate}`);

            setStartDate(formattedStartDate);
            setEndDate(formattedEndDate);
            setSelectedDates(newValue);
            setDateRangeSelected(true);
          }
          // If only start date is selected
          else {
            const formattedStartDate = newValue.from.toISOString().split('T')[0];
            console.log(`Setting start date only: ${formattedStartDate}`);

            setStartDate(formattedStartDate);
            setEndDate('');
            setSelectedDates(newValue);
            setDateRangeSelected(false);
          }
        } else {
          // If newValue is null or undefined (dates cleared)
          console.log('Clearing dates');
          setStartDate('');
          setEndDate('');
          setSelectedDates(null);
          setDateRangeSelected(false);
        }
      } catch (error) {
        console.error('Error handling date change:', error);
        // Reset dates if there's a problem
        setStartDate('');
        setEndDate('');
        setSelectedDates(null);
        setDateRangeSelected(false);
      }
    };

    const handleLocalDateRangeChange = (range: StringDateRange | null) => {
      try {
        console.log("Date range change:", range);

        if (range && range.from && range.to) {
          try {
            // Format dates consistently
            const formattedStartDate = new Date(range.from).toISOString().split('T')[0];
            const formattedEndDate = new Date(range.to).toISOString().split('T')[0];

            console.log(`Setting formatted date range: ${formattedStartDate} to ${formattedEndDate}`);

            setStartDate(formattedStartDate);
            setEndDate(formattedEndDate);
            setDateRangeSelected(true);
          } catch (error) {
            console.error('Invalid date format in range:', error);
            throw new Error('Invalid date format');
          }
        } else {
          // Clear dates if range is null or incomplete
          console.log('Clearing date range');
          setStartDate('');
          setEndDate('');
          setDateRangeSelected(false);
        }
      } catch (error) {
        console.error('Error in handleLocalDateRangeChange:', error);
        // Reset on error
        setStartDate('');
        setEndDate('');
        setDateRangeSelected(false);
      }
    };

    // Create a wrapper function that matches the window interface
    const globalHandleDateRangeChange = (range: StringDateRange | null) => {
      handleLocalDateRangeChange(range);
    };

    // Expose the handler using the wrapper
    window.handleDateRangeChange = globalHandleDateRangeChange;

    // Store references to the local handlers
    handleDateRangeChangeRef.current = handleLocalDateRangeChange;
    handleDatePickerChangeRef.current = handleLocalDatePickerChange;

    return () => {
      delete window.handleDateRangeChange;
    };
  }, []);

  // Add a separate effect for when onlyShowAvailable changes
  useEffect(() => {
    // Update filtered view when onlyShowAvailable changes without re-fetching data
    if (startDate && endDate && dateRangeSelected && vehiclesToDisplay.length > 0) {
      console.log(`Updating vehicle filter based on availability status. Only show available: ${onlyShowAvailable}`);
    }
  }, [onlyShowAvailable]);

  // Replace it with a simpler useEffect that triggers fetching when both dates are selected
  useEffect(() => {
    // When both dates are selected (as strings), trigger a fetch
    if (startDate && endDate && dateRangeSelected) {
      console.log("Complete date range detected, fetching data with filter:", { startDate, endDate });
      // The main useEffect with [startDate, endDate, onlyShowAvailable] dependencies
      // will handle the actual data fetching
    }
  }, [startDate, endDate, dateRangeSelected]);

  // Fix type issue with handleDateRangeChange by making a custom type wrapper
  // Replace the handleDateRangeChange function in the component with this one:
  type CustomHandleDateRangeChange = (start: string, end: string) => void;

  const handleDateRangeChange: CustomHandleDateRangeChange = (start, end) => {
    handleDateRangeChangeRef.current?.({ from: start, to: end });
  };

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
    // Navigate to shop page instead of directly to booking
    router.push(`/shop/${shopId}`)
  }

  // Handle Book Now button click
  const handleBookClick = (vehicleId: string) => {
    // Find the vehicle to get its shop ID
    const vehicle = vehiclesToDisplay.find(v => v.id === vehicleId)
    if (vehicle && vehicle.shopId) {
      // Check if this is a showcase shop
      if (vehicle.shopIsShowcase) {
        // Don't navigate to booking page for showcase shops
        alert('This is a showcase shop for demonstration purposes only. Bookings are not available.');
        return;
      }

      // Navigate to the booking page with vehicle ID, shop ID, and dates
      const queryParams = new URLSearchParams();
      queryParams.append('shop', vehicle.shopId);

      // Add date parameters if dates are selected
      if (startDate && endDate && dateRangeSelected) {
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
      }

      router.push(`/booking/${vehicleId}?${queryParams.toString()}`);
    } else {
      console.error("Could not find shop ID for vehicle:", vehicleId)
      // Fallback to just the vehicle ID
      router.push(`/booking/${vehicleId}`)
    }
  }

  // Apply filters
  const filteredVehicles = vehiclesToDisplay.filter(vehicle => {
    // Price filter
    if (vehicle.price_per_day < priceRange[0] || vehicle.price_per_day > priceRange[1]) {
      return false
    }

    // Vehicle type filter
    if (selectedVehicleType !== 'all' && vehicle.vehicle_type !== selectedVehicleType) {
      return false
    }

    // Category filter - only apply if there are selected categories
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(vehicle.category)) {
        return false
      }
    }

    // Location filter
    if (selectedLocation && vehicle.shopLocation !== selectedLocation) {
      return false
    }

    // Availability filter
    if (onlyShowAvailable) {
      if (!vehicle.is_available) {
        return false;
      }

      // If dates are selected, also check date-specific availability
      if (startDate && endDate && dateRangeSelected && !vehicle.is_available_for_dates) {
        return false;
      }
    }

    // Vehicle-specific filters
    if (vehicle.vehicle_type === 'car') {
      // Filter by minimum seats
      if (minSeats > 0 && (!vehicle.specifications?.seats || vehicle.specifications.seats < minSeats)) {
        return false
      }

      // Filter by transmission
      if (transmission !== 'any' && (!vehicle.specifications?.transmission || vehicle.specifications.transmission !== transmission)) {
        return false
      }
    }

    // Motorcycle-specific filters
    if (vehicle.vehicle_type === 'motorcycle') {
      // Engine size filter
      const engineSize = parseFloat(vehicle.specifications?.engine || '0')
      if (engineSize < engineSizeRange[0] || engineSize > engineSizeRange[1]) {
        return false
      }
    }

    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case "price_asc":
        return a.price_per_day - b.price_per_day
      case "price_desc":
        return b.price_per_day - a.price_per_day
      case "rating_desc":
        return 0 // No rating for vehicles yet
      default:
        return 0
    }
  });

  // Log the filtered results for debugging
  console.log("After applying UI filters:", {
    originalCount: vehiclesToDisplay.length,
    filteredCount: filteredVehicles.length,
    filters: {
      priceRange,
      selectedVehicleType,
      selectedCategories,
      selectedLocation,
      onlyShowAvailable
    }
  });

  // After getting query results but before filtering
  console.log('Vehicle query results:', {
    vehicleCount: vehiclesToDisplay?.length || 0,
    filters: {
      is_available: true,
      is_verified: true,
      verification_status: 'approved'
    },
    shops: vehiclesToDisplay?.map(v => ({
      shop_id: v.shop_id,
      shop_name: v.shopName || 'N/A',
      shop_location: v.shopLocation || 'N/A',
      vehicle_id: v.id,
      vehicle_name: v.name
    }))
  });

  // At the end of filter function before returning filtered vehicles
  console.log('Filtered vehicles:', {
    originalCount: vehiclesToDisplay?.length || 0,
    filteredCount: filteredVehicles.length,
    filters: {
      priceRange,
      selectedVehicleType,
      selectedCategories,
      selectedLocation,
      onlyShowAvailable,
      shops: filteredVehicles.map(v => ({
        shop_id: v.shop_id,
        shop_name: v.shopName || 'N/A',
        shop_location: v.shopLocation || 'N/A',
        vehicle_id: v.id,
        vehicle_name: v.name
      }))
    }
  });

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

  // Update clear button click handlers
  const clearDates = () => {
    console.log("Clearing all dates");
    setStartDate('');
    setEndDate('');
    setStartDateObj(null);
    setEndDateObj(null);
    setSelectedDates(null);
    setDateRangeSelected(false);
  };

  // Create a function for resetting all filters
  const resetAllFilters = () => {
    // Reset all filters
    setPriceRange([100, 2000]);
    setSelectedCategories([]);
    setMinRating(0);
    setSelectedLocation("");
    setOnlyShowAvailable(false);
    setSortBy("price_asc");
    setMinSeats(0);
    setTransmission("any");
    setEngineSizeRange([0, 1000]);

    // Also clear dates
    clearDates();
  };

  if (isLoading) return <div>Loading...</div>;
  if (queryError) return <div>Error loading vehicles.</div>;

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
              className="flex justify-between items-center"
            >
              <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                Find Your Ride
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-white/80 hover:text-white flex items-center gap-1"
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
            </motion.div>
            <motion.h1
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              Browse Available Vehicles
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
          {/* Top bar with filters toggle and view options */}
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
              <div className="hidden md:block sticky top-20 p-6 bg-card/30 backdrop-blur-xl rounded-xl border border-border/30">
                <h2 className="text-xl font-semibold mb-6 text-white">
                  Filters
                </h2>

                {/* Vehicle Type Selector */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">
                    Vehicle Type
                  </h3>
                  <VehicleTypeSelector
                    selectedType={selectedVehicleType}
                    onChange={setSelectedVehicleType}
                  />
                </div>

                {/* Location Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">
                    Location
                  </h3>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-card/50 text-white border border-border/50 rounded-lg p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <option value="">All Locations</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4 text-white/90">
                    Date Range
                  </h3>
                  <div className="mb-4">
                    <DateRangePicker
                      startDate={startDateObj}
                      endDate={endDateObj}
                      onStartDateChange={(date) => {
                        setStartDateObj(date);
                        if (date) {
                          const formattedDate = date.toISOString().split('T')[0];
                          setStartDate(formattedDate);
                        } else {
                          setStartDate('');
                        }
                        if (!date) {
                          setEndDateObj(null);
                          setEndDate('');
                          setDateRangeSelected(false);
                        }
                      }}
                      onEndDateChange={(date) => {
                        setEndDateObj(date);
                        if (date) {
                          const formattedDate = date.toISOString().split('T')[0];
                          setEndDate(formattedDate);
                          if (startDateObj) {
                            setDateRangeSelected(true);
                          }
                        } else {
                          setEndDate('');
                          setDateRangeSelected(false);
                        }
                      }}
                    />
                    
                    {dateRangeSelected && (
                      <p className="text-xs text-primary mt-2">
                        {vehiclesToDisplay.filter(v => v.is_available_for_dates).length} vehicles available
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
                      onChange={() => {
                        setOnlyShowAvailable(!onlyShowAvailable);
                        if (dateRangeSelected && startDate && endDate) {
                          handleDateRangeChange(startDate, endDate);
                        }
                      }}
                      className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20 bg-card/50"
                    />
                    <span className="text-sm text-white/80">
                      {dateRangeSelected ? "Available for selected dates" : "Available only"}
                    </span>
                  </label>
                </div>

                {/* Category Filter - show categories based on selected vehicle type */}
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
                {(selectedCategories.length > 0 || minRating > 0 || priceRange[0] > 100 || priceRange[1] < 2000 || selectedLocation || onlyShowAvailable) && (
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
                        Date Range
                      </h3>
                      <div className="mb-3">
                        <DateRangePicker
                          startDate={startDateObj}
                          endDate={endDateObj}
                          onStartDateChange={(date) => {
                            console.log("Start date changed (mobile):", date);

                            // Update the Date object
                            setStartDateObj(date);

                            // Update the formatted string date
                            if (date) {
                              const formattedDate = date.toISOString().split('T')[0];
                              setStartDate(formattedDate);
                            } else {
                              setStartDate('');
                            }

                            // If we're clearing the start date, also clear the end date
                            if (!date) {
                              setEndDateObj(null);
                              setEndDate('');
                              setDateRangeSelected(false);
                            }
                          }}
                          onEndDateChange={(date) => {
                            console.log("End date changed (mobile):", date);

                            // Update the Date object
                            setEndDateObj(date);

                            // Update the formatted string date
                            if (date) {
                              const formattedDate = date.toISOString().split('T')[0];
                              setEndDate(formattedDate);

                              // If we now have both dates, mark selection as complete
                              if (startDateObj) {
                                setDateRangeSelected(true);
                              }
                            } else {
                              setEndDate('');
                              setDateRangeSelected(false);
                            }
                          }}
                        />
                        <p className="text-xs text-white/60 mt-1.5">
                          {dateRangeSelected
                            ? `Found ${vehiclesToDisplay.filter(v => v.is_available_for_dates).length} vehicles available for selected dates`
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
                          onChange={() => {
                            setOnlyShowAvailable(!onlyShowAvailable);
                            // Re-fetch data if dates are selected and we're toggling availability filter
                            if (dateRangeSelected && startDate && endDate) {
                              handleDateRangeChange(startDate, endDate);
                            }
                          }}
                          className="rounded border-gray-700 text-primary focus:ring-primary bg-gray-900/50"
                        />
                        <label htmlFor="mobile-available-vehicles" className="text-sm text-gray-300">
                          {dateRangeSelected
                            ? "Only show available for selected dates"
                            : "Only show available vehicles"}
                        </label>
                      </div>
                    </div>

                    {/* Category Filter - Mobile */}
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

                    {/* Mobile-specific filters */}
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

                    {/* Car-specific filters - mobile */}
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
                      </select>
                    </div>

                    {/* Reset Filters Button (Mobile) */}
                    {(selectedCategories.length > 0 || minRating > 0 || priceRange[0] > 100 || priceRange[1] < 2000 || selectedLocation || onlyShowAvailable) ? (
                      <div className="mt-4">
                        <button
                          onClick={resetAllFilters}
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

            {/* Vehicle Listings */}
            <div className="md:col-span-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-400">Loading vehicles...</p>
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
              ) : filteredVehicles.length === 0 ? (
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
                      <span className="font-semibold">{filteredVehicles.length}</span> {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'} found
                    </p>
                    <Badge className="bg-primary/10 text-xs text-primary border-primary/20 py-1">
                      {(selectedCategories.length > 0 || minRating > 0 || selectedLocation || onlyShowAvailable || selectedVehicleType !== 'all')
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
                    {filteredVehicles.map((vehicle) => (
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
                            startDate: startDate,
                            endDate: endDate
                          } : undefined}
                          onViewShopClick={() => handleViewShopClick(vehicle.shopId)}
                          onImageClick={() => handleViewShopClick(vehicle.shopId)}
                          onBookClick={handleBookClick}
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