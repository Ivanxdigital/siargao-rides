"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Calendar, User, Bike, MapPin, CreditCard, CheckCircle, XCircle, Clock, AlertTriangle, Eye } from "lucide-react";
import AutoCancellationOverride from "@/components/AutoCancellationOverride";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { notifyBookingStatusChange } from '@/lib/notifications';
import { toast } from 'sonner';

interface VehicleData {
  id: string;
  name: string;
  price_per_day: number;
  description?: string;
  image_url?: string;
  [key: string]: any; // For other properties
}

// Add this helper function at the top of the file (outside the component)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add a timestamp cache for auth operations
let lastAuthRefresh = 0;
const MIN_AUTH_REFRESH_INTERVAL = 60000; // 1 minute minimum between refreshes

export default function BookingDetailsPage() {
  // Use the useParams hook to get the id parameter
  const params = useParams();
  const bookingId = params?.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchBooking = async (retryCount = 0) => {
      if (!bookingId) {
        setError("Booking ID is missing");
        setLoading(false);
        return;
      }

      console.log(`Starting to fetch details for booking ID: ${bookingId} (attempt ${retryCount + 1})`);

      try {
        // Check if user is authenticated
        if (!user) {
          console.log("User not authenticated, redirecting to sign-in");
          router.push("/sign-in");
          return;
        }

        // Use the same Supabase client instance for all operations
        // Only check auth if we haven't refreshed recently
        let freshSupabase = supabase;
        const now = Date.now();

        try {
          if (now - lastAuthRefresh > MIN_AUTH_REFRESH_INTERVAL) {
            console.log("Checking auth session...");

            // Get current session but don't force a refresh every time
            let sessionData;
            try {
              sessionData = (await freshSupabase.auth.getSession()).data;
            } catch (tokenError) {
              console.error('Error getting session:', tokenError);

              // If there's a JWT token error, sign out and redirect to login
              if (tokenError.message?.includes('Invalid value for JWT claim')) {
                console.log('Invalid JWT token detected, signing out...');
                await freshSupabase.auth.signOut();
                router.push("/sign-in");
                return;
              }
              throw tokenError; // Re-throw other errors
            }

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
              let refreshError;
              try {
                const refreshResult = await freshSupabase.auth.refreshSession();
                refreshError = refreshResult.error;
              } catch (tokenError) {
                console.error('Error refreshing session:', tokenError);

                // If there's a JWT token error, sign out and redirect to login
                if (tokenError.message?.includes('Invalid value for JWT claim')) {
                  console.log('Invalid JWT token detected during refresh, signing out...');
                  await freshSupabase.auth.signOut();
                  router.push("/sign-in");
                  return;
                }
                throw tokenError; // Re-throw other errors
              }

              if (refreshError) {
                if (refreshError.message.includes("rate limit") && retryCount < 2) {
                  console.log("Hit rate limit, waiting before retry...");
                  // Exponential backoff - wait longer for each retry
                  const backoffTime = Math.pow(2, retryCount) * 2000;
                  await delay(backoffTime);
                  checkUserAndFetchBooking(retryCount + 1);
                  return;
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
          // Continue with existing client, don't retry auth immediately
        }

        console.log(`Fetching shop for user ID: ${user.id}`);

        // Get user's shop
        let shopQuery;
        try {
          shopQuery = await freshSupabase
            .from("rental_shops")
            .select("id")
            .eq("owner_id", user.id)
            .single();
        } catch (shopQueryError) {
          console.error("Error executing shop query:", shopQueryError);
          throw new Error("Failed to query shop data");
        }

        const { data: shop, error: shopError } = shopQuery;

        if (shopError) {
          if (Object.keys(shopError).length > 0) {
            console.error("Shop query error details:", {
              message: shopError.message,
              details: shopError.details,
              hint: shopError.hint,
              code: shopError.code
            });
            setError(`Shop error: ${shopError.message || "Unknown shop error"}`);
          } else {
            console.error("Empty shop error object - likely an auth issue");

            // If this is not the final retry attempt, try again with exponential backoff
            if (retryCount < 2) {
              console.log(`Retrying data fetch (attempt ${retryCount + 2})...`);
              // Exponential backoff for retries
              const backoffTime = Math.pow(2, retryCount) * 1000;
              await delay(backoffTime);
              checkUserAndFetchBooking(retryCount + 1);
              return;
            }

            setError("Authentication error. Please refresh the page or sign in again.");
          }
          setLoading(false);
          return;
        }

        if (!shop) {
          console.error("No shop found for user:", user.id);
          setError("You don't have a shop. Please create one first.");
          setLoading(false);
          return;
        }

        console.log(`Found shop with ID: ${shop.id}`);
        setShopId(shop.id);

        console.log(`Fetching booking with ID: ${bookingId} for shop: ${shop.id}`);

        try {
          // Fetch the booking details - use the same client instance, don't create a new one
          console.log(`Executing query for booking ${bookingId} in shop ${shop.id}`);
          let bookingResult;
          try {
            console.log("About to execute Supabase query...");

            // Use simple field selection for more reliability, removing guest fields that don't exist
            bookingResult = await freshSupabase
              .from("rentals")
              .select("id, start_date, end_date, total_price, status, created_at, vehicle_id, shop_id, user_id, payment_method_id, delivery_option_id, payment_status, deposit_required, deposit_paid, deposit_amount, deposit_processed, pickup_time, grace_period_minutes, auto_cancel_enabled, auto_cancel_processed, shop_owner_override, contact_info")
              .eq("id", bookingId)
              .eq("shop_id", shop.id)
              .single();

            console.log("Query executed");
          } catch (queryExecutionError) {
            console.error("Error during Supabase query execution:", queryExecutionError);

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
              // Exponential backoff for retries
              const backoffTime = Math.pow(2, retryCount) * 1000;
              await delay(backoffTime);
              checkUserAndFetchBooking(retryCount + 1);
              return;
            }

            throw new Error(`Query execution error: ${queryExecutionError instanceof Error ? queryExecutionError.message : 'Unknown error'}`);
          }

          const { data: bookingData, error: bookingError } = bookingResult;

          if (bookingError) {
            // If we have a structured error, log the details
            if (Object.keys(bookingError).length > 0) {
              console.error("Booking query error details:", {
                message: bookingError.message,
                details: bookingError.details,
                hint: bookingError.hint,
                code: bookingError.code
              });
              setError(`Booking error: ${bookingError.message || "Booking not found or you don't have permission to view it."}`);
            } else {
              // If we get an empty error object and this is not the final retry attempt, try again
              console.error("Empty booking error object - likely an auth issue");

              if (retryCount < 2) {
                console.log(`Retrying after empty error object (attempt ${retryCount + 2})...`);
                // Exponential backoff for retries
                const backoffTime = Math.pow(2, retryCount) * 1000;
                await delay(backoffTime);
                checkUserAndFetchBooking(retryCount + 1);
                return;
              }

              setError("Authentication error. Please try refreshing the page or signing in again.");
            }
            setLoading(false);
            return;
          }

          if (!bookingData) {
            console.error("No booking data returned for ID:", bookingId);
            setError("Booking not found");
            setLoading(false);
            return;
          }

          console.log("Base booking data:", bookingData);

          // Now fetch all the related data in separate queries
          let vehicleData: VehicleData = {
            id: "",
            name: "Unknown Vehicle",
            price_per_day: 0,
            description: "",
            image_url: "/placeholder.jpg"
          };
          let shopData = null;
          let userData = null;
          let paymentMethodData = null;
          let deliveryOptionData = null;

          // Get vehicle data
          if (bookingData.vehicle_id) {
            console.log(`Fetching vehicle with ID: ${bookingData.vehicle_id}`);
            const { data: vehicle, error: vehicleError } = await freshSupabase
              .from("vehicles")
              .select("*")
              .eq("id", bookingData.vehicle_id)
              .single();

            if (vehicleError) {
              console.warn("Error fetching vehicle details:", vehicleError);
            } else if (vehicle) {
              vehicleData = vehicle as VehicleData;

              // Get vehicle image (primary first)
              const { data: images } = await freshSupabase
                .from("vehicle_images")
                .select("image_url")
                .eq("vehicle_id", vehicle.id)
                .eq("is_primary", true)
                .limit(1);

              if (images && images.length > 0) {
                vehicleData.image_url = images[0].image_url;
              } else {
                // Try to get any image
                const { data: anyImage } = await freshSupabase
                  .from("vehicle_images")
                  .select("image_url")
                  .eq("vehicle_id", vehicle.id)
                  .limit(1);

                if (anyImage && anyImage.length > 0) {
                  vehicleData.image_url = anyImage[0].image_url;
                } else {
                  // Fallback to placeholder
                  vehicleData.image_url = "/placeholder.jpg";
                }
              }
            }
          }

          // Get shop data
          if (bookingData.shop_id) {
            console.log(`Fetching shop with ID: ${bookingData.shop_id}`);
            const { data: shop, error: shopDetailError } = await freshSupabase
              .from("rental_shops")
              .select("*")
              .eq("id", bookingData.shop_id)
              .single();

            if (shopDetailError) {
              console.warn("Error fetching shop details:", shopDetailError);
            } else {
              shopData = shop;
            }
          }

          // Get user data
          if (bookingData.user_id) {
            console.log(`Fetching user with ID: ${bookingData.user_id}`);
            try {
              const { data: user, error: userError } = await freshSupabase
                .from("users")
                .select("*")
                .eq("id", bookingData.user_id)
                .single();

              if (userError) {
                if (Object.keys(userError).length > 0) {
                  console.error("User query error details:", {
                    message: userError.message,
                    details: userError.details,
                    hint: userError.hint,
                    code: userError.code
                  });
                } else {
                  console.error("Empty user error object - likely an auth issue");
                }
              } else if (user) {
                userData = user;
              }
            } catch (userFetchError) {
              console.error("Error fetching user data:", userFetchError);
            }
          }

          // Get payment method
          if (bookingData.payment_method_id) {
            console.log(`Fetching payment method with ID: ${bookingData.payment_method_id}`);
            const { data: method, error: methodError } = await freshSupabase
              .from("payment_methods")
              .select("*")
              .eq("id", bookingData.payment_method_id)
              .single();

            if (methodError) {
              console.warn("Error fetching payment method:", methodError);
            } else {
              paymentMethodData = method;
            }
          }

          // Get delivery option
          if (bookingData.delivery_option_id) {
            console.log(`Fetching delivery option with ID: ${bookingData.delivery_option_id}`);
            const { data: delivery, error: deliveryError } = await freshSupabase
              .from("delivery_options")
              .select("*")
              .eq("id", bookingData.delivery_option_id)
              .single();

            if (deliveryError) {
              console.warn("Error fetching delivery option:", deliveryError);
            } else {
              deliveryOptionData = delivery;
            }
          }

          // Combine all the data
          const completeBooking = {
            ...bookingData,
            vehicle: vehicleData,
            shop: shopData,
            user: userData,
            payment_method: paymentMethodData,
            delivery_option: deliveryOptionData
          };

          console.log("Complete booking data:", completeBooking);
          setBooking(completeBooking);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching booking details:", err);
          setError(`Failed to load booking details: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setLoading(false);
        }
      } catch (err) {
        console.error("Top level error in checkUserAndFetchBooking:", err);
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    };

    // Start the data fetching process
    checkUserAndFetchBooking();
  }, [bookingId, user, router, supabase]);

  const handleStatusChange = async (newStatus: string) => {
    if (!bookingId) return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from("rentals")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      // Get vehicle name for the notification
      const vehicleName = booking?.vehicle?.name || 'Vehicle';

      // Instead of fetching all new data, just update the status in our existing state
      setBooking((prevBooking) => {
        if (!prevBooking) return null;
        return {
          ...prevBooking,
          status: newStatus
        };
      });

      setProcessing(false);

      // Show success message using toast instead of alert
      notifyBookingStatusChange(bookingId, vehicleName, newStatus as any);

    } catch (error) {
      console.error("Error updating status:", error);
      // Show error message using toast instead of alert
      toast.error("Failed to update booking status", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200/30 hover:bg-amber-500/20 hover:text-amber-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200/30 hover:bg-green-500/20 hover:text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200/30 hover:bg-blue-500/20 hover:text-blue-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200/30 hover:bg-red-500/20 hover:text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-200/30">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/dashboard/bookings">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Not Found</CardTitle>
          <CardDescription>The booking you are looking for does not exist or has been removed.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/dashboard/bookings">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Add null checks for vehicles and related properties
  const pricePerDay = booking.vehicle?.price_per_day || 0;
  const rentalPrice = pricePerDay * days;
  const deliveryFee = booking.delivery_option?.fee || 0;

  const customerName = booking.guest_name || (booking.user
    ? `${booking.user.first_name || ''} ${booking.user.last_name || ''}`.trim()
    : "Guest");

  const customerEmail = booking.guest_email || booking.user?.email || "N/A";
  const customerPhone = booking.guest_phone || booking.user?.phone || "N/A";

  const renderVehicleDetails = () => {
    if (!booking.vehicle) {
      return (
        <div className="text-muted-foreground">Vehicle information not available</div>
      );
    }

    return (
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 rounded-md overflow-hidden bg-muted">
          <img
            src={booking.vehicle.image_url || "/placeholder.jpg"}
            alt={booking.vehicle.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.jpg";
            }}
          />
        </div>
        <div>
          <h3 className="font-medium text-lg">{booking.vehicle.name}</h3>
          <p className="text-muted-foreground">{booking.vehicle.description || "No description provided"}</p>
          <p className="mt-1">₱{pricePerDay.toLocaleString()} per day</p>
        </div>
      </div>
    );
  };

  const renderShopDetails = () => {
    if (!booking.shop) {
      return (
        <div className="text-muted-foreground">Shop information not available</div>
      );
    }

    return (
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium">Shop Location</h3>
          <p>{booking.shop.name}</p>
          <p className="text-sm text-muted-foreground">{booking.shop.address || "No address provided"}</p>
        </div>
      </div>
    );
  };

  const renderPaymentDetails = () => {
    const isCashPayment = booking.payment_method_id === '0bea770f-c0c2-4510-a22f-e42fc122eb9c';
    const isTemporaryCashPayment = booking.payment_method_id === '5c5e37c7-3f69-4e72-ae03-10cab46f6724';
    const hasDepositPaid = booking.deposit_required && booking.deposit_paid;

    return (
      <div className="flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium">Payment</h3>
          <p>{booking.payment_method?.name || "Cash on delivery"}</p>
          <p className="text-sm text-muted-foreground">
            Status: {booking.payment_status || "Not paid"}
          </p>

          {/* Show temporary cash payment notice */}
          {isTemporaryCashPayment && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400">Cash Payment</h4>
              <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
                Customer will pay the full amount of ₱{booking.total_price?.toFixed(2)} in cash when they {booking.delivery_option?.name === 'Self Pickup' ? 'pick up the vehicle' : 'receive the vehicle delivery'}.
              </p>

              {/* Show pickup time if available */}
              {booking.pickup_time && (
                <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
                  Pickup time: {format(new Date(booking.pickup_time), 'h:mm a, EEEE, MMMM d')}
                </p>
              )}
            </div>
          )}

          {/* Show auto-cancellation override for temporary cash payments with pickup time */}
          {isTemporaryCashPayment && booking.pickup_time && booking.status !== 'cancelled' && (
            <div className="mt-3">
              <AutoCancellationOverride
                bookingId={booking.id}
                pickupTime={booking.pickup_time}
                gracePeriodMinutes={booking.grace_period_minutes || 30}
                isOverridden={booking.shop_owner_override}
                onOverride={() => {
                  // Update the local state to reflect the override
                  setBooking({
                    ...booking,
                    shop_owner_override: true
                  });
                }}
              />
            </div>
          )}

          {/* Show deposit information for regular cash payments */}
          {isCashPayment && hasDepositPaid && (
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-400">Deposit Paid</h4>
              <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                Customer has paid a ₱{booking.deposit_amount?.toFixed(2)} deposit. Please deduct this amount from the final payment when they pick up the vehicle.
              </p>
              {booking.status === 'cancelled' && !booking.deposit_processed && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  This booking was cancelled. The deposit will be processed and paid out to you on the next working day.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCustomerInfo = () => {
    // Check if contact info exists
    const hasContactInfo = booking.contact_info && booking.contact_info.method && booking.contact_info.number;

    return (
      <div className="flex items-start gap-3">
        <User className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium">Customer</h3>
          <p>{customerName}</p>
          <p className="text-sm text-muted-foreground">{customerEmail}</p>
          <p className="text-sm text-muted-foreground">{customerPhone}</p>

          {/* Display contact information if available */}
          {hasContactInfo && (
            <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md">
              <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-400">
                {booking.contact_info.method === 'whatsapp' ? 'WhatsApp' : 'Telegram'} Contact
              </h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-500 mt-1">
                {booking.contact_info.countryCode} {booking.contact_info.number}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/bookings">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
        {getStatusBadge(booking.status)}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Booking #{booking.id.substring(0, 8)}</CardTitle>
              <CardDescription>
                Created on {format(new Date(booking.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {booking.status !== "cancelled" && booking.status !== "completed" && (
                <>
                  {booking.status !== "confirmed" && (
                    <Button
                      variant="outline"
                      className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                      onClick={() => handleStatusChange("confirmed")}
                      disabled={processing}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm
                    </Button>
                  )}
                  {booking.status !== "completed" && (
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                      onClick={() => handleStatusChange("completed")}
                      disabled={processing}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => handleStatusChange("cancelled")}
                    disabled={processing}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-lg font-medium mb-4">Vehicle Details</h2>
                {renderVehicleDetails()}
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-medium mb-4">Booking Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Rental Period</h3>
                        <p>
                          {format(startDate, "MMMM d, yyyy")} to{" "}
                          {format(endDate, "MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">{days} days</p>
                      </div>
                    </div>

                    {renderShopDetails()}
                  </div>

                  <div className="space-y-5">
                    {renderCustomerInfo()}
                    {renderPaymentDetails()}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Price Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rental Fee</span>
                      <span>₱{rentalPrice.toLocaleString()}</span>
                    </div>

                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span>₱{deliveryFee.toLocaleString()}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>₱{booking.total_price.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}