"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, MapPin, Phone, Mail, Clock, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

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
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !shop) return;
    
    try {
      setIsSaving(true);
      
      // Update shop in Supabase
      const { error } = await supabase
        .from("rental_shops")
        .update({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          phone_number: formData.phone_number,
          whatsapp: formData.whatsapp,
          email: formData.email,
          updated_at: new Date().toISOString()
        })
        .eq("id", shop.id);
      
      if (error) throw error;
      
      // Update the local shop state
      setShop({
        ...shop,
        ...formData,
        updated_at: new Date().toISOString()
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating shop:", error);
      setError("Failed to update shop information");
    } finally {
      setIsSaving(false);
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
            {shop.banner_url ? (
              <Image
                src={shop.banner_url}
                alt={shop.name}
                className="object-cover"
                fill
              />
            ) : (
              <div className="h-full bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                <p className="text-muted-foreground">No banner image</p>
              </div>
            )}

            <div className="absolute bottom-4 left-4 flex items-end">
              <div className="relative w-20 h-20 rounded-md overflow-hidden border-4 border-card bg-card">
                {shop.logo_url ? (
                  <Image
                    src={shop.logo_url}
                    alt={`${shop.name} logo`}
                    className="object-cover"
                    fill
                  />
                ) : (
                  <div className="h-full bg-primary/10 flex items-center justify-center">
                    <p className="text-xs text-center text-muted-foreground">
                      No logo
                    </p>
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