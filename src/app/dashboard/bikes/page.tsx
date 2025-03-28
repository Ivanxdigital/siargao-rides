"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, SearchIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import ManageBikeCard from "@/components/ManageBikeCard";
import { mockBikes } from "@/lib/mock-data";

// This would be replaced with actual API calls in the future
import { Bike } from "@/lib/types";

export default function ManageBikesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is a shop owner
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
      return;
    }

    // Fetch bikes - this would be replaced with an API call
    const fetchBikes = async () => {
      try {
        setIsLoading(true);
        // In a real app, we would fetch from API with the shop owner's ID
        // For now, use mock data
        setBikes(mockBikes);
      } catch (error) {
        console.error("Error fetching bikes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBikes();
    }
  }, [isAuthenticated, user, router]);

  const handleAddBike = () => {
    router.push("/dashboard/bikes/add");
  };

  const handleEditBike = (bikeId: string) => {
    router.push(`/dashboard/bikes/edit/${bikeId}`);
  };

  const handleDeleteBike = async (bikeId: string) => {
    if (window.confirm("Are you sure you want to delete this bike?")) {
      // In a real app, we would call an API
      // For now, just update the state
      setBikes((prevBikes) => prevBikes.filter((bike) => bike.id !== bikeId));
    }
  };

  const handleToggleAvailability = async (bikeId: string, isAvailable: boolean) => {
    // In a real app, we would call an API
    // For now, just update the state
    setBikes((prevBikes) =>
      prevBikes.map((bike) =>
        bike.id === bikeId ? { ...bike, is_available: isAvailable } : bike
      )
    );
  };

  // Filter bikes based on search query
  const filteredBikes = bikes.filter((bike) =>
    bike.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Bikes</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage your bikes available for rent
          </p>
        </div>
        <Button onClick={handleAddBike} className="shrink-0">
          <Plus size={18} className="mr-2" />
          Add New Bike
        </Button>
      </div>

      {/* Search and filter */}
      <div className="mb-6 relative">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search bikes by model..."
            className="pl-10 pr-4 py-2 w-full border border-border rounded-md bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bikes grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-80" />
          ))}
        </div>
      ) : filteredBikes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBikes.map((bike) => (
            <ManageBikeCard
              key={bike.id}
              id={bike.id}
              model={bike.name}
              images={bike.images?.map(img => img.image_url) || []}
              prices={{
                daily: bike.price_per_day,
                weekly: bike.price_per_week,
                monthly: bike.price_per_month,
              }}
              isAvailable={bike.is_available}
              onEdit={handleEditBike}
              onDelete={handleDeleteBike}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-medium mb-2">No bikes found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "No bikes match your search query."
              : "You haven't added any bikes yet."}
          </p>
          <Button onClick={handleAddBike}>
            <Plus size={18} className="mr-2" />
            Add Your First Bike
          </Button>
        </div>
      )}
    </div>
  );
} 