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
import { mockBikes } from "@/lib/mock-data";

// Mock data for recent bookings
const mockRecentBookings = [
  { 
    id: 'b1', 
    bikeName: 'Honda Click 125i', 
    customerName: 'John Smith', 
    startDate: '2023-06-15', 
    endDate: '2023-06-18', 
    status: 'active' 
  },
  { 
    id: 'b2', 
    bikeName: 'Yamaha Mio 125', 
    customerName: 'Maria Garcia', 
    startDate: '2023-06-20', 
    endDate: '2023-06-25', 
    status: 'upcoming' 
  },
  { 
    id: 'b3', 
    bikeName: 'Kawasaki KLX 150', 
    customerName: 'David Lee', 
    startDate: '2023-06-10', 
    endDate: '2023-06-12', 
    status: 'completed' 
  },
];

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [shopStats, setShopStats] = useState({
    totalBikes: 0,
    availableBikes: 0,
    unavailableBikes: 0,
  });

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  // Calculate shop stats if user is a shop owner
  useEffect(() => {
    if (isAuthenticated && user?.user_metadata?.role === "shop_owner") {
      // In a real app, we would fetch this data from the API
      // For now, use mock data
      const total = mockBikes.length;
      const available = mockBikes.filter(bike => bike.is_available).length;
      
      setShopStats({
        totalBikes: total,
        availableBikes: available,
        unavailableBikes: total - available,
      });
    }
  }, [isAuthenticated, user]);

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
          {/* Stats Overview */}
          {isShopOwner ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Total Bikes</h2>
                    <div className="text-4xl font-bold mb-2 text-primary">
                      {shopStats.totalBikes}
                    </div>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Bike size={20} className="text-primary" />
                  </div>
                </div>
                <Link 
                  href="/dashboard/bikes" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  View all bikes →
                </Link>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Available</h2>
                    <div className="text-4xl font-bold mb-2 text-green-500">
                      {shopStats.availableBikes}
                    </div>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded-md">
                    <Clock size={20} className="text-green-500" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {Math.round((shopStats.availableBikes / shopStats.totalBikes) * 100) || 0}% of your fleet
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Active Bookings</h2>
                    <div className="text-4xl font-bold mb-2 text-blue-500">
                      2
                    </div>
                  </div>
                  <div className="bg-blue-500/10 p-2 rounded-md">
                    <CalendarRange size={20} className="text-blue-500" />
                  </div>
                </div>
                <Link 
                  href="/dashboard/bookings" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  View all bookings →
                </Link>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Total Revenue</h2>
                    <div className="text-4xl font-bold mb-2 text-primary">
                      ₱15,200
                    </div>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-md">
                    <TrendingUp size={20} className="text-primary" />
                  </div>
                </div>
                <Link 
                  href="/dashboard/analytics" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  View analytics →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Active Bookings</h2>
                <div className="text-4xl font-bold mb-2 text-primary">0</div>
                <p className="text-sm text-muted-foreground">
                  No bikes currently rented
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Saved Bikes</h2>
                <div className="text-4xl font-bold mb-2 text-primary">0</div>
                <p className="text-sm text-muted-foreground">
                  No bikes saved to favorites
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Profile Completion</h2>
                <div className="text-4xl font-bold mb-2 text-primary">40%</div>
                <p className="text-sm text-muted-foreground">
                  Add more details to complete your profile
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {isShopOwner ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                  >
                    <Link href="/dashboard/bikes/add">
                      <PlusCircle size={22} className="mb-2" />
                      Add New Bike
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                  >
                    <Link href="/dashboard/shop">
                      <ShoppingBag size={22} className="mb-2" />
                      Manage Shop
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                  >
                    <Link href="/dashboard/bikes">
                      <Bike size={22} className="mb-2" />
                      Manage Bikes
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                  >
                    <Link href="/dashboard/analytics">
                      <BarChart size={22} className="mb-2" />
                      View Analytics
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                  >
                    <Link href="/browse">
                      <Bike size={22} className="mb-2" />
                      Browse Bikes
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                  >
                    <Link href="/dashboard/bookings">
                      <CalendarRange size={22} className="mb-2" />
                      My Bookings
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                  >
                    <Link href="/dashboard/favorites">
                      <Heart size={22} className="mb-2" />
                      Favorites
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                  >
                    <Link href="/profile">
                      <Settings size={22} className="mb-2" />
                      Profile Settings
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity / Bookings - only for shop owners */}
          {isShopOwner && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Bookings</h2>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/bookings">View All</Link>
                </Button>
              </div>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
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
                      {mockRecentBookings.map((booking) => (
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
                                  : booking.status === "upcoming"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : booking.status === "completed"
                                  ? "bg-gray-500/10 text-gray-500"
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
              </div>
            </div>
          )}

          {/* Register as Shop Owner - only shown to tourists */}
          {!isShopOwner && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-12">
              <h2 className="text-xl font-semibold mb-2">
                Own a Motorbike Rental Shop?
              </h2>
              <p className="mb-4">
                List your shop on Siargao Rides to reach more tourists and
                manage your rentals easily.
              </p>
              <Button asChild>
                <Link href="/register">Register Your Shop</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 