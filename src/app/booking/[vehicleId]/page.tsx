"use client"

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Vehicle, RentalShop, VehicleType } from "@/lib/types";
import { ArrowLeft, Bike, Car, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import BookingForm from "@/components/BookingForm";
import BookingSummary from "@/components/BookingSummary";

export default function BookingPage() {
  const { vehicleId } = useParams();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shop");
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [shop, setShop] = useState<RentalShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for dates and delivery fee to share between components
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    // Fetch vehicle and shop data
    const fetchData = async () => {
      if (!vehicleId || !shopId) {
        setError("Missing vehicle or shop ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createClientComponentClient();

        // Check if there are date parameters in the URL
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        // If date parameters exist, set the dates
        if (startDateParam && endDateParam) {
          try {
            const parsedStartDate = new Date(startDateParam);
            const parsedEndDate = new Date(endDateParam);

            // Validate dates before setting them
            if (!isNaN(parsedStartDate.getTime()) && !isNaN(parsedEndDate.getTime())) {
              setStartDate(parsedStartDate);
              setEndDate(parsedEndDate);
              console.log("Setting dates from URL parameters:", {
                startDate: parsedStartDate,
                endDate: parsedEndDate
              });
            }
          } catch (error) {
            console.error("Error parsing date parameters:", error);
          }
        }

        try {
          // Try to get vehicle from vehicles table first
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select(`
              *,
              vehicle_images(*),
              vehicle_types(*)
            `)
            .eq('id', vehicleId)
            .single();

          if (vehicleError) {
            throw vehicleError;
          }

          // Format vehicle data
          const formattedVehicle = {
            ...vehicleData,
            vehicle_type: vehicleData.vehicle_types?.name || 'motorcycle',
            images: vehicleData.vehicle_images || [],
            // Map category_id to category name if needed
            category: vehicleData.category,
          };

          setVehicle(formattedVehicle);
        } catch (vehicleError) {
          console.log('Error fetching from vehicles table, trying bikes table:', vehicleError);

          // Fallback to bikes table for backward compatibility
          const { data: bikeData, error: bikeError } = await supabase
            .from('bikes')
            .select(`
              *,
              bike_images(*)
            `)
            .eq('id', vehicleId)
            .single();

          if (bikeError || !bikeData) {
            console.error('Error fetching bike:', bikeError);
            setError('Vehicle not found');
            setLoading(false);
            return;
          }

          // Transform bike data to vehicle format
          const formattedVehicle = {
            ...bikeData,
            vehicle_type: 'motorcycle' as VehicleType,
            vehicle_type_id: '1', // Assuming motorcycles have ID 1
            images: bikeData.bike_images || []
          };

          setVehicle(formattedVehicle);
        }

        // Get shop data
        const { data: shopData, error: shopError } = await supabase
          .from('rental_shops')
          .select('*')
          .eq('id', shopId)
          .single();

        if (shopError || !shopData) {
          console.error('Error fetching shop:', shopError);
          setError('Shop not found');
          setLoading(false);
          return;
        }

        // Check if this is a showcase shop
        if (shopData.is_showcase) {
          setError('This is a showcase shop for demonstration purposes only. Bookings are not available.');
          setShop(shopData);
          setLoading(false);
          return;
        }

        setShop(shopData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load booking data');
        setLoading(false);
      }
    };

    fetchData();
  }, [vehicleId, shopId, searchParams]);

  const goBack = () => {
    router.back();
  };

  // Get the appropriate icon based on vehicle type
  const getVehicleIcon = () => {
    if (!vehicle) return null;

    switch(vehicle.vehicle_type) {
      case 'car':
        return <Car size={18} className="mr-2 text-blue-400" />;
      case 'tuktuk':
        return <Truck size={18} className="mr-2 text-amber-400" />;
      case 'motorcycle':
      default:
        return <Bike size={18} className="mr-2 text-primary" />;
    }
  };

  // Get the vehicle type label
  const getVehicleTypeLabel = () => {
    if (!vehicle) return '';

    switch(vehicle.vehicle_type) {
      case 'car': return 'Car';
      case 'tuktuk': return 'Tuktuk';
      case 'motorcycle': return 'Motorcycle';
      default: return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
        <div className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
          <Button variant="ghost" onClick={goBack} className="mb-6">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>

          <div className="text-center py-20">
            <h1 className="text-2xl font-semibold mb-4">Loading Booking Details</h1>
            <p className="text-muted-foreground">
              Please wait while we prepare your booking...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !vehicle || !shop) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
        <div className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
          <Button variant="ghost" onClick={goBack} className="mb-6">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>

          <div className="text-center py-20">
            <h1 className="text-2xl font-semibold mb-4">Booking Not Available</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The vehicle or shop you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => router.push('/browse')}>
              Browse Available Vehicles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
        <Button variant="ghost" onClick={goBack} className="mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Back to Shop
        </Button>

        <div className="flex items-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold">Book {vehicle.name}</h1>
          <div className="ml-3 px-3 py-1 bg-black/30 rounded-full flex items-center border border-white/10">
            {getVehicleIcon()}
            <span>{getVehicleTypeLabel()}</span>
          </div>
        </div>
        <p className="text-white/70 mb-8">from {shop.name}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Booking Form</h2>

              <BookingForm
                vehicle={vehicle}
                shop={shop}
                user={user}
                isAuthenticated={isAuthenticated}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onDeliveryFeeChange={setDeliveryFee}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Booking Summary</h2>

              <BookingSummary
                vehicle={vehicle}
                shop={shop}
                startDate={startDate}
                endDate={endDate}
                deliveryFee={deliveryFee}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}