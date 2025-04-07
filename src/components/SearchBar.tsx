"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Calendar, MapPin, X, ChevronDown, Check } from "lucide-react"
import { Button } from "./ui/Button"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { motion, AnimatePresence } from "framer-motion"
import { VehicleType } from "@/lib/types"

interface SearchBarProps {
  onSearch: (searchParams: SearchParams) => void
}

export interface SearchParams {
  location: string
  startDate: string
  endDate: string
  budget: number
  vehicleType: VehicleType
  category: string
}

// Replace the vehicle combinations with simplified options
const vehicleOptions = [
  { vehicleType: 'motorcycle', label: 'Motorbike', icon: 'bike' },
  { vehicleType: 'car', label: 'Car', icon: 'car' },
  { vehicleType: 'tuktuk', label: 'TukTuk', icon: 'truck' }
];

// Default categories for each vehicle type
const defaultCategories = {
  motorcycle: 'scooter',
  car: 'sedan',
  tuktuk: 'standard'
};

// Predefined Siargao locations
const siargaoLocations = [
  "General Luna",
  "Cloud 9",
  "Pacifico",
  "Dapa",
  "Union",
  "Pilar",
  "Santa Monica",
  "San Isidro",
  "Del Carmen",
  "Burgos",
  "Maasin River",
  "Sugba Lagoon",
  "Magpupungko Rock Pools"
]

// Budget options as presets
const budgetOptions = [
  { label: "Budget (< ₱500)", value: 500 },
  { label: "Mid-range (₱500-1000)", value: 1000 },
  { label: "Premium (₱1000+)", value: 1500 }
]

// Animation variants - simplified
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
}

const dropdownVariants = {
  hidden: { opacity: 0, scaleY: 0, transformOrigin: 'top' },
  visible: { 
    opacity: 1, 
    scaleY: 1, 
    transformOrigin: 'top',
    transition: { duration: 0.15 }
  },
  exit: { 
    opacity: 0, 
    scaleY: 0, 
    transformOrigin: 'top',
    transition: { duration: 0.1 } 
  }
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  // Search state
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budget, setBudget] = useState(500)
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle')
  const [category, setCategory] = useState("scooter")
  const [selectedVehicleOption, setSelectedVehicleOption] = useState(vehicleOptions[0])
  
  // UI state
  const [step, setStep] = useState(1) // Progressive disclosure steps
  const [isSearching, setIsSearching] = useState(false)
  const [showLocations, setShowLocations] = useState(false)
  const [showVehicleOptions, setShowVehicleOptions] = useState(false)
  const [showBudgetOptions, setShowBudgetOptions] = useState(false)
  const [filteredLocations, setFilteredLocations] = useState<string[]>(siargaoLocations)
  const [currentDate, setCurrentDate] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  
  // Refs for handling clicks outside dropdowns
  const locationInputRef = useRef<HTMLDivElement>(null)
  const locationsDropdownRef = useRef<HTMLDivElement>(null)
  const vehicleDropdownRef = useRef<HTMLDivElement>(null)
  const budgetDropdownRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Detect if device is mobile
  const isMobile = useMediaQuery("(max-width: 640px)")
  
  // Set initial dates when component mounts
  useEffect(() => {
    setIsMounted(true)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const formattedDate = today.toISOString().split('T')[0]
    setCurrentDate(formattedDate)
    setStartDate(formattedDate)
    
    // Set end date to tomorrow by default
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setEndDate(tomorrow.toISOString().split('T')[0])
  }, [])
  
  // Update filtered locations when typing
  useEffect(() => {
    if (location.trim() === '') {
      setFilteredLocations(siargaoLocations)
    } else {
      const filtered = siargaoLocations.filter(loc => 
        loc.toLowerCase().includes(location.toLowerCase())
      )
      setFilteredLocations(filtered)
    }
  }, [location])
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value
    setStartDate(newStartDate)
    
    // If end date is before new start date, update end date
    if (endDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate(newStartDate)
    }
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value)
  }
  
  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation)
    setShowLocations(false)
    
    // If we're on step 1, move to step 2 after location selection
    if (step === 1) {
      setTimeout(() => setStep(2), 300)
    }
  }
  
  const handleVehicleSelect = (option: typeof vehicleOptions[0]) => {
    setSelectedVehicleOption(option);
    setVehicleType(option.vehicleType as VehicleType);
    // Set the default category based on vehicle type
    setCategory(defaultCategories[option.vehicleType as VehicleType]);
    setShowVehicleOptions(false);
    
    // If we're on step 2, move to step 3 after vehicle selection
    if (step === 2) {
      setTimeout(() => setStep(3), 300);
    }
  };
  
  const handleBudgetSelect = (value: number) => {
    setBudget(value)
    setShowBudgetOptions(false)
  }
  
  const handleDateShortcut = (days: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Set start date
    setStartDate(today.toISOString().split('T')[0])
    
    // Set end date based on days
    const endDay = new Date(today)
    endDay.setDate(endDay.getDate() + days)
    setEndDate(endDay.toISOString().split('T')[0])
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSearching(true)
    
    // Simulate AI "thinking" with a brief delay
    setTimeout(() => {
      onSearch({
        location,
        startDate,
        endDate,
        budget,
        vehicleType,
        category
      })
      setIsSearching(false)
    }, 500)
  }

  // Add back the missing click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Location dropdown
      if (
        locationInputRef.current && 
        !locationInputRef.current.contains(event.target as Node) &&
        locationsDropdownRef.current && 
        !locationsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocations(false)
      }
      
      // Vehicle dropdown
      if (
        vehicleDropdownRef.current &&
        !vehicleDropdownRef.current.contains(event.target as Node)
      ) {
        setShowVehicleOptions(false)
      }
      
      // Budget dropdown
      if (
        budgetDropdownRef.current &&
        !budgetDropdownRef.current.contains(event.target as Node)
      ) {
        setShowBudgetOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <motion.div 
      className="bg-black/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 p-5 transition-all duration-300 relative overflow-visible w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-30 pointer-events-none" />

      <motion.form 
        ref={formRef} 
        onSubmit={handleSubmit} 
        className="relative space-y-5 z-10"
      >
        {/* Step 1: Location */}
        <AnimatePresence>
          {(step >= 1) && (
            <motion.div 
              className="space-y-2"
              initial={fadeIn.hidden}
              animate={fadeIn.visible}
              exit={fadeIn.hidden}
            >
              <label className="text-xs font-medium text-white/80 ml-1">Where are you staying?</label>
              <div className="relative z-50" ref={locationInputRef}>
                <input
                  type="text"
                  placeholder="Enter your location in Siargao"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    setShowLocations(true)
                  }}
                  onClick={() => setShowLocations(true)}
                  onFocus={() => setShowLocations(true)}
                  className="w-full p-3 px-10 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 text-white placeholder:text-white/40 transition-all duration-200"
                />
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/60" />
                
                {/* Clear button */}
                {location && (
                  <button
                    type="button"
                    onClick={() => setLocation('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <X size={14} className="hover:rotate-90 transition-transform duration-200" />
                  </button>
                )}
                
                {/* Locations Dropdown */}
                <AnimatePresence>
                  {showLocations && (
                    <motion.div 
                      ref={locationsDropdownRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl z-[9999] shadow-xl overflow-auto"
                      style={{ 
                        maxHeight: '60vh', 
                      }}
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((loc) => (
                          <div 
                            key={loc}
                            className="p-2.5 cursor-pointer hover:bg-white/5 flex items-center transition-colors duration-150"
                            onClick={() => handleLocationSelect(loc)}
                          >
                            <MapPin size={14} className="text-primary/70 mr-2.5" />
                            <span className="text-sm text-white">{loc}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-white/60">
                          No locations found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Step 2: Vehicle Type */}
        <AnimatePresence>
          {(step >= 2) && (
            <motion.div 
              className="space-y-2"
              initial={fadeIn.hidden}
              animate={fadeIn.visible}
              exit={fadeIn.hidden}
            >
              <label className="text-xs font-medium text-white/80 ml-1">What would you like to ride?</label>
              <div className="relative" ref={vehicleDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowVehicleOptions(!showVehicleOptions)}
                  className="w-full p-3 px-10 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 text-white text-left flex items-center justify-between transition-all duration-200"
                >
                  <span className="flex items-center">
                    <span className="w-6 flex justify-center mr-2">
                      {selectedVehicleOption.icon === 'bike' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70">
                          <path d="M5 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"></path>
                          <path d="M15 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"></path>
                          <path d="M12 19v-5l-3-3 2-4h5l2 4"></path>
                          <path d="M17 7h2l3 4"></path>
                          <path d="M2 15h3"></path>
                        </svg>
                      )}
                      {selectedVehicleOption.icon === 'car' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70">
                          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.6-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"></path>
                          <circle cx="7" cy="17" r="2"></circle>
                          <path d="M9 17h6"></path>
                          <circle cx="17" cy="17" r="2"></circle>
                        </svg>
                      )}
                      {selectedVehicleOption.icon === 'truck' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70">
                          <path d="M10 17h4V5H2v12h3"></path>
                          <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"></path>
                          <circle cx="7.5" cy="17.5" r="2.5"></circle>
                          <circle cx="17.5" cy="17.5" r="2.5"></circle>
                        </svg>
                      )}
                    </span>
                    <span className="text-sm">{selectedVehicleOption.label}</span>
                  </span>
                  <ChevronDown size={16} className={`text-white/60 transition-transform duration-200 ${showVehicleOptions ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Vehicle Options Dropdown */}
                <AnimatePresence>
                  {showVehicleOptions && (
                    <motion.div 
                      className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl z-50 overflow-hidden"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {vehicleOptions.map((option) => (
                        <div 
                          key={`${option.vehicleType}-${option.label}`}
                          className={`p-2.5 cursor-pointer hover:bg-white/5 flex items-center justify-between ${
                            selectedVehicleOption.vehicleType === option.vehicleType ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => handleVehicleSelect(option)}
                        >
                          <span className="flex items-center">
                            <span className="w-6 flex justify-center mr-2">
                              {option.icon === 'bike' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                                  <path d="M5 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"></path>
                                  <path d="M15 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"></path>
                                  <path d="M12 19v-5l-3-3 2-4h5l2 4"></path>
                                  <path d="M17 7h2l3 4"></path>
                                  <path d="M2 15h3"></path>
                                </svg>
                              )}
                              {option.icon === 'car' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.6-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"></path>
                                  <circle cx="7" cy="17" r="2"></circle>
                                  <path d="M9 17h6"></path>
                                  <circle cx="17" cy="17" r="2"></circle>
                                </svg>
                              )}
                              {option.icon === 'truck' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                                  <path d="M10 17h4V5H2v12h3"></path>
                                  <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"></path>
                                  <circle cx="7.5" cy="17.5" r="2.5"></circle>
                                  <circle cx="17.5" cy="17.5" r="2.5"></circle>
                                </svg>
                              )}
                            </span>
                            <span className="text-sm text-white">{option.label}</span>
                          </span>
                          
                          {selectedVehicleOption.vehicleType === option.vehicleType && (
                            <Check size={14} className="text-primary" />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Step 3: Date & Budget */}
        <AnimatePresence>
          {(step >= 3) && (
            <motion.div 
              className="space-y-1.5"
              initial={fadeIn.hidden}
              animate={fadeIn.visible}
              exit={fadeIn.hidden}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/80">When do you need it?</label>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => handleDateShortcut(1)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-2 py-1 rounded transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDateShortcut(2)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-2 py-1 rounded transition-colors"
                  >
                    2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDateShortcut(7)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-2 py-1 rounded transition-colors"
                  >
                    Week
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Start Date */}
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    min={currentDate}
                    onChange={handleStartDateChange}
                    className="w-full p-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 text-white appearance-none"
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                  {isMobile && (
                    <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                      <Calendar size={14} className="text-white/40 mr-2" />
                      <span className="text-sm text-white/80">
                        {startDate ? new Date(startDate).toLocaleDateString('en-US', { 
                          day: 'numeric', 
                          month: 'short'
                        }) : 'Start'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* End Date */}
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || currentDate}
                    onChange={handleEndDateChange}
                    className="w-full p-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 text-white appearance-none"
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                  {isMobile && (
                    <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                      <Calendar size={14} className="text-white/40 mr-2" />
                      <span className="text-sm text-white/80">
                        {endDate ? new Date(endDate).toLocaleDateString('en-US', { 
                          day: 'numeric', 
                          month: 'short'
                        }) : 'End'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Budget Selection */}
              <div className="mt-3">
                <label className="text-xs font-medium text-white/80 mb-1.5 block">Daily budget</label>
                <div className="relative" ref={budgetDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowBudgetOptions(!showBudgetOptions)}
                    className="w-full p-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 text-white text-left flex items-center justify-between"
                  >
                    <span>
                      {budgetOptions.find(option => option.value === budget)?.label || `₱${budget}`}
                    </span>
                    <ChevronDown size={16} className={`text-white/60 transition-transform duration-200 ${showBudgetOptions ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Budget Options Dropdown */}
                  <AnimatePresence>
                    {showBudgetOptions && (
                      <motion.div 
                        className="absolute top-full left-0 right-0 mt-1 bg-black/90 border border-white/10 rounded-lg z-50 overflow-hidden"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {budgetOptions.map((option) => (
                          <div 
                            key={option.value}
                            className={`p-2.5 cursor-pointer hover:bg-white/5 flex items-center justify-between ${
                              budget === option.value ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => handleBudgetSelect(option.value)}
                          >
                            <span className="text-sm text-white">{option.label}</span>
                            {budget === option.value && (
                              <Check size={14} className="text-primary" />
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Search Button - only shown when all required fields are completed */}
        <AnimatePresence>
          {((step === 3 && location && startDate && endDate) || step > 3) && (
            <motion.div
              initial={fadeIn.hidden}
              animate={fadeIn.visible}
              exit={fadeIn.hidden}
              className="pt-2"
            >
              <button
                type="submit"
                className="w-full py-3 font-medium bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white rounded-lg transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed border border-white/10 shadow-lg hover:shadow-primary/10 group"
                disabled={isSearching || !location || !startDate || !endDate}
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent mr-2 animate-spin"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-300">Find Your Ride</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Step Indicators */}
        <div className="flex items-center justify-center space-x-1 pt-1">
          {[1, 2, 3].map((stepNumber) => (
            <motion.div
              key={stepNumber}
              className={`h-1 rounded-full ${
                stepNumber <= step ? 'bg-primary/70' : 'bg-white/10'
              } transition-all duration-300`}
              style={{ width: stepNumber <= step ? '24px' : '12px' }}
              animate={{ 
                width: stepNumber <= step ? '24px' : '12px',
                backgroundColor: stepNumber <= step ? 'rgb(139 92 246 / 0.7)' : 'rgb(255 255 255 / 0.1)'
              }}
            />
          ))}
        </div>
      </motion.form>
      
      {/* Custom date input styling for mobile */}
      <style jsx global>{`
        @media (max-width: 640px) {
          input[type="date"]::-webkit-calendar-picker-indicator {
            opacity: 0;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }
          
          input[type="date"] {
            color: transparent;
          }
        }
      `}</style>
    </motion.div>
  )
}

export default SearchBar 