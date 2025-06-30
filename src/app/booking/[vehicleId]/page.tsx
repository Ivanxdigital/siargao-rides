"use client"

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Vehicle, RentalShop, VehicleType, VehicleGroupWithDetails } from "@/lib/types";
import { ArrowLeft, Bike, Car, Truck, Users, Package, CheckCircle, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [vehicleGroup, setVehicleGroup] = useState<VehicleGroupWithDetails | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for dates and delivery fee to share between components
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Helper function to fetch available vehicles for specific dates
  const fetchAvailableVehiclesForDates = async (groupId: string, start: Date, end: Date) => {
    try {
      const response = await fetch(`/api/vehicle-groups/${groupId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.available_vehicles && data.available_vehicles.length > 0) {
          // Fetch full vehicle details for available vehicles
          const supabase = createClientComponentClient();
          const { data: vehicles, error } = await supabase
            .from('vehicles')
            .select(`
              *,
              vehicle_images(*)
            `)
            .in('id', data.available_vehicles);

          if (!error && vehicles) {
            setAvailableVehicles(vehicles);
          }
        } else {
          setAvailableVehicles([]);
        }
      }
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      setAvailableVehicles([]);
    }
  };

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

          // Check if this vehicle is part of a group
          if (formattedVehicle.group_id) {
            try {
              // Fetch group information
              const { data: groupData, error: groupError } = await supabase
                .from('vehicle_group_availability')
                .select('*')
                .eq('id', formattedVehicle.group_id)
                .single();

              if (!groupError && groupData) {
                setVehicleGroup(groupData);

                // If dates are selected, check which vehicles are available for those dates
                if (startDate && endDate) {
                  await fetchAvailableVehiclesForDates(formattedVehicle.group_id, startDate, endDate);
                }
              }
            } catch (groupError) {
              console.error('Error fetching group data:', groupError);
              // Continue without group data
            }
          }
        } catch (vehicleError) {
          console.error('Error fetching vehicle:', vehicleError);
          setError('Vehicle not found');
          setLoading(false);
          return;
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

  // Effect to fetch available vehicles when dates change (for group vehicles)
  useEffect(() => {
    if (vehicleGroup && startDate && endDate) {
      fetchAvailableVehiclesForDates(vehicleGroup.id, startDate, endDate);
    }
  }, [vehicleGroup, startDate, endDate]);

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
          <h1 className="text-2xl md:text-3xl font-bold">Request to Book {vehicle.name}</h1>
          <div className="ml-3 px-3 py-1 bg-black/30 rounded-full flex items-center border border-white/10">
            {getVehicleIcon()}
            <span>{getVehicleTypeLabel()}</span>
          </div>
        </div>
        <p className="text-white/70 mb-8">from {shop.name}</p>

        {/* Vehicle Selection for Groups */}
        {vehicleGroup && (
          <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Select Your Vehicle</h2>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {availableVehicles.length} of {vehicleGroup.total_units} available
              </Badge>
            </div>
            
            <p className="text-white/70 mb-6">
              This is a group of {vehicleGroup.total_units} identical vehicles. 
              {startDate && endDate 
                ? ` For your selected dates, ${availableVehicles.length} units are available.`
                : ' Please select your dates to see available units.'
              }
            </p>

            {startDate && endDate && availableVehicles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white/80">
                    Choose a specific vehicle (optional)
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVehicleId(null)}
                    className={selectedVehicleId ? 'opacity-100' : 'opacity-50'}
                  >
                    Auto-assign
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableVehicles.map((availableVehicle) => (
                    <div
                      key={availableVehicle.id}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedVehicleId === availableVehicle.id
                          ? 'border-primary bg-primary/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      onClick={() => setSelectedVehicleId(availableVehicle.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">
                            {availableVehicle.individual_identifier || availableVehicle.name}
                          </h4>
                          <p className="text-sm text-white/60">
                            {availableVehicle.specifications?.color && (
                              <span className="capitalize">{availableVehicle.specifications.color}</span>
                            )}
                            {availableVehicle.specifications?.year && (
                              <span> • {availableVehicle.specifications.year}</span>
                            )}
                          </p>
                        </div>
                        {selectedVehicleId === availableVehicle.id && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-white/70">
                      <p className="font-medium text-white/90 mb-1">Vehicle Assignment</p>
                      <p>
                        {selectedVehicleId 
                          ? "You've selected a specific vehicle. We'll assign this exact unit to your booking."
                          : "Auto-assign is enabled. We'll automatically assign the best available vehicle from this group based on your preferences."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {startDate && endDate && availableVehicles.length === 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-400 mb-1">No Units Available</p>
                    <p className="text-sm text-red-300">
                      All vehicles in this group are booked for your selected dates. 
                      Please try different dates or contact the shop directly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(!startDate || !endDate) && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-400 mb-1">Select Dates First</p>
                    <p className="text-sm text-blue-300">
                      Choose your rental dates below to see which vehicles are available in this group.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
                selectedVehicleId={selectedVehicleId}
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