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
  Users
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const isShopOwner = user?.user_metadata?.role === "shop_owner";

  // Show dashboard content if authenticated
  return (
    <div>
      <div className="bg-black text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {user?.user_metadata?.first_name || "Rider"}!
          </h1>
          <p className="text-lg">
            {isShopOwner
              ? "Manage your shop, bikes, and bookings from your dashboard."
              : "Manage your bookings, favorites, and account settings."}
          </p>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Error message if any */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {/* Stats Overview */}
          {isShopOwner ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-1">Total Bikes</h2>
                    <div className="text-3xl font-bold mb-2 text-primary">
                      {isDataLoading ? (
                        <div className="animate-pulse w-12 h-10 bg-primary/10 rounded"></div>
                      ) : (
                        shopStats.totalBikes
                      )}
                    </div>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Bike size={18} className="text-primary" />
                  </div>
                </div>
                <Link 
                  href="/dashboard/bikes" 
                  className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  View all bikes
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </Link>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-1">Available</h2>
                    <div className="text-3xl font-bold mb-2 text-green-500">
                      {isDataLoading ? (
                        <div className="animate-pulse w-12 h-10 bg-green-500/10 rounded"></div>
                      ) : (
                        shopStats.availableBikes
                      )}
                    </div>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded-full">
                    <Clock size={18} className="text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((shopStats.availableBikes / (shopStats.totalBikes || 1)) * 100) || 0}% of your fleet
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-1">Active Bookings</h2>
                    <div className="text-3xl font-bold mb-2 text-blue-500">
                      {isDataLoading ? (
                        <div className="animate-pulse w-12 h-10 bg-blue-500/10 rounded"></div>
                      ) : (
                        shopStats.activeBookings
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-500/10 p-2 rounded-full">
                    <CalendarRange size={18} className="text-blue-500" />
                  </div>
                </div>
                <Link 
                  href="/dashboard/bookings" 
                  className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  View all bookings
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </Link>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</h2>
                    <div className="text-3xl font-bold mb-2 text-primary">
                      {isDataLoading ? (
                        <div className="animate-pulse w-24 h-10 bg-primary/10 rounded"></div>
                      ) : (
                        `₱${shopStats.totalRevenue.toLocaleString()}`
                      )}
                    </div>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <TrendingUp size={18} className="text-primary" />
                  </div>
                </div>
                <Link 
                  href="/dashboard/analytics" 
                  className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  View analytics
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-1">Active Bookings</h2>
                    <div className="text-3xl font-bold mb-2 text-blue-500">
                      {isDataLoading ? (
                        <div className="animate-pulse w-12 h-10 bg-blue-500/10 rounded"></div>
                      ) : (
                        userStats.activeBookings
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-500/10 p-2 rounded-full">
                    <CalendarRange size={18} className="text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {userStats.activeBookings === 0 
                    ? "No bikes currently rented" 
                    : userStats.activeBookings === 1
                      ? "You have 1 active booking"
                      : `You have ${userStats.activeBookings} active bookings`
                  }
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-1">Saved Bikes</h2>
                    <div className="text-3xl font-bold mb-2 text-pink-500">
                      {isDataLoading ? (
                        <div className="animate-pulse w-12 h-10 bg-pink-500/10 rounded"></div>
                      ) : (
                        userStats.savedBikes
                      )}
                    </div>
                  </div>
                  <div className="bg-pink-500/10 p-2 rounded-full">
                    <Heart size={18} className="text-pink-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {userStats.savedBikes === 0 
                    ? "No bikes saved to favorites" 
                    : userStats.savedBikes === 1
                      ? "You have 1 saved bike"
                      : `You have ${userStats.savedBikes} saved bikes`
                  }
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-1">Profile Completion</h2>
                    <div className="text-3xl font-bold mb-2 text-primary">
                      {isDataLoading ? (
                        <div className="animate-pulse w-16 h-10 bg-primary/10 rounded"></div>
                      ) : (
                        `${userStats.profileCompletionPercentage}%`
                      )}
                    </div>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Settings size={18} className="text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {userStats.profileCompletionPercentage < 100
                    ? "Add more details to complete your profile"
                    : "Your profile is complete"
                  }
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {isShopOwner ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-200 border-border/80"
                  >
                    <Link href="/dashboard/bikes/add">
                      <div className="bg-primary/10 rounded-full p-2 mb-2">
                        <PlusCircle size={20} className="text-primary" />
                      </div>
                      <span>Add New Bike</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-200 border-border/80"
                  >
                    <Link href="/dashboard/shop">
                      <div className="bg-primary/10 rounded-full p-2 mb-2">
                        <ShoppingBag size={20} className="text-primary" />
                      </div>
                      <span>Manage Shop</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-200 border-border/80"
                  >
                    <Link href="/dashboard/bikes">
                      <div className="bg-primary/10 rounded-full p-2 mb-2">
                        <Bike size={20} className="text-primary" />
                      </div>
                      <span>Manage Bikes</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-200 border-border/80"
                  >
                    <Link href="/dashboard/analytics">
                      <div className="bg-primary/10 rounded-full p-2 mb-2">
                        <BarChart size={20} className="text-primary" />
                      </div>
                      <span>View Analytics</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-200 border-border/80"
                  >
                    <Link href="/browse">
                      <div className="bg-primary/10 rounded-full p-2 mb-2">
                        <Bike size={20} className="text-primary" />
                      </div>
                      <span>Browse Bikes</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-200 border-border/80"
                  >
                    <Link href="/dashboard/bookings">
                      <div className="bg-primary/10 rounded-full p-2 mb-2">
                        <CalendarRange size={20} className="text-primary" />
                      </div>
                      <span>My Bookings</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-200 border-border/80"
                  >
                    <Link href="/dashboard/favorites">
                      <div className="bg-primary/10 rounded-full p-2 mb-2">
                        <Heart size={20} className="text-primary" />
                      </div>
                      <span>Favorites</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-200 border-border/80"
                  >
                    <Link href="/profile">
                      <div className="bg-primary/10 rounded-full p-2 mb-2">
                        <Settings size={20} className="text-primary" />
                      </div>
                      <span>Profile Settings</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity / Bookings - only for shop owners */}
          {isShopOwner && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Bookings</h2>
                <Button asChild variant="outline" size="sm" className="ml-4">
                  <Link href="/dashboard/bookings">View All</Link>
                </Button>
              </div>
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                {isDataLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-muted h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Bike
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Dates
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                                  <Bike size={14} className="text-primary" />
                                </div>
                                <span className="font-medium">{booking.bikeName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center mr-2">
                                  <Users size={14} />
                                </div>
                                {booking.customerName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  booking.status === "active"
                                    ? "bg-green-500/10 text-green-500"
                                    : booking.status === "confirmed" || booking.status === "upcoming"
                                    ? "bg-blue-500/10 text-blue-500"
                                    : booking.status === "completed"
                                    ? "bg-gray-500/10 text-gray-500"
                                    : booking.status === "cancelled"
                                    ? "bg-red-500/10 text-red-500"
                                    : ""
                                }`}
                              >
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/dashboard/bookings/${booking.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <div className="bg-muted/20 rounded-full p-3 mb-3">
                      <CalendarRange size={32} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No recent bookings</h3>
                    <p className="text-muted-foreground text-sm text-center max-w-xs">
                      When you receive bookings, they will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Register as Shop Owner - only shown to tourists */}
          {!isShopOwner && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 mb-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Own a Motorbike Rental Shop?
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    List your shop on Siargao Rides to reach more tourists and
                    manage your rentals easily.
                  </p>
                </div>
                <Button asChild size="lg" className="shrink-0">
                  <Link href="/register">Register Your Shop</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 