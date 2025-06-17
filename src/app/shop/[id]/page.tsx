"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Star, MapPin, Phone, Mail, MessageCircle, Bike, Car, Truck, AlertTriangle, Edit } from "lucide-react"
import VehicleCard from "@/components/VehicleCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import * as service from "@/lib/service"
import { Vehicle, VehicleType, Review, ReviewWithDetails } from "@/lib/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { VehicleAvailabilityCalendar } from "@/components/VehicleAvailabilityCalendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { motion } from 'framer-motion';
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { ReviewDialog } from "@/components/ReviewDialog"
import { ReviewItem } from "@/components/ReviewItem"

// --- Animation Variants ---
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const bannerVariants = {
  hidden: { opacity: 0, scale: 1.02 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut" } }
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

const hoverScale = {
  initial: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } }
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

// Update the RentalShop type to include new fields
interface RentalShop {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone_number: string | null;
  whatsapp: string | null;
  email: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
  owner_id: string;
  location_area: string | null;
  offers_delivery: boolean;
  delivery_fee: number;
  is_active?: boolean;
  requires_id_deposit?: boolean;
  requires_cash_deposit?: boolean;
  cash_deposit_amount?: number;
  facebook_url?: string | null;
  instagram_url?: string | null;
  sms_number?: string | null;
  is_showcase?: boolean;
}

export default function ShopPage() {
  const { id } = useParams()
  const router = useRouter()
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [shop, setShop] = useState<RentalShop | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | 'all'>('all')
  const { user } = useAuth()

  // Add these new state variables for review functionality
  const [userCanReview, setUserCanReview] = useState(false)
  const [userReview, setUserReview] = useState<ReviewWithDetails | null>(null)

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

  // Add this function to check if user can review
  const checkUserCanReview = async () => {
    if (!user) return

    try {
      const supabase = createClientComponentClient()

      // Check if user has any completed rentals with this shop
      const { data: rentalData, error: rentalError } = await supabase
        .from('rentals')
        .select('id')
        .eq('shop_id', id)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .limit(1)

      if (rentalError) throw rentalError

      // Check if user already has a review for this shop
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(*)
        `)
        .eq('shop_id', id)
        .eq('user_id', user.id)
        .limit(1)

      if (reviewError) throw reviewError

      // User can review if they have completed rentals
      setUserCanReview(rentalData ? rentalData.length > 0 : false)

      // If user already has a review, store it
      if (reviewData && reviewData.length > 0) {
        setUserReview(reviewData[0])
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error)
    }
  }

  // Add this function to refresh reviews
  const refreshReviews = async () => {
    try {
      const supabase = createClientComponentClient()

      // Get reviews for this shop with user details
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(*)
        `)
        .eq('shop_id', id);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      } else {
        setReviews(reviewsData || [])
      }

      // Refresh user's review status
      checkUserCanReview()
    } catch (error) {
      console.error('Error refreshing reviews:', error)
    }
  }

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

        // Get reviews for this shop with user details
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            user:users(*)
          `)
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

    // Check if user can review when shop data is loaded
    if (user) {
      checkUserCanReview()
    }
  }, [id, user])

  const handleBookClick = (vehicleId: string) => {
    if (!shop) return; // Prevents null access

    // Check if this is a showcase shop
    if (shop.is_showcase) {
      // Don't navigate to booking page for showcase shops
      // Instead, show an alert or toast message
      alert('This is a showcase shop for demonstration purposes only. Bookings are not available.')
      return
    }

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
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-950 text-white relative">
        {/* Background with enhanced overlay gradient */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-purple-900/15 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-blue-900/5 to-transparent"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
        </div>

        <div className="container mx-auto px-4 pt-32 pb-12 text-center relative z-10">
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
      </div>
    )
  }

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  // Sort reviews before rendering them
  const sortedReviews = [...reviews].sort((a, b) => {
    // First prioritize reviews with responses
    if (a.reply && !b.reply) return -1;
    if (!a.reply && b.reply) return 1;

    // Then sort by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Add these type guard helper functions
  const canUserReview = (): boolean => {
    return !!userCanReview;
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-950 text-white relative"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background with enhanced overlay gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-purple-900/15 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-blue-900/5 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
      </div>

      {/* Banner with enhanced height and overlay */}
      <motion.div
        className="relative h-[35vh] md:h-[40vh] w-full z-10 overflow-hidden"
        variants={bannerVariants}
      >
        <Image
          src={shop.banner_url || 'https://placehold.co/1200x400/1e3b8a/white?text=Shop+Banner'}
          alt={`${shop.name} banner`}
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 backdrop-blur-[2px]"></div>
      </motion.div>

      {/* Simplified Shop Info */}
      <div className="container mx-auto px-4 -mt-24 md:-mt-28 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Clean Profile Image */}
          <motion.div
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-card relative group"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Image
              src={shop.logo_url || 'https://placehold.co/400x400/1e3b8a/white?text=Logo'}
              alt={shop.name}
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Cleaner Shop Details */}
          <motion.div
            className="flex-1 bg-card/30 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-border/30"
            variants={slideUpFadeIn}
          >
            <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{shop.name}</h1>

              {/* Edit Shop button for shop owners */}
              {isShopOwner && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
                >
                  <Link href="/dashboard/shop">
                    <Edit size={16} className="mr-2" />
                    Edit Shop
                  </Link>
                </Button>
              )}
            </div>

            {/* Rating and badges */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center bg-amber-400/15 px-4 py-2 rounded-lg">
                <Star size={16} className="text-amber-400 fill-amber-400 mr-2" />
                <span className="font-semibold text-white">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-white/70 ml-1">({reviews.length})</span>
              </div>
              
              {shop.is_verified && (
                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 px-3 py-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Verified
                </Badge>
              )}
              
              {shop.is_showcase && (
                <Badge variant="outline" className="bg-purple-500/15 text-purple-300 border-purple-500/30 px-3 py-1.5">
                  <AlertTriangle size={14} className="mr-1.5" />
                  Showcase
                </Badge>
              )}
            </div>

            {/* Description */}
            {shop.description && (
              <p className="text-white/80 text-base leading-relaxed mb-6">{shop.description}</p>
            )}

            {/* Vehicle types */}
            <div className="flex flex-wrap gap-3 mb-6">
              {hasMotorcycles && (
                <div className="flex items-center bg-primary/15 text-primary px-4 py-2 rounded-lg">
                  <Bike size={16} className="mr-2" />
                  <span className="font-medium">Motorcycles</span>
                </div>
              )}
              {hasCars && (
                <div className="flex items-center bg-blue-500/15 text-blue-400 px-4 py-2 rounded-lg">
                  <Car size={16} className="mr-2" />
                  <span className="font-medium">Cars</span>
                </div>
              )}
              {hasTuktuks && (
                <div className="flex items-center bg-amber-500/15 text-amber-400 px-4 py-2 rounded-lg">
                  <Truck size={16} className="mr-2" />
                  <span className="font-medium">Tuktuks</span>
                </div>
              )}
            </div>

            {/* Delivery info */}
            {shop.offers_delivery && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="text-primary bg-primary/20 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="8 12 12 16 16 12"></polyline>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-primary font-semibold">Delivery Available</h3>
                    <p className="text-white/80 text-sm">
                      We deliver to your accommodation for ₱{shop.delivery_fee}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Clean Contact Info */}
          <motion.div
            className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-2xl p-6 w-full md:w-80"
            variants={slideUpFadeIn}
          >
            <h3 className="font-semibold mb-6 text-xl text-white">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-primary mt-0.5" />
                <div className="text-sm text-white/80 leading-relaxed">
                  {shop.address}<br/>{shop.city}
                </div>
              </div>

              {shop.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-blue-400" />
                  <a href={`tel:${shop.phone_number}`} className="text-sm text-white/80 hover:text-white transition-colors">
                    {shop.phone_number}
                  </a>
                </div>
              )}

              {shop.email && (
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-amber-400" />
                  <a href={`mailto:${shop.email}`} className="text-sm text-white/80 hover:text-white transition-colors">
                    {shop.email}
                  </a>
                </div>
              )}

              {/* Social Links */}
              {(shop.facebook_url || shop.instagram_url) && (
                <div className="pt-2">
                  <div className="flex gap-3">
                    {shop.facebook_url && (
                      <a
                        href={shop.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 rounded-lg transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    )}
                    {shop.instagram_url && (
                      <a
                        href={shop.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 bg-pink-600/15 hover:bg-pink-600/25 text-pink-400 rounded-lg transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* WhatsApp CTA */}
              {shop.whatsapp && (
                <div className="pt-4">
                  <Button
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
                    onClick={() => window.open(`https://wa.me/${shop.whatsapp?.replace(/\+/g, '').replace(/\s/g, '')}`, '_blank')}
                  >
                    <MessageCircle size={18} className="mr-2" />
                    WhatsApp
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Simplified notice section */}
      <motion.div
        className="container mx-auto px-4 mt-12 mb-8 relative z-10"
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-yellow-400 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <h3 className="text-yellow-400 font-semibold text-lg mb-2">Rental Requirements</h3>
              <p className="text-white/80 leading-relaxed">
                {shop.requires_id_deposit && shop.requires_cash_deposit ? (
                  <>
                    Valid ID and cash deposit of <span className="font-semibold text-yellow-300">₱{shop.cash_deposit_amount}</span> required.
                    Both returned when vehicle is returned in good condition.
                  </>
                ) : shop.requires_id_deposit ? (
                  <>
                    <span className="font-semibold text-yellow-300">Valid ID</span> required as deposit.
                    Returned when vehicle is brought back in good condition.
                  </>
                ) : shop.requires_cash_deposit ? (
                  <>
                    Cash deposit of <span className="font-semibold text-yellow-300">₱{shop.cash_deposit_amount}</span> required.
                    Fully refunded when vehicle is returned in good condition.
                  </>
                ) : (
                  <>
                    Please check with the shop about their specific rental requirements.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Clean vehicle type tabs */}
      {vehicles.length > 0 && (
        <motion.div
          className="container mx-auto px-4 mb-8 relative z-10"
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <Button
              variant={selectedVehicleType === 'all' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedVehicleType('all')}
              className={`px-6 ${selectedVehicleType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card/50 border-border/50 text-foreground hover:bg-card'}`}
            >
              All Vehicles
            </Button>

            {hasMotorcycles && (
              <Button
                variant={selectedVehicleType === 'motorcycle' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedVehicleType('motorcycle')}
                className={`px-6 ${selectedVehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground' : 'bg-card/50 border-border/50 text-foreground hover:bg-card'}`}
              >
                <Bike size={16} className="mr-2" /> Motorcycles
              </Button>
            )}

            {hasCars && (
              <Button
                variant={selectedVehicleType === 'car' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedVehicleType('car')}
                className={`px-6 ${selectedVehicleType === 'car' ? 'bg-primary text-primary-foreground' : 'bg-card/50 border-border/50 text-foreground hover:bg-card'}`}
              >
                <Car size={16} className="mr-2" /> Cars
              </Button>
            )}

            {hasTuktuks && (
              <Button
                variant={selectedVehicleType === 'tuktuk' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedVehicleType('tuktuk')}
                className={`px-6 ${selectedVehicleType === 'tuktuk' ? 'bg-primary text-primary-foreground' : 'bg-card/50 border-border/50 text-foreground hover:bg-card'}`}
              >
                <Truck size={16} className="mr-2" /> Tuktuks
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Showcase shop warning banner */}
      {shop.is_showcase && (
        <motion.div
          className="container mx-auto px-4 mt-10 relative z-10"
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-4 bg-purple-900/30 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-lg">
            <div className="flex items-start gap-3">
              <div className="text-purple-300 mt-1">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-100 mb-1">Showcase Shop - No Bookings Available</h3>
                <p className="text-purple-200/80">
                  This is a showcase shop for demonstration purposes only. You cannot make real bookings from this shop.
                  Please browse other shops to make actual vehicle rentals.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Vehicle Listings with improved styling */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          className="flex items-center gap-3 mb-8"
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            {selectedVehicleType === 'all' ? 'Available Vehicles' :
            selectedVehicleType === 'motorcycle' ? 'Available Motorcycles' :
            selectedVehicleType === 'car' ? 'Available Cars' : 'Available Tuktuks'}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
        </motion.div>

        {vehicles.length === 0 ? (
          <motion.div
            className="text-center py-16 backdrop-blur-md bg-black/20 rounded-xl border border-dashed border-white/10"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <AlertTriangle size={24} className="text-yellow-400" />
            </div>
            <p className="text-white/70 font-medium">No vehicles available from this shop at the moment.</p>
            <p className="text-white/50 text-sm mt-2">Check back later or browse other shops.</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            {vehicles
              .filter(v => selectedVehicleType === 'all' || v.vehicle_type === selectedVehicleType)
              .map(vehicle => (
                <motion.div
                  key={vehicle.id}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="transform transition-all duration-300"
                >
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

      {/* Update the Reviews section with new components */}
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
                  <Star
                    size={18}
                    className="text-amber-400 fill-amber-400"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
                <p className="text-white/70 text-center mb-6">
                  Be the first to share your experience with this shop!
                </p>
                {user ? (
                  userCanReview ? (
                    <ReviewDialog
                      shopId={id as string}
                      onReviewSubmitted={refreshReviews}
                    />
                  ) : (
                    <p className="text-sm text-amber-400">
                      Complete a rental with this shop to leave a review
                    </p>
                  )
                ) : (
                  <Button asChild>
                    <Link href="/signin">Sign in to Review</Link>
                  </Button>
                )}
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
              {sortedReviews.map(review => (
                <motion.div key={review.id} variants={itemVariants}>
                  <ReviewItem
                    review={review}
                    isShopOwner={isShopOwner}
                    onResponseSubmitted={refreshReviews}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {reviews.length > 0 && user && (
            <motion.div
              className="flex justify-center mt-10"
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              {userReview ? (
                <ReviewDialog
                  shopId={id as string}
                  onReviewSubmitted={refreshReviews}
                  isUpdate={true}
                  existingReview={{
                    id: userReview.id,
                    rating: userReview.rating,
                    comment: userReview.comment || ""
                  }}
                />
              ) : userCanReview ? (
                <ReviewDialog
                  shopId={id as string}
                  onReviewSubmitted={refreshReviews}
                />
              ) : (
                <p className="text-sm bg-amber-900/30 px-4 py-2 rounded-full border border-amber-500/30 text-amber-400">
                  Complete a rental with this shop to leave a review
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}