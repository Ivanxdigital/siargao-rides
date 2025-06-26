"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import SearchBar, { SearchParams } from "@/components/SearchBar"
import RentalShopCard from "@/components/RentalShopCard"
import VehicleCard from "@/components/VehicleCard"
import * as service from "@/lib/service"
import { RentalShop, Bike, BikeCategory, Vehicle, VehicleType, VehicleCategory } from "@/lib/types"
import { ArrowRight } from "lucide-react"
import FAQSection from '@/components/FAQSection'
import { generateLocalBusinessSchema, generateJSONLD } from "@/lib/structured-data"

// Transformed shop data for the RentalShopCard
interface ShopCardData {
  id: string
  name: string
  images: string[]
  startingPrice: number
  rating: number
  reviewCount: number
}

// Transformed vehicle data for the VehicleCard
interface VehicleCardData {
  id: string
  model: string
  vehicleType: VehicleType
  category?: VehicleCategory | string
  images: string[]
  prices: {
    daily: number
    weekly?: number
    monthly?: number
  }
  isAvailable: boolean
  specifications?: Record<string, any>
  shop?: {
    id: string
    name: string
    logo?: string
    location?: string
  }
}

export default function Home() {
  const [shops, setShops] = useState<ShopCardData[]>([])
  const [bikes, setBikes] = useState<Bike[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<ShopCardData[] | null>(null)
  const [vehicleSearchResults, setVehicleSearchResults] = useState<VehicleCardData[] | null>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)

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

  // YouTube video setup - TEMPORARILY DISABLED
  // const videoId = "l6K6FgR2xB8"

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch shops and bikes
        const shopsData = await service.getVerifiedShops()

        // Only fetch verified vehicles for public display
        // The API now defaults to only returning verified vehicles
        const bikesData = await service.getBikes()

        setBikes(bikesData)

        // Transform shop data for the card component
        const shopCardData = await Promise.all(
          shopsData.map(async (shop) => {
            // Get bikes for this shop - only verified bikes will be included
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

  // YouTube iframe initialization - TEMPORARILY DISABLED
  /*
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

    // Handle successful load
    iframe.onload = () => {
      setVideoLoaded(true);
      setVideoError(false);
    };

    // Handle error
    iframe.onerror = () => {
      console.error('YouTube iframe failed to load');
      setVideoError(true);
      setVideoLoaded(false);
    };

    // Additional error handling for YouTube iframe
    const handleIframeError = () => {
      console.error('YouTube iframe encountered an error');
      setVideoError(true);
      setVideoLoaded(false);
    };

    // Append to container
    videoContainerRef.current.appendChild(iframe);

    // Set a timeout to check if video loaded successfully
    const timeoutId = setTimeout(() => {
      if (!videoLoaded) {
        console.warn('YouTube video did not load within timeout period');
        setVideoError(true);
      }
    }, 5000); // 5 second timeout

    return () => {
      clearTimeout(timeoutId);
    };
  }, [videoId, isMobile, videoLoaded]);
  */

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

      console.log("Searching vehicles with filters:", { 
        vehicleType: params.vehicleType, 
        category, 
        maxPrice: params.budget,
        location: params.location
      })

      // Get all vehicles matching the search criteria - directly pass vehicle_type
      const filteredVehicles = await service.getVehicles({
        vehicle_type: params.vehicleType as VehicleType,
        category: category as string,
        max_price: params.budget,
        is_available: true,
      });

      console.log(`Found ${filteredVehicles.length} vehicles matching criteria`);

      // Additional location filtering since it's not supported directly by the API
      const locationFilteredVehicles = params.location
        ? await Promise.all(
            filteredVehicles.map(async (vehicle) => {
              const shop = await service.getShopById(vehicle.shop_id);
              if (!shop) return null;
              
              const shopAddress = shop.address?.toLowerCase() || "";
              const shopCity = shop.city?.toLowerCase() || "";
              const searchLocation = params.location.toLowerCase();
              
              if (shopAddress.includes(searchLocation) || shopCity.includes(searchLocation)) {
                return { vehicle, shop };
              }
              return null;
            })
          )
        : filteredVehicles.map(vehicle => ({ vehicle, shop: null }));

      // Filter out nulls and transform data for VehicleCard component
      const vehicleResults = (await Promise.all(
        locationFilteredVehicles
          .filter((item): item is { vehicle: Vehicle; shop: RentalShop | null } => item !== null)
          .map(async ({ vehicle, shop }) => {
            // If shop is null (in case we didn't filter by location), fetch it
            const vehicleShop = shop || await service.getShopById(vehicle.shop_id);
            if (!vehicleShop || !vehicleShop.is_verified) return null;

            // Get vehicle images
            const imageUrls = vehicle.images 
              ? vehicle.images.map(img => img.image_url)
              : [];

            return {
              id: vehicle.id,
              model: vehicle.name,
              vehicleType: vehicle.vehicle_type,
              category: vehicle.category,
              images: imageUrls,
              prices: {
                daily: vehicle.price_per_day,
                weekly: vehicle.price_per_week,
                monthly: vehicle.price_per_month
              },
              isAvailable: vehicle.is_available,
              specifications: vehicle.specifications || {},
              shop: vehicleShop ? {
                id: vehicleShop.id,
                name: vehicleShop.name,
                logo: vehicleShop.logo_url,
                location: `${vehicleShop.city}${vehicleShop.address ? ', ' + vehicleShop.address : ''}`
              } : undefined
            } as VehicleCardData;
          })
      )).filter((result): result is VehicleCardData => result !== null);

      console.log(`Final search results: ${vehicleResults.length} vehicles`);
      
      setVehicleSearchResults(vehicleResults);
      setSearchResults(null); // Clear shop results since we're now showing vehicles

      // Scroll to search results after a short delay to allow rendering
      setTimeout(() => {
        searchResultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);
    } catch (error: any) {
      console.error("Error searching vehicles:", error);
      setError("Failed to search vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Check if announcement is visible and if page is scrolled
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  // Debounce function to delay execution
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  useEffect(() => {
    // Check if device is mobile
    const isMobile = window.innerWidth < 768

    // Listen for custom event when announcement is dismissed
    const handleAnnouncementDismissed = () => {
      setIsAnnouncementVisible(false)
    }

    // Handle scroll events
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    // Apply debounce for mobile devices to handle momentum scrolling
    const debouncedHandleScroll = isMobile
      ? debounce(handleScroll, 150) // 150ms delay for mobile
      : handleScroll

    window.addEventListener("announcement-dismissed", handleAnnouncementDismissed)
    window.addEventListener("scroll", debouncedHandleScroll)

    return () => {
      window.removeEventListener("announcement-dismissed", handleAnnouncementDismissed)
      window.removeEventListener("scroll", debouncedHandleScroll)
    }
  }, [])

  // Generate structured data for SEO
  const localBusinessSchema = generateLocalBusinessSchema()

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(localBusinessSchema)
        }}
      />
      {/* Hero Section - improved responsive heights */}
      <section className="relative min-h-[100vh] sm:min-h-screen bg-gradient-to-b from-black to-black/95 overflow-hidden border-b border-white/10 transition-all duration-500">
        {/* Background Image with Overlay - Mobile Only - simplified */}
        <div className="absolute inset-0 z-0 md:hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
            style={{
              backgroundImage: "url('/images/siargao-motorbike-rental-siargao.png')",
              backgroundSize: "cover"
            }}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 z-10"></div>
        </div>

        {/* Static Background Image - Desktop */}
        <div className="absolute inset-0 w-full h-full hidden md:block">
          <div className="w-full h-full relative">
            <Image
              src="/images/siargao-motorbike-rental-siargao.png"
              alt="Siargao Motorbike Rental"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70 z-10"></div>
        </div>

        {/* Hero Content - improved padding and spacing for mobile */}
        <div className="container mx-auto relative z-20 min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4 sm:mb-8 pt-10 sm:pt-12 md:pt-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 sm:mb-8 tracking-tight max-w-4xl mx-auto px-4 leading-tight">
              Siargao Vehicle Rentals – Because Walking in Flip-Flops Only Gets You So Far
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed px-2">
              Rent motorbikes, cars, and scooters in Siargao Island, Philippines. Compare trusted local rental shops with flexible pickup, competitive rates, and total freedom to explore paradise.
            </p>
{/* Credits removed since no longer using video background */}
          </div>

          {/* Search Bar Container - better mobile spacing */}
          <div className="w-full max-w-md mx-auto relative mb-8 sm:mb-12 lg:mb-16 px-2 sm:px-0">
            <SearchBar onSearch={handleSearch} />
          </div>
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


        /* Animation for the Safety Tips section */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Optimize animations for mobile */
        @media (max-width: 768px) {
          /* Reduce animation complexity for mobile */
          .group:hover svg {
            transform: scale(1.05) !important;
          }

          /* Optimize animation performance */
          .animate-fade-in-up,
          [class*='animate-[fadeIn'],
          [class*='animate-[fadeInUp'] {
            will-change: opacity, transform;
          }
        }


        /* Add shimmer effect for shop cards */
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .bg-shimmer {
          background: linear-gradient(90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.05) 50%,
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2.5s infinite;
        }

        /* Add subtle pulse animation for interactive elements */
        @keyframes subtle-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }

        .hover-pulse:hover {
          animation: subtle-pulse 2s ease-in-out infinite;
        }

        /* Add background movement animation */
        @keyframes bg-slide {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 100%;
          }
        }

        .animate-bg-slide {
          animation: bg-slide 15s linear infinite alternate;
          background-size: 200% 200%;
        }
      `}</style>

      {/* Featured Shops Section - improved for mobile */}
      <section ref={searchResultsRef} className="py-14 sm:py-20 bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white relative overflow-hidden">
        {/* Background Elements - reduced animations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(29,78,216,0.08),transparent_70%)] opacity-70"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,0.08),transparent_70%)] opacity-60"></div>
          <div className="absolute inset-0 bg-noise-pattern opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header with enhanced styling */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="inline-block text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
                {vehicleSearchResults ? "Search Results" : "Featured Rental Shops"}
              </span>
            </h2>
            {!vehicleSearchResults && !searchResults && (
              <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base">
                Discover top-rated rental shops with quality vehicles and exceptional service
              </p>
            )}
            {vehicleSearchResults && (
              <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base">
                Browse available vehicles that match your search criteria
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 sm:py-16">
              <div className="inline-block animate-[spin_2s_linear_infinite] rounded-full h-8 w-8 border-b-2 border-white mb-4 opacity-70"></div>
              <p className="text-gray-300">
                Finding the perfect ride for you...
              </p>

              {/* Loading skeleton cards - reduced animations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-white/5 h-full flex flex-col">
                    {/* Skeleton image */}
                    <div className="relative aspect-[16/9] bg-gray-800/50 overflow-hidden">
                      {/* Removed shimmer animation */}
                    </div>

                    {/* Skeleton content */}
                    <div className="p-4 sm:p-5 flex flex-col flex-grow space-y-3">
                      <div className="h-5 bg-gray-800/80 rounded-md w-2/3 relative overflow-hidden">
                        {/* Removed shimmer animation */}
                      </div>
                      <div className="h-4 bg-gray-800/80 rounded-md w-1/2 relative overflow-hidden">
                        {/* Removed shimmer animation */}
                      </div>
                      <div className="h-4 bg-gray-800/80 rounded-md w-full mt-auto relative overflow-hidden">
                        {/* Removed shimmer animation */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 sm:py-16 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-400 mb-3">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white border border-primary/30 shadow-md rounded-lg hover:border-primary/50 transition-all hover:shadow-primary/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Vehicle Search Results */}
              {vehicleSearchResults && (
                <>
                  {vehicleSearchResults.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 max-w-md mx-auto">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/50 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-300 mb-3">No vehicles found matching your criteria.</p>
                      <button
                        onClick={() => {
                          setVehicleSearchResults(null);
                          setSearchResults(null);
                        }}
                        className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white border border-primary/30 shadow-md rounded-lg hover:border-primary/50 transition-all hover:shadow-primary/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        View Featured Shops
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {vehicleSearchResults.map((vehicle, index) => (
                        <div key={vehicle.id} className="group animate-[fadeInUp_0.6s_ease-out_forwards] opacity-0" style={{ animationDelay: `${index * 0.1}s` }}>
                          <VehicleCard
                            id={vehicle.id}
                            model={vehicle.model}
                            vehicleType={vehicle.vehicleType}
                            category={vehicle.category}
                            images={vehicle.images}
                            prices={vehicle.prices}
                            isAvailable={vehicle.isAvailable}
                            specifications={vehicle.specifications}
                            shop={vehicle.shop}
                            onBookClick={(id) => {
                              window.location.href = `/booking/${id}`;
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Shop Results or Default Shop Display */}
              {!vehicleSearchResults && (
                <>
                  {(searchResults || shops).length === 0 ? (
                    <div className="text-center py-12 sm:py-16 max-w-md mx-auto">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/50 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-300 mb-3">No shops found matching your criteria.</p>
                      <button
                        onClick={() => setSearchResults(null)}
                        className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white border border-primary/30 shadow-md rounded-lg hover:border-primary/50 transition-all hover:shadow-primary/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        View Featured Shops
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {(searchResults || shops).map((shop, index) => (
                        <div key={shop.id} className="group animate-[fadeInUp_0.6s_ease-out_forwards] opacity-0" style={{ animationDelay: `${index * 0.1}s` }}>
                          <Link href={`/shop/${shop.id}`}>
                            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 shadow-xl hover:shadow-black/40 hover:border-gray-700 transition-all duration-300 h-full flex flex-col">
                              {/* Image Gallery with better layout */}
                              <div className="relative aspect-[16/9] overflow-hidden">
                                <div className="flex h-full">
                                  {/* Main image */}
                                  <div className="w-2/3 h-full relative border-r border-white/5">
                                    {shop.images && shop.images[0] && (
                                      <Image
                                        src={shop.images[0]}
                                        fill
                                        alt={`${shop.name} vehicle`}
                                        className="object-cover transition-transform duration-700"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      />
                                    )}
                                  </div>
                                  {/* Side thumbnails */}
                                  <div className="w-1/3 h-full flex flex-col">
                                    {shop.images && shop.images.slice(1, 3).map((image, i) => (
                                      <div key={i} className="h-1/2 relative border-b last:border-b-0 border-white/5">
                                        <Image
                                          src={image}
                                          fill
                                          alt={`${shop.name} vehicle ${i+1}`}
                                          className="object-cover transition-transform duration-700"
                                          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 16vw, 11vw"
                                        />
                                      </div>
                                    ))}
                                    {/* If not enough images, show placeholder */}
                                    {(!shop.images || shop.images.length < 3) && Array.from({ length: 3 - (shop.images?.length || 0) }).map((_, i) => (
                                      <div key={i + (shop.images?.length || 0)} className="h-1/2 relative bg-gray-800/50 border-b last:border-b-0 border-white/5 flex items-center justify-center">
                                        <span className="text-xs text-gray-500">No image</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Price badge - simpler hover */}
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-white font-medium shadow-lg text-sm">
                                  From ₱{shop.startingPrice}/day
                                </div>
                              </div>

                              {/* Content Area - removed hover effects */}
                              <div className="p-4 sm:p-5 flex flex-col flex-grow">
                                <h3 className="text-lg sm:text-xl font-medium text-white mb-2 truncate">
                                  {shop.name}
                                </h3>

                                {/* Rating */}
                                <div className="flex items-center mt-auto pt-3">
                                  <div className="flex items-center">
                                    {shop.reviewCount > 0 ? (
                                      <>
                                        <div className="flex">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <svg
                                              key={star}
                                              className={`w-4 h-4 ${star <= Math.round(shop.rating) ? 'text-yellow-400' : 'text-gray-600'}`}
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                          ))}
                                        </div>
                                        <span className="ml-2 text-sm text-gray-400">
                                          {shop.rating.toFixed(1)}
                                          <span className="ml-1 text-gray-500">
                                            ({shop.reviewCount} {shop.reviewCount === 1 ? 'review' : 'reviews'})
                                          </span>
                                        </span>
                                      </>
                                    ) : (
                                      <div className="flex items-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800/50">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                          </svg>
                                          New Shop
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* View button - simplified */}
                                  <div className="ml-auto">
                                    <span className="inline-flex items-center text-xs text-blue-400">
                                      View shop
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3.5 w-3.5 ml-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* View All Button - simplified design - only show when not showing search results */}
          {!vehicleSearchResults && !searchResults && !loading && shops.length > 0 && (
            <div className="text-center mt-12 sm:mt-14">
              <Link
                href="/browse"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg shadow-lg border border-gray-700 transition-colors duration-300 inline-flex items-center justify-center"
              >
                View all rental shops
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Siargao Rides Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Why Rent with Siargao Rides?
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
              The most trusted vehicle rental platform in Siargao Island
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Local Expertise */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-primary/5">
              <div className="text-primary/80 mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Local Siargao Knowledge</h3>
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                Partner with verified local rental shops who know Siargao's roads, conditions, and best spots to explore.
              </p>
            </div>

            {/* Best Prices */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-primary/5">
              <div className="text-primary/80 mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Competitive Rates</h3>
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                Compare prices from multiple Siargao rental shops to find the best deals on motorbikes, cars, and scooters.
              </p>
            </div>

            {/* Easy Booking */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-primary/5 md:col-span-2 lg:col-span-1">
              <div className="text-primary/80 mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <path d="M22 4 12 14.01l-3-3"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Flexible Pickup</h3>
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                Book online and arrange convenient pickup anywhere in General Luna, Cloud 9, or other Siargao locations.
              </p>
            </div>
          </div>

          {/* Popular Destinations */}
          <div className="mt-12 sm:mt-16 text-center">
            <h3 className="text-lg sm:text-xl font-medium mb-4 text-white">
              Popular Siargao Destinations to Explore
            </h3>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {[
                'Cloud 9 Surfing',
                'Magpupungko Rock Pools',
                'Sugba Lagoon',
                'Naked Island',
                'Daku Island',
                'Guyam Island',
                'Sohoton Cove',
                'General Luna'
              ].map((destination) => (
                <span 
                  key={destination}
                  className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs sm:text-sm font-medium"
                >
                  {destination}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safety Tips Section */}
      <section className="py-10 sm:py-16 md:py-20 bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Section Header with animation */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Ride Safe, Ride Smart
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
              Essential safety tips for exploring Siargao Island on two wheels
            </p>
          </div>

          {/* Tips Grid - Improved mobile spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 lg:gap-8">
            {/* Tip 1 - Improved mobile sizing */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-primary/5 group opacity-0 animate-[fadeInUp_0.5s_ease-out_0.1s_forwards]">
              <div className="text-primary/80 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 sm:w-10 sm:h-10">
                  <path d="M12 2a8 8 0 0 0 0 16 8 8 0 0 0 0-16z"></path>
                  <path d="M12 8v4l2 2"></path>
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-center">Helmet Always</h3>
              <p className="text-gray-400 text-xs sm:text-sm text-center leading-relaxed">
                Always wear a helmet, even for short trips. Most rental shops provide one, or you can bring your own.
              </p>
            </div>

            {/* Tip 2 - Improved mobile sizing */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-primary/5 group opacity-0 animate-[fadeInUp_0.5s_ease-out_0.2s_forwards]">
              <div className="text-primary/80 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 sm:w-10 sm:h-10">
                  <path d="M2 12h2"></path>
                  <path d="M20 12h2"></path>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="M6.34 6.34 4.93 4.93"></path>
                  <path d="M19.07 4.93l-1.41 1.41"></path>
                  <path d="M17.66 17.66 19.07 19.07"></path>
                  <path d="M4.93 19.07l1.41-1.41"></path>
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-center">Local Traffic Rules</h3>
              <p className="text-gray-400 text-xs sm:text-sm text-center leading-relaxed">
                Always look left and right at intersections. Ride defensively as if others can't see you. Double beep your horn when overtaking other vehicles.
              </p>
            </div>

            {/* Tip 3 - Improved mobile sizing */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-primary/5 group opacity-0 animate-[fadeInUp_0.5s_ease-out_0.3s_forwards]">
              <div className="text-primary/80 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 sm:w-10 sm:h-10">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <path d="M22 4 12 14.01l-3-3"></path>
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-center">Inspect Your Bike</h3>
              <p className="text-gray-400 text-xs sm:text-sm text-center leading-relaxed">
                Check brakes, lights, and tires before riding. Ask the rental shop to demonstrate any features you're unsure about.
              </p>
            </div>

            {/* Tip 4 - Improved mobile sizing */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-primary/5 group opacity-0 animate-[fadeInUp_0.5s_ease-out_0.4s_forwards]">
              <div className="text-primary/80 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 sm:w-10 sm:h-10">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2 text-center">Weather Aware</h3>
              <p className="text-gray-400 text-xs sm:text-sm text-center leading-relaxed">
                Siargao roads can become slippery during rain. Plan your trips according to weather forecasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

    </div>
  )
}
