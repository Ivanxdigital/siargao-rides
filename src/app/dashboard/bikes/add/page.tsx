"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BikeCategory } from "@/lib/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type PriceInputs = {
  daily: string;
  weekly: string;
  monthly: string;
};

type ImageInput = {
  id: string;
  file: File | null;
  preview: string;
  isUploading: boolean;
};

// Define an interface for bike image
interface BikeImage {
  url: string;
  image_url: string;
  is_primary: boolean;
}

export default function AddBikePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BikeCategory>("scooter");
  const [prices, setPrices] = useState<PriceInputs>({
    daily: "",
    weekly: "",
    monthly: "",
  });
  const [images, setImages] = useState<ImageInput[]>([
    { id: "1", file: null, preview: "", isUploading: false },
  ]);
  const [specifications, setSpecifications] = useState<{
    engine: string;
    year: string;
    color: string;
    features: string;
  }>({
    engine: "",
    year: "",
    color: "",
    features: "",
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect to dashboard if not authenticated or not a shop owner
  useEffect(() => {
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Storage has already been set up via SQL commands, so we don't need this API call anymore
  // If you need to re-enable storage setup later, uncomment this block
  /*
  useEffect(() => {
    const setupStorage = async () => {
      try {
        // Call the API to set up storage
        const response = await fetch("/api/storage/setup");
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error("Error setting up storage:", errorData);
            // Don't set an error state here as it's not critical to page function
          } catch (parseError) {
            console.error("Error parsing response:", parseError);
          }
        } else {
          console.log("Storage setup successful");
        }
      } catch (error) {
        // Log but don't block the page from functioning
        console.error("Network error setting up storage:", error);
      }
    };

    if (isAuthenticated && user?.user_metadata?.role === "shop_owner") {
      setupStorage().catch(e => {
        console.warn("Failed to set up storage, but continuing:", e);
      });
    }
  }, [isAuthenticated, user]);
  */

  const handlePriceChange = (key: keyof PriceInputs, value: string) => {
    // Only allow numbers
    if (/^[0-9]*$/.test(value)) {
      setPrices((prev) => ({ ...prev, [key]: value }));
    }
  };

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
        throw new Error("Bike name is required");
      }
      if (!prices.daily || parseInt(prices.daily) <= 0) {
        throw new Error("Daily price is required and must be greater than 0");
      }
      if (!images[0].file) {
        throw new Error("At least one image is required");
      }

      // Upload images to Supabase Storage
      const supabase = createClientComponentClient();
      const uploadedImages: BikeImage[] = [];

      // Update all image states to uploading
      setImages(images.map(img => ({ ...img, isUploading: !!img.file })));

      // Try uploading each image
      let uploadErrorOccurred = false;
      let uploadErrorMessage = "";

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img.file) continue;

        try {
          // Create a unique file path
          const fileExt = img.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `bike-images/${fileName}`;

          // Upload the file
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('bikes')
            .upload(filePath, img.file);

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            uploadErrorOccurred = true;
            uploadErrorMessage = uploadError.message;
            // Continue with other images instead of throwing immediately
            continue;
          }

          // Get the public URL for the uploaded file
          const { data: { publicUrl } } = supabase.storage
            .from('bikes')
            .getPublicUrl(filePath);

          uploadedImages.push({
            url: publicUrl,
            image_url: publicUrl,
            is_primary: i === 0 // First image is primary
          });
        } catch (uploadErr: any) {
          console.error("Exception during image upload:", uploadErr);
          uploadErrorOccurred = true;
          uploadErrorMessage = uploadErr.message || "Unknown upload error";
          // Continue with other images
        }
      }

      // If we couldn't upload any images but were required to, show error
      if (uploadedImages.length === 0 && uploadErrorOccurred) {
        throw new Error(`Failed to upload images: ${uploadErrorMessage}`);
      }

      // Prepare bike data
      const bikeData = {
        name,
        description,
        category,
        price_per_day: parseInt(prices.daily),
        price_per_week: prices.weekly ? parseInt(prices.weekly) : null,
        price_per_month: prices.monthly ? parseInt(prices.monthly) : null,
        is_available: isAvailable,
        specifications: {
          engine: specifications.engine,
          year: specifications.year,
          color: specifications.color,
          features: specifications.features.split(',').map(f => f.trim()).filter(f => f)
        },
        images: uploadedImages
      };

      // Send data to API
      const response = await fetch("/api/bikes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bikeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add bike");
      }

      // Redirect back to bikes management page
      router.push("/dashboard/bikes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add bike");
      setImages(images.map(img => ({ ...img, isUploading: false })));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-3xl font-bold">Add New Bike</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        {/* Basic Information */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Bike Name/Model *
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
                onChange={(e) => setCategory(e.target.value as BikeCategory)}
                required
              >
                <option value="scooter">Scooter</option>
                <option value="semi_auto">Semi Automatic</option>
                <option value="dirt_bike">Dirt Bike</option>
                <option value="sport_bike">Sport Bike</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  value={prices.daily}
                  onChange={(e) => handlePriceChange("daily", e.target.value)}
                  required
                />
              </div>
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
                  value={prices.weekly}
                  onChange={(e) => handlePriceChange("weekly", e.target.value)}
                />
              </div>
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
                  value={prices.monthly}
                  onChange={(e) => handlePriceChange("monthly", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Bike Images *</h2>
          <div className="space-y-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="flex flex-col sm:flex-row gap-4 items-center border-b border-border pb-4 last:border-0"
              >
                <div className="w-full sm:w-32 h-32 bg-muted rounded-md overflow-hidden relative flex items-center justify-center">
                  {img.preview ? (
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No image
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id={`image-${img.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(
                          img.id,
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                    />
                    <label
                      htmlFor={`image-${img.id}`}
                      className="cursor-pointer bg-primary/10 text-primary px-4 py-2 rounded-md text-center hover:bg-primary/20 transition"
                    >
                      {img.file ? "Change Image" : "Select Image"}
                    </label>
                    {index === 0 && (
                      <p className="text-xs text-muted-foreground">
                        This will be the primary image
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveImage(img.id)}
                  disabled={images.length === 1}
                  className="text-destructive hover:text-destructive/90 shrink-0"
                >
                  <XCircle size={18} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddImage}
              className="w-full"
            >
              <PlusCircle size={18} className="mr-2" />
              Add Another Image
            </Button>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="engine"
              >
                Engine Size
              </label>
              <input
                id="engine"
                type="text"
                placeholder="e.g. 125cc"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={specifications.engine}
                onChange={(e) => handleSpecChange("engine", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="year">
                Year Model
              </label>
              <input
                id="year"
                type="text"
                placeholder="e.g. 2023"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={specifications.year}
                onChange={(e) => handleSpecChange("year", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="color">
                Color
              </label>
              <input
                id="color"
                type="text"
                placeholder="e.g. Blue"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={specifications.color}
                onChange={(e) => handleSpecChange("color", e.target.value)}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="features"
              >
                Features (comma separated)
              </label>
              <input
                id="features"
                type="text"
                placeholder="e.g. Fuel Injection, Digital Dashboard"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={specifications.features}
                onChange={(e) => handleSpecChange("features", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Availability</h2>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="isAvailable">
              This bike is currently available for rent
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Bike"}
          </Button>
        </div>
      </form>
    </div>
  );
} 