"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarRange, TrendingUp, Users, CreditCard, Bike, Repeat } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Mock data for analytics
const mockAnalytics = {
  totalBookings: 47,
  totalRevenue: 18650,
  uniqueCustomers: 32,
  bookingRate: 78,
  repeatCustomers: 9,
  popularBikes: [
    { id: "bike1", name: "Honda Click 125i", bookings: 15, revenue: 6000 },
    { id: "bike2", name: "Yamaha Mio 125", bookings: 12, revenue: 4200 },
    { id: "bike4", name: "Kawasaki KLX 150", bookings: 8, revenue: 5600 },
  ],
  monthlyBookings: [
    { month: "Jan", bookings: 3 },
    { month: "Feb", bookings: 5 },
    { month: "Mar", bookings: 8 },
    { month: "Apr", bookings: 12 },
    { month: "May", bookings: 9 },
    { month: "Jun", bookings: 10 },
  ],
};

export default function AnalyticsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("all");

  useEffect(() => {
    // Check if user is a shop owner
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
      return;
    }

    // Simulate loading analytics data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, router]);

  // Calculate max value for the chart
  const maxBookings = Math.max(...mockAnalytics.monthlyBookings.map(item => item.bookings));

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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Total Bookings</p>
              <h3 className="text-3xl font-bold">{mockAnalytics.totalBookings}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <CalendarRange size={20} className="text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-500 text-sm flex items-center">
              <TrendingUp size={14} className="mr-1" /> +12% from last month
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Total Revenue</p>
              <h3 className="text-3xl font-bold">₱{mockAnalytics.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <CreditCard size={20} className="text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-500 text-sm flex items-center">
              <TrendingUp size={14} className="mr-1" /> +8% from last month
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Unique Customers</p>
              <h3 className="text-3xl font-bold">{mockAnalytics.uniqueCustomers}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <Users size={20} className="text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-500 text-sm flex items-center">
              <TrendingUp size={14} className="mr-1" /> +5% from last month
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Repeat Customers</p>
              <h3 className="text-3xl font-bold">{mockAnalytics.repeatCustomers}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <Repeat size={20} className="text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-500 text-sm flex items-center">
              <TrendingUp size={14} className="mr-1" /> +3 from last month
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Monthly Bookings</h3>
          <div className="h-64 w-full flex items-end justify-between">
            {mockAnalytics.monthlyBookings.map((item) => (
              <div key={item.month} className="flex flex-col items-center">
                <div 
                  className="w-12 bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                  style={{ 
                    height: `${(item.bookings / maxBookings) * 180}px`,
                    minHeight: '20px' 
                  }}
                ></div>
                <div className="text-muted-foreground text-xs mt-2">{item.month}</div>
                <div className="text-sm font-medium">{item.bookings}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Bikes</h3>
          <div className="space-y-4">
            {mockAnalytics.popularBikes.map((bike) => (
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
                        width: `${(bike.bookings / mockAnalytics.popularBikes[0].bookings) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Booking Rate</h3>
        <div className="flex items-center mb-4">
          <div className="w-full bg-muted rounded-full h-4">
            <div 
              className="bg-primary h-4 rounded-full text-xs flex items-center justify-center text-white"
              style={{ width: `${mockAnalytics.bookingRate}%` }}
            >
              {mockAnalytics.bookingRate}%
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Your bikes were booked {mockAnalytics.bookingRate}% of available days this period,
          which is 15% higher than the average in Siargao.
        </p>
      </div>

      {/* Improvement Suggestions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
        <ul className="space-y-3">
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
            <p className="text-sm">Consider adding more Kawasaki KLX models to your fleet as they have the highest revenue per booking.</p>
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
            <p className="text-sm">Your weekly rental rates could be more competitive based on market research.</p>
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
            <p className="text-sm">Send follow-up messages to your 32 unique customers to encourage repeat bookings.</p>
          </li>
        </ul>
      </div>
    </div>
  );
} 