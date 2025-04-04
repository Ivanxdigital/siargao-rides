"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

// Icons
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from "lucide-react";

export default function DashboardBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bookingsPerPage = 10;
  
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkUserAndShop = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/sign-in");
          return;
        }

        // Get user's shop
        const { data: shop, error: shopError } = await supabase
          .from("rental_shops")
          .select("id")
          .eq("owner_id", session.user.id)
          .single();

        if (shopError || !shop) {
          setError("You don't have a shop. Please create one first.");
          setLoading(false);
          return;
        }

        setShopId(shop.id);
        fetchBookings(shop.id);
      } catch (error) {
        console.error("Error checking user/shop:", error);
        setError("Failed to verify your account.");
        setLoading(false);
      }
    };

    checkUserAndShop();
  }, [supabase, router]);

  const fetchBookings = async (shopId: string) => {
    try {
      setLoading(true);
      // Calculate pagination
      const from = (currentPage - 1) * bookingsPerPage;
      const to = from + bookingsPerPage - 1;
      
      console.log("Fetching bookings for shop:", shopId, "page:", currentPage);
      
      // Base query for rentals
      let query = supabase
        .from("rentals")
        .select(`
          id, 
          vehicle_id,
          vehicle_type_id,
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
      
      // Apply status filter if not "all"
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      // Execute the query to get rentals
      const { data: rentalData, error: rentalsError } = await query;
      
      if (rentalsError) {
        console.error("Supabase rentals query error:", rentalsError);
        throw new Error(rentalsError.message);
      }
      
      console.log("Rental data:", rentalData);
      
      // For now, set a dummy total count - we'll handle real pagination later
      // This is a workaround to avoid the TypeScript error with count parameter
      setTotalBookings(100); // Just show multiple pages for now
      
      // Process the rentals to fetch related data
      if (rentalData && rentalData.length > 0) {
        const processedBookings = await Promise.all(
          rentalData.map(async (rental) => {
            try {
              console.log("Processing rental with vehicle_id:", rental.vehicle_id);
              
              // Get vehicle info
              const { data: vehicleData, error: vehicleError } = await supabase
                .from("vehicles")
                .select("name, price_per_day")
                .eq("id", rental.vehicle_id)
                .single();
              
              if (vehicleError) {
                console.error("Error fetching vehicle:", vehicleError);
                throw vehicleError;
              }
              
              console.log("Vehicle data found:", vehicleData);
              
              // Get vehicle image (primary image first)
              const { data: vehicleImages, error: imagesError } = await supabase
                .from("vehicle_images")
                .select("image_url")
                .eq("vehicle_id", rental.vehicle_id)
                .eq("is_primary", true)
                .limit(1);
              
              let vehicleImageUrl = "/placeholder.jpg";
              
              if (!imagesError && vehicleImages && vehicleImages.length > 0) {
                vehicleImageUrl = vehicleImages[0].image_url;
                console.log("Found primary image:", vehicleImageUrl);
              } else {
                console.log("No primary image found, looking for any image");
                // If no primary image, try to get any image
                const { data: anyImage } = await supabase
                  .from("vehicle_images")
                  .select("image_url")
                  .eq("vehicle_id", rental.vehicle_id)
                  .limit(1);
                
                if (anyImage && anyImage.length > 0) {
                  vehicleImageUrl = anyImage[0].image_url;
                  console.log("Found alternative image:", vehicleImageUrl);
                } else {
                  console.log("No images found for vehicle, using placeholder");
                }
              }
              
              // Get user info if available
              let userData = null;
              if (rental.user_id) {
                const { data: user } = await supabase
                  .from("users")
                  .select("first_name, last_name")
                  .eq("id", rental.user_id)
                  .single();
                userData = user;
              }
              
              return {
                ...rental,
                vehicle: {
                  ...vehicleData,
                  image_url: vehicleImageUrl
                },
                user: userData
              };
            } catch (error) {
              console.error("Error processing booking:", error);
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
        console.log("Formatted bookings:", formattedBookings);
        setBookings(formattedBookings);
      } else {
        // No bookings found
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(`Error fetching bookings: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  const formatBookings = (bookings: any[]) => {
    return bookings.map(booking => {
      const customerName = booking.user 
        ? `${booking.user.first_name || ''} ${booking.user.last_name || ''}`.trim() || "Guest"
        : "Guest";
        
      return {
        id: booking.id,
        vehicleName: booking.vehicle?.name || "Unknown Vehicle",
        vehicleImage: booking.vehicle?.image_url || "/placeholder.jpg",
        customerName,
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
          <span className="flex items-center gap-1 text-yellow-400">
            <Clock size={14} />
            <span>Pending</span>
          </span>
        );
      case "confirmed":
        return (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle size={14} />
            <span>Confirmed</span>
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 text-blue-400">
            <CheckCircle size={14} />
            <span>Completed</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1 text-red-400">
            <XCircle size={14} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-gray-400">
            <AlertTriangle size={14} />
            <span>{status}</span>
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
    <div className="flex flex-col min-h-screen space-y-6 pb-36 overflow-visible relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Manage Bookings</h1>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bookings..."
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
            <button type="submit" className="sr-only">Search</button>
          </form>
          <div className="relative group">
            <button
              className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-md"
            >
              <Filter size={16} /> 
              <span>Filter</span>
            </button>
            <div className="absolute right-0 mt-2 py-2 w-48 bg-black/90 backdrop-blur-sm border border-white/10 rounded-md shadow-lg z-10 hidden group-hover:block">
              <button
                onClick={() => handleFilterChange("all")}
                className={`block w-full text-left px-4 py-2 hover:bg-white/5 ${
                  statusFilter === "all" ? "bg-white/10" : ""
                }`}
              >
                All Bookings
              </button>
              <button
                onClick={() => handleFilterChange("pending")}
                className={`block w-full text-left px-4 py-2 hover:bg-white/5 ${
                  statusFilter === "pending" ? "bg-white/10" : ""
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleFilterChange("confirmed")}
                className={`block w-full text-left px-4 py-2 hover:bg-white/5 ${
                  statusFilter === "confirmed" ? "bg-white/10" : ""
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => handleFilterChange("completed")}
                className={`block w-full text-left px-4 py-2 hover:bg-white/5 ${
                  statusFilter === "completed" ? "bg-white/10" : ""
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => handleFilterChange("cancelled")}
                className={`block w-full text-left px-4 py-2 hover:bg-white/5 ${
                  statusFilter === "cancelled" ? "bg-white/10" : ""
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : loading ? (
        <div className="animate-pulse text-center py-20">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-md">
          <p className="text-gray-400">No bookings found.</p>
          <p className="text-sm mt-2">
            {statusFilter !== "all" 
              ? `No ${statusFilter} bookings at the moment.` 
              : "When customers book your bikes, they'll appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left">Booking Details</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Dates</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <img
                          src={booking.vehicleImage || "/placeholder.jpg"}
                          alt={`${booking.vehicleName || "Vehicle"}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.log("Image failed to load:", e.currentTarget.src);
                            e.currentTarget.src = "/placeholder.jpg";
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium truncate w-40">
                          {booking.vehicleName || "Unknown Vehicle"}
                        </p>
                        <p className="text-sm text-gray-400">
                          ₱{(booking.totalPrice || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{booking.customerName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-gray-200">
                      {format(new Date(booking.startDate), "MMM d")} - {format(new Date(booking.endDate), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-gray-400">Booked: {format(new Date(booking.created_at), "MMM d, yyyy")}</p>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/dashboard/bookings/${booking.id}`}
                        className="px-3 py-1 text-xs bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                      >
                        View Details
                      </Link>
                      <div className="relative" ref={dropdownRef}>
                        <button 
                          className="px-3 py-1 text-xs bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                          onClick={() => toggleDropdown(booking.id)}
                        >
                          Update Status
                        </button>
                        {openDropdownId === booking.id && (
                          <div className="absolute right-0 mt-1 py-2 w-40 bg-black/90 backdrop-blur-sm border border-white/10 rounded-md shadow-lg z-50">
                            {booking.status !== "confirmed" && (
                              <button
                                onClick={() => {
                                  handleStatusChange(booking.id, "confirmed");
                                  setOpenDropdownId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-green-400 hover:bg-white/5"
                              >
                                Confirm
                              </button>
                            )}
                            {booking.status !== "completed" && booking.status !== "cancelled" && (
                              <button
                                onClick={() => {
                                  handleStatusChange(booking.id, "completed");
                                  setOpenDropdownId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-blue-400 hover:bg-white/5"
                              >
                                Mark as Completed
                              </button>
                            )}
                            {booking.status !== "cancelled" && (
                              <button
                                onClick={() => {
                                  handleStatusChange(booking.id, "cancelled");
                                  setOpenDropdownId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-red-400 hover:bg-white/5"
                              >
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Spacer to push pagination to bottom */}
      <div className="flex-grow"></div>
      
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