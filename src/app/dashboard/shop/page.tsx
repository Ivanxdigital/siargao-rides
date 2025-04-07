"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, MapPin, Phone, Mail, Clock, Save, Eye, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SubscriptionStatus, ShopWithSubscription } from "@/components/shop/SubscriptionStatus";
import { Badge } from "@/components/ui/Badge";

// Predefined Siargao locations (same as in SearchBar.tsx)
const siargaoLocations = [
  "General Luna",
  "Cloud 9",
  "Pacifico",
  "Dapa",
  "Union",
  "Pilar",
  "Santa Monica",
  "San Isidro",
  "Del Carmen",
  "Burgos",
  "Maasin River",
  "Sugba Lagoon",
  "Magpupungko Rock Pools"
];

// Define a proper type for the shop data
interface RentalShop {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone_number: string | null;
  whatsapp: string | null;
  email: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
  location_area: string | null;
  offers_delivery: boolean;
  delivery_fee: number;
  subscription_status?: 'active' | 'inactive' | 'expired';
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  is_active?: boolean;
  requires_id_deposit?: boolean;
  requires_cash_deposit?: boolean;
  cash_deposit_amount?: number;
}

// Define form data type
interface ShopFormData {
  name: string;
  description: string;
  address: string;
  phone_number: string;
  whatsapp: string;
  email: string;
  location_area: string;
  offers_delivery: boolean;
  delivery_fee: number;
  requires_id_deposit: boolean;
  requires_cash_deposit: boolean;
  cash_deposit_amount: number;
}

export default function ManageShopPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<RentalShop | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    description: "",
    address: "",
    phone_number: "",
    whatsapp: "",
    email: "",
    location_area: "",
    offers_delivery: false,
    delivery_fee: 0,
    requires_id_deposit: true,
    requires_cash_deposit: false,
    cash_deposit_amount: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [vehicleStats, setVehicleStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    rentedVehicles: 0
  });
  
  // New states for image uploads
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Refs for file inputs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user is a shop owner
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
      return;
    }

    // Fetch shop data
    const fetchShop = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get the shop owned by this user
        const { data, error: shopError } = await supabase
          .from("rental_shops")
          .select("*")
          .eq("owner_id", user.id)
          .single();
        
        if (shopError) {
          if (shopError.code === 'PGRST116') {
            // No shop found for this user
            setError("You don't have a shop registered yet.");
            setIsLoading(false);
            return;
          }
          throw shopError;
        }
        
        // Cast the data to the RentalShop type
        const shopData = data as RentalShop;
        setShop(shopData);
        
        // Set form data for potential editing
        setFormData({
          name: shopData.name,
          description: shopData.description || "",
          address: shopData.address,
          phone_number: shopData.phone_number || "",
          whatsapp: shopData.whatsapp || "",
          email: shopData.email || "",
          location_area: shopData.location_area || "",
          offers_delivery: shopData.offers_delivery || false,
          delivery_fee: shopData.delivery_fee || 0,
          requires_id_deposit: shopData.requires_id_deposit !== false,
          requires_cash_deposit: shopData.requires_cash_deposit || false,
          cash_deposit_amount: shopData.cash_deposit_amount || 0
        });
        
        // Set banner and logo preview if they exist
        if (shopData.banner_url) {
          setBannerPreview(shopData.banner_url);
        }
        
        if (shopData.logo_url) {
          setLogoPreview(shopData.logo_url);
        }
        
        // Fetch vehicle statistics
        const { data: bikes, error: bikesError } = await supabase
          .from("bikes")
          .select("*")
          .eq("shop_id", shopData.id);
        
        if (!bikesError && bikes) {
          setVehicleStats({
            totalVehicles: bikes.length,
            availableVehicles: bikes.filter(bike => bike.is_available).length,
            rentedVehicles: bikes.filter(bike => !bike.is_available).length
          });
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
        setError("Failed to load shop data");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchShop();
    }
  }, [isAuthenticated, user, router]);

  const handleEditToggle = () => {
    // Reset previews when canceling edit
    if (isEditing) {
      setBannerPreview(shop?.banner_url || null);
      setLogoPreview(shop?.logo_url || null);
      setBannerFile(null);
      setLogoFile(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev: any) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // New file input handlers
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      alert('File size must be less than 5MB');
      return;
    }
    
    setBannerFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB max
      alert('File size must be less than 2MB');
      return;
    }
    
    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleBannerRemove = () => {
    setBannerFile(null);
    setBannerPreview(shop?.banner_url || null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };
  
  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(shop?.logo_url || null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };
  
  // Upload files to Supabase Storage
  const uploadImage = async (file: File, path: string) => {
    const supabaseClient = createClientComponentClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    
    const { data, error } = await supabaseClient.storage
      .from('shop-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('shop-images')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !shop) return;
    
    try {
      setIsSaving(true);
      setUploadProgress(0);
      
      // Initialize update data with form fields
      const updateData: any = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone_number: formData.phone_number,
        whatsapp: formData.whatsapp,
        email: formData.email,
        location_area: formData.location_area,
        offers_delivery: formData.offers_delivery,
        delivery_fee: formData.delivery_fee,
        requires_id_deposit: formData.requires_id_deposit,
        requires_cash_deposit: formData.requires_cash_deposit,
        cash_deposit_amount: formData.requires_cash_deposit ? formData.cash_deposit_amount : 0,
        updated_at: new Date().toISOString()
      };
      
      // Upload banner if changed
      if (bannerFile) {
        setIsUploading(true);
        setUploadProgress(10);
        try {
          const bannerUrl = await uploadImage(bannerFile, `banners/${shop.id}`);
          updateData.banner_url = bannerUrl;
          setUploadProgress(50);
        } catch (error) {
          console.error("Error uploading banner:", error);
          setError("Failed to upload banner image");
          setIsSaving(false);
          setIsUploading(false);
          return;
        }
      }
      
      // Upload logo if changed
      if (logoFile) {
        setIsUploading(true);
        setUploadProgress(60);
        try {
          const logoUrl = await uploadImage(logoFile, `logos/${shop.id}`);
          updateData.logo_url = logoUrl;
          setUploadProgress(90);
        } catch (error) {
          console.error("Error uploading logo:", error);
          setError("Failed to upload logo image");
          setIsSaving(false);
          setIsUploading(false);
          return;
        }
      }
      
      setUploadProgress(95);
      
      // Update shop in Supabase
      const { error } = await supabase
        .from("rental_shops")
        .update(updateData)
        .eq("id", shop.id);
      
      if (error) throw error;
      
      setUploadProgress(100);
      
      // Update the local shop state
      setShop({
        ...shop,
        ...updateData
      });
      
      setIsEditing(false);
      setIsUploading(false);
      
      // Reset file states
      setBannerFile(null);
      setLogoFile(null);
      
      // Update previews to new URLs
      if (updateData.banner_url) {
        setBannerPreview(updateData.banner_url);
      }
      
      if (updateData.logo_url) {
        setLogoPreview(updateData.logo_url);
      }
      
    } catch (error) {
      console.error("Error updating shop:", error);
      setError("Failed to update shop information");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };
  
  // Not verified message
  if (shop && !shop.is_verified) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center max-w-md mx-auto shadow-md">
          <h1 className="text-2xl font-bold mb-4">Pending Verification</h1>
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={40} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="mb-6 text-muted-foreground">
            Your shop registration is currently being reviewed by our team. You'll be able to manage your shop once it's verified.
          </p>
          <Button variant="outline" asChild className="hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse flex flex-col space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-40 bg-muted rounded-lg"></div>
            <div className="h-40 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center max-w-md mx-auto shadow-md">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <div className="w-20 h-20 bg-red-100 dark:bg-red-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={40} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button variant="outline" asChild className="hover:bg-red-100 dark:hover:bg-red-900/30">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show shop management interface
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold">Manage Shop</h1>
          <p className="text-muted-foreground mt-2">
            Update your shop information and settings
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          {shop && !shop.is_verified && (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-2 py-1.5 px-3">
              <Clock className="h-4 w-4" />
              Pending Verification
            </Badge>
          )}
          
          {!isEditing && (
            <Button
              onClick={handleEditToggle}
              variant="outline"
              className="flex items-center gap-2 hover:bg-primary/5"
            >
              <Edit size={16} />
              Edit Shop
            </Button>
          )}
        </div>
      </div>

      {/* Form/Content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {shop && (
          <>
            <div className="relative w-full h-60 md:h-80 rounded-xl overflow-hidden mb-10 bg-card shadow-md group lg:col-span-3">
              {/* Banner image with edit option when in edit mode */}
              {(bannerPreview || shop.banner_url) && !isEditing ? (
                <>
                  <Image
                    src={bannerPreview || shop.banner_url || '/placeholder-banner.jpg'}
                    alt={shop.name}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    fill
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </>
              ) : !isEditing ? (
                <div className="h-full bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                  <p className="text-muted-foreground">No banner image</p>
                </div>
              ) : (
                <div className="h-full relative">
                  {bannerPreview ? (
                    <>
                      <Image
                        src={bannerPreview || '/placeholder-banner.jpg'}
                        alt="Banner preview"
                        className="object-cover"
                        fill
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <button 
                        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                        onClick={handleBannerRemove}
                      >
                        <X size={20} />
                      </button>
                    </>
                  ) : (
                    <div className="h-full bg-gradient-to-r from-primary/20 to-primary/5 flex flex-col items-center justify-center">
                      <ImageIcon size={50} className="text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4 text-lg">No banner image</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => bannerInputRef.current?.click()}
                        className="flex items-center border-primary/30 hover:border-primary hover:shadow-md transition-all"
                      >
                        <Upload size={16} className="mr-2" />
                        Upload Banner
                      </Button>
                      <input
                        type="file"
                        ref={bannerInputRef}
                        onChange={handleBannerChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 flex items-end">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-4 border-card bg-card shadow-lg">
                  {/* Logo image with edit option when in edit mode */}
                  {(logoPreview || shop.logo_url) && !isEditing ? (
                    <Image
                      src={logoPreview || shop.logo_url || '/placeholder-logo.jpg'}
                      alt={`${shop.name} logo`}
                      className="object-cover"
                      fill
                    />
                  ) : !isEditing ? (
                    <div className="h-full bg-primary/10 flex items-center justify-center">
                      <p className="text-xs text-center text-muted-foreground">
                        No logo
                      </p>
                    </div>
                  ) : (
                    <div className="h-full relative">
                      {logoPreview ? (
                        <>
                          <Image
                            src={logoPreview || '/placeholder-logo.jpg'}
                            alt="Logo preview"
                            className="object-cover"
                            fill
                          />
                          <button 
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                            onClick={handleLogoRemove}
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <div 
                          className="h-full bg-primary/10 flex items-center justify-center cursor-pointer"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <p className="text-xs text-center text-muted-foreground">
                            Add Logo
                          </p>
                          <input
                            type="file"
                            ref={logoInputRef}
                            onChange={handleLogoChange}
                            className="hidden"
                            accept="image/*"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="ml-4 bg-black/50 backdrop-blur-sm p-4 rounded-lg">
                  <h2 className="text-white font-semibold text-xl md:text-2xl">{shop.name}</h2>
                  {shop.is_verified && (
                    <span className="bg-primary/30 text-white text-xs px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-10 lg:col-span-3">
                {/* Image upload section */}
                <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                  <h2 className="text-xl font-semibold mb-8 pb-3 border-b border-border">Shop Images</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Banner Image */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium mb-2">
                        Banner Image
                      </label>
                      <div className="border border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                        {bannerPreview ? (
                          <div className="relative w-full h-52 mb-4 rounded-md overflow-hidden">
                            <Image
                              src={bannerPreview || '/placeholder-banner.jpg'}
                              alt="Banner preview"
                              className="object-cover"
                              fill
                            />
                            <button 
                              type="button"
                              className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                              onClick={handleBannerRemove}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-52 bg-muted rounded-md">
                            <ImageIcon size={36} className="text-muted-foreground mb-3" />
                            <p className="text-muted-foreground text-sm mb-3">No banner selected</p>
                          </div>
                        )}
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => bannerInputRef.current?.click()}
                          className="w-full py-2 hover:bg-primary/5"
                        >
                          <Upload size={16} className="mr-2" />
                          {bannerPreview ? "Change Banner" : "Upload Banner"}
                        </Button>
                        <input
                          type="file"
                          ref={bannerInputRef}
                          onChange={handleBannerChange}
                          className="hidden"
                          accept="image/*"
                        />
                        <p className="text-xs text-muted-foreground mt-3">
                          Recommended size: 1200×400 pixels. Max 5MB.
                        </p>
                      </div>
                    </div>
                    
                    {/* Shop Logo */}
                    <div className="space-y-4">
                      <label className="block text-base font-medium mb-2">
                        Shop Logo
                      </label>
                      <div className="border border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                        {logoPreview ? (
                          <div className="relative h-52 mb-4 rounded-md flex items-center justify-center bg-muted/30">
                            <div className="relative w-36 h-36 rounded-lg overflow-hidden shadow-md">
                              <Image
                                src={logoPreview || '/placeholder-logo.jpg'}
                                alt="Logo preview"
                                className="object-cover"
                                fill
                              />
                            </div>
                            <button 
                              type="button"
                              className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                              onClick={handleLogoRemove}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-52 bg-muted rounded-md">
                            <ImageIcon size={36} className="text-muted-foreground mb-3" />
                            <p className="text-muted-foreground text-sm mb-3">No logo selected</p>
                          </div>
                        )}
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full py-2 hover:bg-primary/5"
                        >
                          <Upload size={16} className="mr-2" />
                          {logoPreview ? "Change Logo" : "Upload Logo"}
                        </Button>
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoChange}
                          className="hidden"
                          accept="image/*"
                        />
                        <p className="text-xs text-muted-foreground mt-3">
                          Recommended size: 200×200 pixels. Max 2MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                  <h2 className="text-xl font-semibold mb-8 pb-3 border-b border-border">Shop Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Shop Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="phone_number" className="block text-sm font-medium mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="whatsapp" className="block text-sm font-medium mb-1">
                        WhatsApp (Optional)
                      </label>
                      <input
                        type="text"
                        id="whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="address" className="block text-sm font-medium mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="location_area" className="block text-sm font-medium mb-1">
                        Location Area
                      </label>
                      <select
                        id="location_area"
                        name="location_area"
                        value={formData.location_area}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="">Select an area</option>
                        {siargaoLocations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        This helps customers find your shop when searching by location.
                      </p>
                    </div>
                    
                    <div className="md:col-span-2 space-y-2 mt-2">
                      <label htmlFor="description" className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        rows={5}
                      />
                    </div>
                    
                    {/* Add delivery options section */}
                    <div className="md:col-span-2 mt-8 p-8 bg-primary/5 rounded-lg border border-primary/20">
                      <h3 className="text-lg font-medium mb-5">Delivery Options</h3>
                      
                      <div className="flex items-center space-x-2 mb-5">
                        <input
                          type="checkbox"
                          id="offers_delivery"
                          name="offers_delivery"
                          checked={formData.offers_delivery}
                          onChange={handleInputChange}
                          className="h-4 w-4"
                        />
                        <label htmlFor="offers_delivery" className="text-sm font-medium">
                          Offer delivery service to customers
                        </label>
                      </div>
                      
                      {formData.offers_delivery && (
                        <div className="ml-6 mt-3">
                          <label htmlFor="delivery_fee" className="block text-sm font-medium mb-2">
                            Delivery Fee (₱)
                          </label>
                          <input
                            type="number"
                            id="delivery_fee"
                            name="delivery_fee"
                            value={formData.delivery_fee}
                            onChange={handleInputChange}
                            min="0"
                            step="10"
                            className="w-full max-w-xs px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            This is the fee you charge for delivering vehicles to the customer's accommodation.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Add deposit requirement options section */}
                    <div className="md:col-span-2 mt-2 p-8 bg-primary/5 rounded-lg border border-primary/20">
                      <h3 className="text-lg font-medium mb-5">Deposit Requirements</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2 p-4 border border-white/10 rounded-md hover:bg-white/5">
                            <input
                              type="checkbox"
                              id="requires_id_deposit"
                              name="requires_id_deposit"
                              checked={formData.requires_id_deposit}
                              onChange={handleInputChange}
                              className="h-4 w-4"
                            />
                            <label htmlFor="requires_id_deposit" className="text-sm font-medium">
                              Require ID deposit
                            </label>
                          </div>
                          
                          <p className="text-xs text-muted-foreground px-3">
                            Customers will need to provide a valid ID which is returned after the rental period.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2 p-4 border border-white/10 rounded-md hover:bg-white/5">
                            <input
                              type="checkbox"
                              id="requires_cash_deposit"
                              name="requires_cash_deposit"
                              checked={formData.requires_cash_deposit}
                              onChange={handleInputChange}
                              className="h-4 w-4"
                            />
                            <label htmlFor="requires_cash_deposit" className="text-sm font-medium">
                              Require cash deposit
                            </label>
                          </div>
                          
                          {formData.requires_cash_deposit && (
                            <div className="px-3">
                              <label htmlFor="cash_deposit_amount" className="block text-sm font-medium mb-2">
                                Cash Deposit Amount (₱)
                              </label>
                              <input
                                type="number"
                                id="cash_deposit_amount"
                                name="cash_deposit_amount"
                                value={formData.cash_deposit_amount}
                                onChange={handleInputChange}
                                min="0"
                                step="100"
                                className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                This is the amount of cash deposit required for renting your vehicles.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-6 p-5 bg-white/5 rounded-md border border-white/10">
                        <p className="text-sm text-muted-foreground">
                          The deposit requirements will be clearly displayed to customers on your shop page and 
                          during the booking process.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload progress indicator with animation */}
                  {isUploading && (
                    <div className="mt-8 bg-primary/5 rounded-lg p-5 border border-primary/20">
                      <label className="block text-sm font-medium mb-3">Upload Progress</label>
                      <div className="w-full bg-muted rounded-full h-4">
                        <div 
                          className="bg-primary h-4 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-primary mt-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        {uploadProgress}% complete
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-10 flex justify-end space-x-4 border-t border-border pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleEditToggle}
                      className="px-5"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center shadow-md hover:shadow-lg transition-all px-6"
                    >
                      {isSaving ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="lg:col-span-3 space-y-10">
                {/* Shop Info */}
                <div className="bg-card rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-border">
                    <h2 className="text-xl font-semibold flex items-center">
                      <MapPin size={18} className="mr-2" />
                      Shop Information
                    </h2>
                    <Button
                      onClick={handleEditToggle}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 hover:bg-primary/5"
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                  </div>
                  
                  {shop.description && (
                    <div className="mb-8 bg-muted/30 p-5 rounded-lg border-l-4 border-primary/30">
                      <p className="text-foreground italic">{shop.description}</p>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <MapPin size={20} className="mr-3 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="text-foreground font-medium">{shop.address}</p>
                        {shop.location_area && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            {shop.location_area} Area
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {shop.phone_number && (
                      <div className="flex items-center">
                        <Phone size={20} className="mr-3 text-primary shrink-0" />
                        <p>{shop.phone_number}</p>
                      </div>
                    )}
                    
                    {shop.email && (
                      <div className="flex items-center">
                        <Mail size={20} className="mr-3 text-primary shrink-0" />
                        <p>{shop.email}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Vehicle Stats */}
                <div className="bg-card rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-border">Inventory Summary</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-primary/5 rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                      <div className="text-3xl font-bold mb-2 text-primary">{vehicleStats.totalVehicles}</div>
                      <div className="text-sm text-muted-foreground">Total Vehicles</div>
                    </div>
                    <div className="bg-green-500/5 rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                      <div className="text-3xl font-bold mb-2 text-green-500">{vehicleStats.availableVehicles}</div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                    <div className="bg-red-500/5 rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                      <div className="text-3xl font-bold mb-2 text-red-500">{vehicleStats.rentedVehicles}</div>
                      <div className="text-sm text-muted-foreground">Rented</div>
                    </div>
                  </div>
                </div>
                
                {/* Deposit Requirements */}
                <div className="bg-card rounded-xl border border-border p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-border">
                    <h2 className="text-xl font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Deposit Requirements
                    </h2>
                    <Button
                      onClick={handleEditToggle}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 hover:bg-primary/5"
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* ID Deposit */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-5 h-5 flex-shrink-0 rounded-full ${shop.requires_id_deposit ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center mt-0.5`}>
                        {shop.requires_id_deposit ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">ID Deposit</h3>
                        <p className="text-sm text-muted-foreground">
                          {shop.requires_id_deposit 
                            ? "Customers must provide a valid ID as deposit." 
                            : "ID deposit is not required."}
                        </p>
                      </div>
                    </div>

                    {/* Cash Deposit */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-5 h-5 flex-shrink-0 rounded-full ${shop.requires_cash_deposit ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center mt-0.5`}>
                        {shop.requires_cash_deposit ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Cash Deposit</h3>
                        <p className="text-sm text-muted-foreground">
                          {shop.requires_cash_deposit 
                            ? `Customers must provide a cash deposit of ₱${shop.cash_deposit_amount}.` 
                            : "Cash deposit is not required."}
                        </p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 p-5 bg-muted/30 rounded-lg border border-primary/10">
                      <p className="text-sm text-muted-foreground">
                        These deposit requirements will be shown to customers when booking or viewing your shop page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 