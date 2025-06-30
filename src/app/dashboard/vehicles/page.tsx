"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, SearchIcon, Filter, AlertCircle, CheckCircle2, Clock, XCircle, Package, LayoutGrid, Users, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ManageVehicleCard from "@/components/ManageVehicleCard";
import { GroupedVehicleCard } from "@/components/dashboard/GroupedVehicleCard";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useShopAccess } from "@/utils/shopAccess";
import { checkShopSetupStatus } from "@/utils/shopSetupStatus";
import { OnboardingGuide } from "@/components/shop/OnboardingGuide";
import { SmartTooltip, TooltipPresets } from "@/components/ui/smart-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

import { VehicleGroupWithDetails } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type VehicleType = "motorcycle" | "car" | "tuktuk";
type VerificationStatus = "pending" | "approved" | "rejected";

interface Vehicle {
  id: string;
  name: string;
  shop_id: string;
  vehicle_type_id: string;
  is_available: boolean;
  price_per_day: number;
  verification_status?: VerificationStatus;
  verification_notes?: string;
  vehicle_images?: { id: string; image_url: string; url?: string }[];
  images?: { id: string; image_url: string; url?: string }[];
  vehicle_types?: { id: string; name: string };
  group_id?: string;
  group_index?: number;
  individual_identifier?: string;
  is_group_primary?: boolean;
}

interface DuplicateGroup {
  shop_id: string;
  shop_name: string;
  vehicle_name: string;
  vehicle_type_id: string;
  category_id: string;
  count: number;
  vehicle_ids: string[];
  price_per_day: number;
}

export default function ManageVehiclesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { isLoading: isAccessLoading, hasAccess, subscriptionStatus } = useShopAccess();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroupWithDetails[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleType | "all">("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleTypeMap, setVehicleTypeMap] = useState<Record<string, VehicleType>>({});
  const [shopData, setShopData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'individual' | 'grouped'>('individual');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [isDetectingDuplicates, setIsDetectingDuplicates] = useState(false);
  const [shopSetupStatus, setShopSetupStatus] = useState({
    shopHasVehicles: false,
    shopHasLogo: false,
    shopHasBanner: false,
    shopHasDescription: false,
    shopHasLocation: false,
    shopHasContactInfo: false,
    shouldShowGuide: false,
    completionPercentage: 0
  });

  useEffect(() => {
    // Check if user is a shop owner
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
      return;
    }

    // Only fetch vehicles if the user has access
    if (!hasAccess) return;

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

        // Get shop ID and details for the current user
        const { data: shopData, error: shopError } = await supabase
          .from("rental_shops")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (shopError || !shopData) {
          console.error("Error fetching shop:", shopError);
          setError("No shop found for this user");
          setVehicles([]);
          return;
        }

        setShopData(shopData);

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
            // Convert verification_status to our VerificationStatus type
            verification_status: (vehicle.verification_status || 'pending') as VerificationStatus,
            images: formattedImages
          };
        });

        setVehicles(formattedVehicles);

        // Update shop setup status
        const setupStatus = checkShopSetupStatus(shopData, formattedVehicles.length);
        setShopSetupStatus(setupStatus);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        setError("Failed to load vehicles. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && !isAccessLoading && hasAccess) {
      fetchVehicles();
      if (viewMode === 'grouped') {
        fetchVehicleGroups();
      }
    }
  }, [isAuthenticated, user, router, hasAccess, isAccessLoading, viewMode]);

  // Fetch vehicle groups
  const fetchVehicleGroups = async () => {
    if (!shopData?.id) return;

    try {
      const response = await fetch(`/api/vehicle-groups?shop_id=${shopData.id}`);
      if (response.ok) {
        const data = await response.json();
        setVehicleGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching vehicle groups:', error);
    }
  };

  // Detect duplicate vehicles
  const detectDuplicates = async () => {
    if (!shopData?.id) return;

    setIsDetectingDuplicates(true);
    try {
      const response = await fetch(`/api/vehicle-groups/detect-duplicates?shop_id=${shopData.id}`);
      if (response.ok) {
        const data = await response.json();
        setDuplicateGroups(data.potential_groups || []);
        setShowDuplicates(true);
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      alert('Failed to detect duplicates. Please try again.');
    } finally {
      setIsDetectingDuplicates(false);
    }
  };

  // Convert vehicles to group
  const convertToGroup = async (vehicleIds: string[], groupName: string) => {
    try {
      const response = await fetch('/api/vehicle-groups/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_ids: vehicleIds,
          group_name: groupName,
          naming_pattern: 'Unit {index}'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully created group "${groupName}" with ${result.vehicle_count} vehicles!`);
        
        // Refresh data
        fetchVehicles();
        if (viewMode === 'grouped') {
          fetchVehicleGroups();
        }
        detectDuplicates();
      } else {
        const error = await response.json();
        alert(`Failed to create group: ${error.error}`);
      }
    } catch (error) {
      console.error('Error converting to group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'individual' | 'grouped') => {
    setViewMode(mode);
    if (mode === 'grouped') {
      fetchVehicleGroups();
    }
  };

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

  // Filter vehicles based on search query, vehicle type, and verification status
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase());
    const currentVehicleType = getVehicleType(vehicle.vehicle_type_id);
    const matchesType = vehicleTypeFilter === "all" || currentVehicleType === vehicleTypeFilter;
    const matchesVerification = verificationFilter === "all" || vehicle.verification_status === verificationFilter;

    return matchesSearch && matchesType && matchesVerification;
  });

  // Skip the rest of the rendering if still checking access or no access
  if (isAccessLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If subscription is inactive or expired, show appropriate message
  if (!hasAccess) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center mb-8">
          <AlertCircle size={40} className="text-amber-600 dark:text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Subscription Required</h3>
          <p className="text-muted-foreground mb-6">
            {subscriptionStatus === 'expired'
              ? "Your subscription has expired. Please renew your subscription to manage vehicles."
              : "You need an active subscription to manage vehicles."}
          </p>
          <Button asChild>
            <Link href="/dashboard/subscription">View Subscription Options</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Vehicles</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage all your vehicles available for rent
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'individual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('individual')}
              className="h-8"
            >
              <LayoutGrid className="w-4 h-4 mr-1" />
              Individual
            </Button>
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grouped')}
              className="h-8"
            >
              <Package className="w-4 h-4 mr-1" />
              Groups
            </Button>
          </div>

          {/* Detect Duplicates Button */}
          <SmartTooltip
            {...TooltipPresets.groupCreation}
            content="Find vehicles with the same name and convert them to groups for easier management."
          >
            <Button
              variant="outline"
              onClick={detectDuplicates}
              disabled={isDetectingDuplicates}
              className="shrink-0"
            >
              <Users className="w-4 h-4 mr-2" />
              {isDetectingDuplicates ? 'Detecting...' : 'Detect Groups'}
            </Button>
          </SmartTooltip>

          {/* Add Vehicle Button */}
          <Button onClick={handleAddVehicle} className="shrink-0">
            <Plus size={18} className="mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Onboarding Guide - only show if needed */}
      {shopSetupStatus.shouldShowGuide && vehicles.length === 0 && (
        <div className="mb-8">
          <OnboardingGuide
            shopHasVehicles={shopSetupStatus.shopHasVehicles}
            shopHasLogo={shopSetupStatus.shopHasLogo}
            shopHasBanner={shopSetupStatus.shopHasBanner}
            shopHasDescription={shopSetupStatus.shopHasDescription}
            shopHasLocation={shopSetupStatus.shopHasLocation}
            shopHasContactInfo={shopSetupStatus.shopHasContactInfo}
          />
        </div>
      )}

      {/* Search and filter */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search vehicles by name..."
            className="pl-10 pr-4 py-2 w-full border border-border rounded-md bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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

        <Select
          value={verificationFilter}
          onValueChange={(value) => setVerificationFilter(value as VerificationStatus | "all")}
        >
          <SelectTrigger>
            <div className="flex items-center">
              <SelectValue placeholder="All Statuses" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center">
                <Filter size={16} className="mr-2 text-muted-foreground" />
                All Statuses
              </div>
            </SelectItem>
            <SelectItem value="pending">
              <div className="flex items-center">
                <Clock size={16} className="mr-2 text-yellow-500" />
                Pending
              </div>
            </SelectItem>
            <SelectItem value="approved">
              <div className="flex items-center">
                <CheckCircle2 size={16} className="mr-2 text-green-500" />
                Verified
              </div>
            </SelectItem>
            <SelectItem value="rejected">
              <div className="flex items-center">
                <XCircle size={16} className="mr-2 text-red-500" />
                Rejected
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Duplicate Groups Modal */}
      {showDuplicates && duplicateGroups.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Potential Vehicle Groups Found
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We found {duplicateGroups.length} groups of identical vehicles that could be grouped together.
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDuplicates(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {duplicateGroups.map((group, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{group.vehicle_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {group.count} identical vehicles • {formatPrice(group.price_per_day)}/day
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => convertToGroup(group.vehicle_ids, group.vehicle_name)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Create Group
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for duplicates */}
      {showDuplicates && duplicateGroups.length === 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  No Duplicate Vehicles Found
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All your vehicles are unique or already grouped.
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDuplicates(false)}
              className="text-green-600 hover:text-green-800"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-80" />
          ))}
        </div>
      ) : viewMode === 'individual' ? (
        // Individual vehicles view
        filteredVehicles.length > 0 ? (
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
                verificationStatus={vehicle.verification_status}
                verificationNotes={vehicle.verification_notes}
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
              {searchQuery || vehicleTypeFilter !== "all" || verificationFilter !== "all"
                ? "No vehicles match your search criteria."
                : "You haven't added any vehicles yet."}
            </p>
            <Button onClick={handleAddVehicle}>
              <Plus size={18} className="mr-2" />
              Add Your First Vehicle
            </Button>
          </div>
        )
      ) : (
        // Grouped vehicles view
        vehicleGroups.length > 0 ? (
          <div className="space-y-6">
            {vehicleGroups.map((group) => (
              <GroupedVehicleCard
                key={group.id}
                group={group}
                onEdit={() => {
                  // TODO: Open group edit modal
                  console.log('Edit group:', group.id);
                }}
                onDelete={() => {
                  // TODO: Delete group with confirmation
                  console.log('Delete group:', group.id);
                }}
                onViewVehicle={(vehicleId) => {
                  handleEditVehicle(vehicleId);
                }}
                onBulkAction={(action, vehicleIds) => {
                  // TODO: Handle bulk actions
                  console.log('Bulk action:', action, vehicleIds);
                }}
              />
            ))}
            
            {/* Individual vehicles without groups */}
            {filteredVehicles.filter(v => !v.group_id).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5" />
                  Individual Vehicles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVehicles.filter(v => !v.group_id).map((vehicle) => (
                    <ManageVehicleCard
                      key={vehicle.id}
                      id={vehicle.id}
                      name={vehicle.name}
                      vehicleType={getVehicleType(vehicle.vehicle_type_id)}
                      images={vehicle.images?.map(img => img.image_url) || []}
                      price={vehicle.price_per_day}
                      isAvailable={vehicle.is_available}
                      verificationStatus={vehicle.verification_status}
                      verificationNotes={vehicle.verification_notes}
                      onEdit={handleEditVehicle}
                      onDelete={handleDeleteVehicle}
                      onToggleAvailability={handleToggleAvailability}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 border border-border rounded-lg bg-card">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Vehicle Groups Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create groups to manage multiple identical vehicles efficiently. Use the "Detect Groups" button to find duplicates.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={detectDuplicates} disabled={isDetectingDuplicates}>
                <Users className="w-4 h-4 mr-2" />
                {isDetectingDuplicates ? 'Detecting...' : 'Detect Groups'}
              </Button>
              <Button variant="outline" onClick={() => setViewMode('individual')}>
                <LayoutGrid className="w-4 h-4 mr-2" />
                View Individual
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}