"use client"

import { useState } from "react"
import RentalShopCard from "@/components/RentalShopCard"
import { Sliders, ChevronDown, ChevronUp } from "lucide-react"

// Temporary mock data for shops
const SHOPS = [
  {
    id: "shop1",
    name: "Island Riders",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=Island+Riders", "https://placehold.co/600x400/1e3b8a/white?text=Island+Riders"],
    startingPrice: 400,
    rating: 4.7,
    reviewCount: 24,
    bikeTypes: ["Scooter", "Semi-automatic"]
  },
  {
    id: "shop2",
    name: "Siargao Wheels",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=Siargao+Wheels", "https://placehold.co/600x400/1e3b8a/white?text=Siargao+Wheels"],
    startingPrice: 350,
    rating: 4.5,
    reviewCount: 18,
    bikeTypes: ["Scooter", "Dirt Bike"]
  },
  {
    id: "shop3",
    name: "Wave Cruisers",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=Wave+Cruisers", "https://placehold.co/600x400/1e3b8a/white?text=Wave+Cruisers"],
    startingPrice: 450,
    rating: 4.8,
    reviewCount: 32,
    bikeTypes: ["Semi-automatic", "Manual"]
  },
  {
    id: "shop4",
    name: "GL Rentals",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=GL+Rentals", "https://placehold.co/600x400/1e3b8a/white?text=GL+Rentals"],
    startingPrice: 380,
    rating: 4.2,
    reviewCount: 12,
    bikeTypes: ["Scooter", "Electric"]
  },
  {
    id: "shop5",
    name: "Surf & Ride",
    images: ["https://placehold.co/600x400/1e3b8a/white?text=Surf+Ride", "https://placehold.co/600x400/1e3b8a/white?text=Surf+Ride"],
    startingPrice: 420,
    rating: 4.6,
    reviewCount: 28,
    bikeTypes: ["Manual", "Dirt Bike"]
  }
]

const BikeTypeCheckbox = ({ type, checked, onChange }: { type: string, checked: boolean, onChange: () => void }) => {
  return (
    <div className="flex items-center space-x-2">
      <input 
        type="checkbox" 
        id={`type-${type}`} 
        checked={checked}
        onChange={onChange}
        className="rounded border-border text-primary focus:ring-primary"
      />
      <label htmlFor={`type-${type}`} className="text-sm">{type}</label>
    </div>
  )
}

export default function BrowsePage() {
  const [priceRange, setPriceRange] = useState([100, 2000])
  const [selectedBikeTypes, setSelectedBikeTypes] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  
  const toggleBikeType = (type: string) => {
    if (selectedBikeTypes.includes(type)) {
      setSelectedBikeTypes(selectedBikeTypes.filter(t => t !== type))
    } else {
      setSelectedBikeTypes([...selectedBikeTypes, type])
    }
  }

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value)
  }

  // Apply filters
  const filteredShops = SHOPS.filter(shop => {
    // Price filter
    if (shop.startingPrice < priceRange[0] || shop.startingPrice > priceRange[1]) {
      return false
    }
    
    // Bike type filter
    if (selectedBikeTypes.length > 0) {
      const hasMatchingType = shop.bikeTypes.some(type => 
        selectedBikeTypes.includes(type)
      )
      if (!hasMatchingType) return false
    }
    
    // Rating filter
    if (shop.rating < minRating) {
      return false
    }
    
    return true
  })

  return (
    <div className="pt-24">
      <>
        <div className="bg-black text-white">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-4">Browse Motorbike Rentals</h1>
            <p className="text-lg">Find the perfect ride for your Siargao adventure</p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-semibold mb-8 text-center">Browse Motorbike Rentals</h1>
          
          {/* Mobile Filters Toggle */}
          <div className="md:hidden mb-4">
            <button 
              className="w-full flex items-center justify-between bg-card border border-border rounded-md p-3"
              onClick={() => setShowFilters(!showFilters)}
            >
              <div className="flex items-center">
                <Sliders size={18} className="mr-2" />
                <span>Filters</span>
              </div>
              {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 bg-card border border-border rounded-lg p-4 h-fit`}>
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              
              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Price Range</h3>
                {/* This is a placeholder for the slider component */}
                <div className="mb-2">
                  <div className="h-2 bg-muted rounded-full relative">
                    <div 
                      className="absolute h-full bg-primary rounded-full" 
                      style={{ 
                        left: `${((priceRange[0] - 100) / 1900) * 100}%`, 
                        right: `${100 - ((priceRange[1] - 100) / 1900) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₱{priceRange[0]}</span>
                  <span>₱{priceRange[1]}</span>
                </div>
              </div>
              
              {/* Bike Type Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Bike Type</h3>
                <div className="space-y-2">
                  <BikeTypeCheckbox 
                    type="Scooter" 
                    checked={selectedBikeTypes.includes("Scooter")}
                    onChange={() => toggleBikeType("Scooter")}
                  />
                  <BikeTypeCheckbox 
                    type="Semi-automatic" 
                    checked={selectedBikeTypes.includes("Semi-automatic")}
                    onChange={() => toggleBikeType("Semi-automatic")}
                  />
                  <BikeTypeCheckbox 
                    type="Manual" 
                    checked={selectedBikeTypes.includes("Manual")}
                    onChange={() => toggleBikeType("Manual")}
                  />
                  <BikeTypeCheckbox 
                    type="Dirt Bike" 
                    checked={selectedBikeTypes.includes("Dirt Bike")}
                    onChange={() => toggleBikeType("Dirt Bike")}
                  />
                  <BikeTypeCheckbox 
                    type="Electric" 
                    checked={selectedBikeTypes.includes("Electric")}
                    onChange={() => toggleBikeType("Electric")}
                  />
                </div>
              </div>
              
              {/* Rating Filter */}
              <div>
                <h3 className="text-sm font-medium mb-3">Minimum Rating</h3>
                <select 
                  value={minRating}
                  onChange={e => setMinRating(Number(e.target.value))}
                  className="w-full p-2 bg-background border border-border rounded"
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
            </div>
            
            {/* Shop Listings */}
            <div className="flex-1">
              {filteredShops.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredShops.map(shop => (
                    <RentalShopCard
                      key={shop.id}
                      id={shop.id}
                      name={shop.name}
                      images={shop.images}
                      startingPrice={shop.startingPrice}
                      rating={shop.rating}
                      reviewCount={shop.reviewCount}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    No rental shops match your filters. Try adjusting your criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    </div>
  )
} 