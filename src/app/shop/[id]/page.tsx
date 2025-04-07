"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Star, MapPin, Phone, Mail, MessageCircle, Bike, Car, Truck, AlertTriangle, Edit } from "lucide-react"
import VehicleCard from "@/components/VehicleCard"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import * as service from "@/lib/service"
import { Vehicle, VehicleType, RentalShop, Review } from "@/lib/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { VehicleAvailabilityCalendar } from "@/components/VehicleAvailabilityCalendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog"
import { motion } from 'framer-motion';
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

// --- Animation Variants ---
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const bannerVariants = {
  hidden: { opacity: 0, scale: 1.02 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

const slideUpFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Time delay between child animations
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};
// --- End Animation Variants ---

// Create a new component for the availability section
const VehicleAvailabilitySection = ({ vehicleId, vehicleName, vehicleType }: { vehicleId: string, vehicleName: string, vehicleType: VehicleType }) => {
  const getVehicleIcon = () => {
    switch(vehicleType) {
      case 'car':
        return <Car size={16} className="mr-1 text-blue-400" />;
      case 'tuktuk':
        return <Truck size={16} className="mr-1 text-amber-400" />;
      case 'motorcycle':
      default:
        return <Bike size={16} className="mr-1 text-primary" />;
    }
  };

  return (
    <div className="mt-8 p-6 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        {getVehicleIcon()}
        <span className="ml-2">{vehicleName} Availability</span>
      </h3>
      <p className="text-sm text-white/70 mb-4">
        Check which dates this vehicle is available for rent. Red dates are already booked.
      </p>
      <VehicleAvailabilityCalendar vehicleId={vehicleId} />
    </div>
  );
};

export default function ShopPage() {
  const { id } = useParams()
  const router = useRouter()
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [shop, setShop] = useState<RentalShop | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | 'all'>('all')
  const { user } = useAuth()
  
  // Check if current user is the shop owner
  const isShopOwner = user && shop && user.id === shop.owner_id
  
  // Group vehicles by type
  const motorcycles = vehicles.filter(v => v.vehicle_type === 'motorcycle')
  const cars = vehicles.filter(v => v.vehicle_type === 'car')
  const tuktuks = vehicles.filter(v => v.vehicle_type === 'tuktuk')
  
  // Check if shop has each type of vehicle
  const hasMotorcycles = motorcycles.length > 0
  const hasCars = cars.length > 0
  const hasTuktuks = tuktuks.length > 0
  
  useEffect(() => {
    async function fetchShopData() {
      if (!id || typeof id !== 'string') {
        setError('Invalid shop ID')
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const supabase = createClientComponentClient()
        
        // Get shop data
        const { data: shopData, error: shopError } = await supabase
          .from('rental_shops')
          .select('*')
          .eq('id', id)
          .single();
          
        if (shopError || !shopData) {
          console.error('Error fetching shop:', shopError);
          setError('Shop not found')
          setLoading(false)
          return
        }
        
        // Check if shop is active
        if (!shopData.is_active) {
          console.log('Shop is inactive:', shopData);
          setError('This shop is currently inactive. Please check back later.')
          setShop(shopData) // Set shop data anyway so we can show the name
          setLoading(false)
          return
        }
        
        setShop(shopData)
        
        // For backwards compatibility: Try to get vehicles first, fall back to bikes if needed
        try {
          // Get vehicles for this shop 
          const { data: vehiclesData, error: vehiclesError } = await supabase
            .from('vehicles')
            .select(`
              *,
              vehicle_images(*),
              vehicle_types(*)
            `)
            .eq('shop_id', id)
            .eq('is_available', true)
            .eq('is_verified', true)
            .eq('verification_status', 'approved');
            
          if (vehiclesError) {
            throw vehiclesError;
          }
          
          // Transform data to match our Vehicle type
          const formattedVehicles = vehiclesData.map(vehicle => ({
            ...vehicle,
            vehicle_type: vehicle.vehicle_types?.name || 'motorcycle',
            images: vehicle.vehicle_images || []
          }));
          
          setVehicles(formattedVehicles)
        } catch (vehicleError) {
          console.log('Error fetching vehicles, falling back to bikes:', vehicleError);
          
          // Fallback to bikes for backward compatibility
          const { data: bikesData, error: bikesError } = await supabase
            .from('bikes')
            .select(`
              *,
              bike_images(*)
            `)
            .eq('shop_id', id)
            .eq('is_available', true);
            
          if (bikesError) {
            console.error('Error fetching bikes:', bikesError);
            setError('Failed to load vehicles')
            setLoading(false)
            return
          }
          
          // Transform bike data to vehicle format for compatibility
          const formattedBikes = bikesData.map(bike => ({
            ...bike,
            vehicle_type: 'motorcycle' as VehicleType,
            vehicle_type_id: '1', // Assume motorcycles have ID 1
            images: bike.bike_images || []
          }));
          
          setVehicles(formattedBikes)
        }
        
        // Get reviews for this shop
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('shop_id', id);
          
        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        } else {
          setReviews(reviewsData || [])
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching shop data:', err)
        setError('Failed to load shop data')
        setLoading(false)
      }
    }
    
    fetchShopData()
  }, [id])
  
  const handleBookClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    // Navigate to the booking page with vehicle ID and shop ID
    router.push(`/booking/${vehicleId}?shop=${id}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Loading Shop Details</h1>
        <p className="text-muted-foreground">
          Please wait while we fetch the shop information...
        </p>
      </div>
    )
  }
  
  // Error state
  if (error || !shop) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">
          {shop ? shop.name : "Shop Not Found"}
        </h1>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 max-w-lg mx-auto border border-white/10">
          <div className="text-amber-400 mb-4">
            <AlertTriangle size={48} className="mx-auto" />
          </div>
          <p className="text-white mb-4">
            {error || "The shop you're looking for doesn't exist or has been removed."}
          </p>
          {error && error.includes('inactive') && (
            <div className="mt-2 mb-6 text-sm text-gray-400">
              <p>This shop may have an expired subscription or may be temporarily unavailable.</p>
            </div>
          )}
          <Button asChild className="mt-4">
            <Link href="/browse">
              Browse Available Vehicles
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  
  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-900 text-white relative"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background with enhanced overlay gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-purple-900/25 to-blue-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-blue-900/5 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      </div>
      
      {/* Banner with enhanced height and overlay */}
      <motion.div
        className="relative h-60 md:h-80 w-full z-10"
        variants={bannerVariants}
      >
        <Image
          src={shop.banner_url || 'https://placehold.co/1200x400/1e3b8a/white?text=Shop+Banner'}
          alt={`${shop.name} banner`}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
      </motion.div>
      
      {/* Shop Info with better positioning and card styling */}
      <div className="container mx-auto px-4 -mt-24 md:-mt-28 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Profile Image with improved styling */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-black/40 shadow-lg relative bg-black/60 backdrop-blur-sm">
            <Image
              src={shop.logo_url || 'https://placehold.co/400x400/1e3b8a/white?text=Logo'}
              alt={shop.name}
              fill
              className="object-cover"
            />
          </div>
          
          {/* Shop Details with better typography */}
          <motion.div
            className="flex-1 bg-black/60 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/10"
            variants={slideUpFadeIn}
          >
            <div className="flex justify-between items-start">
              <h1 className="text-2xl md:text-4xl font-bold">{shop.name}</h1>
              
              {/* Add Edit Shop button for shop owners */}
              {isShopOwner && (
                <Button 
                  asChild
                  variant="outline" 
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Link href="/dashboard/shop">
                    <Edit size={16} className="mr-2" />
                    Edit Shop
                  </Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center bg-yellow-900/20 px-2 py-1 rounded-md">
                <Star size={18} className="text-tropical-yellow fill-tropical-yellow" />
                <span className="ml-1 font-medium">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-white/70">({reviews.length} reviews)</span>
              {shop.is_verified && 
                <Badge variant="verified" className="ml-2 animate-pulse">
                  Verified Shop
                </Badge>
              }
            </div>
            <p className="text-white/70 mt-4 max-w-2xl">{shop.description || "No description available."}</p>
            
            {/* Vehicle type badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {hasMotorcycles && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Bike size={14} className="mr-1" /> Motorcycles
                </Badge>
              )}
              {hasCars && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <Car size={14} className="mr-1" /> Cars
                </Badge>
              )}
              {hasTuktuks && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <Truck size={14} className="mr-1" /> Tuktuks
                </Badge>
              )}
            </div>

            {/* In the shop details section, add delivery information */}
            {shop.offers_delivery && (
              <div className="bg-primary/20 border border-primary/30 rounded-lg p-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="8 12 12 16 16 12"></polyline>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-primary font-medium text-sm">Delivery Available</h3>
                    <p className="text-white/90 text-xs">
                      This shop offers delivery to your accommodation for ₱{shop.delivery_fee}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Contact Info Card with improved styling */}
          <motion.div
            className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-5 shadow-sm w-full md:w-auto md:min-w-72 mt-4 md:mt-0"
            variants={slideUpFadeIn}
          >
            <h3 className="font-semibold mb-4 text-lg pb-2 border-b border-white/10">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 group">
                <MapPin size={20} className="text-primary mt-0.5 shrink-0" />
                <span className="text-sm group-hover:text-primary transition-colors">
                  {shop.address}, <br/>{shop.city}
                </span>
              </div>
              {shop.phone_number && (
                <div className="flex items-center gap-3 group">
                  <Phone size={20} className="text-primary shrink-0" />
                  <a href={`tel:${shop.phone_number}`} className="text-sm hover:text-primary transition-colors">
                    {shop.phone_number}
                  </a>
                </div>
              )}
              {shop.email && (
                <div className="flex items-center gap-3 group">
                  <Mail size={20} className="text-primary shrink-0" />
                  <a href={`mailto:${shop.email}`} className="text-sm hover:text-primary transition-colors">
                    {shop.email}
                  </a>
                </div>
              )}
              {shop.whatsapp && (
                <Button 
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white border-green-700" 
                  onClick={() => window.open(`https://wa.me/${shop.whatsapp?.replace(/\+/g, '').replace(/\s/g, '')}`, '_blank')}
                >
                  <MessageCircle size={18} className="mr-2" />
                  Contact via WhatsApp
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Notice about ID requirements - moved here for better visibility */}
      <motion.div 
        className="container mx-auto px-4 mt-8 mb-2 relative z-10"
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-yellow-900/40 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="text-yellow-400 mt-0.5 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <h3 className="text-yellow-400 font-medium text-sm md:text-base">Important Rental Information</h3>
              <p className="text-white/90 text-xs md:text-sm mt-1">
                {shop.requires_id_deposit && shop.requires_cash_deposit ? (
                  <>
                    This shop requires a valid ID and a cash deposit of ₱{shop.cash_deposit_amount} when renting vehicles. 
                    Both will be safely returned to you when you bring back the vehicle in good condition.
                  </>
                ) : shop.requires_id_deposit ? (
                  <>
                    This shop requires a valid ID as a deposit when renting vehicles. 
                    Your ID will be safely returned to you when you bring back the vehicle in good condition.
                  </>
                ) : shop.requires_cash_deposit ? (
                  <>
                    This shop requires a cash deposit of ₱{shop.cash_deposit_amount} when renting vehicles. 
                    The deposit will be fully refunded when you bring back the vehicle in good condition.
                  </>
                ) : (
                  <>
                    Most rental shops in Siargao will request some form of deposit. Please check with this shop 
                    directly about their specific requirements.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Vehicle Type Tabs */}
      {vehicles.length > 0 && (
        <motion.div 
          className="container mx-auto px-4 mt-8 relative z-10"
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedVehicleType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedVehicleType('all')}
              className="rounded-full"
            >
              All Vehicles
            </Button>
            
            {hasMotorcycles && (
              <Button 
                variant={selectedVehicleType === 'motorcycle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedVehicleType('motorcycle')}
                className="rounded-full"
              >
                <Bike size={14} className="mr-1" /> Motorcycles
              </Button>
            )}
            
            {hasCars && (
              <Button 
                variant={selectedVehicleType === 'car' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedVehicleType('car')}
                className="rounded-full"
              >
                <Car size={14} className="mr-1" /> Cars
              </Button>
            )}
            
            {hasTuktuks && (
              <Button 
                variant={selectedVehicleType === 'tuktuk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedVehicleType('tuktuk')}
                className="rounded-full"
              >
                <Truck size={14} className="mr-1" /> Tuktuks
              </Button>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Vehicle Listings with improved styling */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.h2 
          className="text-2xl font-semibold mb-6 flex items-center after:content-[''] after:ml-4 after:flex-1 after:border-t after:border-white/10"
          variants={fadeIn} 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          {selectedVehicleType === 'all' ? 'Available Vehicles' : 
           selectedVehicleType === 'motorcycle' ? 'Available Motorcycles' :
           selectedVehicleType === 'car' ? 'Available Cars' : 'Available Tuktuks'}
        </motion.h2>
        
        {vehicles.length === 0 ? (
          <motion.div 
            className="text-center py-12 bg-black/40 backdrop-blur-sm rounded-lg border border-dashed border-white/10"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-white/50">No vehicles available from this shop at the moment.</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.5 }} 
          >
            {vehicles
              .filter(v => selectedVehicleType === 'all' || v.vehicle_type === selectedVehicleType)
              .map(vehicle => (
                <motion.div key={vehicle.id} variants={itemVariants}>
                  <VehicleCard
                    id={vehicle.id}
                    model={vehicle.name}
                    vehicleType={vehicle.vehicle_type}
                    category={vehicle.category}
                    images={vehicle.images?.map(img => img.image_url) || []}
                    prices={{
                      daily: vehicle.price_per_day,
                      weekly: vehicle.price_per_week,
                      monthly: vehicle.price_per_month
                    }}
                    specifications={vehicle.specifications}
                    isAvailable={vehicle.is_available}
                    onBookClick={handleBookClick}
                  />
                </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Conditionally render the availability section when a vehicle is selected */}
      {selectedVehicleId && vehicles.length > 0 && (
        <div className="container mx-auto px-4 pb-12 relative z-10">
          {vehicles
            .filter(v => v.id === selectedVehicleId)
            .map(vehicle => (
              <VehicleAvailabilitySection 
                key={vehicle.id}
                vehicleId={vehicle.id} 
                vehicleName={vehicle.name}
                vehicleType={vehicle.vehicle_type}
              />
            ))}
        </div>
      )}
      
      {/* Reviews with enhanced design */}
      <div className="py-16 bg-gradient-to-b from-transparent to-black/70 border-t border-white/10 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            className="flex flex-col items-center mb-10"
            variants={slideUpFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-2">Customer Reviews</h2>
            <div className="w-20 h-1 bg-primary rounded-full mb-4"></div>
            <p className="text-white/70 text-center max-w-md">
              See what our customers have to say about their experience with {shop.name}
            </p>
          </motion.div>
          
          {reviews.length === 0 ? (
            <motion.div
              className="max-w-2xl mx-auto bg-black/60 backdrop-blur-sm rounded-xl border border-dashed border-primary/30 overflow-hidden shadow-sm"
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Star size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
                <p className="text-white/70 text-center mb-6">
                  Be the first to share your experience with this shop!
                </p>
                <Button 
                  variant="outline"
                  className="border-primary/30 hover:bg-primary/5 text-primary hover:text-primary"
                >
                  Write a Review
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              {reviews.map(review => (
                <motion.div
                  key={review.id}
                  className="bg-black/60 backdrop-blur-sm border border-white/10 hover:border-primary/20 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                  variants={itemVariants}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {review.user_id.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">Customer</div>
                        <div className="text-xs text-white/50">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center bg-yellow-900/20 px-2 py-1.5 rounded-lg">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={16} 
                          className={i < review.rating ? "text-tropical-yellow fill-tropical-yellow" : "text-white/30"} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-black/40 p-4 rounded-lg mb-4 relative">
                    <div className="absolute -top-2 left-4 w-4 h-4 bg-black/40 rotate-45"></div>
                    <p className="text-sm leading-relaxed">{review.comment || "No comment provided."}</p>
                  </div>
                  
                  {/* Reply from shop owner */}
                  {review.reply && (
                    <div className="flex gap-3 mt-5 bg-primary/5 p-4 rounded-lg border-l-3 border-primary">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <MessageCircle size={14} className="text-primary" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-primary flex items-center gap-2">
                          Shop Response
                          <span className="text-xs text-white/50 font-normal">Official reply</span>
                        </div>
                        <p className="mt-1 text-sm">{review.reply}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {reviews.length > 0 && (
            <motion.div
              className="flex justify-center mt-10"
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <Button className="bg-primary text-white" size="sm">
                Write a Review
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
} 