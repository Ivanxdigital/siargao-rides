"use client"

import { useState, useEffect } from "react"
import { Search, Calendar, Bike, Sparkles } from "lucide-react"
import { Button } from "./ui/Button"
import { useMediaQuery } from "@/hooks/useMediaQuery"

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

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budget, setBudget] = useState(500) // Default budget in PHP
  const [bikeType, setBikeType] = useState("Any Type")
  const [activeField, setActiveField] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  
  // Detect if device is mobile
  const isMobile = useMediaQuery("(max-width: 640px)")

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
      
      <form onSubmit={handleSubmit} className="relative space-y-3 sm:space-y-4 z-10">
        <div className="flex items-center mb-2 sm:mb-3">
          <Sparkles size={16} className="text-primary mr-2 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-medium text-white/90">AI-Powered Search</h3>
        </div>
        
        {/* Location */}
        <div className={`space-y-1 sm:space-y-1.5 transition-all duration-300 ${activeField === 'location' ? 'scale-[1.01]' : ''}`}>
          <label className="text-xs font-medium flex items-center gap-1.5 text-primary/90">
            <Search size={14} className="text-primary" />
            Location
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Where in Siargao are you staying?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setActiveField('location')}
              onBlur={() => setActiveField(null)}
              className="w-full px-3 py-2 sm:py-2.5 bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 pl-10 text-white placeholder:text-white/40"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                onFocus={() => setActiveField('startDate')}
                onBlur={() => setActiveField(null)}
                className={`w-full px-3 py-2 sm:py-2.5 bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 text-white touch-manipulation ${isMobile ? 'pl-14' : 'pl-12'}`}
                inputMode="none"
              />
              <Calendar size={16} className={`absolute ${isMobile ? 'left-4' : 'left-3.5'} top-1/2 -translate-y-1/2 text-white/40`} />
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
                onFocus={() => setActiveField('endDate')}
                onBlur={() => setActiveField(null)}
                className={`w-full px-3 py-2 sm:py-2.5 bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 text-white touch-manipulation ${isMobile ? 'pl-14' : 'pl-12'}`}
                inputMode="none"
              />
              <Calendar size={16} className={`absolute ${isMobile ? 'left-4' : 'left-3.5'} top-1/2 -translate-y-1/2 text-white/40`} />
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
                onFocus={() => setActiveField('budget')}
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
                onFocus={() => setActiveField('bikeType')}
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
        `}</style>
      </form>
    </div>
  )
}

export default SearchBar 