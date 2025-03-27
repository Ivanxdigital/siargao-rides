"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import SearchBar, { SearchParams } from "@/components/SearchBar"
import RentalShopCard from "@/components/RentalShopCard"

// Temporary mock data for featured shops
const FEATURED_SHOPS = [
  {
    id: "shop1",
    name: "Island Riders",
    images: ["/placeholder-1.jpg", "/placeholder-2.jpg"],
    startingPrice: 400,
    rating: 4.7,
    reviewCount: 24
  },
  {
    id: "shop2",
    name: "Siargao Wheels",
    images: ["/placeholder-3.jpg", "/placeholder-4.jpg"],
    startingPrice: 350,
    rating: 4.5,
    reviewCount: 18
  },
  {
    id: "shop3",
    name: "Wave Cruisers",
    images: ["/placeholder-5.jpg", "/placeholder-6.jpg"],
    startingPrice: 450,
    rating: 4.8,
    reviewCount: 32
  }
]

export default function Home() {
  const [searchResults, setSearchResults] = useState<null | typeof FEATURED_SHOPS>(null)

  const handleSearch = (params: SearchParams) => {
    console.log("Search params:", params)
    // In a real app, this would filter shops or redirect to /browse with query params
    // For now, just pretend we're filtering and return all shops
    setSearchResults(FEATURED_SHOPS)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] w-full">
        {/* Hero Background - would be replaced with an actual image */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70">
          {/* We'd have an actual image here, using a div for now */}
          <div className="w-full h-full flex items-center justify-center bg-tropical-teal/20">
            {/* Placeholder for a real hero image */}
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto h-full flex flex-col items-center justify-center px-4 py-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground">
            Explore Siargao on Two Wheels
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-8 text-muted-foreground">
            Find and book the perfect motorbike from local rental shops for your island adventure
          </p>

          {/* Search Bar Component */}
          <div className="w-full max-w-4xl">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Featured Shops Section */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">
          {searchResults ? "Search Results" : "Featured Rental Shops"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(searchResults || FEATURED_SHOPS).map((shop) => (
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

        {/* View All Button */}
        {!searchResults && (
          <div className="text-center mt-12">
            <Link 
              href="/browse" 
              className="text-primary underline hover:text-primary/80 transition-colors"
            >
              View all rental shops
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
