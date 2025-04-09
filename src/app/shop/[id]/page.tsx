"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Star, MapPin, Phone, Mail, MessageCircle, Bike, Car, Truck, AlertTriangle, Edit } from "lucide-react"
import VehicleCard from "@/components/VehicleCard"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import * as service from "@/lib/service"
import { Vehicle, VehicleType, Review, ReviewWithDetails } from "@/lib/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { VehicleAvailabilityCalendar } from "@/components/VehicleAvailabilityCalendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog"
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

      {/* Shop Info with better positioning and card styling */}
      <div className="container mx-auto px-4 -mt-32 md:-mt-36 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Profile Image with improved styling */}
          <motion.div
            className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-black shadow-xl bg-gradient-to-br from-gray-900 to-black relative group"
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
          >
            <Image
              src={shop.logo_url || 'https://placehold.co/400x400/1e3b8a/white?text=Logo'}
              alt={shop.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
          </motion.div>

          {/* Shop Details with better typography */}
          <motion.div
            className="flex-1 backdrop-blur-md bg-white/5 rounded-2xl p-5 md:p-7 border border-white/10 shadow-lg"
            variants={slideUpFadeIn}
          >
            <div className="flex justify-between items-start flex-wrap gap-3">
              <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">{shop.name}</h1>

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
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex items-center bg-amber-400/10 px-3 py-1.5 rounded-full">
                <Star
                  size={16}
                  className="text-amber-400 fill-amber-400"
                />
                <span className="ml-1.5 font-medium">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-white/70">({reviews.length} reviews)</span>
              {shop.is_verified &&
                <Badge variant="verified" className="ml-2 bg-emerald-700/60 text-emerald-100 border border-emerald-500/30 px-2.5 py-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Verified Shop
                </Badge>
              }
            </div>
            <p className="text-white/80 mt-5 max-w-2xl text-sm md:text-base leading-relaxed">{shop.description || "No description available."}</p>

            {/* Vehicle type badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              {hasMotorcycles && (
                <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/30 px-3 py-1.5 transition-colors">
                  <Bike size={14} className="mr-1.5" /> Motorcycles
                </Badge>
              )}
              {hasCars && (
                <Badge className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30 px-3 py-1.5 transition-colors">
                  <Car size={14} className="mr-1.5" /> Cars
                </Badge>
              )}
              {hasTuktuks && (
                <Badge className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30 px-3 py-1.5 transition-colors">
                  <Truck size={14} className="mr-1.5" /> Tuktuks
                </Badge>
              )}
            </div>

            {/* Delivery information with improved styling */}
            {shop.offers_delivery && (
              <div className="bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-xl p-4 mt-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-primary bg-primary/20 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="8 12 12 16 16 12"></polyline>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-primary font-medium text-sm">Delivery Available</h3>
                    <p className="text-white/90 text-xs mt-0.5">
                      This shop offers delivery to your accommodation for ₱{shop.delivery_fee}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Contact Info Card with improved styling */}
          <motion.div
            className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg w-full md:w-auto md:min-w-80 mt-4 md:mt-0"
            variants={slideUpFadeIn}
          >
            <h3 className="font-semibold mb-5 text-lg text-white/90">Contact Information</h3>
            <div className="space-y-5">
              <motion.div
                className="flex items-start gap-3 group"
                whileHover={{ x: 3, transition: { duration: 0.2 } }}
              >
                <div className="bg-primary/10 p-2 rounded-full">
                  <MapPin size={18} className="text-primary" />
                </div>
                <span className="text-sm text-white/80 group-hover:text-white transition-colors pt-1.5">
                  {shop.address}, <br/>{shop.city}
                </span>
              </motion.div>

              {shop.phone_number && (
                <motion.div
                  className="flex items-center gap-3 group"
                  whileHover={{ x: 3, transition: { duration: 0.2 } }}
                >
                  <div className="bg-blue-500/10 p-2 rounded-full">
                    <Phone size={18} className="text-blue-400" />
                  </div>
                  <a href={`tel:${shop.phone_number}`} className="text-sm text-white/80 hover:text-white transition-colors pt-1.5">
                    {shop.phone_number}
                  </a>
                </motion.div>
              )}

              {shop.email && (
                <motion.div
                  className="flex items-center gap-3 group"
                  whileHover={{ x: 3, transition: { duration: 0.2 } }}
                >
                  <div className="bg-amber-500/10 p-2 rounded-full">
                    <Mail size={18} className="text-amber-400" />
                  </div>
                  <a href={`mailto:${shop.email}`} className="text-sm text-white/80 hover:text-white transition-colors pt-1.5">
                    {shop.email}
                  </a>
                </motion.div>
              )}

              {/* Facebook link */}
              {shop.facebook_url && (
                <motion.div
                  className="flex items-center gap-3 group"
                  whileHover={{ x: 3, transition: { duration: 0.2 } }}
                >
                  <div className="bg-blue-600/10 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-400"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </div>
                  <a
                    href={shop.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors pt-1.5"
                  >
                    Facebook Page
                  </a>
                </motion.div>
              )}

              {/* Instagram link */}
              {shop.instagram_url && (
                <motion.div
                  className="flex items-center gap-3 group"
                  whileHover={{ x: 3, transition: { duration: 0.2 } }}
                >
                  <div className="bg-pink-600/10 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-pink-400"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <a
                    href={shop.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-pink-400 hover:text-pink-300 transition-colors pt-1.5"
                  >
                    Instagram Profile
                  </a>
                </motion.div>
              )}

              {/* SMS Number */}
              {shop.sms_number && (
                <motion.div
                  className="flex items-center gap-3 group"
                  whileHover={{ x: 3, transition: { duration: 0.2 } }}
                >
                  <div className="bg-green-600/10 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-400"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <a
                    href={`sms:${shop.sms_number}`}
                    className="text-sm text-green-400 hover:text-green-300 transition-colors pt-1.5"
                  >
                    Send SMS
                  </a>
                </motion.div>
              )}

              {shop.whatsapp && (
                <Button
                  className="w-full mt-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-none shadow-md"
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

      {/* Notice about ID requirements with improved glass morphism */}
      <motion.div
        className="container mx-auto px-4 mt-10 mb-4 relative z-10"
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <div className="backdrop-blur-md bg-gradient-to-r from-yellow-900/20 to-yellow-900/10 border border-yellow-500/20 rounded-xl p-5 shadow-md">
          <div className="flex items-start gap-4">
            <div className="text-yellow-400 bg-yellow-500/10 p-3 rounded-full shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <h3 className="text-yellow-400 font-medium text-base md:text-lg">Important Rental Information</h3>
              <p className="text-white/90 text-xs md:text-sm mt-2 leading-relaxed">
                {shop.requires_id_deposit && shop.requires_cash_deposit ? (
                  <>
                    This shop requires a valid ID and a cash deposit of <span className="font-medium text-yellow-300">₱{shop.cash_deposit_amount}</span> when renting vehicles.
                    Both will be safely returned to you when you bring back the vehicle in good condition.
                  </>
                ) : shop.requires_id_deposit ? (
                  <>
                    This shop requires a <span className="font-medium text-yellow-300">valid ID</span> as a deposit when renting vehicles.
                    Your ID will be safely returned to you when you bring back the vehicle in good condition.
                  </>
                ) : shop.requires_cash_deposit ? (
                  <>
                    This shop requires a cash deposit of <span className="font-medium text-yellow-300">₱{shop.cash_deposit_amount}</span> when renting vehicles.
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

      {/* Vehicle Type Tabs with improved styling */}
      {vehicles.length > 0 && (
        <motion.div
          className="container mx-auto px-4 mt-10 relative z-10"
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl flex flex-wrap justify-center sm:justify-start gap-2 border border-white/10 shadow-md w-full overflow-hidden">
            <Button
              variant={selectedVehicleType === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedVehicleType('all')}
              className={`rounded-full px-3 text-sm ${selectedVehicleType === 'all' ? 'bg-white/10 text-white shadow-sm' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
            >
              All Vehicles
            </Button>

            {hasMotorcycles && (
              <Button
                variant={selectedVehicleType === 'motorcycle' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedVehicleType('motorcycle')}
                className={`rounded-full px-3 text-sm ${selectedVehicleType === 'motorcycle' ? 'bg-primary/20 text-primary shadow-sm' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                <Bike size={14} className="mr-1.5" /> Motorcycles
              </Button>
            )}

            {hasCars && (
              <Button
                variant={selectedVehicleType === 'car' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedVehicleType('car')}
                className={`rounded-full px-3 text-sm ${selectedVehicleType === 'car' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                <Car size={14} className="mr-1.5" /> Cars
              </Button>
            )}

            {hasTuktuks && (
              <Button
                variant={selectedVehicleType === 'tuktuk' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedVehicleType('tuktuk')}
                className={`rounded-full px-3 text-sm ${selectedVehicleType === 'tuktuk' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                <Truck size={14} className="mr-1.5" /> Tuktuks
              </Button>
            )}
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