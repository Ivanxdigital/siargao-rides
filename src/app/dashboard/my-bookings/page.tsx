"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addHours, isAfter, isBefore, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Calendar,
  Bike,
  ChevronRight,
  CalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { notifyBookingStatusChange } from '@/lib/notifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDateChangeOpen, setIsDateChangeOpen] = useState(false);
  const [newStartDate, setNewStartDate] = useState<Date | undefined>(undefined);
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(undefined);
  const [dateChangeReason, setDateChangeReason] = useState("");
  const [isSubmittingDateChange, setIsSubmittingDateChange] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    // REMOVED: Auth check is now handled by the layout
    // if (!isLoading && !isAuthenticated) {
    //   router.push("/sign-in");
    //   return;
    // }

    if (isAuthenticated && user) {
      fetchUserBookings();
    }
  }, [isAuthenticated, isLoading, user, statusFilter]);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);

      // Base query for rentals
      let query = supabase
        .from("rentals")
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          status,
          created_at,
          vehicle_id,
          vehicle_type_id,
          shop_id
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

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

      // Enhanced logging to debug id issues
      console.log("Rental data:", rentalData);
      if (rentalData && rentalData.length > 0) {
        console.log("Sample booking ID:", rentalData[0].id);
        console.log("Booking ID type:", typeof rentalData[0].id);
        console.log("All booking IDs:", rentalData.map(b => b.id));
      }

      // Process the rentals to fetch related data
      if (rentalData && rentalData.length > 0) {
        const processedBookings = await Promise.all(
          rentalData.map(async (rental) => {
            try {
              // Get vehicle info with all possible image fields
              const { data: vehicleData, error: vehicleError } = await supabase
                .from("vehicles")
                .select("*")  // Select all fields to ensure we get all image related fields
                .eq("id", rental.vehicle_id)
                .single();

              if (vehicleError) {
                console.error("Error fetching vehicle data:", vehicleError);
                return {
                  ...rental,
                  vehicle: { name: "Unknown Vehicle" },
                  shop: null
                };
              }

              console.log("Full vehicle data:", vehicleData);

              // Try multiple possible sources for the vehicle image
              let vehicleImageUrl: string | null = null;

              // Check if we have vehicle images
              const { data: vehicleImages, error: vehicleImagesError } = await supabase
                .from("vehicle_images")
                .select("*")
                .eq("vehicle_id", rental.vehicle_id)
                .eq("is_primary", true)
                .limit(1);

              if (!vehicleImagesError && vehicleImages && vehicleImages.length > 0) {
                vehicleImageUrl = vehicleImages[0].image_url;
              }
              // Fallback to other possible image sources
              else if (vehicleData?.image_url) {
                vehicleImageUrl = vehicleData.image_url;
              }
              // Check for images array (structured as objects with image_url)
              else if (vehicleData?.images && Array.isArray(vehicleData.images) && vehicleData.images.length > 0) {
                if (typeof vehicleData.images[0] === 'string') {
                  vehicleImageUrl = vehicleData.images[0];
                } else if (vehicleData.images[0]?.image_url) {
                  vehicleImageUrl = vehicleData.images[0].image_url;
                }
              }
              // Check for main_image_url field
              else if (vehicleData?.main_image_url) {
                vehicleImageUrl = vehicleData.main_image_url;
              }
              // Check for thumbnail field
              else if (vehicleData?.thumbnail) {
                vehicleImageUrl = vehicleData.thumbnail;
              }

              console.log("Final resolved vehicle image URL:", vehicleImageUrl);

              // Get shop info
              const { data: shopData } = await supabase
                .from("rental_shops")
                .select("name, address")
                .eq("id", rental.shop_id)
                .single();

              return {
                ...rental,
                vehicle: {
                  ...vehicleData,
                  imageUrl: vehicleImageUrl
                },
                shop: shopData
              };
            } catch (error) {
              console.error("Error processing booking:", error);
              return {
                ...rental,
                vehicle: { name: "Error loading vehicle data" },
                shop: null
              };
            }
          })
        );

        setBookings(processedBookings);
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

  const canChangeDates = (booking: any) => {
    // Allow date change only if:
    // 1. Booking is in "pending" or "confirmed" status
    // 2. Start date is at least 48 hours in the future
    const allowedStatuses = ["pending", "confirmed"];
    if (!allowedStatuses.includes(booking.status)) return false;

    const now = new Date();
    const startDate = new Date(booking.start_date);
    const hoursUntilStart = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    return hoursUntilStart >= 48;
  };

  const canCancelBooking = (booking: any) => {
    // Allow cancellation only if:
    // 1. Booking is in "pending" or "confirmed" status
    // 2. Start date is at least 24 hours in the future
    const allowedStatuses = ["pending", "confirmed"];
    if (!allowedStatuses.includes(booking.status)) return false;

    const now = new Date();
    const startDate = new Date(booking.start_date);
    const hoursUntilStart = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    return hoursUntilStart >= 24;
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancelling(bookingId);

      // Get the booking details for the notification
      const { data: bookingData, error: fetchError } = await supabase
        .from("rentals")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Get vehicle data separately
      let vehicleName = 'Vehicle'; // Default fallback
      if (bookingData && bookingData.vehicle_id) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", bookingData.vehicle_id)
          .single();

        if (!vehicleError && vehicleData) {
          vehicleName = vehicleData.name || 'Vehicle';
        }
      }

      // Update booking status to cancelled
      const { error } = await supabase
        .from("rentals")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: user!.id,
          cancellation_reason: "Cancelled by user"
        })
        .eq("id", bookingId)
        .eq("user_id", user!.id); // Ensure the booking belongs to this user

      if (error) throw error;

      // Refresh bookings
      fetchUserBookings();

      // Use toast notification instead of alert
      notifyBookingStatusChange(bookingId, vehicleName, 'cancelled');
    } catch (error) {
      console.error("Error cancelling booking:", error);
      // Show error with toast instead of alert
      toast.error("Failed to cancel booking", {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setCancelling(null);
    }
  };

  const handleDateChangeRequest = async () => {
    if (!selectedBooking || !newStartDate || !newEndDate || !dateChangeReason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate dates
    if (isBefore(newEndDate, newStartDate)) {
      toast.error("End date cannot be before start date");
      return;
    }

    const now = new Date();
    if (isBefore(newStartDate, now)) {
      toast.error("Start date cannot be in the past");
      return;
    }

    try {
      setIsSubmittingDateChange(true);

      // First check if the new dates are available
      const { data: availabilityData, error: availabilityError } = await supabase
        .from("vehicles")
        .select("id")
        .eq("id", selectedBooking.vehicle_id)
        .not("rentals", "id", "eq", selectedBooking.id)
        .or(`end_date.lt.${newStartDate.toISOString()},start_date.gt.${newEndDate.toISOString()}`);

      if (availabilityError) {
        throw availabilityError;
      }

      if (!availabilityData || availabilityData.length === 0) {
        toast.error("The vehicle is not available for the selected dates");
        return;
      }

      // Create a date change request
      const { data: requestData, error: requestError } = await supabase
        .from("date_change_requests")
        .insert({
          booking_id: selectedBooking.id,
          user_id: user!.id,
          original_start_date: selectedBooking.start_date,
          original_end_date: selectedBooking.end_date,
          requested_start_date: newStartDate.toISOString(),
          requested_end_date: newEndDate.toISOString(),
          reason: dateChangeReason,
          status: "pending"
        })
        .select();

      if (requestError) {
        throw requestError;
      }

      // Add to booking history
      await supabase
        .from("booking_history")
        .insert({
          booking_id: selectedBooking.id,
          event_type: "date_change_request",
          notes: `Date change requested: ${format(newStartDate, "MMM d, yyyy")} to ${format(newEndDate, "MMM d, yyyy")}`,
          created_by: user!.id,
          metadata: {
            original_start_date: selectedBooking.start_date,
            original_end_date: selectedBooking.end_date,
            requested_start_date: newStartDate.toISOString(),
            requested_end_date: newEndDate.toISOString(),
            reason: dateChangeReason
          }
        });

      // Close the dialog and show success message
      setIsDateChangeOpen(false);

      // Clear form
      setSelectedBooking(null);
      setNewStartDate(undefined);
      setNewEndDate(undefined);
      setDateChangeReason("");

      toast.success("Date change request submitted", {
        description: "The shop owner will review your request and get back to you"
      });

      // Refresh bookings
      fetchUserBookings();

    } catch (error) {
      console.error("Error submitting date change request:", error);
      toast.error("Failed to submit date change request", {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmittingDateChange(false);
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

  // Redirect if not authenticated
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    // Removed the outer div and background/header section, as these are now handled by the layout
    <div className="container mx-auto px-0 py-0">
      {/* Adjusted padding and removed redundant headers */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All Bookings
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "confirmed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("confirmed")}
          >
            Confirmed
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === "cancelled" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("cancelled")}
          >
            Cancelled
          </Button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : loading ? (
        <div className="animate-pulse text-center py-20">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-lg">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-semibold mb-2">No bookings found</p>
          <p className="text-gray-400 mb-6">
            {statusFilter !== "all"
              ? `You don't have any ${statusFilter} bookings.`
              : "You haven't made any bookings yet."}
          </p>
          <Button asChild>
            <Link href="/browse">Browse Vehicles</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors">
              <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Vehicle Image */}
                <div className="w-full md:w-48 h-32 rounded-md overflow-hidden flex-shrink-0 bg-gray-800">
                  <img
                    src={booking.vehicle?.imageUrl || booking.vehicle?.image_url || "/placeholder.jpg"}
                    alt={booking.vehicle?.name || "Vehicle"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Image failed to load:", e.currentTarget.src);
                      e.currentTarget.src = "/placeholder.jpg";
                    }}
                  />
                </div>

                {/* Booking Details */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{booking.vehicle?.name || "Vehicle Rental"}</h3>
                      {getStatusBadge(booking.status)}
                    </div>

                    <p className="text-sm text-gray-400 mb-2">{booking.shop?.name} • {booking.shop?.address}</p>

                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          {format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bike className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          ₱{booking.vehicle?.price_per_day || 0}/day • Total: ₱{booking.total_price}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 mt-4 justify-between items-start md:items-center">
                    <div className="text-xs text-gray-400">
                      Booked on {format(new Date(booking.created_at), "MMMM d, yyyy")}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log("Booking ID before navigation:", booking.id);
                          console.log("Full booking object:", booking);
                        }}
                      >
                        <Link href={`/booking/confirmation/${booking.id?.toString()}`}>
                          View Details
                        </Link>
                      </Button>

                      {canChangeDates(booking) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNewStartDate(parseISO(booking.start_date));
                            setNewEndDate(parseISO(booking.end_date));
                            setIsDateChangeOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <CalendarClock size={14} />
                          Change Dates
                        </Button>
                      )}

                      {canCancelBooking(booking) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancelling === booking.id}
                        >
                          {cancelling === booking.id ? "Cancelling..." : "Cancel Booking"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date Change Request Dialog */}
      <Dialog open={isDateChangeOpen} onOpenChange={setIsDateChangeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Date Change</DialogTitle>
            <DialogDescription>
              Submit a request to change your booking dates. The shop owner will need to approve this request.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Current Dates:</span>
                <span>
                  {format(new Date(selectedBooking.start_date), "MMM d, yyyy")} - {format(new Date(selectedBooking.end_date), "MMM d, yyyy")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="start-date" className="text-sm font-medium">New Start Date</label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newStartDate && "text-gray-400"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newStartDate ? format(newStartDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={newStartDate}
                        onSelect={(date) => {
                          setNewStartDate(date);
                          setStartDateOpen(false);
                        }}
                        disabled={(date) => isBefore(date, new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label htmlFor="end-date" className="text-sm font-medium">New End Date</label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="end-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newEndDate && "text-gray-400"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newEndDate ? format(newEndDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={newEndDate}
                        onSelect={(date) => {
                          setNewEndDate(date);
                          setEndDateOpen(false);
                        }}
                        disabled={(date) => (
                          newStartDate ? isBefore(date, newStartDate) : isBefore(date, new Date())
                        )}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium">Reason for Date Change</label>
                <Input
                  id="reason"
                  placeholder="Please explain why you need to change the dates"
                  value={dateChangeReason}
                  onChange={(e) => setDateChangeReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDateChangeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDateChangeRequest}
              disabled={isSubmittingDateChange || !newStartDate || !newEndDate || !dateChangeReason.trim()}
            >
              {isSubmittingDateChange ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}