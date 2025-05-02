"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, MapPin, Phone, Mail, Clock, Save, Eye, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SubscriptionStatus, ShopWithSubscription } from "@/components/shop/SubscriptionStatus";
import { Badge } from "@/components/ui/badge";
import { SIARGAO_LOCATIONS } from "@/lib/constants";

// Use the shared locations from constants
const siargaoLocations = SIARGAO_LOCATIONS;

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
  facebook_url?: string | null;
  instagram_url?: string | null;
  sms_number?: string | null;
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
  facebook_url: string;
  instagram_url: string;
  sms_number: string;
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
    cash_deposit_amount: 0,
    facebook_url: "",
    instagram_url: "",
    sms_number: ""
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

  // Function to save form state to localStorage
  const saveFormToLocalStorage = (shopId: string, formData: ShopFormData, isEditing: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`shop_form_${shopId}`, JSON.stringify(formData));
      localStorage.setItem(`shop_editing_${shopId}`, isEditing.toString());
    }
  };

  // Function to save image previews to localStorage
  const saveImagesToLocalStorage = (shopId: string, bannerPreview: string | null, logoPreview: string | null) => {
    if (typeof window !== 'undefined') {
      if (bannerPreview) {
        localStorage.setItem(`shop_banner_preview_${shopId}`, bannerPreview);
      }
      if (logoPreview) {
        localStorage.setItem(`shop_logo_preview_${shopId}`, logoPreview);
      }
    }
  };

  // Function to clear form data from localStorage
  const clearFormFromLocalStorage = (shopId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`shop_form_${shopId}`);
      localStorage.removeItem(`shop_editing_${shopId}`);
      localStorage.removeItem(`shop_banner_preview_${shopId}`);
      localStorage.removeItem(`shop_logo_preview_${shopId}`);
    }
  };

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

        // Check if we have saved form data in localStorage
        if (typeof window !== 'undefined') {
          const savedFormData = localStorage.getItem(`shop_form_${shopData.id}`);
          const savedEditingState = localStorage.getItem(`shop_editing_${shopData.id}`);
          const savedBannerPreview = localStorage.getItem(`shop_banner_preview_${shopData.id}`);
          const savedLogoPreview = localStorage.getItem(`shop_logo_preview_${shopData.id}`);

          if (savedFormData) {
            // Restore form data from localStorage
            setFormData(JSON.parse(savedFormData));
            console.log('Restored form data from localStorage');
          } else {
            // Set form data from shop data if no saved data
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
              cash_deposit_amount: shopData.cash_deposit_amount || 0,
              facebook_url: shopData.facebook_url || "",
              instagram_url: shopData.instagram_url || "",
              sms_number: shopData.sms_number || ""
            });
          }

          // Restore editing state if it exists
          if (savedEditingState) {
            setIsEditing(savedEditingState === 'true');
            console.log('Restored editing state from localStorage:', savedEditingState === 'true');
          }

          // Set banner and logo preview from localStorage or from shop data
          if (savedBannerPreview) {
            setBannerPreview(savedBannerPreview);
          } else if (shopData.banner_url) {
            setBannerPreview(shopData.banner_url);
          }

          if (savedLogoPreview) {
            setLogoPreview(savedLogoPreview);
          } else if (shopData.logo_url) {
            setLogoPreview(shopData.logo_url);
          }
        } else {
          // Fallback if localStorage is not available
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
            cash_deposit_amount: shopData.cash_deposit_amount || 0,
            facebook_url: shopData.facebook_url || "",
            instagram_url: shopData.instagram_url || "",
            sms_number: shopData.sms_number || ""
          });

          // Set banner and logo preview if they exist
          if (shopData.banner_url) {
            setBannerPreview(shopData.banner_url);
          }

          if (shopData.logo_url) {
            setLogoPreview(shopData.logo_url);
          }
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

      // Clear form data from localStorage when canceling edit
      if (shop) {
        clearFormFromLocalStorage(shop.id);
      }
    }

    const newEditingState = !isEditing;
    setIsEditing(newEditingState);

    // Save editing state to localStorage
    if (shop && newEditingState) {
      saveFormToLocalStorage(shop.id, formData, newEditingState);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev: any) => {
        const updatedFormData = {
          ...prev,
          [name]: checked,
        };

        // Save updated form data to localStorage
        if (shop && isEditing) {
          saveFormToLocalStorage(shop.id, updatedFormData, isEditing);
        }

        return updatedFormData;
      });
    } else {
      setFormData((prev: any) => {
        const updatedFormData = {
          ...prev,
          [name]: value,
        };

        // Save updated form data to localStorage
        if (shop && isEditing) {
          saveFormToLocalStorage(shop.id, updatedFormData, isEditing);
        }

        return updatedFormData;
      });
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
      const previewUrl = reader.result as string;
      setBannerPreview(previewUrl);

      // Save banner preview to localStorage
      if (shop && isEditing) {
        saveImagesToLocalStorage(shop.id, previewUrl, logoPreview);
      }
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
      const previewUrl = reader.result as string;
      setLogoPreview(previewUrl);

      // Save logo preview to localStorage
      if (shop && isEditing) {
        saveImagesToLocalStorage(shop.id, bannerPreview, previewUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerRemove = () => {
    setBannerFile(null);
    const defaultPreview = shop?.banner_url || null;
    setBannerPreview(defaultPreview);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }

    // Update localStorage
    if (shop && isEditing) {
      saveImagesToLocalStorage(shop.id, defaultPreview, logoPreview);
    }
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    const defaultPreview = shop?.logo_url || null;
    setLogoPreview(defaultPreview);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }

    // Update localStorage
    if (shop && isEditing) {
      saveImagesToLocalStorage(shop.id, bannerPreview, defaultPreview);
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
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        sms_number: formData.sms_number,
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

      // Clear form data from localStorage after successful save
      if (shop) {
        clearFormFromLocalStorage(shop.id);
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
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 sm:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Shop</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Update your shop information and settings
          </p>
        </div>
        <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-3">
          {shop && !shop.is_verified && (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-2 py-1.5 px-3 text-xs sm:text-sm">
              <Clock className="h-4 w-4" />
              Pending Verification
            </Badge>
          )}

          {!isEditing && (
            <div className="flex flex-wrap w-full sm:w-auto gap-2 mt-2 sm:mt-0">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 hover:bg-primary/5 border-primary/30 text-xs sm:text-sm flex-1 sm:flex-none justify-center"
              >
                <Link href={`/shop/${shop?.id}`}>
                  <Eye size={14} className="text-primary mr-1" />
                  <span className="sm:inline">View Public Listing</span>
                  <span className="inline sm:hidden">View Shop</span>
                </Link>
              </Button>
              <Button
                onClick={handleEditToggle}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 hover:bg-primary/5 text-xs sm:text-sm flex-1 sm:flex-none justify-center"
              >
                <Edit size={14} className="mr-1" />
                Edit Shop
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Form/Content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {shop && (
          <>
            <div className="relative w-full h-48 sm:h-60 md:h-80 rounded-xl overflow-hidden mb-6 sm:mb-10 bg-card shadow-md group lg:col-span-3">
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
                  <p className="text-muted-foreground text-sm sm:text-base">No banner image</p>
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
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                        onClick={handleBannerRemove}
                      >
                        <X size={16} className="sm:hidden" />
                        <X size={20} className="hidden sm:block" />
                      </button>
                    </>
                  ) : (
                    <div className="h-full bg-gradient-to-r from-primary/20 to-primary/5 flex flex-col items-center justify-center p-4">
                      <ImageIcon size={30} className="sm:hidden text-muted-foreground mb-2" />
                      <ImageIcon size={50} className="hidden sm:block text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2 sm:mb-4 text-sm sm:text-lg text-center">No banner image</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bannerInputRef.current?.click()}
                        className="flex items-center border-primary/30 hover:border-primary hover:shadow-md transition-all text-xs sm:text-sm"
                      >
                        <Upload size={14} className="mr-1 sm:mr-2" />
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

              <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 flex items-end">
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 sm:border-4 border-card bg-card shadow-lg">
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
                      <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
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
                            <X size={12} className="sm:hidden" />
                            <X size={14} className="hidden sm:block" />
                          </button>
                        </>
                      ) : (
                        <div
                          className="h-full bg-primary/10 flex items-center justify-center cursor-pointer"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
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
                <div className="ml-2 sm:ml-4 bg-black/50 backdrop-blur-sm p-2 sm:p-4 rounded-lg">
                  <h2 className="text-white font-semibold text-sm sm:text-xl md:text-2xl">{shop.name}</h2>
                  {shop.is_verified && (
                    <span className="bg-primary/30 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10 lg:col-span-3">
                {/* Image upload section */}
                <div className="bg-card rounded-xl border border-border p-4 sm:p-6 md:p-8 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-8 pb-2 sm:pb-3 border-b border-border">Shop Images</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                    {/* Banner Image */}
                    <div className="space-y-3 sm:space-y-4">
                      <label className="block text-sm sm:text-base font-medium mb-1 sm:mb-2">
                        Banner Image
                      </label>
                      <div className="border border-dashed border-border rounded-lg p-3 sm:p-6 hover:border-primary/50 transition-colors">
                        {bannerPreview ? (
                          <div className="relative w-full h-36 sm:h-52 mb-3 sm:mb-4 rounded-md overflow-hidden">
                            <Image
                              src={bannerPreview || '/placeholder-banner.jpg'}
                              alt="Banner preview"
                              className="object-cover"
                              fill
                            />
                            <button
                              type="button"
                              className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                              onClick={handleBannerRemove}
                            >
                              <X size={16} className="sm:hidden" />
                              <X size={18} className="hidden sm:block" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-36 sm:h-52 bg-muted rounded-md">
                            <ImageIcon size={24} className="sm:hidden text-muted-foreground mb-2" />
                            <ImageIcon size={36} className="hidden sm:block text-muted-foreground mb-3" />
                            <p className="text-muted-foreground text-xs sm:text-sm mb-2 sm:mb-3">No banner selected</p>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => bannerInputRef.current?.click()}
                          className="w-full py-1.5 sm:py-2 hover:bg-primary/5 text-xs sm:text-sm"
                        >
                          <Upload size={14} className="sm:hidden mr-1" />
                          <Upload size={16} className="hidden sm:block mr-2" />
                          {bannerPreview ? "Change Banner" : "Upload Banner"}
                        </Button>
                        <input
                          type="file"
                          ref={bannerInputRef}
                          onChange={handleBannerChange}
                          className="hidden"
                          accept="image/*"
                        />
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
                          Recommended size: 1200×400 pixels. Max 5MB.
                        </p>
                      </div>
                    </div>

                    {/* Shop Logo */}
                    <div className="space-y-3 sm:space-y-4">
                      <label className="block text-sm sm:text-base font-medium mb-1 sm:mb-2">
                        Shop Logo
                      </label>
                      <div className="border border-dashed border-border rounded-lg p-3 sm:p-6 hover:border-primary/50 transition-colors">
                        {logoPreview ? (
                          <div className="relative h-36 sm:h-52 mb-3 sm:mb-4 rounded-md flex items-center justify-center bg-muted/30">
                            <div className="relative w-24 h-24 sm:w-36 sm:h-36 rounded-lg overflow-hidden shadow-md">
                              <Image
                                src={logoPreview || '/placeholder-logo.jpg'}
                                alt="Logo preview"
                                className="object-cover"
                                fill
                              />
                            </div>
                            <button
                              type="button"
                              className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                              onClick={handleLogoRemove}
                            >
                              <X size={16} className="sm:hidden" />
                              <X size={18} className="hidden sm:block" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-36 sm:h-52 bg-muted rounded-md">
                            <ImageIcon size={24} className="sm:hidden text-muted-foreground mb-2" />
                            <ImageIcon size={36} className="hidden sm:block text-muted-foreground mb-3" />
                            <p className="text-muted-foreground text-xs sm:text-sm mb-2 sm:mb-3">No logo selected</p>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full py-1.5 sm:py-2 hover:bg-primary/5 text-xs sm:text-sm"
                        >
                          <Upload size={14} className="sm:hidden mr-1" />
                          <Upload size={16} className="hidden sm:block mr-2" />
                          {logoPreview ? "Change Logo" : "Upload Logo"}
                        </Button>
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoChange}
                          className="hidden"
                          accept="image/*"
                        />
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
                          Recommended size: 200×200 pixels. Max 2MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4 sm:p-6 md:p-8 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-8 pb-2 sm:pb-3 border-b border-border">Shop Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-4 sm:gap-y-6 md:gap-y-8">
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="name" className="block text-xs sm:text-sm font-medium mb-1">
                        Shop Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="email" className="block text-xs sm:text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="phone_number" className="block text-xs sm:text-sm font-medium mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="whatsapp" className="block text-xs sm:text-sm font-medium mb-1">
                        WhatsApp (Optional)
                      </label>
                      <input
                        type="text"
                        id="whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    {/* Facebook URL */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="facebook_url" className="block text-xs sm:text-sm font-medium mb-1">
                        Facebook Page URL (Optional)
                      </label>
                      <input
                        type="url"
                        id="facebook_url"
                        name="facebook_url"
                        value={formData.facebook_url}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/your-page"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    {/* Instagram URL */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="instagram_url" className="block text-xs sm:text-sm font-medium mb-1">
                        Instagram Page URL (Optional)
                      </label>
                      <input
                        type="url"
                        id="instagram_url"
                        name="instagram_url"
                        value={formData.instagram_url}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/your-account"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    {/* SMS Number */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="sms_number" className="block text-xs sm:text-sm font-medium mb-1">
                        SMS Number (Optional)
                      </label>
                      <input
                        type="text"
                        id="sms_number"
                        name="sms_number"
                        value={formData.sms_number}
                        onChange={handleInputChange}
                        placeholder="+63 XXX XXX XXXX"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="address" className="block text-xs sm:text-sm font-medium mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="location_area" className="block text-xs sm:text-sm font-medium mb-1">
                        Location Area
                      </label>
                      <select
                        id="location_area"
                        name="location_area"
                        value={formData.location_area}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="">Select an area</option>
                        {siargaoLocations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        This helps customers find your shop when searching by location.
                      </p>
                    </div>

                    <div className="md:col-span-2 space-y-1 sm:space-y-2 mt-2">
                      <label htmlFor="description" className="block text-xs sm:text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        rows={4}
                      />
                    </div>

                    {/* Add delivery options section */}
                    <div className="md:col-span-2 mt-4 sm:mt-6 md:mt-8 p-4 sm:p-6 md:p-8 bg-primary/5 rounded-lg border border-primary/20">
                      <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-5">Delivery Options</h3>

                      <div className="flex items-center space-x-2 mb-3 sm:mb-5">
                        <input
                          type="checkbox"
                          id="offers_delivery"
                          name="offers_delivery"
                          checked={formData.offers_delivery}
                          onChange={handleInputChange}
                          className="h-4 w-4"
                        />
                        <label htmlFor="offers_delivery" className="text-xs sm:text-sm font-medium">
                          Offer delivery service to customers
                        </label>
                      </div>

                      {formData.offers_delivery && (
                        <div className="ml-4 sm:ml-6 mt-2 sm:mt-3">
                          <label htmlFor="delivery_fee" className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
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
                            className="w-full max-w-xs px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          />
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                            This is the fee you charge for delivering vehicles to the customer's accommodation.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Add deposit requirement options section */}
                    <div className="md:col-span-2 mt-4 sm:mt-6 p-4 sm:p-6 md:p-8 bg-primary/5 rounded-lg border border-primary/20">
                      <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-5">Deposit Requirements</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center space-x-2 p-3 sm:p-4 border border-white/10 rounded-md hover:bg-white/5">
                            <input
                              type="checkbox"
                              id="requires_id_deposit"
                              name="requires_id_deposit"
                              checked={formData.requires_id_deposit}
                              onChange={handleInputChange}
                              className="h-4 w-4"
                            />
                            <label htmlFor="requires_id_deposit" className="text-xs sm:text-sm font-medium">
                              Require ID deposit
                            </label>
                          </div>

                          <p className="text-[10px] sm:text-xs text-muted-foreground px-3">
                            Customers will need to provide a valid ID which is returned after the rental period.
                          </p>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center space-x-2 p-3 sm:p-4 border border-white/10 rounded-md hover:bg-white/5">
                            <input
                              type="checkbox"
                              id="requires_cash_deposit"
                              name="requires_cash_deposit"
                              checked={formData.requires_cash_deposit}
                              onChange={handleInputChange}
                              className="h-4 w-4"
                            />
                            <label htmlFor="requires_cash_deposit" className="text-xs sm:text-sm font-medium">
                              Require cash deposit
                            </label>
                          </div>

                          {formData.requires_cash_deposit && (
                            <div className="px-3">
                              <label htmlFor="cash_deposit_amount" className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
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
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              />
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                                This is the amount of cash deposit required for renting your vehicles.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-6 p-3 sm:p-5 bg-white/5 rounded-md border border-white/10">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          The deposit requirements will be clearly displayed to customers on your shop page and
                          during the booking process.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload progress indicator with animation */}
                  {isUploading && (
                    <div className="mt-4 sm:mt-6 md:mt-8 bg-primary/5 rounded-lg p-3 sm:p-5 border border-primary/20">
                      <label className="block text-xs sm:text-sm font-medium mb-2 sm:mb-3">Upload Progress</label>
                      <div className="w-full bg-muted rounded-full h-3 sm:h-4">
                        <div
                          className="bg-primary h-3 sm:h-4 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs sm:text-sm text-primary mt-1 sm:mt-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 sm:mr-2 sm:w-4 sm:h-4">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        {uploadProgress}% complete
                      </p>
                    </div>
                  )}

                  <div className="mt-6 sm:mt-8 md:mt-10 flex justify-end gap-2 sm:gap-4 border-t border-border pt-4 sm:pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEditToggle}
                      className="px-3 sm:px-5 text-xs sm:text-sm py-1.5 sm:py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving}
                      className="flex items-center shadow-md hover:shadow-lg transition-all px-3 sm:px-6 text-xs sm:text-sm py-1.5 sm:py-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1 sm:mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} className="sm:hidden mr-1" />
                          <Save size={16} className="hidden sm:block mr-2" />
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

                    {/* Facebook URL in view mode */}
                    {shop.facebook_url && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-blue-500 shrink-0">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                        <a href={shop.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          Facebook Page
                        </a>
                      </div>
                    )}

                    {/* Instagram URL in view mode */}
                    {shop.instagram_url && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-pink-500 shrink-0">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                        <a href={shop.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">
                          Instagram Profile
                        </a>
                      </div>
                    )}

                    {/* SMS Number in view mode */}
                    {shop.sms_number && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-green-500 shrink-0">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <a href={`sms:${shop.sms_number}`} className="text-green-400 hover:underline">
                          {shop.sms_number}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Add View Public Listing button */}
                  <div className="mt-8 pt-4 border-t border-border">
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/90"
                    >
                      <Link href={`/shop/${shop?.id}`}>
                        <Eye size={16} className="mr-1" />
                        View Your Public Shop Listing
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      See how your shop appears to customers
                    </p>
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