"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Calendar as CalendarIcon, List, Grid, Filter, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Add custom styles for the calendar
import './calendar-custom.css';

// Create localizer for calendar
const localizer = momentLocalizer(moment);

// Event styling based on booking status
const eventStyleGetter = (event: any) => {
  let style = {
    backgroundColor: '#8b5cf6', // primary color for default
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '2px 4px',
    fontSize: '0.9em',
    fontWeight: 'bold',
    opacity: 0.9
  };
  
  switch(event.status) {
    case 'pending':
      style.backgroundColor = '#fbbf24'; // amber-400, slightly less harsh than the previous color
      break;
    case 'confirmed':
      style.backgroundColor = '#34d399'; // emerald-400, more vibrant but not too harsh
      break;
    case 'completed':
      style.backgroundColor = '#818cf8'; // indigo-400, softer than previous color
      break;
    case 'cancelled':
      style.backgroundColor = '#f87171'; // red-400, slightly less harsh than previous
      break;
    default:
      break;
  }
  
  return { style };
};

interface BookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  resource: any;
}

// Add this helper function at the top of the file (outside the component)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add a timestamp cache for auth operations - shared between all components
// The variable is declared at the module level, so it will be shared
let lastAuthRefresh = 0;
const MIN_AUTH_REFRESH_INTERVAL = 60000; // 1 minute minimum between refreshes

// Add a timeout reference for debouncing
let fetchDataTimeoutRef: NodeJS.Timeout | null = null;

export default function BookingsCalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingEvent[]>([]);
  const [vehicles, setVehicles] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [view, setView] = useState('month');
  // Add state to track rate limit errors
  const [hasRateLimitError, setHasRateLimitError] = useState(false);
  
  // Add effect to handle auth rate limit errors
  useEffect(() => {
    // If we detect a rate limit error, show a message but don't automatically redirect
    if (hasRateLimitError) {
      setError("You've been hitting Supabase's rate limits. Please wait a moment and try refreshing the page manually.");
      setIsLoading(false);
    }
  }, [hasRateLimitError]);
  
  // Fetch bookings and vehicles
  useEffect(() => {
    // Clear any pending timeout when dependencies change
    if (fetchDataTimeoutRef) {
      clearTimeout(fetchDataTimeoutRef);
    }
    
    // Reset rate limit error state on fresh fetch attempt
    setHasRateLimitError(false);
    
    // Debounce the fetch operation to prevent rapid consecutive calls
    fetchDataTimeoutRef = setTimeout(() => {
      const fetchData = async (retryCount = 0) => {
        if (!user) {
          console.log("User not authenticated, skipping fetch");
          return;
        }
        
        console.log(`Starting to fetch booking calendar data (attempt ${retryCount + 1})`);
        
        try {
          setIsLoading(true);
          
          // Use the same Supabase client instance for all operations
          const supabase = createClientComponentClient();
          const now = Date.now();
          
          try {
            // Only check auth if we haven't refreshed recently
            if (now - lastAuthRefresh > MIN_AUTH_REFRESH_INTERVAL) {
              console.log("Checking auth session...");
              
              // Get current session but don't force a refresh every time
              const { data: sessionData } = await supabase.auth.getSession();
              
              if (!sessionData.session) {
                console.error("No active session found, redirecting to login");
                router.push("/sign-in");
                return;
              }
              
              // Only refresh if token is about to expire (within 5 minutes)
              const expiresAt = sessionData.session.expires_at;
              const expiresIn = expiresAt ? expiresAt - Math.floor(now / 1000) : 0;
              
              if (expiresIn < 300) { // less than 5 minutes left
                console.log("Token expiring soon, refreshing auth session...");
                const { error: refreshError } = await supabase.auth.refreshSession();
                
                if (refreshError) {
                  if (refreshError.message.includes("rate limit")) {
                    console.log("Hit rate limit on auth refresh");
                    setHasRateLimitError(true);
                    
                    if (retryCount < 2) {
                      console.log("Waiting before retry due to rate limit...");
                      // Exponential backoff - wait longer for each retry
                      const backoffTime = Math.pow(2, retryCount) * 2000;
                      await delay(backoffTime);
                      fetchData(retryCount + 1);
                      return;
                    } else {
                      // Don't redirect, just show a message to the user
                      throw new Error("Rate limit reached. Please wait a moment before trying again.");
                    }
                  }
                  
                  console.error("Failed to refresh session:", refreshError);
                  // If rate limited, wait before continuing
                  if (refreshError.message.includes("rate limit")) {
                    await delay(2000);
                  }
                } else {
                  // Update the timestamp for successful refresh
                  lastAuthRefresh = now;
                }
              } else {
                console.log(`Token valid for ${Math.floor(expiresIn / 60)} more minutes, no refresh needed`);
              }
            } else {
              console.log("Recent auth refresh exists, skipping");
            }
          } catch (authError) {
            console.error("Auth check failed:", authError);
            
            // Check for rate limit errors in the auth process
            if (authError instanceof Error && authError.message.includes("rate limit")) {
              setHasRateLimitError(true);
              throw new Error("Rate limit reached. Please wait a moment before trying again.");
            }
            
            // Continue with existing client, don't retry auth immediately
          }
          
          // Shop query with the shared client
          console.log("Fetching shop data for user:", user.id);
          let shopQuery;
          
          try {
            shopQuery = await supabase
              .from('rental_shops')
              .select('id')
              .eq('owner_id', user.id)
              .single();
          } catch (shopQueryError) {
            console.error("Error executing shop query:", shopQueryError);
            throw new Error("Failed to query shop data");
          }
          
          const { data: shop, error: shopError } = shopQuery;
          
          if (shopError) {
            if (Object.keys(shopError).length > 0) {
              console.error('Shop query error details:', {
                message: shopError.message,
                details: shopError.details,
                hint: shopError.hint,
                code: shopError.code
              });
              setError(`Shop error: ${shopError.message || 'Unknown shop error'}`);
            } else {
              console.error("Empty shop error object - likely an auth issue");
              
              // If this is not the final retry attempt, try again with exponential backoff
              if (retryCount < 2) {
                console.log(`Retrying data fetch (attempt ${retryCount + 2})...`);
                setIsLoading(false);
                // Exponential backoff for retries
                const backoffTime = Math.pow(2, retryCount) * 1000;
                await delay(backoffTime);
                fetchData(retryCount + 1);
                return;
              }
              
              setError("Authentication error. Please refresh the page or sign in again.");
            }
            setIsLoading(false);
            return;
          }
          
          if (!shop) {
            console.error('No shop found for user:', user.id);
            setError('No shop found for your account. Please set up your shop first.');
            setIsLoading(false);
            return;
          }
          
          console.log("Found shop with ID:", shop.id);
          
          // Get all vehicles for this shop - using the same client instance
          console.log("Fetching vehicles for shop:", shop.id);
          try {
            const { data: vehiclesData, error: vehiclesError } = await supabase
              .from('vehicles')
              .select('id, name')
              .eq('shop_id', shop.id)
              .order('name', { ascending: true });
              
            if (vehiclesError) {
              console.error('Error fetching vehicles:', {
                message: vehiclesError.message,
                details: vehiclesError.details,
                hint: vehiclesError.hint,
                code: vehiclesError.code
              });
            } else {
              console.log(`Found ${vehiclesData?.length || 0} vehicles`);
              setVehicles(vehiclesData || []);
            }
          } catch (vehiclesErr) {
            console.error('Unexpected error fetching vehicles:', vehiclesErr);
          }
          
          // Get all bookings for this shop - using the same client instance
          console.log("Fetching bookings for shop:", shop.id);
          try {
            let bookingsResult;
            try {
              console.log("About to execute rentals query...");
              
              // Simple approach first - just get the basic fields
              bookingsResult = await supabase
                .from('rentals')
                .select('id, vehicle_id, user_id, start_date, end_date, status, total_price')
                .eq('shop_id', shop.id);
              
              console.log("Query executed");
            } catch (queryExecutionError) {
              console.error("Error during Supabase rentals query execution:", queryExecutionError);
              
              // Try to handle network errors specifically
              if (queryExecutionError instanceof Error) {
                if (queryExecutionError.message.includes('fetch') || 
                    queryExecutionError.message.includes('network') ||
                    queryExecutionError.message.includes('Failed to fetch')) {
                  throw new Error("Network connection error. Please check your internet connection and try again.");
                }
              }
              
              // If this is not the final retry attempt, try again with exponential backoff
              if (retryCount < 2) {
                console.log(`Retrying after query execution error (attempt ${retryCount + 2})...`);
                setIsLoading(false);
                // Exponential backoff for retries
                const backoffTime = Math.pow(2, retryCount) * 1000;
                await delay(backoffTime);
                fetchData(retryCount + 1);
                return;
              }
              
              throw new Error(`Query execution error: ${queryExecutionError instanceof Error ? queryExecutionError.message : 'Unknown error'}`);
            }
            
            const { data: bookingsData, error: bookingsError } = bookingsResult;
            
            if (bookingsError) {
              // If we have a structured error, log the details
              if (Object.keys(bookingsError).length > 0) {
                console.error('Bookings query error details:', {
                  message: bookingsError.message,
                  details: bookingsError.details,
                  hint: bookingsError.hint,
                  code: bookingsError.code
                });
                setError(`Failed to load booking data: ${bookingsError.message || 'Unknown error'}`);
              } else {
                // If we get an empty error object and this is not the final retry attempt, try again with exponential backoff
                console.error("Empty bookings error object - likely an auth issue");
                
                if (retryCount < 2) {
                  console.log(`Retrying after empty error object (attempt ${retryCount + 2})...`);
                  setIsLoading(false);
                  // Exponential backoff for retries
                  const backoffTime = Math.pow(2, retryCount) * 1000;
                  await delay(backoffTime);
                  fetchData(retryCount + 1);
                  return;
                }
                
                setError("Authentication error. Please try refreshing the page or signing in again.");
              }
              setIsLoading(false);
              return;
            }
            
            if (!bookingsData) {
              console.log("No bookings data returned (null)");
              setBookings([]);
              setIsLoading(false);
              return;
            }
            
            console.log(`Found ${bookingsData.length} bookings`);
            
            if (bookingsData.length === 0) {
              // No bookings, but this isn't an error
              setBookings([]);
              setIsLoading(false);
              return;
            }
            
            // Fetch vehicle data separately for each booking
            const bookingPromises = bookingsData.map(async (booking) => {
              try {
                // Get vehicle info if we have vehicle_id
                if (booking.vehicle_id) {
                  console.log(`Fetching vehicle data for booking ${booking.id}, vehicle: ${booking.vehicle_id}`);
                  const { data: vehicleData, error: vehicleError } = await supabase
                    .from("vehicles")
                    .select("name")
                    .eq("id", booking.vehicle_id)
                    .single();
                    
                  if (!vehicleError && vehicleData) {
                    booking.vehicle_name = vehicleData.name;
                  } else {
                    console.error('Vehicle error details:', {
                      message: vehicleError?.message,
                      details: vehicleError?.details,
                      hint: vehicleError?.hint,
                      code: vehicleError?.code
                    });
                    booking.vehicle_name = "Unknown Vehicle";
                  }
                } else {
                  console.log(`Booking ${booking.id} has no vehicle_id`);
                  booking.vehicle_name = "Unknown Vehicle";
                }
                
                return booking;
              } catch (error) {
                console.error(`Error fetching vehicle details for booking ${booking.id}:`, error);
                booking.vehicle_name = "Unknown Vehicle";
                return booking;
              }
            });
            
            try {
              console.log("Processing all booking vehicle data");
              const processedBookings = await Promise.all(bookingPromises);
              
              // Format bookings for calendar
              const formattedBookings = processedBookings.map(booking => {
                // Check for valid dates
                if (!booking.start_date || !booking.end_date) {
                  console.warn('Booking is missing start or end date:', booking.id);
                  return null;
                }
                
                const vehicleName = booking.vehicle_name || 'Vehicle';
                // Use short user_id instead of guest_name since guest_name doesn't exist
                const customerName = booking.user_id 
                  ? `Customer ${booking.user_id.substring(0, 6)}` 
                  : 'Customer';
                
                return {
                  id: booking.id,
                  title: `${vehicleName} - ${customerName}`,
                  start: new Date(booking.start_date),
                  end: new Date(booking.end_date),
                  status: booking.status,
                  resource: booking,
                };
              }).filter(booking => booking !== null) as BookingEvent[];
              
              console.log(`Processed ${formattedBookings.length} bookings for calendar`);
              setBookings(formattedBookings);
            } catch (promiseError) {
              console.error('Error processing bookings:', promiseError);
              setError('Error processing booking data');
            }
          } catch (bookingsErr) {
            console.error('Unexpected error in bookings query:', bookingsErr);
            setError(`Unexpected error: ${bookingsErr instanceof Error ? bookingsErr.message : 'Unknown error'}`);
          }
        } catch (err) {
          console.error('Top level error in fetchData:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(`Failed to load bookings: ${errorMessage}`);
        } finally {
          console.log("Finished fetching calendar data");
          setIsLoading(false);
        }
      };
      
      fetchData();
    }, 100); // Small delay to allow state to settle
    
    // Cleanup function
    return () => {
      if (fetchDataTimeoutRef) {
        clearTimeout(fetchDataTimeoutRef);
      }
    };
  }, [user, router]); // Only re-run when user or router changes
  
  // Filter bookings by selected vehicle
  const filteredBookings = selectedVehicle === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.resource.vehicle_id === selectedVehicle);
  
  // Handle booking click
  const handleSelectEvent = (event: BookingEvent) => {
    router.push(`/dashboard/bookings/${event.id}`);
  };
  
  return (
    <div className="space-y-6 pb-8 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="group transition-all duration-200 hover:border-primary/50"
            >
              <Link href="/dashboard/bookings">
                <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Bookings</span>
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Bookings Calendar</h1>
          <p className="text-muted-foreground text-sm">Visualize and manage your bookings across time</p>
        </div>
        
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="transition-all duration-200"
          >
            <Link href="/dashboard/bookings">
              <List className="h-4 w-4 mr-2" />
              List View
            </Link>
          </Button>
          <Button 
            size="sm"
            className="shadow-sm transition-all duration-200"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading calendar data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-lg shadow-sm flex flex-col items-center">
          <p className="mb-4">{error}</p>
          {hasRateLimitError && (
            <Button 
              onClick={() => {
                setIsLoading(true);
                setError('');
                // Wait a moment before trying again
                setTimeout(() => {
                  // Force a full page refresh to clear any stale state
                  window.location.reload();
                }, 2000);
              }}
              className="mt-2"
            >
              Wait and Retry
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-5 bg-card/50 p-4 rounded-lg border border-border/70 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <p className="text-xs text-muted-foreground font-medium w-full mb-1.5">Filter by vehicle:</p>
              <Button 
                variant={selectedVehicle === 'all' ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedVehicle('all')}
                className="transition-all duration-200"
              >
                All Vehicles
              </Button>
              
              <div className="flex flex-wrap gap-2 max-w-full">
                {vehicles.map(vehicle => (
                  <Button 
                    key={vehicle.id} 
                    variant={selectedVehicle === vehicle.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    className="transition-all duration-200"
                  >
                    {vehicle.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground font-medium">View options:</p>
              <div className="flex items-center gap-2">
                <Button 
                  variant={view === 'month' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setView('month')}
                  className="transition-all duration-200"
                >
                  Month
                </Button>
                <Button 
                  variant={view === 'week' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setView('week')}
                  className="transition-all duration-200"
                >
                  Week
                </Button>
                <Button 
                  variant={view === 'day' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setView('day')}
                  className="transition-all duration-200"
                >
                  Day
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg overflow-hidden p-4 sm:p-5 shadow-sm">
            <div className="h-[400px] sm:h-[500px] md:h-[600px] calendar-container">
              <Calendar
                localizer={localizer}
                events={filteredBookings}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                view={view as any}
                onView={(view) => setView(view)}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                popup
                className="custom-calendar"
              />
            </div>
          </div>
          
          <div className="mt-6 p-5 bg-white dark:bg-gray-800 border border-border rounded-lg text-sm shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-primary rounded-full"></div>
              <h3 className="font-medium text-base">Booking Status Legend</h3>
            </div>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <div className="w-5 h-5 rounded-sm bg-[#fbbf24]"></div>
                <div>
                  <span className="font-medium">Pending</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Awaiting confirmation</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <div className="w-5 h-5 rounded-sm bg-[#34d399]"></div>
                <div>
                  <span className="font-medium">Confirmed</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Ready for pickup</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <div className="w-5 h-5 rounded-sm bg-[#818cf8]"></div>
                <div>
                  <span className="font-medium">Completed</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Rental finished</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                <div className="w-5 h-5 rounded-sm bg-[#f87171]"></div>
                <div>
                  <span className="font-medium">Cancelled</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Booking cancelled</p>
                </div>
              </div>
            </div>
            
            <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Click on any booking event to view its details and manage the reservation
            </p>
          </div>
        </>
      )}
    </div>
  );
} 