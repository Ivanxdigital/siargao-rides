"use client"

import { useState } from "react"
import { Search, Calendar, Bike, DollarSign } from "lucide-react"
import { Button } from "./ui/Button"

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch({
      location,
      startDate,
      endDate,
      budget,
      bikeType
    })
  }

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-4 transition-all duration-300">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Location */}
        <div className={`space-y-1 transition-all duration-200 ${activeField === 'location' ? 'scale-[1.02]' : ''}`}>
          <label className="text-xs font-medium flex items-center gap-1 text-primary">
            <Search size={14} className="text-primary" />
            Location
          </label>
          <input
            type="text"
            placeholder="Enter hotel or area in Siargao"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setActiveField('location')}
            onBlur={() => setActiveField(null)}
            className="w-full px-3 py-2 bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`space-y-1 transition-all duration-200 ${activeField === 'startDate' ? 'scale-[1.02]' : ''}`}>
            <label className="text-xs font-medium flex items-center gap-1 text-primary">
              <Calendar size={14} className="text-primary" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onFocus={() => setActiveField('startDate')}
              onBlur={() => setActiveField(null)}
              className="w-full px-3 py-2 bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className={`space-y-1 transition-all duration-200 ${activeField === 'endDate' ? 'scale-[1.02]' : ''}`}>
            <label className="text-xs font-medium flex items-center gap-1 text-primary">
              <Calendar size={14} className="text-primary" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onFocus={() => setActiveField('endDate')}
              onBlur={() => setActiveField(null)}
              className="w-full px-3 py-2 bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Budget and Bike Type in a grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Budget Slider */}
          <div className={`space-y-2 transition-all duration-200 ${activeField === 'budget' ? 'scale-[1.02]' : ''}`}>
            <label className="text-xs font-medium flex items-center gap-1 text-primary">
              <DollarSign size={14} className="text-primary" />
              <span>Daily Budget:</span>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md">₱{budget}</span>
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value))}
              onFocus={() => setActiveField('budget')}
              onBlur={() => setActiveField(null)}
              className="w-full h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
            <div className="flex justify-between text-[10px] text-primary/70">
              <span>₱100</span>
              <span>₱2000</span>
            </div>
          </div>

          {/* Bike Type */}
          <div className={`space-y-1 transition-all duration-200 ${activeField === 'bikeType' ? 'scale-[1.02]' : ''}`}>
            <label className="text-xs font-medium flex items-center gap-1 text-primary">
              <Bike size={14} className="text-primary" />
              Bike Type
            </label>
            <select
              value={bikeType}
              onChange={(e) => setBikeType(e.target.value)}
              onFocus={() => setActiveField('bikeType')}
              onBlur={() => setActiveField(null)}
              className="w-full px-3 py-2 bg-background/80 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.8em]"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
            >
              {bikeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full py-2 text-sm font-medium bg-primary hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] rounded-lg shadow-md hover:shadow-lg"
        >
          <Search size={14} className="mr-1" />
          Find Your Ride
        </Button>
      </form>
    </div>
  )
}

export default SearchBar 