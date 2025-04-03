"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

type PriceInput = string;

type ImageInput = {
  id: string;
  file: File | null;
  preview: string;
  isUploading: boolean;
  existing_url?: string;
  image_id?: string;
};

// Define an interface for vehicle image
interface VehicleImage {
  id?: string;
  url: string;
  image_url: string;
  is_primary: boolean;
}

type VehicleType = "motorcycle" | "car" | "tuktuk";

interface VehicleTypeOption {
  id: number;
  name: string;
  value: VehicleType;
}

const vehicleTypes: VehicleTypeOption[] = [
  { id: 1, name: "Motorcycle", value: "motorcycle" },
  { id: 2, name: "Car", value: "car" },
  { id: 3, name: "Tuktuk", value: "tuktuk" },
];

export default function EditVehiclePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const vehicleId = Array.isArray(id) ? id[0] : id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState<number>(1);
  const [selectedVehicleTypeUUID, setSelectedVehicleTypeUUID] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState<PriceInput>("");
  const [images, setImages] = useState<ImageInput[]>([
    { id: "1", file: null, preview: "", isUploading: false },
  ]);
  
  // Common specifications
  const [specifications, setSpecifications] = useState<{
    color: string;
    year: string;
    features: string;
  }>({
    color: "",
    year: "",
    features: "",
  });
  
  // Motorcycle-specific fields
  const [engineSize, setEngineSize] = useState<string>("");
  
  // Car-specific fields
  const [seats, setSeats] = useState<string>("");
  const [transmission, setTransmission] = useState<string>("automatic");
  
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Vehicle categories based on type
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  // Redirect to dashboard if not authenticated or not a shop owner
  useEffect(() => {
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Fetch the vehicle data when the component loads
  useEffect(() => {
    if (!vehicleId || !isAuthenticated) return;

    const fetchVehicleData = async () => {
      setIsLoading(true);
      try {
        const supabase = createClientComponentClient();
        
        // Get vehicle data
        const { data: vehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .select(`
            *,
            vehicle_images(*),
            categories(id, name),
            vehicle_types(id, name)
          `)
          .eq("id", vehicleId)
          .single();
        
        if (vehicleError) {
          console.error("Error fetching vehicle:", vehicleError);
          setError("Failed to load vehicle data. Please try again later.");
          setIsLoading(false);
          return;
        }

        if (!vehicle) {
          setError("Vehicle not found");
          setIsLoading(false);
          return;
        }

        // Get shop ID and check ownership
        const { data: shopData, error: shopError } = await supabase
          .from("rental_shops")
          .select("id, owner_id")
          .eq("id", vehicle.shop_id)
          .single();
        
        if (shopError) {
          console.error("Error fetching shop:", shopError);
          setError("Failed to verify ownership. Please try again later.");
          setIsLoading(false);
          return;
        }

        // Check if user owns this shop
        if (shopData.owner_id !== user?.id) {
          setError("You don't have permission to edit this vehicle");
          setIsLoading(false);
          return;
        }

        // Set vehicle type ID based on the vehicle_type name
        const vehicleTypeName = vehicle.vehicle_types?.name || "motorcycle";
        const matchedType = vehicleTypes.find(type => type.value === vehicleTypeName);
        const typeId = matchedType?.id || 1;
        
        // Map data to form state
        setName(vehicle.name || "");
        setDescription(vehicle.description || "");
        setVehicleTypeId(typeId);
        setSelectedVehicleTypeUUID(vehicle.vehicle_type_id);
        setCategory(vehicle.category_id || "");
        setPrice(vehicle.price_per_day?.toString() || "");
        setIsAvailable(vehicle.is_available !== false);

        // Set specifications
        const specs = vehicle.specifications || {};
        setSpecifications({
          color: vehicle.color || "",
          year: vehicle.year?.toString() || "",
          features: Array.isArray(specs.features) ? specs.features.join(", ") : ""
        });

        // Set vehicle-specific fields
        if (vehicleTypeName === "motorcycle") {
          setEngineSize(specs.engine_size?.toString() || "");
        } else if (vehicleTypeName === "car") {
          setSeats(specs.seats?.toString() || "");
          setTransmission(specs.transmission || "automatic");
        }

        // Prepare images data
        const vehicleImages = vehicle.vehicle_images || [];
        if (vehicleImages.length > 0) {
          setImages(
            vehicleImages.map((img, index) => ({
              id: index.toString(),
              file: null,
              preview: img.image_url,
              isUploading: false,
              existing_url: img.image_url,
              image_id: img.id
            }))
          );
        }

        // Update existing categories for this vehicle type
        updateCategories(vehicle.vehicle_type_id);
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
        setError("Failed to load vehicle data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicleData();
  }, [vehicleId, isAuthenticated, user?.id]);

  // Update categories when vehicle type changes
  const updateCategories = async (vehicleTypeUUID: string) => {
    try {
      if (!vehicleTypeUUID) return;
      
      const supabase = createClientComponentClient();
      
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("vehicle_type_id", vehicleTypeUUID);
        
      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }
      
      setCategories(data || []);
    } catch (err) {
      console.error("Error updating categories:", err);
    }
  };
  
  // Fetch vehicle type UUID when vehicleTypeId changes
  useEffect(() => {
    const fetchVehicleTypeUUID = async () => {
      try {
        const supabase = createClientComponentClient();
        const selectedType = vehicleTypes.find(type => type.id === vehicleTypeId);
        
        if (selectedType) {
          const { data, error } = await supabase
            .from("vehicle_types")
            .select("id")
            .eq("name", selectedType.value)
            .single();
            
          if (error) {
            console.error("Error fetching vehicle type UUID:", error);
            return;
          }
          
          setSelectedVehicleTypeUUID(data.id);
          updateCategories(data.id);
        }
      } catch (err) {
        console.error("Error in fetchVehicleTypeUUID:", err);
      }
    };
    
    fetchVehicleTypeUUID();
  }, [vehicleTypeId]);

  const handleAddImage = () => {
    const newId = (images.length + 1).toString();
    setImages([
      ...images,
      { id: newId, file: null, preview: "", isUploading: false },
    ]);
  };

  const handleRemoveImage = (id: string) => {
    if (images.length > 1) {
      setImages(images.filter((img) => img.id !== id));
    }
  };

  const handleImageChange = (id: string, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(
          images.map((img) =>
            img.id === id
              ? { ...img, file, preview: e.target?.result as string }
              : img
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpecChange = (key: string, value: string) => {
    setSpecifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validation
      if (!name) {
        throw new Error("Vehicle name is required");
      }
      if (!selectedVehicleTypeUUID) {
        throw new Error("Vehicle type could not be determined");
      }
      if (!price || parseInt(price) <= 0) {
        throw new Error("Price is required and must be greater than 0");
      }
      if (!category) {
        throw new Error("Category is required");
      }

      // Validate vehicle-specific fields
      if (vehicleTypeId === 1) { // Motorcycle
        if (!engineSize) {
          throw new Error("Engine size is required for motorcycles");
        }
      } else if (vehicleTypeId === 2) { // Car
        if (!seats) {
          throw new Error("Number of seats is required for cars");
        }
        if (!transmission) {
          throw new Error("Transmission type is required for cars");
        }
      }

      // Upload new images to Supabase Storage if any
      const supabase = createClientComponentClient();
      const updatedImages: VehicleImage[] = [];

      // Update all image states to uploading
      setImages(images.map(img => ({ ...img, isUploading: !!img.file })));

      // Process each image
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        // If this is an existing image with no new file, keep the existing URL
        if (img.existing_url && !img.file) {
          updatedImages.push({
            id: img.image_id,
            url: img.existing_url,
            image_url: img.existing_url,
            is_primary: i === 0 // First image is primary
          });
          continue;
        }
        
        // If there's a new file to upload
        if (img.file) {
          try {
            // Create a unique file path
            const fileExt = img.file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `vehicle-images/${fileName}`;

            // Upload the file
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('vehicles')
              .upload(filePath, img.file);

            if (uploadError) {
              console.error("Error uploading image:", uploadError);
              continue;
            }

            // Get the public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
              .from('vehicles')
              .getPublicUrl(filePath);

            updatedImages.push({
              id: img.image_id, // Include ID if it's an existing image
              url: publicUrl,
              image_url: publicUrl,
              is_primary: i === 0 // First image is primary
            });
          } catch (uploadErr: any) {
            console.error("Exception during image upload:", uploadErr);
            // Continue with other images
          }
        }
      }

      // Prepare vehicle data
      const vehicleData: any = {
        name,
        description,
        vehicle_type_id: selectedVehicleTypeUUID,
        category_id: category,
        price_per_day: parseInt(price),
        is_available: isAvailable,
        color: specifications.color,
        year: specifications.year ? parseInt(specifications.year) : null,
        features: specifications.features ? specifications.features.split(',').map(f => f.trim()).filter(f => f) : [],
        images: updatedImages
      };

      // Add vehicle-type specific data
      if (vehicleTypeId === 1) { // Motorcycle
        vehicleData.engine_size = engineSize;
      } else if (vehicleTypeId === 2) { // Car
        vehicleData.seats = seats ? parseInt(seats) : null;
        vehicleData.transmission = transmission;
      }

      // Send data to API
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(vehicleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update vehicle");
      }

      // Redirect back to vehicles management page
      router.push("/dashboard/vehicles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vehicle");
      setImages(images.map(img => ({ ...img, isUploading: false })));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get vehicle-specific input fields based on selected type
  const renderVehicleSpecificFields = () => {
    switch (vehicleTypeId) {
      case 1: // Motorcycle
        return (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="engineSize">
              Engine Size (cc) *
            </label>
            <input
              id="engineSize"
              type="text"
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              value={engineSize}
              onChange={(e) => setEngineSize(e.target.value)}
              required
            />
          </div>
        );
      case 2: // Car
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="seats">
                Number of Seats *
              </label>
              <input
                id="seats"
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="transmission">
                Transmission *
              </label>
              <select
                id="transmission"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                required
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        );
      case 3: // Tuktuk
        return null; // No specific fields for tuktuks
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium">Loading vehicle data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Vehicle</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        {/* Vehicle Type Selection */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Vehicle Type</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="vehicleType">
                Vehicle Type *
              </label>
              <select
                id="vehicleType"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={vehicleTypeId}
                onChange={(e) => setVehicleTypeId(parseInt(e.target.value))}
                required
              >
                {vehicleTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Vehicle Name/Model *
              </label>
              <input
                id="name"
                type="text"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="description"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="category"
              >
                Category *
              </label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Vehicle-specific fields */}
            {renderVehicleSpecificFields()}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing</h2>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="dailyPrice"
            >
              Daily Price (₱) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                ₱
              </span>
              <input
                id="dailyPrice"
                type="text"
                className="w-full pl-7 pr-3 py-2 border border-border rounded-md bg-background"
                value={price}
                onChange={(e) => {
                  // Only allow numbers
                  if (/^[0-9]*$/.test(e.target.value)) {
                    setPrice(e.target.value);
                  }
                }}
                required
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="color"
              >
                Color
              </label>
              <input
                id="color"
                type="text"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={specifications.color}
                onChange={(e) => handleSpecChange("color", e.target.value)}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="year"
              >
                Year
              </label>
              <input
                id="year"
                type="text"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={specifications.year}
                onChange={(e) => {
                  // Only allow numbers
                  if (/^[0-9]*$/.test(e.target.value)) {
                    handleSpecChange("year", e.target.value);
                  }
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="features"
              >
                Features (comma-separated)
              </label>
              <input
                id="features"
                type="text"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={specifications.features}
                onChange={(e) => handleSpecChange("features", e.target.value)}
                placeholder="ABS, GPS, Power Steering, etc."
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Images</h2>
          <div className="space-y-4">
            {images.map((image, index) => (
              <div key={image.id} className="flex items-center gap-4">
                <div className="flex-1 border border-border rounded-md p-2 bg-background">
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(
                          image.id,
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                      className="flex-1"
                      disabled={image.isUploading}
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={image.isUploading}
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                  </div>
                  {(image.preview || image.existing_url) && (
                    <div className="mt-2 relative h-40 rounded-md overflow-hidden">
                      <img
                        src={image.preview || image.existing_url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  )}
                  {image.isUploading && (
                    <div className="mt-2 h-4 bg-gray-200 rounded">
                      <div className="h-full bg-primary rounded animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddImage}
              className="flex items-center text-primary hover:text-primary/80"
              disabled={isSubmitting}
            >
              <PlusCircle size={16} className="mr-2" />
              Add Another Image
            </button>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Availability</h2>
          <div className="flex items-center">
            <input
              id="available"
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              checked={isAvailable}
              onChange={() => setIsAvailable(!isAvailable)}
            />
            <label htmlFor="available" className="ml-2 text-sm font-medium">
              Vehicle is available for rent
            </label>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className={isSubmitting ? "opacity-70 cursor-not-allowed" : ""}
          >
            {isSubmitting ? "Updating Vehicle..." : "Update Vehicle"}
          </Button>
        </div>
      </form>
    </div>
  );
} 