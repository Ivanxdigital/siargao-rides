"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import SearchBar, { SearchParams } from "@/components/SearchBar"
import RentalShopCard from "@/components/RentalShopCard"
import * as service from "@/lib/service"
import { RentalShop, Bike } from "@/lib/types"
import { ArrowRight } from "lucide-react"

// Transformed shop data for the RentalShopCard
interface ShopCardData {
  id: string
  name: string
  images: string[]
  startingPrice: number
  rating: number
  reviewCount: number
}

export default function Home() {
  const [shops, setShops] = useState<ShopCardData[]>([])
  const [bikes, setBikes] = useState<Bike[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<ShopCardData[] | null>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Set initial value
    checkIfMobile()
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile)
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // YouTube video setup
  const videoId = "l6K6FgR2xB8"

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch shops and bikes
        const shopsData = await service.getShops()
        const bikesData = await service.getBikes()
        
        setBikes(bikesData)
        
        // Transform shop data for the card component
        const shopCardData = await Promise.all(
          shopsData.map(async (shop) => {
            // Get bikes for this shop
            const shopBikes = bikesData.filter(bike => bike.shop_id === shop.id)
            
            // Calculate starting price (lowest price per day)
            const startingPrice = shopBikes.length > 0
              ? Math.min(...shopBikes.map(bike => bike.price_per_day))
              : 0
            
            // Get shop reviews (in a real app we'd calculate average rating)
            const reviews = await service.getShopReviews(shop.id)
            const reviewCount = reviews.length
            const averageRating = reviewCount > 0
              ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
              : 0
            
            // Get bike images for thumbnails
            const bikeImages = shopBikes.flatMap(bike => bike.images?.map(img => img.image_url) || [])
            
            return {
              id: shop.id,
              name: shop.name,
              // Use bike images if available, or use shop logo/placeholder
              images: bikeImages.length > 0 
                ? bikeImages.slice(0, 3) 
                : [shop.logo_url || 'https://placehold.co/600x400/1e3b8a/white?text=Shop+Image'],
              startingPrice,
              rating: averageRating || 4.5, // Default rating if no reviews
              reviewCount: reviewCount || 0
            }
          })
        )
        
        setShops(shopCardData)
      } catch (error: any) {
        console.error("Error fetching data:", {
          name: error?.name || 'Unknown Error',
          message: error?.message || 'An unknown error occurred',
          stack: error?.stack || 'No stack trace available'
        })
        setError(error?.message || 'Failed to load data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Initialize the YouTube iframe after the component mounts (client-side only)
  useEffect(() => {
    if (!videoContainerRef.current || isMobile) return;

    // Clear out any existing content
    videoContainerRef.current.innerHTML = '';
    
    // Create iframe element
    const iframe = document.createElement('iframe');
    
    // Set attributes
    iframe.className = 'absolute w-[150%] md:w-[120%] h-[150%] md:h-[120%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&disablekb=1&modestbranding=1&showinfo=0`;
    iframe.title = 'Siargao Island Video Background';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.onload = () => setVideoLoaded(true);
    
    // Append to container
    videoContainerRef.current.appendChild(iframe);
  }, [videoId, isMobile]);

  const handleSearch = async (params: SearchParams) => {
    console.log("Search params:", params)
    
    // Filter bikes based on search params
    let filteredBikes = [...bikes]
    
    // Map the UI bike type to our database category
    if (params.bikeType && params.bikeType !== "Any Type") {
      const categoryMap: Record<string, string> = {
        "Scooter": "scooter",
        "Semi-automatic": "semi_auto",
        "Dirt Bike": "dirt_bike",
        "Manual": "sport_bike",
        "Electric": "other"
      }
      
      const category = categoryMap[params.bikeType]
      if (category) {
        filteredBikes = filteredBikes.filter(bike => bike.category === category)
      }
    }
    
    // Use the budget parameter for price filtering
    if (params.budget) {
      filteredBikes = filteredBikes.filter(bike => bike.price_per_day <= params.budget)
    }
    
    // Get unique shop IDs from filtered bikes
    const shopIds = [...new Set(filteredBikes.map(bike => bike.shop_id))]
    
    // Filter shops that have matching bikes
    const filteredShops = shops.filter(shop => shopIds.includes(shop.id))
    
    setSearchResults(filteredShops)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[110vh] sm:min-h-screen max-h-[900px] bg-gradient-to-b from-black to-black/95 overflow-hidden border-b border-white/10">
        {/* Background Image with Overlay - Mobile Only */}
        <div className="absolute inset-0 z-0 md:hidden">
          <Image
            src="/images/hero-bg.jpg"
            alt="Siargao Rides Hero"
            fill
            className="object-cover object-center opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/95 z-10"></div>
        </div>
        
        {/* YouTube Video Background - Desktop Only */}
        <div className="absolute inset-0 w-full h-full hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-10"></div>
          <div className="relative w-full h-full overflow-hidden">
            {/* Video container - iframe will be dynamically inserted here */}
            <div ref={videoContainerRef} className="w-full h-full"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto relative z-20 h-full flex flex-col justify-center py-12 pb-24 px-4 sm:px-6 sm:py-16 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 pt-12 md:pt-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary animate-gradient-x">Explore Siargao</span> on Two Wheels
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Discover the island's hidden gems with our premium motorbike rentals. Convenient pickup locations, competitive rates, and the freedom to explore at your own pace.
            </p>
          </div>

          {/* Search Bar Container */}
          <div className="w-full max-w-4xl mx-auto relative mb-12 sm:mb-16 shadow-2xl">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
        
        {/* Scroll Down Indicator - Desktop Only */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 hidden md:flex flex-col items-center animate-bounce">
          <span className="text-white/80 text-xs mb-1">Scroll Down</span>
          <svg className="w-5 h-5 text-white/80" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      {/* Add CSS keyframes for animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>

      {/* Featured Shops Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">
            {searchResults ? "Search Results" : "Featured Rental Shops"}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-300">Loading shops...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm rounded hover:border-primary/50 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {(searchResults || shops).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-300">No shops found. Please try a different search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(searchResults || shops).map((shop) => (
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
              )}
            </>
          )}

          {/* View All Button */}
          {!searchResults && !loading && shops.length > 0 && (
            <div className="text-center mt-12">
              <Link 
                href="/browse" 
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm rounded hover:border-primary/50 transition-colors inline-flex items-center"
              >
                View all rental shops <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
