"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import imageCompression from 'browser-image-compression';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PriceInput = string;

type ImageInput = {
  id: string;
  file: File | null;
  preview: string;
  isUploading: boolean;
  isCompressing: boolean;
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
  const [weeklyPrice, setWeeklyPrice] = useState<PriceInput>("");
  const [monthlyPrice, setMonthlyPrice] = useState<PriceInput>("");
  const [images, setImages] = useState<ImageInput[]>([
    { id: "1", file: null, preview: "", isUploading: false, isCompressing: false },
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
        setWeeklyPrice(vehicle.price_per_week?.toString() || "");
        setMonthlyPrice(vehicle.price_per_month?.toString() || "");
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
              isCompressing: false,
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
      { id: newId, file: null, preview: "", isUploading: false, isCompressing: false },
    ]);
  };

  const handleRemoveImage = (id: string) => {
    if (images.length > 1) {
      setImages(images.filter((img) => img.id !== id));
    }
  };

  const handleImageChange = async (id: string, file: File | null) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload only JPEG, PNG, or WebP images.');
      return;
    }
    
    // Set compressing state
    setImages(prevImages =>
      prevImages.map(img =>
        img.id === id
          ? { ...img, isCompressing: true }
          : img
      )
    );
    
    console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
    
    // Always compress images for optimal upload size
    const compressionOptions = {
      maxSizeMB: 1, // Target 1MB for reliable uploads
      maxWidthOrHeight: 1200, // Reduce resolution for faster uploads
      useWebWorker: true, // Use multi-threading
      quality: 0.8, // 80% quality for good balance
      onProgress: (progress: number) => {
        console.log(`Compression progress: ${progress}%`);
      }
    };
    
    try {
      let processedFile = file;
      
      // Compress all images for optimal performance
      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      console.log('Compressing image for optimal upload...');
      processedFile = await imageCompression(file, compressionOptions);
      console.log(`Compressed file size: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      // If still too large, apply more aggressive compression
      if (processedFile.size > 2 * 1024 * 1024) { // If still > 2MB
        console.log('Applying more aggressive compression...');
        const aggressiveOptions = {
          maxSizeMB: 0.5, // Very aggressive limit
          maxWidthOrHeight: 800, // Lower resolution
          useWebWorker: true,
          quality: 0.6, // Lower quality
        };
        processedFile = await imageCompression(processedFile, aggressiveOptions);
        console.log(`Final compressed size: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prevImages =>
          prevImages.map(img =>
            img.id === id
              ? { 
                  ...img, 
                  file: processedFile, 
                  preview: e.target?.result as string,
                  isCompressing: false 
                }
              : img
          )
        );
      };
      reader.readAsDataURL(processedFile);
      
      // Clear any previous errors
      if (error) setError("");
      
    } catch (compressionError) {
      console.error('Error compressing image:', compressionError);
      setError(`Failed to process image: ${compressionError instanceof Error ? compressionError.message : 'Unknown error'}. Please try a different image.`);
      
      // Reset compressing state
      setImages(prevImages =>
        prevImages.map(img =>
          img.id === id
            ? { ...img, isCompressing: false }
            : img
        )
      );
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
        throw new Error("Daily price is required and must be greater than 0");
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
      setImages(images.map(img => ({ ...img, isUploading: !!img.file, isCompressing: false })));

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

            // Check final file size before upload
            if (img.file.size > 5 * 1024 * 1024) { // 5MB safety check
              console.error(`File still too large after compression: ${(img.file.size / 1024 / 1024).toFixed(2)}MB`);
              continue;
            }

            // Upload the file with additional options
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('vehicles')
              .upload(filePath, img.file, {
                cacheControl: '3600',
                upsert: false // Ensure unique file names
              });

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
        price_per_week: weeklyPrice ? parseInt(weeklyPrice) : null,
        price_per_month: monthlyPrice ? parseInt(monthlyPrice) : null,
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
      setImages(images.map(img => ({ ...img, isUploading: false, isCompressing: false })));
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
          <div className="space-y-4">
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
              <p className="text-xs text-muted-foreground mt-1">Required. This is the base rate for daily rentals.</p>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="weeklyPrice"
              >
                Weekly Price (₱)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  ₱
                </span>
                <input
                  id="weeklyPrice"
                  type="text"
                  className="w-full pl-7 pr-3 py-2 border border-border rounded-md bg-background"
                  value={weeklyPrice}
                  placeholder={price ? `Suggested: ₱${parseInt(price) * 6}` : ""}
                  onChange={(e) => {
                    // Only allow numbers
                    if (/^[0-9]*$/.test(e.target.value)) {
                      setWeeklyPrice(e.target.value);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Optional. Special rate for weekly rentals (typically 7 days for the price of 6).</p>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="monthlyPrice"
              >
                Monthly Price (₱)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  ₱
                </span>
                <input
                  id="monthlyPrice"
                  type="text"
                  className="w-full pl-7 pr-3 py-2 border border-border rounded-md bg-background"
                  value={monthlyPrice}
                  placeholder={price ? `Suggested: ₱${parseInt(price) * 25}` : ""}
                  onChange={(e) => {
                    // Only allow numbers
                    if (/^[0-9]*$/.test(e.target.value)) {
                      setMonthlyPrice(e.target.value);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Optional. Special rate for monthly rentals (typically 30 days for a discounted price).</p>
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
          <div className="space-y-5">
            <div className="bg-background/50 border border-border rounded-md p-4">
              <div className="text-sm text-muted-foreground mb-3">
                <p>Upload clear, high-quality images of your vehicle. The first image will be set as the primary image shown to potential renters.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className={`relative group rounded-lg transition-all duration-200 ${
                      index === 0 
                        ? 'border-2 border-primary bg-primary/5' 
                        : 'border border-border bg-background'
                    }`}
                  >
                    {/* Image Preview */}
                    {(image.preview || image.existing_url) ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-md bg-muted">
                        <img
                          src={image.preview || image.existing_url}
                          alt={`Vehicle image ${index + 1}`}
                          className="h-full w-full object-cover transition-all hover:scale-105"
                        />
                        
                        {/* Primary badge */}
                        {index === 0 && (
                          <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full shadow-md">
                            Primary
                          </div>
                        )}
                        
                        {/* Remove button overlay */}
                        {index > 0 && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(image.id)}
                              className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full shadow-lg"
                              disabled={image.isUploading || image.isCompressing}
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-t-md">
                        <div className="text-muted-foreground text-sm">No image selected</div>
                      </div>
                    )}
                    
                    {/* Upload interface */}
                    <div className="p-3 border-t border-border">
                      {image.isUploading ? (
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '100%' }}></div>
                          <p className="text-xs text-center mt-2 text-muted-foreground">Uploading...</p>
                        </div>
                      ) : image.isCompressing ? (
                        <div className="w-full">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                          </div>
                          <p className="text-xs text-center mt-2 text-blue-600">Compressing image...</p>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center w-full cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageChange(
                                image.id,
                                e.target.files ? e.target.files[0] : null
                              )
                            }
                            className="hidden"
                            disabled={image.isUploading || image.isCompressing}
                          />
                          <div className="flex items-center space-x-2 py-2 px-3 bg-background border border-border rounded-md hover:bg-muted/50 hover:border-primary/50 transition-colors w-full text-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
                              <line x1="16" y1="5" x2="22" y2="5"></line>
                              <line x1="19" y1="2" x2="19" y2="8"></line>
                              <circle cx="9" cy="9" r="2"></circle>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                            </svg>
                            <span className="text-xs font-medium">{(image.preview || image.existing_url) ? 'Change Image' : 'Upload Image'}</span>
                          </div>
                        </label>
                      )}
                      
                      {index === 0 && (
                        <div className="mt-2 text-xs text-center text-primary font-medium">
                          Primary Image
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Add Image Button */}
                {images.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-4 h-full min-h-[200px] hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    disabled={isSubmitting}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <PlusCircle size={24} className="text-primary" />
                    </div>
                    <span className="text-sm font-medium">Add Another Image</span>
                    <span className="text-xs text-muted-foreground mt-1">({images.length}/6)</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 rounded-md p-3 border border-border">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>You can upload up to 6 images. The first image will be used as the primary display image.</p>
              </div>
            </div>
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