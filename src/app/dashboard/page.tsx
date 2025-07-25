"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
  ChevronRight,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { SubscriptionStatus, ShopWithSubscription } from "@/components/shop/SubscriptionStatus";
import { OnboardingGuide } from "@/components/shop/OnboardingGuide";
import { checkShopSetupStatus } from "@/utils/shopSetupStatus";
import { ProgressiveSetupCard } from "@/components/shop/ProgressiveSetupCard";
import { QuickStartOnboarding } from "@/components/shop/QuickStartOnboarding";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { withParallelTimeout, formatError, withTimeout, safeDbOperation } from "@/lib/dbTimeout";

// Types for our dashboard data
interface ShopStats {
  totalVehicles: number;
  availableVehicles: number;
  unavailableVehicles: number;
  activeBookings: number;
  totalRevenue: number;
}

interface UserStats {
  activeBookings: number;
  savedVehicles: number;
  profileCompletionPercentage: number;
}

interface BookingData {
  id: string;
  vehicleName: string;
  customerName: string;
  startDate: string;
  endDate: string;
  status: string;
}

// Define types for Supabase data
interface VehicleData {
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
  vehicles?: {
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
    totalVehicles: 0,
    availableVehicles: 0,
    unavailableVehicles: 0,
    activeBookings: 0,
    totalRevenue: 0
  });
  const [userStats, setUserStats] = useState<UserStats>({
    activeBookings: 0,
    savedVehicles: 0,
    profileCompletionPercentage: 40 // Default value
  });
  const [recentBookings, setRecentBookings] = useState<BookingData[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopData, setShopData] = useState<ShopWithSubscription | null>(null);
  const [isSubscriptionCollapsed, setIsSubscriptionCollapsed] = useState(true);
  const [shopSetupStatus, setShopSetupStatus] = useState({
    shopHasVehicles: false,
    shopHasLogo: false,
    shopHasBanner: false,
    shopHasDescription: false,
    shopHasLocation: false,
    shopHasContactInfo: false,
    shouldShowGuide: false,
    completionPercentage: 0
  });
  const [isGuideVisible, setIsGuideVisible] = useState(true);

  // Load guide visibility preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && shopData?.id) {
      const storedVisibility = localStorage.getItem(`guide_visible_${shopData.id}`);
      if (storedVisibility !== null) {
        setIsGuideVisible(storedVisibility === 'true');
      }
    }
  }, [shopData?.id]);

  // Save guide visibility preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && shopData?.id) {
      localStorage.setItem(`guide_visible_${shopData.id}`, isGuideVisible.toString());
    }
  }, [isGuideVisible, shopData?.id]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  // No longer redirect shop owners without a shop to registration page
  // Instead, we show the ShopOnboardingBanner component

  // Add ref to prevent concurrent fetches
  const isFetchingRef = useRef(false);

  // BUGFIX: Function to check if shop exists in database when metadata says no shop
  const checkShopExistenceAndFetch = useCallback(async (supabase: any) => {
    try {
      console.log("Checking database for shop existence (metadata fallback)");
      
      if (!user?.id) {
        console.warn("Cannot check shop existence: No user ID");
        return;
      }

      // Query database to check if shop actually exists
      const { data: shopExists, error: shopCheckError } = await supabase
        .from("rental_shops")
        .select("id, name")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .single();

      if (shopCheckError) {
        if (shopCheckError.code === 'PGRST116') {
          // No shop found - metadata is correct
          console.log("Database confirms no shop exists - metadata is accurate");
          return;
        } else {
          console.warn("Error checking shop existence:", shopCheckError);
          return;
        }
      }

      if (shopExists) {
        console.log("🔧 METADATA SYNC ISSUE DETECTED: Shop exists in database but metadata shows has_shop=false");
        console.log("Shop found:", shopExists);
        
        // Shop exists but metadata is stale - update session metadata
        try {
          console.log("Attempting to refresh session metadata...");
          const { error: metadataUpdateError } = await supabase.auth.updateUser({
            data: { has_shop: true }
          });

          if (metadataUpdateError) {
            console.warn("Failed to update metadata, but continuing with shop data fetch:", metadataUpdateError);
          } else {
            console.log("Successfully updated session metadata: has_shop = true");
          }

          // Refresh session to get updated metadata
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.warn("Session refresh failed, but continuing:", refreshError);
          } else {
            console.log("Session refreshed successfully");
          }

        } catch (metadataError) {
          console.warn("Metadata update failed, but shop exists so continuing with data fetch:", metadataError);
        }

        // Fetch shop data since shop exists
        console.log("Proceeding to fetch shop data (metadata corrected)");
        await fetchShopOwnerData(supabase);
      } else {
        console.log("Database confirms no shop exists - metadata is accurate");
      }

    } catch (err) {
      console.error("Error in checkShopExistenceAndFetch:", err);
      // Don't throw - let dashboard continue with default state
    }
  }, [user?.id]);

  // Function to fetch all required dashboard data with improved error handling
  const fetchDashboardData = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("Already fetching dashboard data, skipping duplicate call");
      return;
    }

    console.log("Starting fetchDashboardData for user role:", user?.user_metadata?.role);
    isFetchingRef.current = true;
    setIsDataLoading(true);
    setError(null);

    try {
      const supabase = createClientComponentClient();

      if (!user) {
        console.warn("Cannot fetch dashboard data: No authenticated user");
        setError("Please sign in to view your dashboard");
        return;
      }

      if (user?.user_metadata?.role === "shop_owner") {
        // Check if the user has a shop before trying to fetch shop data
        const hasShop = user.user_metadata?.has_shop;
        console.log("Shop owner has_shop status:", hasShop);
        
        if (hasShop === true) {
          console.log("Fetching shop data for verified shop owner");
          // Fetch shop data for shop owners who have a shop
          await fetchShopOwnerData(supabase);
        } else if (hasShop === false) {
          console.log("Shop owner doesn't have a shop yet (has_shop = false)");
          console.log("Performing database fallback check to verify shop existence");
          // BUGFIX: Add database fallback check when metadata indicates no shop
          // This handles the case where shop exists in DB but session metadata is stale
          await checkShopExistenceAndFetch(supabase);
        } else {
          console.log("Shop owner has_shop status is undefined, checking if shop exists in database");
          // has_shop is undefined - this might be an old user or metadata is not synced
          // Try to fetch shop data anyway - if it exists, the user has a shop even if metadata is stale
          await fetchShopOwnerData(supabase);
        }
      } else {
        console.log("Fetching data for regular user");
        // Fetch user data for regular users
        await fetchRegularUserData(supabase);
      }
    } catch (err) {
      // More detailed error logging
      console.warn("Error fetching dashboard data:", {
        error: formatError(err),
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        userRole: user?.user_metadata?.role || 'unknown',
        userId: user?.id || 'unknown',
        timestamp: new Date().toISOString()
      });

      // Set specific error messages based on error type
      if (err instanceof Error && err.message.includes('timed out')) {
        setError("Dashboard is taking longer than expected to load. Please check your connection and try refreshing the page.");
      } else {
        setError("Failed to load dashboard data. Please refresh the page or try again later.");
      }
    } finally {
      // CRITICAL: Always set loading to false to prevent stuck loading states
      console.log("Setting isDataLoading to false in fetchDashboardData finally block");
      setIsDataLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]); // Only depend on user ID to prevent infinite loops

  // Fetch dashboard data when authenticated
  useEffect(() => {
    console.log("Dashboard useEffect triggered:", {
      isAuthenticated,
      userId: user?.id,
      hasUser: !!user,
      timestamp: new Date().toISOString()
    });
    
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user?.id]); // Removed fetchDashboardData to prevent infinite loop

  // Helper function to fetch vehicle statistics and related data with timeout and parallel execution
  const fetchVehicleStats = async (supabase: any, shopId: string) => {
    try {
      console.log(`Starting data fetch for shop: ${shopId}`);

      // Execute the main data queries in parallel with timeout protection
      const parallelResults = await withParallelTimeout({
        vehicles: supabase
          .from("vehicles")
          .select("id, is_available, price_per_day")
          .eq("shop_id", shopId),
        activeBookings: supabase
          .from("rentals")
          .select("id, status")
          .eq("shop_id", shopId)
          .in("status", ["pending", "confirmed", "active"]),
        paidBookings: supabase
          .from("rentals")
          .select("total_price")
          .eq("shop_id", shopId)
          .eq("payment_status", "paid")
      }, { timeoutMs: 6000, operation: 'Vehicle statistics fetch' });

      // Extract data from results, handling potential nulls
      const vehicles = parallelResults.vehicles?.data || [];
      const activeBookings = parallelResults.activeBookings?.data || [];
      const paidBookings = parallelResults.paidBookings?.data || [];

      // Log any errors from the parallel operations
      if (parallelResults.vehicles?.error) {
        console.warn("Error fetching vehicles:", {
          error: formatError(parallelResults.vehicles.error),
          raw: parallelResults.vehicles.error
        });
      }
      if (parallelResults.activeBookings?.error) {
        console.warn("Error fetching active bookings:", {
          error: formatError(parallelResults.activeBookings.error),
          raw: parallelResults.activeBookings.error
        });
      }
      if (parallelResults.paidBookings?.error) {
        console.warn("Error fetching paid bookings:", {
          error: formatError(parallelResults.paidBookings.error),
          raw: parallelResults.paidBookings.error
        });
      }

      const totalVehicles = vehicles.length;
      const availableVehicles = vehicles.filter((vehicle: any) => vehicle.is_available).length;
      const totalRevenue = paidBookings.reduce((sum: number, booking: { total_price?: number }) =>
        sum + (booking.total_price || 0), 0);

      console.log("Vehicle stats:", { totalVehicles, availableVehicles, activeBookings: activeBookings.length, totalRevenue });

      // 4. Get recent bookings for the shop with timeout protection
      const recentBookingsResult = await safeDbOperation(
        async () => {
          const { data: rentalsData, error: rentalsError } = await supabase
            .from("rentals")
            .select("id, start_date, end_date, status, vehicle_id, user_id")
            .eq("shop_id", shopId)
            .order("created_at", { ascending: false })
            .limit(5);

          if (rentalsError) {
            console.warn("Error fetching rentals:", rentalsError);
            return [];
          }

          if (!rentalsData || rentalsData.length === 0) {
            return [];
          }

          // Use parallel operations to fetch vehicle and user data
          const formattedBookings = await Promise.all(rentalsData.map(async (rental) => {
            const [vehicleResult, userResult] = await Promise.allSettled([
              rental.vehicle_id ? supabase
                .from("vehicles")
                .select("name")
                .eq("id", rental.vehicle_id)
                .single() : Promise.resolve({ data: null }),
              rental.user_id ? supabase
                .from("users")
                .select("first_name, last_name")
                .eq("id", rental.user_id)
                .single() : Promise.resolve({ data: null })
            ]);

            const vehicleName = vehicleResult.status === 'fulfilled' && vehicleResult.value.data
              ? vehicleResult.value.data.name || "Unknown Vehicle"
              : "Unknown Vehicle";

            const customerName = userResult.status === 'fulfilled' && userResult.value.data
              ? `${userResult.value.data.first_name || ''} ${userResult.value.data.last_name || ''}`.trim() || "Guest"
              : "Guest";

            return {
              id: rental.id,
              vehicleName,
              customerName,
              startDate: rental.start_date,
              endDate: rental.end_date,
              status: rental.status
            };
          }));

          return formattedBookings;
        },
        [], // fallback to empty array
        { timeoutMs: 5000, operation: 'Recent bookings fetch' }
      );

      setRecentBookings(recentBookingsResult);

      // Update state with all the shop owner data
      setShopStats({
        totalVehicles,
        availableVehicles,
        unavailableVehicles: totalVehicles - availableVehicles,
        activeBookings: activeBookings.length,
        totalRevenue
      });

      console.log("Successfully completed vehicle stats fetch");
    } catch (err) {
      console.warn("Error in fetchVehicleStats:", {
        error: formatError(err),
        errorType: err instanceof Error ? 'Error' : typeof err,
        shopId,
        timestamp: new Date().toISOString()
      });
      
      // Set default values on error to prevent UI issues
      setShopStats({
        totalVehicles: 0,
        availableVehicles: 0,
        unavailableVehicles: 0,
        activeBookings: 0,
        totalRevenue: 0
      });
      setRecentBookings([]);
      
      // Don't throw error here - let the dashboard load with default values
      console.log("fetchVehicleStats completed with fallback values due to error");
    }
  };

  // Fetch data specific to shop owners
  const fetchShopOwnerData = async (supabase: any) => {
    try {
      // Check if user ID is defined
      if (!user || !user.id) {
        console.warn("Cannot fetch shop owner data: User ID is undefined");
        setError("Unable to identify your account. Please try signing out and signing in again.");
        return;
      }

      // 1. Get the user's shop with subscription data
      const { data: shopWithSubscription, error: shopError } = await supabase
        .from("rental_shops")
        .select("id, name, logo_url, banner_url, description, address, location_area, phone_number, whatsapp, email, facebook_url, instagram_url, is_verified, subscription_status, subscription_start_date, subscription_end_date, is_active")
        .eq("owner_id", user.id)
        .single();

      console.log("User ID:", user.id); // Debug log
      console.log("Shop data:", shopWithSubscription); // Debug log

      // Enhanced error handling for shopError with retry logic
      if (shopError || !shopWithSubscription) {
        // Log detailed error information
        console.warn("Error fetching shop:", {
          error: shopError,
          errorMessage: shopError?.message || "No error message",
          errorCode: shopError?.code || "No error code",
          userId: user?.id || "No user ID",
          hasData: !!shopWithSubscription,
          userHasShop: user?.user_metadata?.has_shop
        });

        // Check if this is likely a race condition (user has has_shop=true but shop not found)
        const isLikelyRaceCondition = user?.user_metadata?.has_shop === true && 
                                     (!shopError || shopError.code === 'PGRST116');

        if (isLikelyRaceCondition) {
          console.log("Race condition detected: user has has_shop=true but shop not found. Implementing retry logic...");
          
          // Implement exponential backoff retry
          const retryAttempts = 3;
          for (let attempt = 1; attempt <= retryAttempts; attempt++) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s max
            console.log(`Retry attempt ${attempt}/${retryAttempts} in ${delay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const retryResult = await withTimeout(
              supabase
                .from("rental_shops")
                .select("id, name, logo_url, banner_url, description, address, location_area, phone_number, whatsapp, email, facebook_url, instagram_url, is_verified, subscription_status, subscription_start_date, subscription_end_date, is_active")
                .eq("owner_id", user.id)
                .single(),
              { timeoutMs: 3000, operation: `Shop data retry ${attempt}` }
            );
            
            const { data: retryShopData, error: retryError } = retryResult;
            
            if (retryShopData && !retryError) {
              console.log(`Retry successful on attempt ${attempt}!`);
              // Continue with the rest of the function using retryShopData
              setShopData(retryShopData as ShopWithSubscription);
              const shopId = retryShopData.id;
              
              // Continue to vehicle statistics and setup status
              await fetchVehicleStats(supabase, shopId);
              
              // Update shop setup status with the shop data and vehicle count
              const vehicleCountResult = await safeDbOperation(
                async () => {
                  const { data: vehiclesForSetup } = await supabase
                    .from("vehicles")
                    .select("id")
                    .eq("shop_id", shopId);
                  return vehiclesForSetup?.length || 0;
                },
                0, // fallback to 0 vehicles
                { timeoutMs: 3000, operation: 'Vehicle count for setup status' }
              );
              
              const setupStatus = checkShopSetupStatus(retryShopData, vehicleCountResult);
              setShopSetupStatus(setupStatus);
              return;
            } else {
              console.log(`Retry attempt ${attempt} failed:`, retryError);
            }
          }
          
          // All retries failed - set error and stop loading
          console.warn("All retry attempts failed. Shop may not exist yet.");
          setError("Shop data is still being created. Please refresh the page in a moment.");
        } else {
          // Only show error for actual database errors, not missing data
          if (shopError && shopError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            setError(`Error loading shop data: ${shopError.message}. Please refresh the page.`);
          } else if (!shopWithSubscription) {
            // For missing shop data, don't show an error immediately - the user might be mid-onboarding
            console.log("No shop found for user. They may need to complete onboarding or data is still syncing.");
            // Don't set an error - let the onboarding component show instead
          }
        }
        
        // IMPORTANT: Set loading to false even when returning early
        setIsDataLoading(false);
        return;
      }

      // Save shop data with subscription info for component
      setShopData(shopWithSubscription as ShopWithSubscription);

      const shopId = shopWithSubscription.id;

      // Fetch vehicle statistics and related data
      await fetchVehicleStats(supabase, shopId);

      // Update shop setup status with the shop data and vehicle count
      const vehicleCountResult = await safeDbOperation(
        async () => {
          const { data: vehiclesForSetup } = await supabase
            .from("vehicles")
            .select("id")
            .eq("shop_id", shopId);
          return vehiclesForSetup?.length || 0;
        },
        0, // fallback to 0 vehicles
        { timeoutMs: 3000, operation: 'Vehicle count for setup status' }
      );
      
      const setupStatus = checkShopSetupStatus(shopWithSubscription, vehicleCountResult);
      setShopSetupStatus(setupStatus);
    } catch (err) {
      // Enhanced catch block with more detailed error logging
      console.warn("Error in fetchShopOwnerData:", {
        error: formatError(err),
        errorType: err instanceof Error ? 'Error' : typeof err,
        userId: user?.id,
        hasShop: user?.user_metadata?.has_shop,
        timestamp: new Date().toISOString(),
        stack: err instanceof Error ? err.stack : undefined
      });

      // Set a user-friendly error message based on error type
      if (err instanceof Error && err.message.includes('timed out')) {
        setError("Loading is taking longer than expected. Please check your connection and try refreshing the page.");
      } else {
        setError("An error occurred while fetching your shop data. Please try refreshing the page or contact support if the problem persists.");
      }

      // Set default shop stats to prevent UI issues
      setShopStats({
        totalVehicles: 0,
        availableVehicles: 0,
        unavailableVehicles: 0,
        activeBookings: 0,
        totalRevenue: 0
      });
      setRecentBookings([]);

      // Don't rethrow the error so we can handle it here
      return;
    } finally {
      // CRITICAL: Always set loading to false to prevent stuck loading states
      console.log("Setting isDataLoading to false in fetchShopOwnerData finally block");
      setIsDataLoading(false);
    }
  };

  // Fetch data specific to regular users with timeout protection
  const fetchRegularUserData = async (supabase: any) => {
    console.log("Starting fetchRegularUserData for user:", user?.id);
    
    try {
      // Execute user data queries in parallel with timeout protection
      const parallelResults = await withParallelTimeout({
        activeBookings: supabase
          .from("rentals")
          .select("id")
          .eq("user_id", user!.id)
          .in("status", ["active", "confirmed"]),
        savedVehicles: supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user!.id)
      }, { timeoutMs: 5000, operation: 'User data fetch' });

      // Extract data from results, handling potential nulls
      const activeBookings = parallelResults.activeBookings?.data || [];
      const savedVehicles = parallelResults.savedVehicles?.data || [];

      // Log any errors from the parallel operations
      if (parallelResults.activeBookings?.error) {
        console.warn("Error fetching user bookings:", {
          error: formatError(parallelResults.activeBookings.error),
          raw: parallelResults.activeBookings.error
        });
      }
      if (parallelResults.savedVehicles?.error) {
        console.warn("Error fetching favorites:", {
          error: formatError(parallelResults.savedVehicles.error),
          raw: parallelResults.savedVehicles.error
        });
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
        activeBookings: activeBookings.length,
        savedVehicles: savedVehicles.length,
        profileCompletionPercentage
      });

      console.log("Successfully completed regular user data fetch");
    } catch (err) {
      console.warn("Error in fetchRegularUserData:", {
        error: formatError(err),
        errorType: err instanceof Error ? 'Error' : typeof err,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      
      // Set default values on error to prevent UI issues
      setUserStats({
        activeBookings: 0,
        savedVehicles: 0,
        profileCompletionPercentage: 40 // Default value
      });
      
      // Don't throw error here - let the dashboard load with default values
      console.log("fetchRegularUserData completed with fallback values due to error");
    }
  };

  // Toggle subscription collapse state
  const toggleSubscriptionCollapse = () => {
    setIsSubscriptionCollapsed(!isSubscriptionCollapsed);
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
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-white inline-flex items-center gap-2">
          Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500">{user?.user_metadata?.first_name || "Rider"}!</span>
        </h1>
        <p className="text-base sm:text-lg text-white/70">
          {isShopOwner
            ? "Manage your shop, vehicles, and bookings from your dashboard."
            : "Manage your bookings, favorites, and account settings."}
        </p>
      </motion.div>

      <div className="space-y-6 md:space-y-10">
        {/* Enhanced error message with retry option */}
        {error && !error.includes('registration') && (
          <motion.div
            className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-base"
            variants={slideUp}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <h3 className="font-medium text-red-300">Unable to Load Dashboard Data</h3>
                </div>
                <p className="text-sm text-red-200 mb-3">{error}</p>
                {error.includes('still being created') && (
                  <p className="text-xs text-red-300/80">
                    💡 This usually resolves within a few seconds after creating a new shop.
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  fetchDashboardData();
                }}
                className="bg-red-900/30 border-red-600/50 text-red-200 hover:bg-red-800/40 hover:text-red-100 flex-shrink-0"
              >
                <Clock className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* Quick Start Onboarding: Show if user is shop owner and hasn't completed initial registration */}
        {isFeatureEnabled('ONBOARDING_V2') && isShopOwner && user?.user_metadata?.has_shop === false && (
          <motion.div
            key="quick-start-onboarding"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full flex justify-center mb-8"
          >
            <QuickStartOnboarding
              onComplete={fetchDashboardData} // Refreshes data, including user.user_metadata.has_shop
            />
          </motion.div>
        )}

        {/* Progressive Setup Card: Show if user is shop owner and has completed initial registration */}
        {isFeatureEnabled('ONBOARDING_V2') && isShopOwner && user?.user_metadata?.has_shop === true && !isDataLoading && (
          <motion.div
            key="progressive-setup-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full mb-6"
          >
            <ProgressiveSetupCard
              shopId={shopData?.id}
              vehicleCount={shopStats.totalVehicles}
              shopData={shopData}
            />
          </motion.div>
        )}

        {/* Stats Overview */}
        {isShopOwner ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Subscription Status for Shop Owners */}
            {shopData && (
              <motion.div
                className="mb-6 relative"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white/90">Subscription Status</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
                    onClick={toggleSubscriptionCollapse}
                    aria-label={isSubscriptionCollapsed ? "Expand subscription details" : "Collapse subscription details"}
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotate: isSubscriptionCollapsed ? 0 : 180 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <ChevronDown className="h-5 w-5 text-primary" />
                    </motion.div>
                  </Button>
                </div>
                <AnimatePresence mode="wait">
                  {!isSubscriptionCollapsed ? (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                    >
                      <SubscriptionStatus shop={shopData} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="collapsed"
                      className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg flex items-center justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          shopData?.subscription_status === "active" ? "bg-green-500" :
                          shopData?.is_verified === false ? "bg-yellow-500" :
                          shopData?.subscription_status === "expired" ? "bg-red-500" :
                          "bg-yellow-500"
                        }`}></div>
                        <span className="text-sm text-white/80">
                          {shopData?.subscription_status
                            ? shopData.subscription_status.charAt(0).toUpperCase() + shopData.subscription_status.slice(1)
                            : "Unknown"} Subscription
                        </span>
                      </div>
                      <span className="text-xs text-primary/80 hover:text-primary cursor-pointer" onClick={toggleSubscriptionCollapse}>View Details</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            <motion.h2
              className="text-base sm:text-lg md:text-xl font-semibold mb-3 md:mb-4 text-white/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Shop Overview
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
              variants={containerVariants}
            >
              <motion.div
                className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group"
                variants={cardVariants}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm md:text-base font-medium text-white/60 mb-1">Total Vehicles</h2>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                      {isDataLoading ? (
                        <div className="h-8 w-12 bg-white/10 rounded animate-pulse"></div>
                      ) : (
                        shopStats.totalVehicles
                      )}
                    </div>
                  </div>
                  <div className="bg-primary/20 p-2 md:p-3 rounded-full group-hover:bg-primary/30 transition-all duration-300">
                    <Bike size={18} className="text-primary" />
                  </div>
                </div>
                <Link
                  href="/dashboard/vehicles"
                  className="text-sm text-white/60 hover:text-primary transition-colors inline-flex items-center gap-1 mt-1"
                >
                  View all vehicles
                  <ChevronRight size={12} />
                </Link>
              </motion.div>

              <motion.div
                className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-500/30 group"
                variants={cardVariants}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm md:text-base font-medium text-white/60 mb-1">Available</h2>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                      {isDataLoading ? (
                        <div className="h-8 w-12 bg-white/10 rounded animate-pulse"></div>
                      ) : (
                        shopStats.availableVehicles
                      )}
                    </div>
                  </div>
                  <div className="bg-green-500/20 p-2 md:p-3 rounded-full group-hover:bg-green-500/30 transition-all duration-300">
                    <Clock size={18} className="text-green-400" />
                  </div>
                </div>
                <p className="text-sm text-white/60 mt-1">
                  {Math.round((shopStats.availableVehicles / (shopStats.totalVehicles || 1)) * 100) || 0}% of your fleet
                </p>
              </motion.div>

              <motion.div
                className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-500/30 group"
                variants={cardVariants}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm md:text-base font-medium text-white/60 mb-1">Active Bookings</h2>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
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
                  className="text-sm text-white/60 hover:text-primary transition-colors inline-flex items-center gap-1 mt-1"
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
                    <h2 className="text-sm md:text-base font-medium text-white/60 mb-1">Total Revenue</h2>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
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
                  className="text-sm text-white/60 hover:text-primary transition-colors inline-flex items-center gap-1 mt-1"
                >
                  View analytics
                  <ChevronRight size={12} />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-500/30 group"
              variants={cardVariants}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-sm md:text-base font-medium text-white/60 mb-1">Active Bookings</h2>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
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
              <p className="text-sm text-white/60 mt-1">
                {userStats.activeBookings === 0
                  ? "No vehicles currently rented"
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
                  <h2 className="text-sm md:text-base font-medium text-white/60 mb-1">Saved Vehicles</h2>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
                    {isDataLoading ? (
                      <div className="h-8 w-12 bg-white/10 rounded animate-pulse"></div>
                    ) : (
                      userStats.savedVehicles
                    )}
                  </div>
                </div>
                <div className="bg-pink-500/20 p-2 md:p-3 rounded-full group-hover:bg-pink-500/30 transition-all duration-300">
                  <Heart size={18} className="text-pink-400" />
                </div>
              </div>
              <p className="text-sm text-white/60 mt-1">
                {userStats.savedVehicles === 0
                  ? "No vehicles saved to favorites"
                  : userStats.savedVehicles === 1
                    ? "You have 1 saved vehicle"
                    : `You have ${userStats.savedVehicles} saved vehicles`
                }
              </p>
            </motion.div>

            <motion.div
              className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group"
              variants={cardVariants}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-sm md:text-base font-medium text-white/60 mb-1">Profile Completion</h2>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-white">
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
              <p className="text-sm text-white/60 mt-1">
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
            className="text-base sm:text-lg md:text-xl font-semibold mb-3 md:mb-4 text-white/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Quick Actions
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 0.5, staggerChildren: 0.1 }}
          >
            {isShopOwner ? (
              <>
                <motion.div variants={cardVariants}>
                  <Link href="/dashboard/vehicles/add" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <PlusCircle size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">Add New Vehicle</span>
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
                  <Link href="/dashboard/vehicles" className="group">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary/30 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center gap-2 md:gap-3 text-center">
                      <div className="bg-primary/20 rounded-full p-3 md:p-4 mb-1 md:mb-2 group-hover:bg-primary/30 transition-all duration-300">
                        <Bike size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-white/90 text-sm md:text-base">Manage Vehicles</span>
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
                      <span className="font-medium text-white/90 text-sm md:text-base">Browse Vehicles</span>
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
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white/90">Recent Bookings</h2>
              <Button asChild variant="outline" size="sm" className="border-white/10 hover:border-primary/30 bg-black/40 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-primary" aria-label="View all bookings">
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
                <>
                  {/* Table for md+ screens */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
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
                                <span className="font-medium text-white/90 text-sm">{booking.vehicleName}</span>
                              </div>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
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
                              <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary text-xs md:text-sm py-1 focus:outline-none focus:ring-2 focus:ring-primary" aria-label="View booking details">
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
                  {/* Card list for mobile screens */}
                  <div className="md:hidden flex flex-col gap-3 p-3">
                    {recentBookings.map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        className="bg-black/60 border border-white/10 rounded-lg p-4 flex flex-col gap-2 shadow-md"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + (index * 0.1), duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <Bike size={16} className="text-primary" />
                          </div>
                          <span className="font-medium text-white/90 text-base">{booking.vehicleName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 bg-white/10 rounded-full flex items-center justify-center">
                            <Users size={14} className="text-white/70" />
                          </div>
                          <span className="text-white/80 text-sm">{booking.customerName}</span>
                        </div>
                        <div className="text-sm text-white/80">
                          <span className="font-medium">Dates: </span>
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
                        <div className="flex items-center gap-2">
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
                          <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary text-xs py-1 focus:outline-none focus:ring-2 focus:ring-primary" aria-label="View booking details">
                            <Link href={`/dashboard/bookings/${booking.id}`}>
                              Details
                            </Link>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
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
                <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-white">
                  Own a Vehicle Rental Shop?
                </h2>
                <p className="text-white/70 text-xs md:text-sm max-w-xl">
                  List your shop on Siargao Rides to reach more tourists and
                  manage your rentals easily.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0 bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-lg hover:shadow-primary/10 font-medium text-sm md:text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Register your shop">
                <Link href="/register">Register Your Shop</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}