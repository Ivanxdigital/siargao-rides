"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BikeCategory } from "@/lib/types";

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

      // In a real app, we would upload images and save the bike data to the database
      // For now, just simulate an API call and redirect back

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect back to bikes management page
      router.push("/dashboard/bikes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add bike");
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