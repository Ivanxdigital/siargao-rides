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

export default function ManageShopPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [bikeStats, setBikeStats] = useState({
    totalBikes: 0,
    availableBikes: 0,
    rentedBikes: 0
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
        
        setShop(data);
        
        // Set form data for potential editing
        setFormData({
          name: data.name,
          description: data.description || "",
          address: data.address,
          city: data.city,
          phone_number: data.phone_number || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          // You can add more fields here as needed
        });
        
        // Set banner and logo preview if they exist
        if (data.banner_url) {
          setBannerPreview(data.banner_url);
        }
        
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
        
        // Fetch bike statistics
        const { data: bikes, error: bikesError } = await supabase
          .from("bikes")
          .select("*")
          .eq("shop_id", data.id);
        
        if (!bikesError && bikes) {
          setBikeStats({
            totalBikes: bikes.length,
            availableBikes: bikes.filter(bike => bike.is_available).length,
            rentedBikes: bikes.filter(bike => !bike.is_available).length
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
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
        city: formData.city,
        phone_number: formData.phone_number,
        whatsapp: formData.whatsapp,
        email: formData.email,
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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Pending Verification</h1>
          <p className="mb-4 text-muted-foreground">
            Your shop registration is currently being reviewed by our team. You'll be able to manage your shop once it's verified.
          </p>
          <Button variant="outline" asChild>
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
        <div className="animate-pulse text-center">
          <h1 className="text-2xl font-bold mb-4">Loading your shop...</h1>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show shop management interface
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">My Shop</h1>
        
        <div className="flex items-center gap-3">
          {shop && (
            <Button variant="outline" asChild>
              <Link href={`/shop/${shop.id}`} className="inline-flex items-center gap-2">
                <Eye size={16} />
                <span>View Public Listing</span>
              </Link>
            </Button>
          )}
          
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={handleEditToggle}
          >
            {isEditing ? "Cancel" : (
              <>
                <Edit size={16} className="mr-2" />
                Edit Shop
              </>
            )}
          </Button>
        </div>
      </div>

      {shop && (
        <>
          <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6 bg-card">
            {/* Banner image with edit option when in edit mode */}
            {(bannerPreview || shop.banner_url) && !isEditing ? (
              <Image
                src={bannerPreview || shop.banner_url}
                alt={shop.name}
                className="object-cover"
                fill
              />
            ) : !isEditing ? (
              <div className="h-full bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                <p className="text-muted-foreground">No banner image</p>
              </div>
            ) : (
              <div className="h-full relative">
                {bannerPreview ? (
                  <>
                    <Image
                      src={bannerPreview}
                      alt="Banner preview"
                      className="object-cover"
                      fill
                    />
                    <button 
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      onClick={handleBannerRemove}
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <div className="h-full bg-gradient-to-r from-primary/20 to-primary/5 flex flex-col items-center justify-center">
                    <ImageIcon size={40} className="text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-3">No banner image</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => bannerInputRef.current?.click()}
                      className="flex items-center"
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

            <div className="absolute bottom-4 left-4 flex items-end">
              <div className="relative w-20 h-20 rounded-md overflow-hidden border-4 border-card bg-card">
                {/* Logo image with edit option when in edit mode */}
                {(logoPreview || shop.logo_url) && !isEditing ? (
                  <Image
                    src={logoPreview || shop.logo_url}
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
                          src={logoPreview}
                          alt="Logo preview"
                          className="object-cover"
                          fill
                        />
                        <button 
                          className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full"
                          onClick={handleLogoRemove}
                        >
                          <X size={12} />
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
              <div className="ml-4 bg-black/50 backdrop-blur-sm p-2 rounded-md">
                <h2 className="text-white font-semibold">{shop.name}</h2>
                {shop.is_verified && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image upload section */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-4">Shop Images</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Banner Image
                    </label>
                    <div className="border border-dashed border-border rounded-lg p-4">
                      {bannerPreview ? (
                        <div className="relative h-40 mb-2">
                          <Image
                            src={bannerPreview}
                            alt="Banner preview"
                            className="object-cover rounded-md"
                            fill
                          />
                          <button 
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                            onClick={handleBannerRemove}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 bg-muted rounded-md">
                          <ImageIcon size={30} className="text-muted-foreground mb-2" />
                          <p className="text-muted-foreground text-sm mb-2">No banner selected</p>
                        </div>
                      )}
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full"
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
                      <p className="text-xs text-muted-foreground mt-2">
                        Recommended size: 1200×400 pixels. Max 5MB.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Shop Logo
                    </label>
                    <div className="border border-dashed border-border rounded-lg p-4">
                      {logoPreview ? (
                        <div className="relative h-40 mb-2">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-md overflow-hidden">
                            <Image
                              src={logoPreview}
                              alt="Logo preview"
                              className="object-cover"
                              fill
                            />
                          </div>
                          <button 
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                            onClick={handleLogoRemove}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 bg-muted rounded-md">
                          <ImageIcon size={30} className="text-muted-foreground mb-2" />
                          <p className="text-muted-foreground text-sm mb-2">No logo selected</p>
                        </div>
                      )}
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full"
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
                      <p className="text-xs text-muted-foreground mt-2">
                        Recommended size: 200×200 pixels. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-4">Shop Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium mb-1">
                      WhatsApp (Optional)
                    </label>
                    <input
                      type="text"
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={5}
                    />
                  </div>
                </div>
                
                {/* Upload progress indicator */}
                {isUploading && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Upload Progress</label>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{uploadProgress}% complete</p>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center"
                  >
                    {isSaving ? "Saving..." : (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Shop Info */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h2 className="text-xl font-semibold mb-4">Shop Information</h2>
                  
                  {shop.description && (
                    <p className="text-muted-foreground mb-4">{shop.description}</p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <MapPin size={18} className="mr-2 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-foreground">{shop.address}</p>
                        <p className="text-muted-foreground">{shop.city}</p>
                      </div>
                    </div>
                    
                    {shop.phone_number && (
                      <div className="flex items-center">
                        <Phone size={18} className="mr-2 text-muted-foreground shrink-0" />
                        <p>{shop.phone_number}</p>
                      </div>
                    )}
                    
                    {shop.email && (
                      <div className="flex items-center">
                        <Mail size={18} className="mr-2 text-muted-foreground shrink-0" />
                        <p>{shop.email}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bike Stats */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h2 className="text-xl font-semibold mb-4">Inventory Summary</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-primary/5 rounded-md p-4 text-center">
                      <div className="text-3xl font-bold mb-1 text-primary">{bikeStats.totalBikes}</div>
                      <div className="text-sm text-muted-foreground">Total Bikes</div>
                    </div>
                    <div className="bg-green-500/5 rounded-md p-4 text-center">
                      <div className="text-3xl font-bold mb-1 text-green-500">{bikeStats.availableBikes}</div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                    <div className="bg-red-500/5 rounded-md p-4 text-center">
                      <div className="text-3xl font-bold mb-1 text-red-500">{bikeStats.rentedBikes}</div>
                      <div className="text-sm text-muted-foreground">Rented</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Opening Hours - This could be expanded in the future */}
              <div className="bg-card rounded-lg border border-border p-6 h-fit">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock size={18} className="mr-2" />
                  Quick Links
                </h2>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/bikes">Manage Bikes</Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/bikes/add">Add New Bike</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 