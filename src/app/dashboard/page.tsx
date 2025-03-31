"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { 
  ShoppingBag, 
  Bike, 
  BarChart, 
  CalendarRange, 
  Heart, 
  Settings,
  PlusCircle,
  TrendingUp,
  Clock,
  Users,
  ChevronRight
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";

// Types for our dashboard data
interface ShopStats {
  totalBikes: number;
  availableBikes: number;
  unavailableBikes: number;
  activeBookings: number;
  totalRevenue: number;
}

interface UserStats {
  activeBookings: number;
  savedBikes: number;
  profileCompletionPercentage: number;
}

interface BookingData {
  id: string;
  bikeName: string;
  customerName: string;
  startDate: string;
  endDate: string;
  status: string;
}

// Define types for Supabase data
interface BikeData {
  id: string;
  is_available: boolean;
  price_per_day: number;
}

interface RentalData {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_price?: number;
  bikes?: {
    name: string;
  };
  users?: {
    first_name?: string;
    last_name?: string;
  };
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5 } 
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20 
    } 
  }
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [shopStats, setShopStats] = useState<ShopStats>({
    totalBikes: 0,
    availableBikes: 0,
    unavailableBikes: 0,
    activeBookings: 0,
    totalRevenue: 0
  });
  const [userStats, setUserStats] = useState<UserStats>({
    activeBookings: 0,
    savedBikes: 0,
    profileCompletionPercentage: 40 // Default value
  });
  const [recentBookings, setRecentBookings] = useState<BookingData[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch dashboard data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  // Function to fetch all required dashboard data
  const fetchDashboardData = async () => {
    setIsDataLoading(true);
    setError(null);
    
    try {
      const supabase = createClientComponentClient();
      
      if (user?.user_metadata?.role === "shop_owner") {
        // Fetch shop data for shop owners
        await fetchShopOwnerData(supabase);
      } else {
        // Fetch user data for regular users
        await fetchRegularUserData(supabase);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Fetch data specific to shop owners
  const fetchShopOwnerData = async (supabase: any) => {
    try {
      // 1. Get the user's shop
      const { data: shops, error: shopError } = await supabase
        .from("rental_shops")
        .select("id")
        .eq("owner_id", user!.id)
        .single();
      
      if (shopError) {
        console.error("Error fetching shop:", shopError);
        setError("Could not find your shop. Please ensure you have completed registration.");
        return;
      }
      
      const shopId = shops.id;
      
      // 2. Get bike statistics
      const { data: bikes, error: bikesError } = await supabase
        .from("bikes")
        .select("id, is_available, price_per_day")
        .eq("shop_id", shopId);
      
      if (bikesError) {
        console.error("Error fetching bikes:", bikesError);
        return;
      }
      
      const totalBikes = bikes?.length || 0;
      const availableBikes = bikes?.filter((bike: BikeData) => bike.is_available).length || 0;
      
      // 3. Get active bookings
      const { data: activeBookings, error: bookingsError } = await supabase
        .from("rentals")
        .select("id, status")
        .eq("shop_id", shopId)
        .in("status", ["active", "confirmed"]);
      
      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
        return;
      }
      
      // 4. Calculate revenue (from completed bookings)
      const { data: completedBookings, error: revenueError } = await supabase
        .from("rentals")
        .select("total_price")
        .eq("shop_id", shopId)
        .eq("status", "completed");
      
      if (revenueError) {
        console.error("Error fetching revenue data:", revenueError);
        return;
      }
      
      const totalRevenue = completedBookings?.reduce((sum: number, booking: { total_price?: number }) => 
        sum + (booking.total_price || 0), 0) || 0;
      
      // 5. Get recent bookings for the shop
      const { data: recentBookingsData, error: recentBookingsError } = await supabase
        .from("rentals")
        .select(`
          id, 
          start_date, 
          end_date, 
          status,
          bikes(name),
          users(first_name, last_name)
        `)
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (recentBookingsError) {
        console.error("Error fetching recent bookings:", recentBookingsError);
        return;
      }
      
      // Format the bookings data
      const formattedBookings = recentBookingsData?.map((booking: RentalData) => ({
        id: booking.id,
        bikeName: booking.bikes?.name || "Unknown Bike",
        customerName: `${booking.users?.first_name || ''} ${booking.users?.last_name || ''}`.trim() || "Unknown Customer",
        startDate: booking.start_date,
        endDate: booking.end_date,
        status: booking.status
      })) || [];
      
      // Update state with all the shop owner data
      setShopStats({
        totalBikes,
        availableBikes,
        unavailableBikes: totalBikes - availableBikes,
        activeBookings: activeBookings?.length || 0,
        totalRevenue
      });
      
      setRecentBookings(formattedBookings);
    } catch (err) {
      console.error("Error in fetchShopOwnerData:", err);
      throw err;
    }
  };

  // Fetch data specific to regular users
  const fetchRegularUserData = async (supabase: any) => {
    try {
      // 1. Get user's active bookings
      const { data: activeBookings, error: bookingsError } = await supabase
        .from("rentals")
        .select("id")
        .eq("user_id", user!.id)
        .in("status", ["active", "confirmed"]);
      
      if (bookingsError) {
        console.error("Error fetching user bookings:", bookingsError);
        return;
      }
      
      // 2. Get user's saved bikes (favorites)
      const { data: savedBikes, error: favoritesError } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user!.id);
      
      if (favoritesError) {
        console.error("Error fetching favorites:", favoritesError);
        return;
      }
      
      // 3. Calculate profile completion percentage
      // This would normally be based on fields the user has filled out
      // For simplicity, we'll just check a few metadata fields
      const userMetadata = user?.user_metadata || {};
      let filledFields = 0;
      const totalFields = 5;
      
      if (userMetadata.first_name) filledFields++;
      if (userMetadata.last_name) filledFields++;
      if (userMetadata.phone_number) filledFields++;
      if (userMetadata.address) filledFields++;
      if (user?.email) filledFields++;
      
      const profileCompletionPercentage = Math.round((filledFields / totalFields) * 100);
      
      // Update state with all the user data
      setUserStats({
        activeBookings: activeBookings?.length || 0,
        savedBikes: savedBikes?.length || 0,
        profileCompletionPercentage
      });
    } catch (err) {
      console.error("Error in fetchRegularUserData:", err);
      throw err;
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <div className="text-primary/80 font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const isShopOwner = user?.user_metadata?.role === "shop_owner";

  // Show dashboard content if authenticated
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div 
        className="pt-2 md:pt-4 mb-6 md:mb-8"
        variants={slideUp}
      >
        <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-white inline-flex items-center gap-2">
          Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500">{user?.user_metadata?.first_name || "Rider"}!</span>
        </h1>
        <p className="text-white/70 text-sm md:text-base">
          {isShopOwner
            ? "Manage your shop, bikes, and bookings from your dashboard."
            : "Manage your bookings, favorites, and account settings."}
        </p>
      </motion.div>

      <div className="space-y-6 md:space-y-10">
        {/* Error message if any */}
        {error && (
          <motion.div 
            className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg mb-6"
            variants={slideUp}
          >
            {error}
          </motion.div>
        )}
        
        {/* Stats Overview */}
        {isShopOwner ? (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            variants={containerVariants}
          >
            <motion.div 
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group"
              variants={cardVariants}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs md:text-sm font-medium text-white/60 mb-1">Total Bikes</h2>
                  <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                    {isDataLoading ? (
                      <div className="h-8 w-12 bg-white/10 rounded animate-pulse"></div>
                    ) : (
                      shopStats.totalBikes
                    )}
                  </div>
                </div>
                <div className="bg-primary/20 p-2 md:p-3 rounded-full group-hover:bg-primary/30 transition-all duration-300">
                  <Bike size={18} className="text-primary" />
                </div>
              </div>
              <Link 
                href="/dashboard/bikes" 
                className="text-xs text-white/60 hover:text-primary transition-colors inline-flex items-center gap-1 mt-1"
              >
                View all bikes
                <ChevronRight size={12} />
              </Link>
            </motion.div>

            <motion.div 
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-500/30 group"
              variants={cardVariants}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs md:text-sm font-medium text-white/60 mb-1">Available</h2>
                  <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                    {isDataLoading ? (
                      <div className="h-8 w-12 bg-white/10 rounded animate-pulse"></div>
                    ) : (
                      shopStats.availableBikes
                    )}
                  </div>
                </div>
                <div className="bg-green-500/20 p-2 md:p-3 rounded-full group-hover:bg-green-500/30 transition-all duration-300">
                  <Clock size={18} className="text-green-400" />
                </div>
              </div>
              <p className="text-xs text-white/60 mt-1">
                {Math.round((shopStats.availableBikes / (shopStats.totalBikes || 1)) * 100) || 0}% of your fleet
              </p>
            </motion.div>

            <motion.div 
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-500/30 group"
              variants={cardVariants}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs md:text-sm font-medium text-white/60 mb-1">Active Bookings</h2>
                  <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                    {isDataLoading ? (
                      <div className="h-8 w-12 bg-white/10 rounded animate-pulse"></div>
                    ) : (
                      shopStats.activeBookings
                    )}
                  </div>
                </div>
                <div className="bg-blue-500/20 p-2 md:p-3 rounded-full group-hover:bg-blue-500/30 transition-all duration-300">
                  <CalendarRange size={18} className="text-blue-400" />
                </div>
              </div>
              <Link 
                href="/dashboard/bookings" 
                className="text-xs text-white/60 hover:text-primary transition-colors inline-flex items-center gap-1 mt-1"
              >
                View all bookings
                <ChevronRight size={12} />
              </Link>
            </motion.div>

            <motion.div 
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group"
              variants={cardVariants}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs md:text-sm font-medium text-white/60 mb-1">Total Revenue</h2>
                  <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                    {isDataLoading ? (
                      <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
                    ) : (
                      `₱${shopStats.totalRevenue.toLocaleString()}`
                    )}
                  </div>
                </div>
                <div className="bg-primary/20 p-2 md:p-3 rounded-full group-hover:bg-primary/30 transition-all duration-300">
                  <TrendingUp size={18} className="text-primary" />
                </div>
              </div>
              <Link 
                href="/dashboard/analytics" 
                className="text-xs text-white/60 hover:text-primary transition-colors inline-flex items-center gap-1 mt-1"
              >
                View analytics
                <ChevronRight size={12} />
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
            variants={containerVariants}
          >
            <motion.div 
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-500/30 group"
              variants={cardVariants}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs md:text-sm font-medium text-white/60 mb-1">Active Bookings</h2>
                  <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                    {isDataLoading ? (
                      <div className="h-8 w-12 bg-white/10 rounded animate-pulse"></div>
                    ) : (
                      userStats.activeBookings
                    )}
                  </div>
                </div>
                <div className="bg-blue-500/20 p-2 md:p-3 rounded-full group-hover:bg-blue-500/30 transition-all duration-300">
                  <CalendarRange size={18} className="text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-white/60 mt-1">
                {userStats.activeBookings === 0 
                  ? "No bikes currently rented" 
                  : userStats.activeBookings === 1
                    ? "You have 1 active booking"
                    : `You have ${userStats.activeBookings} active bookings`
                }
              </p>
            </motion.div>

            <motion.div 
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-pink-500/30 group"
              variants={cardVariants}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs md:text-sm font-medium text-white/60 mb-1">Saved Bikes</h2>
                  <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                    {isDataLoading ? (
                      <div className="h-8 w-12 bg-white/10 rounded animate-pulse"></div>
                    ) : (
                      userStats.savedBikes
                    )}
                  </div>
                </div>
                <div className="bg-pink-500/20 p-2 md:p-3 rounded-full group-hover:bg-pink-500/30 transition-all duration-300">
                  <Heart size={18} className="text-pink-400" />
                </div>
              </div>
              <p className="text-xs text-white/60 mt-1">
                {userStats.savedBikes === 0 
                  ? "No bikes saved to favorites" 
                  : userStats.savedBikes === 1
                    ? "You have 1 saved bike"
                    : `You have ${userStats.savedBikes} saved bikes`
                }
              </p>
            </motion.div>

            <motion.div 
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group"
              variants={cardVariants}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs md:text-sm font-medium text-white/60 mb-1">Profile Completion</h2>
                  <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                    {isDataLoading ? (
                      <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
                    ) : (
                      `${userStats.profileCompletionPercentage}%`
                    )}
                  </div>
                </div>
                <div className="bg-primary/20 p-2 md:p-3 rounded-full group-hover:bg-primary/30 transition-all duration-300">
                  <Settings size={18} className="text-primary" />
                </div>
              </div>
              <motion.div 
                className="w-full bg-white/10 rounded-full h-1.5 mt-2 mb-1 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <motion.div 
                  className="bg-gradient-to-r from-primary to-blue-500 h-1.5 rounded-full" 
                  style={{ width: "0%" }}
                  animate={{ width: `${userStats.profileCompletionPercentage}%` }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                />
              </motion.div>
              <p className="text-xs text-white/60 mt-1">
                {userStats.profileCompletionPercentage < 100
                  ? "Add more details to complete your profile"
                  : "Your profile is complete"
                }
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.h2 
            className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-white/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Quick Actions
          </motion.h2>
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 0.5, staggerChildren: 0.1 }}
          >
            {isShopOwner ? (
              <>
                <motion.div variants={cardVariants}>
                  <Link href="/dashboard/bikes/add" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <PlusCircle size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">Add New Bike</span>
                    </div>
                  </Link>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Link href="/dashboard/shop" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <ShoppingBag size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">Manage Shop</span>
                    </div>
                  </Link>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Link href="/dashboard/bikes" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <Bike size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">Manage Bikes</span>
                    </div>
                  </Link>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Link href="/dashboard/analytics" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <BarChart size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">View Analytics</span>
                    </div>
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={cardVariants}>
                  <Link href="/browse" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <Bike size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">Browse Bikes</span>
                    </div>
                  </Link>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Link href="/dashboard/bookings" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <CalendarRange size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">My Bookings</span>
                    </div>
                  </Link>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Link href="/dashboard/favorites" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <Heart size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">Favorites</span>
                    </div>
                  </Link>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Link href="/profile" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <Settings size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">Profile Settings</span>
                    </div>
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Recent Activity / Bookings - only for shop owners */}
        {isShopOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-white/90">Recent Bookings</h2>
              <Button asChild variant="outline" size="sm" className="border-white/10 hover:border-primary/30 bg-black/40 hover:bg-black/60">
                <Link href="/dashboard/bookings">View All</Link>
              </Button>
            </div>
            <motion.div 
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              {isDataLoading ? (
                <div className="p-4 md:p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-white/10 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        <div className="h-4 bg-white/10 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Bike
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider hidden sm:table-cell">
                          Customer
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {recentBookings.map((booking, index) => (
                        <motion.tr 
                          key={booking.id} 
                          className="hover:bg-white/5 transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1 + (index * 0.1), duration: 0.3 }}
                        >
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-7 w-7 md:h-8 md:w-8 bg-primary/20 rounded-full flex items-center justify-center mr-2">
                                <Bike size={14} className="text-primary" />
                              </div>
                              <span className="font-medium text-white/90 text-sm">{booking.bikeName}</span>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden sm:table-cell">
                            <div className="flex items-center">
                              <div className="h-7 w-7 md:h-8 md:w-8 bg-white/10 rounded-full flex items-center justify-center mr-2">
                                <Users size={14} className="text-white/70" />
                              </div>
                              <span className="text-white/80 text-sm">{booking.customerName}</span>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="text-xs md:text-sm text-white/80">
                              {new Date(booking.startDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                              {" - "}
                              {new Date(booking.endDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === "active"
                                  ? "bg-green-500/20 text-green-400"
                                  : booking.status === "confirmed" || booking.status === "upcoming"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : booking.status === "completed"
                                  ? "bg-white/20 text-white/70"
                                  : booking.status === "cancelled"
                                  ? "bg-red-500/20 text-red-400"
                                  : ""
                              }`}
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary text-xs md:text-sm py-1">
                              <Link href={`/dashboard/bookings/${booking.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4">
                  <div className="bg-white/10 rounded-full p-3 md:p-4 mb-3 md:mb-4">
                    <CalendarRange size={24} className="text-white/60" />
                  </div>
                  <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2 text-white/90">No recent bookings</h3>
                  <p className="text-white/60 text-xs md:text-sm text-center max-w-xs">
                    When you receive bookings, they will appear here
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Register as Shop Owner - only shown to tourists */}
        {!isShopOwner && (
          <motion.div 
            className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-2 text-white">
                  Own a Motorbike Rental Shop?
                </h2>
                <p className="text-white/70 text-xs md:text-sm max-w-xl">
                  List your shop on Siargao Rides to reach more tourists and
                  manage your rentals easily.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 text-sm md:text-base">
                <Link href="/register">Register Your Shop</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 