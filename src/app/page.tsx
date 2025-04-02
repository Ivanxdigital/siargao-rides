"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import SearchBar, { SearchParams } from "@/components/SearchBar"
import RentalShopCard from "@/components/RentalShopCard"
import * as service from "@/lib/service"
import { RentalShop, Bike, BikeCategory } from "@/lib/types"
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
    
    // Set attributes - improved for mobile compatibility
    iframe.className = 'absolute w-[150%] md:w-[120%] h-[150%] md:h-[120%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&disablekb=1&modestbranding=1&showinfo=0`;
    iframe.title = 'Siargao Island Video Background';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.setAttribute('playsinline', '1'); // Explicit for iOS
    iframe.setAttribute('webkit-playsinline', '1'); // For older iOS versions
    iframe.onload = () => setVideoLoaded(true);
    
    // Append to container
    videoContainerRef.current.appendChild(iframe);
  }, [videoId, isMobile]);

  const handleSearch = async (params: SearchParams) => {
    console.log("Search params:", params)
    setLoading(true)
    setError(null)
    
    try {
      // Map the UI vehicle type to our database category
      let category: BikeCategory | undefined = undefined
      if (params.vehicleType === "motorcycle" && params.category && params.category !== "Any Type") {
        const categoryMap: Record<string, BikeCategory> = {
          "Scooter": "scooter" as BikeCategory,
          "Semi-automatic": "semi_auto" as BikeCategory,
          "Dirt Bike": "dirt_bike" as BikeCategory,
          "Manual": "sport_bike" as BikeCategory,
          "Electric": "other" as BikeCategory
        }
        category = categoryMap[params.category]
      }
      
      console.log("Searching bikes with filters:", { category, maxPrice: params.budget })
      
      // Filter bikes based on search parameters using Supabase API
      const filteredBikes = await service.getBikes({
        category: category,
        max_price: params.budget
        // We would add location filtering here if the bikes table had a location field
        // For now, we'll filter by shop location after getting the bikes
      })
      
      console.log(`Found ${filteredBikes.length} bikes matching price and category criteria`)
      
      // Get unique shop IDs from filtered bikes
      const shopIds = [...new Set(filteredBikes.map(bike => bike.shop_id))]
      console.log(`These bikes belong to ${shopIds.length} different shops`)
      
      // Get shops with these IDs
      const shopsData = await Promise.all(
        shopIds.map(async (shopId) => {
          const shop = await service.getShopById(shopId)
          
          // Skip if shop not found
          if (!shop) return null
          
          // Check location match if a location is specified
          if (params.location) {
            const shopAddress = shop.address?.toLowerCase() || ""
            const shopCity = shop.city?.toLowerCase() || ""
            const searchLocation = params.location.toLowerCase()
            
            console.log(`Checking location for shop ${shop.name}:`, {
              searchLocation,
              shopAddress,
              shopCity,
              addressMatch: shopAddress.includes(searchLocation),
              cityMatch: shopCity.includes(searchLocation)
            })
            
            // Skip if neither address nor city contains the search location
            if (!shopAddress.includes(searchLocation) && !shopCity.includes(searchLocation)) {
              console.log(`Shop ${shop.name} excluded due to location mismatch`)
              return null
            }
          }
          
          // Get shop bikes that passed our filters
          const shopBikes = filteredBikes.filter(bike => bike.shop_id === shopId)
          
          // Skip if no bikes left after location filtering
          if (shopBikes.length === 0) return null
          
          // Calculate starting price
          const startingPrice = Math.min(...shopBikes.map(bike => bike.price_per_day))
          
          // Get shop reviews
          const reviews = await service.getShopReviews(shopId)
          const reviewCount = reviews.length
          const averageRating = reviewCount > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
            : 0
          
          // Get bike images for thumbnails
          const bikeImages = shopBikes.flatMap(bike => bike.images?.map(img => img.image_url) || [])
          
          return {
            id: shop.id,
            name: shop.name,
            images: bikeImages.length > 0 
              ? bikeImages.slice(0, 3) 
              : [shop.logo_url || 'https://placehold.co/600x400/1e3b8a/white?text=Shop+Image'],
            startingPrice,
            rating: averageRating || 4.5,
            reviewCount: reviewCount || 0
          }
        })
      )
      
      // Filter out any null results
      const filteredShops = shopsData.filter(shop => shop !== null) as ShopCardData[]
      console.log(`Final search results: ${filteredShops.length} shops with matching bikes`)
      
      setSearchResults(filteredShops)
    } catch (error: any) {
      console.error("Error searching bikes:", error)
      setError("Failed to search bikes. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      {/* Hero Section - improved responsive heights */}
      <section className="relative min-h-[100vh] sm:min-h-screen max-h-[900px] bg-gradient-to-b from-black to-black/95 overflow-hidden border-b border-white/10">
        {/* Background Image with Overlay - Mobile Only - improved for performance */}
        <div className="absolute inset-0 z-0 md:hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 hover:opacity-50 transition-opacity duration-1000"
            style={{ 
              backgroundImage: "url('/images/alejandro-luengo-clllGLYtLRA-unsplash.jpg')",
              backgroundSize: "cover"
            }}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-black/50 to-purple-900/40 z-10"></div>
          
          {/* Smooth Gradient Overlay - reduced animation complexity for mobile */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-purple-700/20 animate-[pulse_6s_ease-in-out_infinite] z-10 opacity-70"></div>
          
          {/* Reduced animations for better mobile performance */}
          <div className="absolute -inset-[10%] bg-[radial-gradient(circle_at_50%_50%,rgba(120,50,255,0.08),transparent_70%)] opacity-60 animate-[spin_40s_linear_infinite] z-10"></div>
          
          {/* Simplified floating elements for mobile */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/5 blur-2xl animate-[float_30s_ease-in-out_infinite] z-5"></div>
          <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-purple-500/5 blur-2xl animate-[float_35s_ease-in-out_infinite_1s] z-5"></div>
          
          <div className="absolute top-0 left-0 w-full h-2/5 bg-gradient-to-b from-primary/5 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-purple-900/10 to-transparent z-10"></div>
        </div>
        
        {/* YouTube Video Background - Desktop Only */}
        <div className="absolute inset-0 w-full h-full hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-10"></div>
          <div className="relative w-full h-full overflow-hidden">
            <div ref={videoContainerRef} className="w-full h-full"></div>
          </div>
        </div>

        {/* Hero Content - improved padding and spacing for mobile */}
        <div className="container mx-auto relative z-20 h-full flex flex-col justify-center py-8 pb-16 sm:py-12 sm:pb-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4 sm:mb-8 pt-10 sm:pt-12 md:pt-16">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 tracking-tight leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary animate-gradient-x">Explore Siargao</span> on Two Wheels
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed px-2">
              Discover the island's hidden gems with our premium motorbike rentals. Convenient pickup locations, competitive rates, and the freedom to explore at your own pace.
            </p>
          </div>

          {/* Search Bar Container - better mobile spacing */}
          <div className="w-full max-w-4xl mx-auto relative mb-8 sm:mb-12 lg:mb-16 shadow-2xl px-2 sm:px-0">
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

      {/* Add CSS keyframes for animations - optimized for mobile */}
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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-10px) translateX(10px);
          }
          50% {
            transform: translateY(8px) translateX(-8px);
          }
          75% {
            transform: translateY(-4px) translateX(4px);
          }
        }
        
        /* Add mobile-specific keyframes */
        @media (max-width: 768px) {
          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0);
            }
            50% {
              transform: translateY(5px) translateX(-5px);
            }
          }
        }
        
        .bg-noise-pattern {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        /* Add styles to prevent content overflow on small screens */
        @media (max-width: 480px) {
          html, body {
            overflow-x: hidden;
            width: 100%;
          }
        }
      `}</style>

      {/* Featured Shops Section - improved for mobile */}
      <section className="py-10 sm:py-16 bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6 sm:mb-8 text-center">
            {searchResults ? "Search Results" : "Featured Rental Shops"}
          </h2>

          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-300">Loading shops...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm rounded-lg hover:border-primary/50 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {(searchResults || shops).length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-300">No shops found. Please try a different search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
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

          {/* View All Button - improved touch target */}
          {!searchResults && !loading && shops.length > 0 && (
            <div className="text-center mt-8 sm:mt-12">
              <Link 
                href="/browse" 
                className="px-4 py-3 sm:py-2 bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm rounded-lg hover:border-primary/50 transition-colors inline-flex items-center justify-center"
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
