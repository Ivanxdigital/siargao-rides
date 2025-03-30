"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarRange, TrendingUp, Users, CreditCard, Bike, Repeat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Define interfaces for analytics data
interface PopularBike {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
}

interface MonthlyBooking {
  month: string;
  bookings: number;
  displayMonth?: string;
}

interface Analytics {
  totalBookings: number;
  totalRevenue: number;
  uniqueCustomers: number;
  bookingRate: number;
  repeatCustomers: number;
  popularBikes: PopularBike[];
  monthlyBookings: MonthlyBooking[];
}

export default function AnalyticsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalBookings: 0,
    totalRevenue: 0,
    uniqueCustomers: 0,
    bookingRate: 0,
    repeatCustomers: 0,
    popularBikes: [],
    monthlyBookings: [],
  });
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("all");
  const [prevPeriodData, setPrevPeriodData] = useState({
    bookingsPercentChange: 0,
    revenuePercentChange: 0,
    customersPercentChange: 0,
    repeatCustomersChange: 0,
  });

  useEffect(() => {
    // Check if user is a shop owner
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
      return;
    }

    if (isAuthenticated && user) {
      fetchAnalyticsData(selectedTimeFrame);
    }
  }, [user, router, isAuthenticated, selectedTimeFrame]);

  // Fetch analytics data based on the selected time frame
  const fetchAnalyticsData = async (timeFrame: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClientComponentClient();
      
      // Get the user's shop ID
      const { data: shops, error: shopError } = await supabase
        .from("rental_shops")
        .select("id")
        .eq("owner_id", user!.id)
        .single();
      
      if (shopError) {
        console.error("Error fetching shop:", shopError);
        setError("Could not find your shop. Please ensure you have completed registration.");
        setIsLoading(false);
        return;
      }
      
      const shopId = shops.id;
      
      // Calculate date ranges based on selected time frame
      const now = new Date();
      let startDate: string | null = null;
      let prevPeriodStartDate: string | null = null;
      let prevPeriodEndDate: string | null = null;
      
      if (timeFrame === "30days") {
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        startDate = thirtyDaysAgo.toISOString();
        
        // Previous 30 days before that for comparison
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(now.getDate() - 60);
        prevPeriodStartDate = sixtyDaysAgo.toISOString();
        prevPeriodEndDate = startDate;
      } else if (timeFrame === "6months") {
        // Last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        startDate = sixMonthsAgo.toISOString();
        
        // Previous 6 months for comparison
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 12);
        prevPeriodStartDate = twelveMonthsAgo.toISOString();
        prevPeriodEndDate = startDate;
      }
      
      // 1. Fetch current period bookings
      let bookingsQuery = supabase
        .from("rentals")
        .select("id, user_id, start_date, end_date, total_price, bikes(id, name)")
        .eq("shop_id", shopId);
      
      if (startDate) {
        bookingsQuery = bookingsQuery.gte("created_at", startDate);
      }
      
      const { data: bookings, error: bookingsError } = await bookingsQuery;
      
      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
        setError("Failed to load analytics data. Please try again later.");
        setIsLoading(false);
        return;
      }
      
      // 2. Fetch previous period bookings for comparison
      let prevBookingsData: any[] = [];
      
      if (prevPeriodStartDate && prevPeriodEndDate) {
        const { data: prevBookings } = await supabase
          .from("rentals")
          .select("id, user_id, total_price")
          .eq("shop_id", shopId)
          .gte("created_at", prevPeriodStartDate)
          .lt("created_at", prevPeriodEndDate);
          
        prevBookingsData = prevBookings || [];
      }
      
      // Calculate total bookings
      const totalBookings = bookings?.length || 0;
      
      // Calculate total revenue
      const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
      
      // Calculate unique customers
      const uniqueCustomers = new Set(bookings?.map(booking => booking.user_id)).size;
      
      // Calculate repeat customers (users with more than one booking)
      const userBookingCounts: {[key: string]: number} = {};
      bookings?.forEach(booking => {
        if (booking.user_id) {
          userBookingCounts[booking.user_id] = (userBookingCounts[booking.user_id] || 0) + 1;
        }
      });
      const repeatCustomers = Object.values(userBookingCounts).filter(count => count > 1).length;
      
      // Calculate booking rate (simplistic approach)
      // Assuming each bike is available every day, calculate what percentage of possible booking days were used
      const totalAvailableBikeDays = await calculateAvailableBikeDays(supabase, shopId, startDate);
      const totalBookedDays = calculateTotalBookedDays(bookings || []);
      const bookingRate = totalAvailableBikeDays > 0 
        ? Math.round((totalBookedDays / totalAvailableBikeDays) * 100) 
        : 0;
      
      // Calculate popular bikes
      const bikeStats: {[key: string]: {id: string, name: string, bookings: number, revenue: number}} = {};
      
      bookings?.forEach(booking => {
        if (booking.bikes) {
          // Fix type issue by ensuring proper access to bike properties
          const bikeData = booking.bikes as any;
          const bikeId = bikeData.id;
          const bikeName = bikeData.name;
          
          if (!bikeStats[bikeId]) {
            bikeStats[bikeId] = {
              id: bikeId,
              name: bikeName,
              bookings: 0,
              revenue: 0
            };
          }
          
          bikeStats[bikeId].bookings += 1;
          bikeStats[bikeId].revenue += booking.total_price || 0;
        }
      });
      
      const popularBikes = Object.values(bikeStats)
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 3);
      
      // Calculate monthly bookings
      const monthlyBookings = generateMonthlyBookingsData(bookings || [], timeFrame);
      
      // Calculate percentage changes from previous period
      const prevTotalBookings = prevBookingsData.length;
      const prevTotalRevenue = prevBookingsData.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
      const prevUniqueCustomers = new Set(prevBookingsData.map(booking => booking.user_id)).size;
      
      // Calculate repeat customers for previous period
      const prevUserBookingCounts: {[key: string]: number} = {};
      prevBookingsData.forEach(booking => {
        if (booking.user_id) {
          prevUserBookingCounts[booking.user_id] = (prevUserBookingCounts[booking.user_id] || 0) + 1;
        }
      });
      const prevRepeatCustomers = Object.values(prevUserBookingCounts).filter(count => count > 1).length;
      
      // Calculate percentage changes
      const bookingsPercentChange = prevTotalBookings > 0 
        ? Math.round(((totalBookings - prevTotalBookings) / prevTotalBookings) * 100) 
        : 0;
      
      const revenuePercentChange = prevTotalRevenue > 0 
        ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100) 
        : 0;
      
      const customersPercentChange = prevUniqueCustomers > 0 
        ? Math.round(((uniqueCustomers - prevUniqueCustomers) / prevUniqueCustomers) * 100) 
        : 0;
      
      const repeatCustomersChange = repeatCustomers - prevRepeatCustomers;
      
      // Update state with analytics data
      setAnalytics({
        totalBookings,
        totalRevenue,
        uniqueCustomers,
        bookingRate,
        repeatCustomers,
        popularBikes,
        monthlyBookings,
      });
      
      setPrevPeriodData({
        bookingsPercentChange,
        revenuePercentChange,
        customersPercentChange,
        repeatCustomersChange,
      });
      
    } catch (err) {
      console.error("Error in fetchAnalyticsData:", err);
      setError("Failed to load analytics data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate available bike days
  const calculateAvailableBikeDays = async (supabase: any, shopId: string, startDate: string | null) => {
    try {
      // Get all bikes for the shop
      const { data: bikes } = await supabase
        .from("bikes")
        .select("id, created_at")
        .eq("shop_id", shopId);
      
      if (!bikes || bikes.length === 0) return 0;
      
      const now = new Date();
      let totalDays = 0;
      
      bikes.forEach((bike: any) => {
        // Use either the startDate for filtering or the bike creation date, whichever is later
        const bikeStartDate = startDate ? 
          new Date(Math.max(new Date(startDate).getTime(), new Date(bike.created_at).getTime())) : 
          new Date(bike.created_at);
        
        // Calculate days between bikeStartDate and now
        const dayDiff = Math.floor((now.getTime() - bikeStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        totalDays += Math.max(0, dayDiff);
      });
      
      return totalDays;
    } catch (error) {
      console.error("Error calculating available bike days:", error);
      return 0;
    }
  };

  // Helper function to calculate total booked days
  const calculateTotalBookedDays = (bookings: any[]) => {
    return bookings.reduce((total, booking) => {
      if (booking.start_date && booking.end_date) {
        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.end_date);
        const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return total + Math.max(0, days);
      }
      return total;
    }, 0);
  };

  // Helper function to generate monthly bookings data
  const generateMonthlyBookingsData = (bookings: any[], timeFrame: string): MonthlyBooking[] => {
    // Get the number of months to show based on timeFrame
    const monthsToShow = timeFrame === "30days" ? 6 : 
                          timeFrame === "6months" ? 6 : 
                          12;
    
    // Create an array of the last N months
    const monthsData: MonthlyBooking[] = [];
    const now = new Date();
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = new Date();
      // Set date to first day of month to avoid any day-related issues
      monthDate.setDate(1);
      monthDate.setMonth(now.getMonth() - i);
      
      const monthKey = monthDate.toLocaleString('default', { month: 'short' });
      const monthYear = monthDate.getFullYear();
      const month = monthDate.getMonth();
      
      // Use month/year for display but index position as the unique identifier
      const uniqueKey = `month-${i}`;
      const displayMonth = monthKey;
      
      // Count bookings for this month
      const monthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate.getMonth() === month && bookingDate.getFullYear() === monthYear;
      }).length;
      
      monthsData.push({
        month: uniqueKey, // Use position-based key for uniqueness
        bookings: monthBookings,
        displayMonth: displayMonth // Add display month for rendering
      });
    }
    
    return monthsData;
  };

  // Calculate max value for the chart
  const maxBookings = Math.max(...analytics.monthlyBookings.map(item => item.bookings || 0), 1);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-1/3 bg-card rounded-md mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-card rounded-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Performance Analytics</h1>
          <p className="text-muted-foreground">
            Track your shop's performance and rental statistics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={selectedTimeFrame === "30days" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeFrame("30days")}
          >
            Last 30 Days
          </Button>
          <Button
            variant={selectedTimeFrame === "6months" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeFrame("6months")}
          >
            Last 6 Months
          </Button>
          <Button
            variant={selectedTimeFrame === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeFrame("all")}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Error message if any */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Total Bookings</p>
              <h3 className="text-3xl font-bold">{analytics.totalBookings}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <CalendarRange size={20} className="text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm flex items-center ${prevPeriodData.bookingsPercentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {prevPeriodData.bookingsPercentChange >= 0 ? (
                <TrendingUp size={14} className="mr-1" />
              ) : (
                <TrendingUp size={14} className="mr-1 transform rotate-180" />
              )}
              {prevPeriodData.bookingsPercentChange === 0 && analytics.totalBookings === 0 
                ? "No bookings in this period" 
                : `${prevPeriodData.bookingsPercentChange >= 0 ? '+' : ''}${prevPeriodData.bookingsPercentChange}% from previous period`
              }
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Total Revenue</p>
              <h3 className="text-3xl font-bold">₱{analytics.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <CreditCard size={20} className="text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm flex items-center ${prevPeriodData.revenuePercentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {prevPeriodData.revenuePercentChange >= 0 ? (
                <TrendingUp size={14} className="mr-1" />
              ) : (
                <TrendingUp size={14} className="mr-1 transform rotate-180" />
              )}
              {prevPeriodData.revenuePercentChange === 0 && analytics.totalRevenue === 0 
                ? "No revenue in this period" 
                : `${prevPeriodData.revenuePercentChange >= 0 ? '+' : ''}${prevPeriodData.revenuePercentChange}% from previous period`
              }
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Unique Customers</p>
              <h3 className="text-3xl font-bold">{analytics.uniqueCustomers}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <Users size={20} className="text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm flex items-center ${prevPeriodData.customersPercentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {prevPeriodData.customersPercentChange >= 0 ? (
                <TrendingUp size={14} className="mr-1" />
              ) : (
                <TrendingUp size={14} className="mr-1 transform rotate-180" />
              )}
              {prevPeriodData.customersPercentChange === 0 && analytics.uniqueCustomers === 0 
                ? "No customers in this period" 
                : `${prevPeriodData.customersPercentChange >= 0 ? '+' : ''}${prevPeriodData.customersPercentChange}% from previous period`
              }
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Repeat Customers</p>
              <h3 className="text-3xl font-bold">{analytics.repeatCustomers}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <Repeat size={20} className="text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm flex items-center ${prevPeriodData.repeatCustomersChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {prevPeriodData.repeatCustomersChange >= 0 ? (
                <TrendingUp size={14} className="mr-1" />
              ) : (
                <TrendingUp size={14} className="mr-1 transform rotate-180" />
              )}
              {prevPeriodData.repeatCustomersChange === 0 && analytics.repeatCustomers === 0 
                ? "No repeat customers" 
                : `${prevPeriodData.repeatCustomersChange >= 0 ? '+' : ''}${prevPeriodData.repeatCustomersChange} from previous period`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Monthly Bookings</h3>
          {analytics.monthlyBookings.length > 0 ? (
            <div className="h-64 w-full flex items-end justify-between">
              {analytics.monthlyBookings.map((item) => (
                <div key={item.month} className="flex flex-col items-center">
                  <div 
                    className="w-12 bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                    style={{ 
                      height: `${(item.bookings / maxBookings) * 180}px`,
                      minHeight: item.bookings > 0 ? '20px' : '4px'
                    }}
                  ></div>
                  <div className="text-muted-foreground text-xs mt-2">{item.displayMonth || item.month.split('-')[0]}</div>
                  <div className="text-sm font-medium">{item.bookings}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No booking data available for this period
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Bikes</h3>
          {analytics.popularBikes.length > 0 ? (
            <div className="space-y-4">
              {analytics.popularBikes.map((bike) => (
                <div key={bike.id} className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-md mr-3">
                    <Bike size={16} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{bike.name}</h4>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{bike.bookings} bookings</span>
                      <span>₱{bike.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1 mt-2">
                      <div 
                        className="bg-primary h-1 rounded-full" 
                        style={{ 
                          width: `${(bike.bookings / (analytics.popularBikes[0]?.bookings || 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              No bike rental data available for this period
            </div>
          )}
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Booking Rate</h3>
        <div className="flex items-center mb-4">
          <div className="w-full bg-muted rounded-full h-4">
            <div 
              className="bg-primary h-4 rounded-full text-xs flex items-center justify-center text-white"
              style={{ width: `${analytics.bookingRate}%` }}
            >
              {analytics.bookingRate}%
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {analytics.bookingRate > 0 
            ? `Your bikes were booked ${analytics.bookingRate}% of available days this period.`
            : "No booking data available for calculating the booking rate in this period."
          }
        </p>
      </div>

      {/* Improvement Suggestions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
        {analytics.totalBookings > 0 ? (
          <ul className="space-y-3">
            {analytics.popularBikes.length > 0 && (
              <li className="flex">
                <div className="bg-green-500/10 text-green-500 p-1 rounded-full h-6 w-6 flex items-center justify-center mr-2 shrink-0">
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
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm">
                  Consider adding more {analytics.popularBikes[0]?.name} models to your fleet as they have the highest booking rate.
                </p>
              </li>
            )}
            <li className="flex">
              <div className="bg-green-500/10 text-green-500 p-1 rounded-full h-6 w-6 flex items-center justify-center mr-2 shrink-0">
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
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm">
                {analytics.bookingRate < 50 
                  ? "Consider adjusting your pricing to increase your booking rate."
                  : "Your booking rate is good. Consider adding more bikes to your fleet to increase revenue."
                }
              </p>
            </li>
            <li className="flex">
              <div className="bg-green-500/10 text-green-500 p-1 rounded-full h-6 w-6 flex items-center justify-center mr-2 shrink-0">
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
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm">
                Send follow-up messages to your {analytics.uniqueCustomers} unique customers to encourage repeat bookings.
              </p>
            </li>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Start renting out your bikes to customers to receive personalized recommendations based on your rental data.
          </p>
        )}
      </div>
    </div>
  );
} 