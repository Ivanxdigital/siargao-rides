"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, XCircle, ArrowLeft, Info, Package, Users, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartTooltip, TooltipPresets } from "@/components/ui/smart-tooltip";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import imageCompression from 'browser-image-compression';
import { trackEvent } from "@/lib/trackEvent";
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
};

// Define document input type
type DocumentInput = {
  id: string;
  type: 'registration' | 'insurance' | 'other';
  file: File | null;
  name: string;
  isUploading: boolean;
};

// Define uploaded document type
type UploadedDocument = {
  type: 'registration' | 'insurance' | 'other';
  url: string;
  name: string;
  uploaded_at: string;
};

// Define an interface for vehicle image
interface VehicleImage {
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

export default function AddVehiclePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isOnboarding, setIsOnboarding] = useState(false);

  const [quickAddMode, setQuickAddMode] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState<number>(1); // Default to motorcycle
  const [selectedVehicleTypeUUID, setSelectedVehicleTypeUUID] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState<PriceInput>("");
  const [weeklyPrice, setWeeklyPrice] = useState<PriceInput>("");
  const [monthlyPrice, setMonthlyPrice] = useState<PriceInput>("");
  const [images, setImages] = useState<ImageInput[]>([
    { id: "1", file: null, preview: "", isUploading: false, isCompressing: false },
  ]);
  
  // Add document state
  const [documents, setDocuments] = useState<DocumentInput[]>([
    { id: "reg1", type: "registration", file: null, name: "", isUploading: false },
    { id: "ins1", type: "insurance", file: null, name: "", isUploading: false },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Vehicle categories based on type
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  // Batch creation states
  const [createAsGroup, setCreateAsGroup] = useState(false);
  const [quantity, setQuantity] = useState<string>("2");
  const [namingPattern, setNamingPattern] = useState<string>("Unit {index}");
  const [individualNames, setIndividualNames] = useState<string[]>([]);
  const [showIndividualNames, setShowIndividualNames] = useState(false);

  // Redirect to dashboard if not authenticated or not a shop owner
  useEffect(() => {
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setIsOnboarding(params.get("onboarding") === "1");
  }, []);
  
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
        }
      } catch (err) {
        console.error("Error in fetchVehicleTypeUUID:", err);
      }
    };
    
    fetchVehicleTypeUUID();
  }, [vehicleTypeId]);
  
  // Fetch categories when vehicle type UUID changes
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (!selectedVehicleTypeUUID) return;
        
        const supabase = createClientComponentClient();
        
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .eq("vehicle_type_id", selectedVehicleTypeUUID);
          
        if (error) {
          console.error("Error fetching categories:", error);
          return;
        }
        
        const nextCategories = data || [];
        setCategories(nextCategories);

        // If there is only one valid category for this type, preselect it to reduce friction.
        // Otherwise reset (shop owner can pick).
        if (nextCategories.length === 1) {
          setCategory(nextCategories[0].id);
        } else {
          setCategory("");
        }
      } catch (err) {
        console.error("Error in fetchCategories:", err);
      }
    };
    
    fetchCategories();
  }, [selectedVehicleTypeUUID]);

  // Helper functions for batch creation
  const handleQuantityChange = (newQuantity: string) => {
    const qty = parseInt(newQuantity) || 2;
    setQuantity(newQuantity);
    
    // Update individual names array
    if (showIndividualNames) {
      const newNames = Array.from({ length: qty }, (_, i) => 
        individualNames[i] || namingPattern.replace('{index}', (i + 1).toString()).replace('{name}', name)
      );
      setIndividualNames(newNames);
    }
  };

  const handleNamingPatternChange = (pattern: string) => {
    setNamingPattern(pattern);
    
    // Update individual names if using pattern
    if (!showIndividualNames) {
      const qty = parseInt(quantity) || 2;
      const newNames = Array.from({ length: qty }, (_, i) => 
        pattern.replace('{index}', (i + 1).toString()).replace('{name}', name)
      );
      setIndividualNames(newNames);
    }
  };

  const toggleIndividualNames = () => {
    setShowIndividualNames(!showIndividualNames);
    
    if (!showIndividualNames) {
      // Generate initial individual names from pattern
      const qty = parseInt(quantity) || 2;
      const newNames = Array.from({ length: qty }, (_, i) => 
        namingPattern.replace('{index}', (i + 1).toString()).replace('{name}', name)
      );
      setIndividualNames(newNames);
    }
  };

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

  // Add document handlers
  const handleDocumentChange = (id: string, file: File | null) => {
    if (!file) {
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, file: null, name: "" } : doc))
      );
      return;
    }

    // Check if file type is allowed
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      setError(`File type not allowed. Please upload PDF, JPG, or PNG files only.`);
      return;
    }
    
    // Check file size (5MB limit)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      setError(`File size too large. Please upload files smaller than 5MB. Current file size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    
    setDocuments(
      documents.map((doc) =>
        doc.id === id
          ? { ...doc, file, name: file.name }
          : doc
      )
    );
    
    // Clear any previous errors when a valid file is selected
    if (error) setError("");
  };

  const handleAddOtherDocument = () => {
    const newId = `other${documents.filter(doc => doc.type === 'other').length + 1}`;
    setDocuments([
      ...documents,
      { id: newId, type: "other", file: null, name: "", isUploading: false },
    ]);
  };

  const handleRemoveDocument = (id: string) => {
    const target = documents.find((doc) => doc.id === id);
    if (!target || target.type !== 'other') return;
    setDocuments(documents.filter((doc) => doc.id !== id));
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

      // Additional validation for batch creation
      if (createAsGroup) {
        const qty = parseInt(quantity);
        if (!qty || qty < 2 || qty > 50) {
          throw new Error("Quantity must be between 2 and 50 for batch creation");
        }
        if (showIndividualNames) {
          const validNames = individualNames.filter(name => name.trim().length > 0);
          if (validNames.length !== qty) {
            throw new Error("All vehicle names must be provided when using custom names");
          }
        }
      }

      // Upload images to Supabase Storage
      const supabase = createClientComponentClient();
      const uploadedImages: VehicleImage[] = [];

      // Update all image states to uploading
      setImages(images.map(img => ({ ...img, isUploading: !!img.file, isCompressing: false })));

      // Try uploading each image
      const selectedImageCount = images.filter((img) => !!img.file).length;
      let imageUploadErrorMessage = "";

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img.file) continue;

        try {
          // Create a unique file path
          const fileExt = img.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `vehicle-images/${fileName}`;

          // Check final file size before upload
          if (img.file.size > 5 * 1024 * 1024) { // 5MB safety check
            console.error(`File still too large after compression: ${(img.file.size / 1024 / 1024).toFixed(2)}MB`);
            imageUploadErrorMessage = `Image ${i + 1} is still too large (${(img.file.size / 1024 / 1024).toFixed(2)}MB). Please try a different image.`;
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
            imageUploadErrorMessage = `Upload failed: ${uploadError.message}`;
            // Continue with other images instead of throwing immediately
            continue;
          }

          // Get the public URL for the uploaded file
          const { data: { publicUrl } } = supabase.storage
            .from('vehicles')
            .getPublicUrl(filePath);

          uploadedImages.push({
            url: publicUrl,
            image_url: publicUrl,
            is_primary: i === 0 // First image is primary
          });
        } catch (uploadErr: any) {
          console.error("Exception during image upload:", uploadErr);
          imageUploadErrorMessage = uploadErr.message || "Unknown upload error";
          // Continue with other images
        }
      }

      if (selectedImageCount > 0 && uploadedImages.length === 0) {
        throw new Error(`Failed to upload images: ${imageUploadErrorMessage || "Unknown upload error"}`);
      }

      // Upload documents to Supabase Storage
      setDocuments(documents.map(doc => ({ ...doc, isUploading: !!doc.file })));
      
      const uploadedDocuments: UploadedDocument[] = [];
      const selectedDocCount = documents.filter((doc) => !!doc.file).length;
      let documentUploadErrorMessage = "";
      for (const doc of documents) {
        if (!doc.file) continue;
        
        try {
          // Create a unique file path
          const fileExt = doc.file.name.split('.').pop()?.toLowerCase();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `vehicle-documents/${doc.type}/${fileName}`;

          // Check if document is a PDF - need to handle PDFs differently from images
          const isPDF = fileExt === 'pdf';
          
          // Upload the file
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('vehicles')
            .upload(filePath, doc.file, {
              contentType: isPDF ? 'application/pdf' : undefined,
              upsert: true
            });

          if (uploadError) {
            console.error("Error uploading document:", uploadError);
            documentUploadErrorMessage = `Error uploading ${doc.file.name}: ${uploadError.message}`;
            continue;
          }

          // Get the public URL for the uploaded file
          const { data: { publicUrl } } = supabase.storage
            .from('vehicles')
            .getPublicUrl(filePath);

          uploadedDocuments.push({
            type: doc.type,
            url: publicUrl,
            name: doc.file.name,
            uploaded_at: new Date().toISOString()
          });
          
          console.log(`Successfully uploaded document: ${doc.file.name}`);
        } catch (uploadErr: any) {
          console.error("Exception during document upload:", uploadErr);
          documentUploadErrorMessage = `Error uploading ${doc.file.name}: ${uploadErr.message || "Unknown upload error"}`;
        }
      }
      
      // Documents are optional for publishing; only required for verification.
      if (selectedDocCount > 0 && uploadedDocuments.length === 0) {
        throw new Error(`Failed to upload documents: ${documentUploadErrorMessage || "Unknown upload error"}`);
      }

      // Prepare vehicle data with documents
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
        images: uploadedImages,
        documents: uploadedDocuments
      };

      // Add vehicle-type specific data
      if (vehicleTypeId === 1) { // Motorcycle
        vehicleData.engine_size = engineSize;
      } else if (vehicleTypeId === 2) { // Car
        vehicleData.seats = seats ? parseInt(seats) : null;
        vehicleData.transmission = transmission;
      }

      // Send data to API - handle batch creation vs individual
      if (createAsGroup) {
        // Batch creation via vehicle groups API
        const qty = parseInt(quantity) || 2;
        const groupData = {
          name: name,
          vehicle_type_id: selectedVehicleTypeUUID,
          category_id: category,
          quantity: qty,
          base_vehicle_data: {
            description: description,
            price_per_day: parseInt(price),
            price_per_week: weeklyPrice ? parseInt(weeklyPrice) : null,
            price_per_month: monthlyPrice ? parseInt(monthlyPrice) : null,
            specifications: {
              color: specifications.color,
              year: specifications.year ? parseInt(specifications.year) : null,
              features: specifications.features,
              ...(vehicleTypeId === 1 && { engine_size: engineSize ? parseInt(engineSize) : null }),
              ...(vehicleTypeId === 2 && { 
                seats: seats ? parseInt(seats) : null,
                transmission: transmission 
              })
            },
            images: uploadedImages,
            documents: uploadedDocuments
          },
          naming_pattern: showIndividualNames ? 'Custom' : namingPattern,
          individual_names: showIndividualNames ? individualNames : undefined
        };

        const response = await fetch("/api/vehicle-groups", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(groupData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create vehicle group");
        }

        const result = await response.json();
        console.log(`Created vehicle group with ${result.vehicle_count} vehicles`);
      } else {
        // Individual vehicle creation
        const response = await fetch("/api/vehicles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(vehicleData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add vehicle");
        }
      }

      trackEvent("vehicle_published", { onboarding: isOnboarding });

      // Redirect back to vehicles management page (or onboarding success)
      router.push(isOnboarding ? "/dashboard/onboarding/success?step=vehicle" : "/dashboard/vehicles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vehicle");
      setImages(images.map(img => ({ ...img, isUploading: false, isCompressing: false })));
      setDocuments(documents.map(doc => ({ ...doc, isUploading: false })));
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
              Engine Size (cc)
            </label>
            <input
              id="engineSize"
              type="text"
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              value={engineSize}
              onChange={(e) => setEngineSize(e.target.value)}
            />
          </div>
        );
      case 2: // Car
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="seats">
                Number of Seats
              </label>
              <input
                id="seats"
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="transmission">
                Transmission
              </label>
              <select
                id="transmission"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
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
        <h1 className="text-3xl font-bold">Add New Vehicle</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Publish notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-md mb-6 flex items-start gap-3">
        <Info size={20} className="shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium mb-1">Publish instantly (Unverified)</h3>
          <p className="text-sm">
            You can list vehicles immediately. Add photos and registration documents any time to request a Verified badge and improve trust.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Quick add toggle */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start gap-3">
            <input
              id="quickAddMode"
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={quickAddMode}
              onChange={(e) => setQuickAddMode(e.target.checked)}
            />
            <div className="flex-1">
              <label htmlFor="quickAddMode" className="font-medium cursor-pointer">
                Quick add mode (recommended)
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                Only show the minimum fields needed to publish. You can add photos, documents, and specs later.
              </p>
            </div>
          </div>
        </div>

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

            {/* Batch Creation Option */}
            <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="createAsGroup"
                  checked={createAsGroup}
                  onChange={(e) => setCreateAsGroup(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="createAsGroup" className="flex items-center gap-2 font-medium text-blue-900 dark:text-blue-100 cursor-pointer">
                    <Package className="w-4 h-4" />
                    Create Multiple Identical Vehicles
                    <SmartTooltip
                      {...TooltipPresets.groupCreation}
                      content="Save time by creating multiple identical vehicles at once. Perfect for shops with several Honda Clicks, for example."
                    >
                      <HelpCircle className="w-4 h-4 text-blue-600 cursor-help" />
                    </SmartTooltip>
                  </label>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Create multiple identical vehicles with the same specifications and images.
                  </p>
                </div>
              </div>

              {createAsGroup && (
                <div className="mt-4 space-y-4 pl-7">
                  {/* Quantity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="quantity">
                        Number of Vehicles *
                      </label>
                      <input
                        id="quantity"
                        type="number"
                        min="2"
                        max="50"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">Between 2 and 50 vehicles</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="namingPattern">
                        Naming Pattern
                        <SmartTooltip
                          {...TooltipPresets.namingPattern}
                          content="Use {index} for numbers (1, 2, 3...) and {name} for the vehicle name. Example: 'Honda #{index}' becomes 'Honda #1', 'Honda #2', etc."
                        >
                          <HelpCircle className="w-4 h-4 text-muted-foreground ml-1 inline" />
                        </SmartTooltip>
                      </label>
                      <input
                        id="namingPattern"
                        type="text"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        value={namingPattern}
                        onChange={(e) => handleNamingPatternChange(e.target.value)}
                        placeholder="Unit {index}"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Preview: {namingPattern.replace('{index}', '1').replace('{name}', name || 'Honda Click')}
                      </p>
                    </div>
                  </div>

                  {/* Custom Names Toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showIndividualNames"
                      checked={showIndividualNames}
                      onChange={toggleIndividualNames}
                    />
                    <label htmlFor="showIndividualNames" className="text-sm font-medium cursor-pointer">
                      Use custom names for each vehicle
                    </label>
                  </div>

                  {/* Individual Names */}
                  {showIndividualNames && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Custom Vehicle Names</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {Array.from({ length: parseInt(quantity) || 2 }, (_, i) => (
                          <input
                            key={i}
                            type="text"
                            placeholder={`Vehicle ${i + 1} name`}
                            className="px-3 py-2 border border-border rounded-md bg-background text-sm"
                            value={individualNames[i] || ''}
                            onChange={(e) => {
                              const newNames = [...individualNames];
                              newNames[i] = e.target.value;
                              setIndividualNames(newNames);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="description"
              >
                Description
              </label>
              {!quickAddMode ? (
                <textarea
                  id="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Skip for now — you can add a description later.
                </p>
              )}
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
            {!quickAddMode && renderVehicleSpecificFields()}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {!quickAddMode && (
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
            )}

            {!quickAddMode && (
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
            )}
          </div>
        </div>

        {/* Specifications */}
        {!quickAddMode && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            <div className="md:col-span-2 lg:col-span-3">
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
        )}

        {/* Images */}
        {!quickAddMode && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Images</h2>
          <div className="space-y-5">
            <div className="bg-background/50 border border-border rounded-md p-4">
              <div className="text-sm text-muted-foreground mb-3">
                <p>Optional (recommended). Upload clear, high-quality images of your vehicle. All images are automatically compressed. The first image will be set as the primary image shown to potential renters.</p>
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
                    {image.preview ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-md bg-muted">
                        <Image
                          src={image.preview}
                          alt={`Vehicle image ${index + 1}`}
                          fill
                          className="object-cover transition-all hover:scale-105"
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
                            <span className="text-xs font-medium">{image.preview ? 'Change Image' : 'Upload Image'}</span>
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
                <p>You can upload up to 6 images. All images are automatically compressed for optimal performance. The first image will be used as the primary display image.</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Documents */}
        {!quickAddMode && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Vehicle Documents</h2>
          <div className="space-y-5">
            <div className="bg-background/50 border border-border rounded-md p-4">
              <div className="text-sm text-muted-foreground mb-4">
                <p>Optional for listing. Upload documents to request verification and earn a Verified badge.</p>
              </div>
              
              <div className="space-y-6">
                {/* Registration Document */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Vehicle Registration <span className="text-muted-foreground">(Recommended for verification)</span></h3>
                  
                  <div className="bg-muted/30 border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M16 13H8" />
                          <path d="M16 17H8" />
                          <path d="M10 9H8" />
                        </svg>
                      </div>
                      
                      <div className="flex-1">
                        {documents.find(d => d.type === 'registration')?.name ? (
                          <div>
                            <p className="text-sm font-medium mb-1">{documents.find(d => d.type === 'registration')?.name}</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleDocumentChange('reg1', null)}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                Change file
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium mb-1">Upload Vehicle Registration</p>
                            <p className="text-xs text-muted-foreground mb-2">PDF, JPG, or PNG (max 5MB)</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentChange('reg1', e.target.files ? e.target.files[0] : null)}
                            className="hidden"
                            id="registration-upload"
                          />
                          <Button 
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById('registration-upload')?.click();
                            }}
                          >
                            {documents.find(d => d.type === 'registration')?.name ? 'Replace' : 'Upload'}
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Insurance Document */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Vehicle Insurance <span className="text-muted-foreground">(Optional)</span></h3>
                  
                  <div className="bg-muted/30 border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M16 13H8" />
                          <path d="M16 17H8" />
                          <path d="M10 9H8" />
                        </svg>
                      </div>
                      
                      <div className="flex-1">
                        {documents.find(d => d.type === 'insurance')?.name ? (
                          <div>
                            <p className="text-sm font-medium mb-1">{documents.find(d => d.type === 'insurance')?.name}</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleDocumentChange('ins1', null)}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                Change file
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium mb-1">Upload Vehicle Insurance</p>
                            <p className="text-xs text-muted-foreground mb-2">PDF, JPG, or PNG (max 5MB)</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentChange('ins1', e.target.files ? e.target.files[0] : null)}
                            className="hidden"
                            id="insurance-upload"
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById('insurance-upload')?.click();
                            }}
                          >
                            {documents.find(d => d.type === 'insurance')?.name ? 'Replace' : 'Upload'}
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Other Documents */}
                {documents.filter(doc => doc.type === 'other').map((doc) => (
                  <div key={doc.id}>
                    <h3 className="text-sm font-medium mb-2">Additional Document</h3>
                    
                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                            <path d="M10 9H8" />
                          </svg>
                        </div>
                        
                        <div className="flex-1">
                          {doc.name ? (
                            <div>
                              <p className="text-sm font-medium mb-1">{doc.name}</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDocumentChange(doc.id, null)}
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  Change file
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium mb-1">Upload Additional Document</p>
                              <p className="text-xs text-muted-foreground mb-2">PDF, JPG, or PNG (max 5MB)</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <label className="flex items-center justify-center cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleDocumentChange(doc.id, e.target.files ? e.target.files[0] : null)}
                              className="hidden"
                              id={`other-doc-${doc.id}`}
                            />
                            <Button 
                              type="button" 
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(`other-doc-${doc.id}`)?.click();
                              }}
                            >
                              {doc.name ? 'Replace' : 'Upload'}
                            </Button>
                          </label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <XCircle size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Additional Document Button */}
                {documents.filter(doc => doc.type === 'other').length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOtherDocument}
                    className="w-full mt-2"
                  >
                    <PlusCircle size={16} className="mr-2" />
                    Add Additional Document
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 rounded-md p-3 border border-border mt-4">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p>Vehicle registration is required for verification. Upload it now to get verified faster, or add it later when you're ready.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

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
            {isSubmitting ? (
              createAsGroup ? "Creating Vehicle Group..." : "Adding Vehicle..."
            ) : (
              createAsGroup ? `Create ${quantity} Vehicles` : "Add Vehicle"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 
