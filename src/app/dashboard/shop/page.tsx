"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, MapPin, Phone, Mail, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { mockShops } from "@/lib/mock-data";
import Image from "next/image";

export default function ManageShopPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is a shop owner
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
      return;
    }

    // Fetch shop data - this would be replaced with an API call
    const fetchShop = async () => {
      try {
        setIsLoading(true);
        // In a real app, we would fetch from API with the shop owner's ID
        // For now, use mock data
        const mockShop = mockShops[0]; // Assume the first shop belongs to this owner
        setShop(mockShop);
        setFormData({
          name: mockShop.name,
          description: mockShop.description || "",
          address: mockShop.address,
          city: mockShop.city,
          phone_number: mockShop.phone_number || "",
          whatsapp: mockShop.whatsapp || "",
          email: mockShop.email || "",
          opening_hours: mockShop.opening_hours || {
            monday: { open: "08:00", close: "18:00" },
            tuesday: { open: "08:00", close: "18:00" },
            wednesday: { open: "08:00", close: "18:00" },
            thursday: { open: "08:00", close: "18:00" },
            friday: { open: "08:00", close: "18:00" },
            saturday: { open: "08:00", close: "18:00" },
            sunday: { open: "08:00", close: "18:00" },
          },
        });
      } catch (error) {
        console.error("Error fetching shop:", error);
        setError("Failed to load shop data");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
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

  const handleOpeningHoursChange = (day: string, type: 'open' | 'close', value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [type]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      // In a real app, we would call an API to update the shop
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      
      // Update local state
      setShop({
        ...shop,
        ...formData,
      });
      
      setIsEditing(false);
    } catch (err) {
      setError("Failed to save shop details");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-card rounded-lg mb-6"></div>
        <div className="h-8 w-1/3 bg-card rounded-md mb-4"></div>
        <div className="h-4 w-full bg-card rounded-md mb-2"></div>
        <div className="h-4 w-full bg-card rounded-md mb-2"></div>
      </div>
    );
  }

  // Error state
  if (error && !shop) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  // If shop data is loaded correctly
  if (shop) {
    return (
      <div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Your Shop</h1>
            <p className="text-muted-foreground">
              Update your shop details to help customers find you
            </p>
          </div>
          {!isEditing && (
            <Button onClick={handleEditToggle} className="shrink-0">
              <Edit size={18} className="mr-2" />
              Edit Shop Details
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Shop Banner & Logo */}
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
            {/* Shop Details Form */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Shop Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-sm font-medium mb-1" htmlFor="name">
                    Shop Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium mb-1" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="address">
                    Address *
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="city">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="phone_number">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="whatsapp">
                    WhatsApp
                  </label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="text"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium mb-1" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Opening Hours</h2>
              <div className="space-y-3">
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                  <div key={day} className="grid grid-cols-5 gap-2 items-center">
                    <div className="col-span-1 capitalize">{day}</div>
                    <div className="col-span-2">
                      <label className="sr-only" htmlFor={`${day}-open`}>
                        Open Time
                      </label>
                      <input
                        id={`${day}-open`}
                        type="time"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        value={formData.opening_hours[day]?.open || ""}
                        onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="sr-only" htmlFor={`${day}-close`}>
                        Close Time
                      </label>
                      <input
                        id={`${day}-close`}
                        type="time"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        value={formData.opening_hours[day]?.close || ""}
                        onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Upload - would be implemented in a real app */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Shop Images</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Images help customers recognize your shop and build trust.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Logo</label>
                  <div className="border border-dashed border-border rounded-md p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop or click to upload
                    </p>
                    <Button variant="outline" size="sm" type="button">
                      Select Image
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Banner</label>
                  <div className="border border-dashed border-border rounded-md p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop or click to upload
                    </p>
                    <Button variant="outline" size="sm" type="button">
                      Select Image
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleEditToggle}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Shop Details View */
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
                    <div className="text-3xl font-bold mb-1 text-primary">12</div>
                    <div className="text-sm text-muted-foreground">Total Bikes</div>
                  </div>
                  <div className="bg-green-500/5 rounded-md p-4 text-center">
                    <div className="text-3xl font-bold mb-1 text-green-500">8</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                  <div className="bg-red-500/5 rounded-md p-4 text-center">
                    <div className="text-3xl font-bold mb-1 text-red-500">4</div>
                    <div className="text-sm text-muted-foreground">Rented</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Opening Hours */}
            <div className="bg-card rounded-lg border border-border p-6 h-fit">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock size={18} className="mr-2" />
                Opening Hours
              </h2>
              <div className="space-y-2">
                {shop.opening_hours && Object.entries(shop.opening_hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between py-1 border-b border-border last:border-0">
                    <div className="capitalize">{day}</div>
                    <div>
                      {hours?.open && hours?.close
                        ? `${hours.open} - ${hours.close}`
                        : "Closed"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback if none of the above conditions are met
  return <div>Something went wrong. Please try again.</div>;
} 