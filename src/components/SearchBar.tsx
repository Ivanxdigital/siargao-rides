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
    <div className="bg-card rounded-lg shadow-md border border-border p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Search size={18} />
            Location
          </label>
          <input
            type="text"
            placeholder="Enter hotel or area in Siargao"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={18} />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={18} />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Budget Slider */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <DollarSign size={18} />
            Daily Budget: ₱{budget}
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={budget}
            onChange={(e) => setBudget(parseInt(e.target.value))}
            className="w-full appearance-none h-2 bg-muted rounded-full outline-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₱100</span>
            <span>₱2000</span>
          </div>
        </div>

        {/* Bike Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Bike size={18} />
            Bike Type
          </label>
          <select
            value={bikeType}
            onChange={(e) => setBikeType(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {bikeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full">
          Search Motorbikes
        </Button>
      </form>
    </div>
  )
}

export default SearchBar 