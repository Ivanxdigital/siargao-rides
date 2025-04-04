"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, SearchIcon, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import ManageVehicleCard from "@/components/ManageVehicleCard";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

type VehicleType = "motorcycle" | "car" | "tuktuk";

interface Vehicle {
  id: string;
  name: string;
  shop_id: string;
  vehicle_type_id: string;
  is_available: boolean;
  price_per_day: number;
  vehicle_images?: { id: string; image_url: string; url?: string }[];
  images?: { id: string; image_url: string; url?: string }[];
  vehicle_types?: { id: string; name: string };
}

export default function ManageVehiclesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleType | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleTypeMap, setVehicleTypeMap] = useState<Record<string, VehicleType>>({});

  useEffect(() => {
    // Check if user is a shop owner
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
      return;
    }

    // Fetch vehicles from the actual database
    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!user?.id) {
          setError("User not authenticated");
          return;
        }
        
        const supabase = createClientComponentClient();
        
        // First, get all vehicle types for mapping
        const { data: vehicleTypesData, error: typesError } = await supabase
          .from("vehicle_types")
          .select("id, name");
          
        if (typesError) {
          console.error("Error fetching vehicle types:", typesError);
        } else if (vehicleTypesData) {
          // Create a mapping of type IDs to type names
          const typeMap: Record<string, VehicleType> = {};
          vehicleTypesData.forEach(type => {
            typeMap[type.id] = type.name as VehicleType;
          });
          setVehicleTypeMap(typeMap);
        }
        
        // Get shop ID for the current user
        const { data: shopData, error: shopError } = await supabase
          .from("rental_shops")
          .select("id")
          .eq("owner_id", user.id)
          .single();
        
        if (shopError || !shopData) {
          console.error("Error fetching shop:", shopError);
          setError("No shop found for this user");
          setVehicles([]);
          return;
        }
        
        // Fetch vehicles for this shop
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from("vehicles")
          .select(`
            *,
            vehicle_images(*),
            vehicle_types(id, name)
          `)
          .eq("shop_id", shopData.id);
        
        if (vehiclesError) {
          console.error("Error fetching vehicles:", vehiclesError);
          setError("Failed to load vehicles. Please try again later.");
          return;
        }
        
        // Transform data to match our Vehicle type
        const formattedVehicles = vehiclesData.map(vehicle => {
          // Fix image URLs
          const images = vehicle.vehicle_images || [];
          const formattedImages = images.map(img => ({
            ...img,
            // Ensure image_url exists
            image_url: img.image_url || img.url
          }));
          
          return {
            ...vehicle,
            images: formattedImages
          };
        });
        
        setVehicles(formattedVehicles);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        setError("Failed to load vehicles. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchVehicles();
    }
  }, [isAuthenticated, user, router]);

  const handleAddVehicle = () => {
    router.push("/dashboard/vehicles/add");
  };

  const handleEditVehicle = (vehicleId: string) => {
    router.push(`/dashboard/vehicles/edit/${vehicleId}`);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        const supabase = createClientComponentClient();
        
        // Delete the vehicle
        const { error } = await supabase
          .from("vehicles")
          .delete()
          .eq("id", vehicleId);
        
        if (error) {
          console.error("Error deleting vehicle:", error);
          throw new Error("Failed to delete vehicle");
        }
        
        // Update the state if successful
        setVehicles((prevVehicles) => prevVehicles.filter((vehicle) => vehicle.id !== vehicleId));
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        alert("Failed to delete vehicle. Please try again.");
      }
    }
  };

  const handleToggleAvailability = async (vehicleId: string, isAvailable: boolean) => {
    try {
      const supabase = createClientComponentClient();
      
      // Update the vehicle availability
      const { error } = await supabase
        .from("vehicles")
        .update({ is_available: isAvailable })
        .eq("id", vehicleId);
      
      if (error) {
        console.error("Error updating vehicle availability:", error);
        throw new Error("Failed to update vehicle availability");
      }
      
      // Update the state if successful
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle.id === vehicleId ? { ...vehicle, is_available: isAvailable } : vehicle
        )
      );
    } catch (error) {
      console.error("Error updating vehicle availability:", error);
      alert("Failed to update vehicle availability. Please try again.");
    }
  };

  // Map vehicle_type_id to our VehicleType
  const getVehicleType = (typeId: string): VehicleType => {
    // First check if we have the type in the map
    if (vehicleTypeMap[typeId]) {
      return vehicleTypeMap[typeId];
    }
    
    // If we have the vehicle_types relation loaded, use that
    const vehicle = vehicles.find(v => v.vehicle_type_id === typeId);
    if (vehicle?.vehicle_types?.name) {
      return vehicle.vehicle_types.name as VehicleType;
    }
    
    // Fallback for backward compatibility with numeric IDs
    if (typeof typeId === 'number' || !isNaN(Number(typeId))) {
      const numericId = Number(typeId);
      switch (numericId) {
        case 1:
          return "motorcycle";
        case 2:
          return "car";
        case 3:
          return "tuktuk";
      }
    }
    
    // Default to motorcycle if nothing else works
    console.warn(`Unknown vehicle type ID: ${typeId}, defaulting to motorcycle`);
    return "motorcycle";
  };

  // Filter vehicles based on search query and vehicle type
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase());
    const currentVehicleType = getVehicleType(vehicle.vehicle_type_id);
    const matchesType = vehicleTypeFilter === "all" || currentVehicleType === vehicleTypeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Vehicles</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage all your vehicles available for rent
          </p>
        </div>
        <Button onClick={handleAddVehicle} className="shrink-0">
          <Plus size={18} className="mr-2" />
          Add New Vehicle
        </Button>
      </div>

      {/* Search and filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search vehicles by name..."
            className="pl-10 pr-4 py-2 w-full border border-border rounded-md bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-48">
          <Select 
            value={vehicleTypeFilter}
            onValueChange={(value) => setVehicleTypeFilter(value as VehicleType | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="motorcycle">Motorcycles</SelectItem>
              <SelectItem value="car">Cars</SelectItem>
              <SelectItem value="tuktuk">Tuktuks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Vehicles grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-80" />
          ))}
        </div>
      ) : filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <ManageVehicleCard
              key={vehicle.id}
              id={vehicle.id}
              name={vehicle.name}
              vehicleType={getVehicleType(vehicle.vehicle_type_id)}
              images={vehicle.images?.map(img => img.image_url) || []}
              price={vehicle.price_per_day}
              isAvailable={vehicle.is_available}
              onEdit={handleEditVehicle}
              onDelete={handleDeleteVehicle}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-medium mb-2">No vehicles found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || vehicleTypeFilter !== "all"
              ? "No vehicles match your search criteria."
              : "You haven't added any vehicles yet."}
          </p>
          <Button onClick={handleAddVehicle}>
            <Plus size={18} className="mr-2" />
            Add Your First Vehicle
          </Button>
        </div>
      )}
    </div>
  );
} 