"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Calendar, Bike, Sparkles, MapPin, X } from "lucide-react"
import { Button } from "./ui/Button"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { createPortal } from "react-dom"

interface SearchBarProps {
  onSearch: (searchParams: SearchParams) => void
}

export interface SearchParams {
  location: string
  startDate: string
  endDate: string
  budget: number
  bikeType: string
}

const bikeTypes = [
  "Any Type",
  "Scooter",
  "Semi-automatic",
  "Manual",
  "Dirt Bike",
  "Electric"
]

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

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budget, setBudget] = useState(500) // Default budget in PHP
  const [bikeType, setBikeType] = useState("Any Type")
  const [activeField, setActiveField] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  
  // Location dropdown states
  const [filteredLocations, setFilteredLocations] = useState<string[]>([])
  const [showLocations, setShowLocations] = useState(false)
  const [keyboardIndex, setKeyboardIndex] = useState(-1)
  
  // Refs for handling clicks outside the dropdown
  const locationInputRef = useRef<HTMLDivElement>(null)
  const locationsDropdownRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Detect if device is mobile
  const isMobile = useMediaQuery("(max-width: 640px)")

  // State to track if the component is mounted (for client-side rendering)
  const [isMounted, setIsMounted] = useState(false)
  
  // Mount effect for client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Set current date in YYYY-MM-DD format on each render
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const formattedDate = today.toISOString().split('T')[0]
    setCurrentDate(formattedDate)
    
    // If startDate is in the past, update it to today
    if (startDate && new Date(startDate) < today) {
      setStartDate(formattedDate)
    }
  }, [])
  
  // Update filtered locations when input changes
  useEffect(() => {
    if (location.trim() === '') {
      setFilteredLocations(siargaoLocations)
    } else {
      const filtered = siargaoLocations.filter(loc => 
        loc.toLowerCase().includes(location.toLowerCase())
      )
      setFilteredLocations(filtered)
    }
    setKeyboardIndex(-1)
  }, [location])

  // Handle outside clicks for location dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationInputRef.current && 
        !locationInputRef.current.contains(event.target as Node) &&
        locationsDropdownRef.current && 
        !locationsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocations(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(newStartDate)
    
    // Prevent selection of past dates
    if (selectedDate < today) {
      const formattedToday = today.toISOString().split('T')[0]
      setStartDate(formattedToday)
    } else {
      setStartDate(newStartDate)
    }
    
    // If end date is before the new start date, update end date to match start date
    if (endDate && endDate < (selectedDate < today ? today.toISOString().split('T')[0] : newStartDate)) {
      setEndDate(selectedDate < today ? today.toISOString().split('T')[0] : newStartDate)
    }
  }
  
  const handleLocationFocus = () => {
    setActiveField('location');
    setShowLocations(true);
    setFilteredLocations(siargaoLocations);
  }
  
  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation)
    setShowLocations(false)
    setActiveField(null)
  }
  
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value)
    if (!showLocations) {
      setShowLocations(true)
    }
  }
  
  const handleClearLocation = () => {
    setLocation('')
    if (locationInputRef.current) {
      locationInputRef.current.querySelector('input')?.focus()
    }
  }
  
  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow keys for navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setKeyboardIndex(prev => 
        prev < filteredLocations.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setKeyboardIndex(prev => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === 'Enter' && keyboardIndex >= 0) {
      e.preventDefault()
      handleLocationSelect(filteredLocations[keyboardIndex])
    } else if (e.key === 'Escape') {
      setShowLocations(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Final validation before submitting
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // If start date is empty or invalid, set it to today
    if (!startDate || new Date(startDate) < today) {
      setStartDate(today.toISOString().split('T')[0])
    }
    
    // If end date is empty, set it to start date
    if (!endDate) {
      setEndDate(startDate)
    }
    
    setIsSearching(true)
    
    // Simulate AI "thinking" with a brief delay
    setTimeout(() => {
      onSearch({
        location,
        startDate,
        endDate,
        budget,
        bikeType
      })
      setIsSearching(false)
    }, 800)
  }

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 p-3 sm:p-4 transition-all duration-300 relative overflow-hidden group">
      {/* Animated gradient accent */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-purple-500/20 to-blue-500/30 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-500 animate-gradient-x"></div>
      
      {/* AI glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      <form ref={formRef} onSubmit={handleSubmit} className="relative space-y-3 sm:space-y-4 z-10">
        <div className="flex items-center mb-2 sm:mb-3">
          <Sparkles size={16} className="text-primary mr-2 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-medium text-white/90">AI-Powered Search</h3>
        </div>
        
        {/* Location */}
        <div className={`space-y-1 sm:space-y-1.5 transition-all duration-300 ${activeField === 'location' ? 'scale-[1.01]' : ''} relative`}>
          <label className="text-xs font-medium flex items-center gap-1.5 text-primary/90">
            <MapPin size={14} className="text-primary" />
            Location
          </label>
          <div className="relative" ref={locationInputRef}>
            <input
              type="text"
              placeholder="Where in Siargao are you staying?"
              value={location}
              onChange={handleLocationInputChange}
              onFocus={handleLocationFocus}
              onKeyDown={handleLocationKeyDown}
              className="w-full px-3 py-2 sm:py-2.5 bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 pl-10 pr-8 text-white placeholder:text-white/40"
            />
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            
            {/* Clear button */}
            {location && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={16} />
              </button>
            )}
            
            {/* Simple Dropdown - directly attached to the input */}
            {showLocations && (
              <div 
                ref={locationsDropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-black border border-gray-700 rounded-lg shadow-2xl z-[9999]"
                style={{
                  maxHeight: "15rem",
                  overflowY: "auto",
                  position: "absolute",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.9)"
                }}
              >
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc, index) => (
                    <div 
                      key={loc}
                      className={`p-3 cursor-pointer text-base hover:bg-gray-800 ${
                        index === keyboardIndex ? "bg-gray-800" : ""
                      }`}
                      onClick={() => handleLocationSelect(loc)}
                      onMouseEnter={() => setKeyboardIndex(index)}
                    >
                      <div className="flex items-center">
                        <MapPin size={16} className="text-primary mr-2" />
                        <span className="font-medium text-white">{loc}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-300">No locations found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date Range - add margin top when dropdown is visible */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${showLocations ? 'mt-64 sm:mt-72' : ''} transition-all duration-200`}>
          <div className={`space-y-1 sm:space-y-1.5 transition-all duration-300 ${activeField === 'startDate' ? 'scale-[1.01]' : ''}`}>
            <label className="text-xs font-medium flex items-center gap-1.5 text-primary/90">
              <Calendar size={14} className="text-primary" />
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                min={currentDate}
                onChange={handleStartDateChange}
                onFocus={() => {
                  setActiveField('startDate')
                  setShowLocations(false)
                }}
                onBlur={() => setActiveField(null)}
                className={`w-full px-3 py-2 sm:py-2.5 bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 text-white touch-manipulation ${isMobile ? 'pl-10' : 'pl-12'} appearance-none`}
                inputMode="none"
                style={{
                  colorScheme: 'dark'
                }}
                required
              />
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              
              {/* Custom date display for mobile */}
              {isMobile && (
                <div className="absolute right-3 left-10 top-1/2 -translate-y-1/2 text-white text-sm pointer-events-none flex items-center">
                  {startDate ? (
                    <span className="font-medium truncate">
                      {new Date(startDate).toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  ) : (
                    <span className="text-white/40">Select start date</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className={`space-y-1 sm:space-y-1.5 transition-all duration-300 ${activeField === 'endDate' ? 'scale-[1.01]' : ''}`}>
            <label className="text-xs font-medium flex items-center gap-1.5 text-primary/90">
              <Calendar size={14} className="text-primary" />
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                min={startDate || currentDate}
                onChange={(e) => setEndDate(e.target.value)}
                onFocus={() => {
                  setActiveField('endDate')
                  setShowLocations(false)
                }}
                onBlur={() => setActiveField(null)}
                className={`w-full px-3 py-2 sm:py-2.5 bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 text-white touch-manipulation ${isMobile ? 'pl-10' : 'pl-12'} appearance-none`}
                inputMode="none"
                style={{
                  colorScheme: 'dark'
                }}
                required
              />
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              
              {/* Custom date display for mobile */}
              {isMobile && (
                <div className="absolute right-3 left-10 top-1/2 -translate-y-1/2 text-white text-sm pointer-events-none flex items-center">
                  {endDate ? (
                    <span className="font-medium truncate">
                      {new Date(endDate).toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  ) : (
                    <span className="text-white/40">Select end date</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Budget and Bike Type in a grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Budget Slider */}
          <div className={`space-y-1 sm:space-y-2 transition-all duration-300 ${activeField === 'budget' ? 'scale-[1.01]' : ''}`}>
            <label className="text-xs font-medium flex items-center gap-1.5 text-primary/90">
              <span>Daily Budget:</span>
              <span className="ml-1 text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-md">₱{budget}</span>
            </label>
            <div className="px-1.5 py-0 sm:py-1">
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                onFocus={() => {
                  setActiveField('budget')
                  setShowLocations(false)
                }}
                onBlur={() => setActiveField(null)}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(139,92,246,0.5)] sm:[&::-webkit-slider-thumb]:w-5 sm:[&::-webkit-slider-thumb]:h-5 touch-manipulation"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-1 sm:mt-1.5 px-1">
                <span>₱100</span>
                <span>₱2000</span>
              </div>
            </div>
          </div>

          {/* Bike Type */}
          <div className={`space-y-1 sm:space-y-1.5 transition-all duration-300 ${activeField === 'bikeType' ? 'scale-[1.01]' : ''}`}>
            <label className="text-xs font-medium flex items-center gap-1.5 text-primary/90">
              <Bike size={14} className="text-primary" />
              Bike Type
            </label>
            <div className="relative">
              <select
                value={bikeType}
                onChange={(e) => setBikeType(e.target.value)}
                onFocus={() => {
                  setActiveField('bikeType')
                  setShowLocations(false)
                }}
                onBlur={() => setActiveField(null)}
                className="w-full px-3 py-2 sm:py-2.5 bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 appearance-none text-white pl-10"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23ffffff' viewBox='0 0 24 24' stroke='%23ffffff' opacity='0.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1rem',
                  backgroundRepeat: 'no-repeat',
                  paddingRight: '2.5rem'
                }}
              >
                {bikeTypes.map((type) => (
                  <option key={type} value={type} className="bg-gray-900 text-white">
                    {type}
                  </option>
                ))}
              </select>
              <Bike size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full py-2 sm:py-2.5 text-sm font-medium bg-gradient-to-r from-primary/90 to-purple-600/90 hover:from-primary hover:to-purple-600 transition-all 
          duration-300 transform hover:scale-[1.01] active:scale-[0.99] rounded-lg shadow-md hover:shadow-lg relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={isSearching}
        >
          <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center">
            {isSearching ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                <span>Finding bikes...</span>
              </>
            ) : (
              <>
                <Search size={16} className="mr-2" />
                <span>Find Your Perfect Ride</span>
              </>
            )}
          </div>
        </Button>
        
        {/* Add animated styles */}
        <style jsx global>{`
          @keyframes gradient-x {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          .animate-gradient-x {
            animation: gradient-x 15s ease infinite;
            background-size: 400% 400%;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
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
              position: relative;
            }
            
            /* Create a fake disabled appearance when empty */
            input[type="date"]:not(:valid):not(:focus) {
              color: transparent;
            }
          }
        `}</style>
      </form>
    </div>
  )
}

export default SearchBar 