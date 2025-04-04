"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { 
  CalendarDays, 
  Search, 
  Filter, 
  ChevronDown, 
  ArrowUpDown, 
  Eye, 
  CheckCircle, 
  XCircle, 
  ClockIcon,
  Loader
} from "lucide-react";

// Icons
import { 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null); // For debugging
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bookingsPerPage = 10;
  
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Add error boundary to catch render errors
  useEffect(() => {
    // Global error handler to catch errors during fetch and render
    const errorHandler = (event: ErrorEvent) => {
      console.error("Unhandled error in BookingsPage:", event.error);
      setError(`An unexpected error occurred: ${event.error?.message || "Unknown error"}`);
      setIsLoading(false);
      setDebugInfo(JSON.stringify(event.error, null, 2));
      event.preventDefault();
    };

    window.addEventListener('error', errorHandler);
    console.log("BookingsPage component mounted with error handler");

    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  useEffect(() => {
    console.log("BookingsPage data fetch starting");
    const checkUserAndShop = async () => {
      try {
        console.log("Checking user and shop...");
        // Check if user is authenticated
        if (!user) {
          console.log("User not authenticated, redirecting to sign-in");
          router.push("/sign-in");
          return;
        }
        console.log("User is authenticated:", user.id);

        // Ensure authentication is fresh
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Session error:", sessionError);
            throw new Error(`Authentication error: ${sessionError.message}`);
          }
          
          if (!sessionData.session) {
            console.error("No active session found");
            router.push("/sign-in");
            return;
          }
          
          // Check if token is about to expire (within 5 minutes)
          const expiresAt = sessionData.session.expires_at;
          const expiresIn = expiresAt ? expiresAt - Math.floor(Date.now() / 1000) : 0;
          
          if (expiresIn < 300) { // less than 5 minutes left
            console.log("Session about to expire, refreshing...");
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error("Failed to refresh session:", refreshError);
              // Continue anyway, maybe it will work
            }
          }
        } catch (authError) {
          console.error("Auth check failed:", authError);
          // Try to continue anyway
        }

        // Get user's shop
        const { data: shop, error: shopError } = await supabase
          .from("rental_shops")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (shopError || !shop) {
          setError("No shop found for your account. Please set up your shop first.");
          setIsLoading(false);
          return;
        }

        // ADDED: Check rentals table structure to ensure schema compatibility
        try {
          console.log("Validating rentals table schema...");
          // First, check if the rentals table exists by doing a minimal query
          const { error: tableCheckError } = await supabase
            .from('rentals')
            .select('id')
            .limit(1);
            
          if (tableCheckError) {
            console.error("Error checking rentals table:", tableCheckError);
            setError(`Database schema issue: ${tableCheckError.message}`);
            setIsLoading(false);
            return;
          }
          
          console.log("Rentals table exists, proceeding with fetching data");
        } catch (schemaError) {
          console.error("Schema validation error:", schemaError);
          setError("Failed to validate database schema. Please check your database configuration.");
          setIsLoading(false);
          return;
        }

        setShopId(shop.id);
        fetchBookings(shop.id);
      } catch (error) {
        console.error("Error checking user/shop:", error);
        setError("Failed to verify your account.");
        setIsLoading(false);
      }
    };

    checkUserAndShop();
  }, [user, supabase, router]);

  const fetchBookings = async (shopId: string) => {
    try {
      setIsLoading(true);
      setError(''); // Clear previous errors
      console.log("fetchBookings: Starting to fetch bookings for shop:", shopId);
      
      // Calculate pagination
      const from = (currentPage - 1) * bookingsPerPage;
      const to = from + bookingsPerPage - 1;
      
      // Create a fresh client for this request
      const freshSupabase = createClientComponentClient();
      
      try {
        console.log("fetchBookings: Building query...");
        
        // Use minimal field selection to avoid schema issues
        let query = freshSupabase
          .from("rentals")
          .select(`
            id, 
            vehicle_id,
            user_id,
            start_date, 
            end_date, 
            total_price, 
            status,
            created_at
          `)
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false })
          .range(from, to);
        
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }
        
        console.log("fetchBookings: Executing rentals query...");
        const { data: rentalData, error: rentalsError } = await query;
        
        if (rentalsError) {
          console.error("fetchBookings: Supabase rentals query error:", rentalsError);
          throw new Error(`Database error: ${rentalsError.message || 'Unknown error'}`);
        }
        
        if (!rentalData) {
          console.log("fetchBookings: No rental data returned (null)");
          setBookings([]);
          setIsLoading(false);
          return;
        }
        
        console.log(`fetchBookings: Found ${rentalData.length} bookings`);
        
        if (rentalData.length === 0) {
          // No bookings, but this isn't an error
          setBookings([]);
          setIsLoading(false);
          return;
        }
        
        // Process the rentals to fetch related data
        console.log("fetchBookings: Processing bookings with related data");
        const processedBookings = await Promise.all(
          rentalData.map(async (rental) => {
            try {
              console.log(`Processing rental ${rental.id} with vehicle_id: ${rental.vehicle_id}`);
              
              // Get vehicle info
              let vehicleName = "Unknown Vehicle";
              let vehicleImageUrl = "/placeholder.jpg";
              
              if (rental.vehicle_id) {
                // Get vehicle name
                const { data: vehicleData, error: vehicleError } = await freshSupabase
                  .from("vehicles")
                  .select("name, price_per_day")
                  .eq("id", rental.vehicle_id)
                  .single();
                
                if (!vehicleError && vehicleData) {
                  vehicleName = vehicleData.name;
                  console.log(`Found vehicle: ${vehicleName}`);
                } else {
                  console.warn(`Error fetching vehicle ${rental.vehicle_id}:`, vehicleError);
                }
                
                // Get vehicle image (primary image first)
                const { data: vehicleImages, error: imagesError } = await freshSupabase
                  .from("vehicle_images")
                  .select("image_url")
                  .eq("vehicle_id", rental.vehicle_id)
                  .eq("is_primary", true)
                  .limit(1);
                
                if (!imagesError && vehicleImages && vehicleImages.length > 0) {
                  vehicleImageUrl = vehicleImages[0].image_url;
                  console.log("Found primary image");
                } else {
                  // If no primary image, try to get any image
                  const { data: anyImage } = await freshSupabase
                    .from("vehicle_images")
                    .select("image_url")
                    .eq("vehicle_id", rental.vehicle_id)
                    .limit(1);
                
                  if (anyImage && anyImage.length > 0) {
                    vehicleImageUrl = anyImage[0].image_url;
                    console.log("Found alternative image");
                  }
                }
              }
              
              // Get user info if available
              let userData = {
                first_name: "",
                last_name: "",
                email: ""
              };

              if (rental.user_id) {
                try {
                  // First try the users table
                  const { data: user, error: userError } = await freshSupabase
                    .from("users")
                    .select("first_name, last_name, email")
                    .eq("id", rental.user_id)
                    .single();
                  
                  if (!userError && user) {
                    userData = user;
                    console.log(`Found user: ${user.first_name || ''} ${user.last_name || ''}`);
                  } else {
                    // If not found in users table, we'll use the default empty values
                    console.log("User not found in users table, using ID only");
                  }
                } catch (userFetchError) {
                  console.error("Error fetching user data:", userFetchError);
                }
              }
              
              return {
                ...rental,
                vehicle: {
                  name: vehicleName,
                  image_url: vehicleImageUrl
                },
                user: userData
              };
            } catch (error) {
              console.error(`Error processing booking ${rental.id}:`, error);
              return {
                ...rental,
                vehicle: { name: "Unknown Vehicle" },
                user: null
              };
            }
          })
        );
        
        // Format the bookings data
        const formattedBookings = formatBookings(processedBookings);
        console.log("Formatted bookings ready for display");
        setBookings(formattedBookings);
        setTotalBookings(100); // Just a placeholder for pagination
        setIsLoading(false);
        
      } catch (queryError) {
        console.error("fetchBookings: Error during query:", queryError);
        const errorMessage = queryError instanceof Error ? queryError.message : "Unknown error";
        setError(`Error fetching bookings: ${errorMessage}`);
        setIsLoading(false);
      }
    } catch (outerError) {
      console.error("fetchBookings: Outer try-catch error:", outerError);
      const errorMessage = outerError instanceof Error ? outerError.message : "Unknown error";
      setError(`Error: ${errorMessage}`);
      setIsLoading(false);
    }
  };
  
  const formatBookings = (bookings: any[]) => {
    return bookings.map(booking => {
      // Use user data if available, otherwise create a generic customer name using the user ID
      const customerName = booking.user 
        ? `${booking.user.first_name || ''} ${booking.user.last_name || ''}`.trim() || "Guest"
        : booking.user_id 
          ? `Guest ${booking.user_id.substring(0, 6)}` 
          : "Guest";
        
      // Get email if available
      const customerEmail = booking.user && booking.user.email 
        ? booking.user.email 
        : '-';
        
      return {
        id: booking.id,
        vehicleName: booking.vehicle?.name || "Unknown Vehicle",
        vehicleImage: booking.vehicle?.image_url || "/placeholder.jpg",
        customerName,
        customerEmail,
        startDate: booking.start_date,
        endDate: booking.end_date,
        status: booking.status,
        totalPrice: booking.total_price,
        created_at: booking.created_at
      };
    });
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("rentals")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      // Refresh bookings
      if (shopId) {
        fetchBookings(shopId);
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status. Please try again.");
    }
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
    if (shopId) {
      fetchBookings(shopId);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (shopId) {
      fetchBookings(shopId);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (shopId) {
      fetchBookings(shopId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <ClockIcon size={12} className="mr-1" />
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Confirmed
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} className="mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const totalPages = Math.ceil(totalBookings / bookingsPerPage);

  // Effect to refetch when page, filter, or search changes
  useEffect(() => {
    if (shopId) {
      fetchBookings(shopId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, shopId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Toggle dropdown visibility
  const toggleDropdown = (bookingId: string) => {
    setOpenDropdownId(openDropdownId === bookingId ? null : bookingId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Bookings</h1>
          <p className="text-muted-foreground">View and manage your vehicle bookings</p>
        </div>
        
        {/* Debug info for development - this will help identify issues */}
        {debugInfo && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-2 rounded text-xs w-full">
            <strong>Debug:</strong> {debugInfo}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={16} className="mr-2" />
            Filter
            <ChevronDown size={16} className="ml-1" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
          >
            <Link href="/dashboard/bookings/calendar">
              <CalendarDays size={16} className="mr-2" />
              Calendar View
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      {isFilterOpen && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              variant={statusFilter === 'all' ? "default" : "outline"} 
              size="sm"
              onClick={() => handleFilterChange('all')}
            >
              All Bookings
            </Button>
            <Button 
              variant={statusFilter === 'pending' ? "default" : "outline"} 
              size="sm"
              onClick={() => handleFilterChange('pending')}
              className="bg-amber-500/10 text-amber-600 border-amber-200/30 hover:bg-amber-500/20 hover:text-amber-700"
            >
              Pending
            </Button>
            <Button 
              variant={statusFilter === 'confirmed' ? "default" : "outline"} 
              size="sm"
              onClick={() => handleFilterChange('confirmed')}
              className="bg-green-500/10 text-green-600 border-green-200/30 hover:bg-green-500/20 hover:text-green-700"
            >
              Confirmed
            </Button>
            <Button 
              variant={statusFilter === 'completed' ? "default" : "outline"} 
              size="sm"
              onClick={() => handleFilterChange('completed')}
              className="bg-blue-500/10 text-blue-600 border-blue-200/30 hover:bg-blue-500/20 hover:text-blue-700"
            >
              Completed
            </Button>
            <Button 
              variant={statusFilter === 'cancelled' ? "default" : "outline"} 
              size="sm"
              onClick={() => handleFilterChange('cancelled')}
              className="bg-red-500/10 text-red-600 border-red-200/30 hover:bg-red-500/20 hover:text-red-700"
            >
              Cancelled
            </Button>
          </div>
        </div>
      )}
      
      {/* Bookings List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
          {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-card border border-border rounded-lg p-6 text-center">
          <CalendarDays size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Bookings Found</h3>
          <p className="text-muted-foreground mb-6">
            {statusFilter !== 'all' 
              ? `You don't have any ${statusFilter} bookings.` 
              : "You don't have any bookings yet."}
          </p>
          <Button variant="outline" onClick={() => handleFilterChange('all')}>
            Show All Bookings
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img 
                            className="h-10 w-10 rounded-md object-cover" 
                            src={booking.vehicleImage} 
                            alt={booking.vehicleName}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.jpg';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{booking.vehicleName}</div>
                          <div className="text-xs text-muted-foreground">Booked: {format(new Date(booking.created_at), "MMM d, yyyy")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{booking.customerName}</div>
                      <div className="text-xs text-muted-foreground">{booking.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{format(new Date(booking.startDate), "MMM d")}</div>
                      <div className="text-xs text-muted-foreground">to {format(new Date(booking.endDate), "MMM d, yyyy")}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      ₱{booking.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark" asChild>
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Eye size={16} className="mr-1" />
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12 mb-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md bg-white/5 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md bg-white/5 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 