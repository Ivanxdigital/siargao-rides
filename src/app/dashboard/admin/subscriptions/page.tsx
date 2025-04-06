"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Calendar, Calendar as CalendarIcon, Plus, RefreshCw } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ManageableSubscription } from "../types";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function SubscriptionManagementPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [shops, setShops] = useState<ManageableSubscription[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [selectedShop, setSelectedShop] = useState<ManageableSubscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // Fetch shops with subscription information
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchShops();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      const { data, error } = await supabase
        .from("rental_shops")
        .select(`
          id,
          name,
          logo_url,
          is_verified,
          is_active,
          subscription_status,
          subscription_start_date,
          subscription_end_date,
          created_at,
          updated_at,
          users!rental_shops_owner_id_fkey (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .order("subscription_end_date", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Error fetching shops:", error.message || error);
      } else {
        // Transform the data to match our ManageableSubscription type
        const transformedData = data.map(shop => ({
          ...shop,
          owner: shop.users
        })) as ManageableSubscription[];
        
        setShops(transformedData || []);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error fetching shops:", errorMessage);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const handleEditClick = (shop: ManageableSubscription) => {
    setSelectedShop(shop);
    if (shop.subscription_end_date) {
      setEndDate(new Date(shop.subscription_end_date));
    } else {
      setEndDate(undefined);
    }
    setIsEditDialogOpen(true);
  };

  const calculateDaysRemaining = (endDateStr: string | null): number => {
    if (!endDateStr) return 0;
    
    const endDate = new Date(endDateStr);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const handleExtendSubscription = async () => {
    if (!selectedShop) return;
    
    setIsUpdating(true);
    
    try {
      // Calculate new end date
      let newEndDate: Date;
      
      if (endDate) {
        // Use the selected date from DatePicker
        newEndDate = new Date(endDate);
      } else if (selectedShop.subscription_end_date) {
        // Extend from current end date
        newEndDate = new Date(selectedShop.subscription_end_date);
        newEndDate.setDate(newEndDate.getDate() + extendDays);
      } else {
        // Start new subscription from today
        newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + extendDays);
      }
      
      // Update the subscription in the database
      const { error } = await supabase
        .from("rental_shops")
        .update({
          subscription_status: "active",
          is_active: true,
          subscription_end_date: newEndDate.toISOString(),
          // If no start date exists, set it to now
          subscription_start_date: selectedShop.subscription_start_date || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedShop.id);

      if (error) {
        console.error("Error updating subscription:", error.message || error);
        alert("Failed to update subscription. Please try again.");
      } else {
        // Refresh data
        fetchShops();
        setIsEditDialogOpen(false);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error updating subscription:", errorMessage);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeactivateSubscription = async () => {
    if (!selectedShop) return;
    
    if (!confirm("Are you sure you want to deactivate this subscription? The shop will no longer be visible to customers.")) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from("rental_shops")
        .update({
          subscription_status: "expired",
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedShop.id);

      if (error) {
        console.error("Error deactivating subscription:", error.message || error);
        alert("Failed to deactivate subscription. Please try again.");
      } else {
        // Refresh data
        fetchShops();
        setIsEditDialogOpen(false);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error deactivating subscription:", errorMessage);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter shops based on search term
  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.owner?.email && shop.owner.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (shop.owner?.first_name && shop.owner.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (shop.owner?.last_name && shop.owner.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="mb-6 text-muted-foreground">You don't have permission to access the admin dashboard.</p>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Simple date picker component to avoid dependencies
  const SimpleDatePicker = ({ 
    selected, 
    onSelect, 
    minDate, 
    className 
  }: { 
    selected?: Date; 
    onSelect: (date: Date) => void; 
    minDate?: Date;
    className?: string;
  }) => {
    return (
      <div className={cn("relative", className)}>
        <input
          type="date"
          className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
          value={selected ? selected.toISOString().split('T')[0] : ''}
          min={minDate ? minDate.toISOString().split('T')[0] : undefined}
          onChange={(e) => {
            if (e.target.value) {
              onSelect(new Date(e.target.value));
            }
          }}
        />
      </div>
    );
  };

  // Show subscription management interface
  return (
    <div>
      <div className="pt-2 md:pt-4 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">
              Subscription Management
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage rental shop subscriptions and trial periods
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button onClick={fetchShops} variant="outline" size="sm" className="flex items-center gap-1">
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <Input
            placeholder="Search shops by name or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Subscription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Active Subscriptions</h3>
              <p className="text-2xl font-bold">
                {isLoadingShops ? "..." : shops.filter(s => s.subscription_status === "active").length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Trial Periods</h3>
              <p className="text-2xl font-bold">
                {isLoadingShops ? "..." : shops.filter(s => 
                  s.subscription_status === "active" && 
                  s.subscription_end_date && 
                  calculateDaysRemaining(s.subscription_end_date) <= 30 &&
                  calculateDaysRemaining(s.subscription_end_date) > 0
                ).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Expired Subscriptions</h3>
              <p className="text-2xl font-bold">
                {isLoadingShops ? "..." : shops.filter(s => s.subscription_status === "expired").length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subscriptions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-sm font-medium">Shop</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Start Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium">End Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Remaining</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingShops ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-2">Loading subscription data...</p>
                  </td>
                </tr>
              ) : filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {searchTerm ? "No shops match your search." : "No shops found."}
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => {
                  const daysRemaining = calculateDaysRemaining(shop.subscription_end_date);
                  
                  return (
                    <tr key={shop.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted">
                            {shop.logo_url ? (
                              <Image 
                                src={shop.logo_url} 
                                alt={shop.name} 
                                width={32} 
                                height={32} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                                {shop.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{shop.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {shop.owner?.first_name && shop.owner?.last_name
                                ? `${shop.owner.first_name} ${shop.owner.last_name}`
                                : shop.owner?.email || "Unknown owner"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {shop.subscription_status === "active" && shop.is_active ? (
                          <div className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-green-500">Active</span>
                          </div>
                        ) : shop.subscription_status === "expired" ? (
                          <div className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            <span className="text-red-500">Expired</span>
                          </div>
                        ) : shop.is_verified && !shop.subscription_status ? (
                          <div className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                            <span className="text-amber-500">No Trial</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                            <span className="text-gray-500">Inactive</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {shop.subscription_start_date 
                          ? new Date(shop.subscription_start_date).toLocaleDateString() 
                          : "Not started"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {shop.subscription_end_date 
                          ? new Date(shop.subscription_end_date).toLocaleDateString() 
                          : "No end date"}
                      </td>
                      <td className="px-4 py-3">
                        {shop.subscription_status === "active" && shop.subscription_end_date ? (
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${
                              daysRemaining <= 3 ? "text-red-500" :
                              daysRemaining <= 7 ? "text-amber-500" : 
                              "text-green-500"
                            }`}>
                              {daysRemaining} days
                            </span>
                            {daysRemaining <= 7 && (
                              <span className="text-xs text-muted-foreground">
                                {daysRemaining <= 3 ? "Critical" : "Expiring soon"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClick(shop)}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Update subscription details for {selectedShop?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  <span className={`text-sm ${
                    selectedShop?.subscription_status === "active" ? "text-green-500" :
                    selectedShop?.subscription_status === "expired" ? "text-red-500" :
                    "text-white/70"
                  }`}>
                    {selectedShop?.subscription_status === "active" ? "Active" :
                     selectedShop?.subscription_status === "expired" ? "Expired" :
                     "Not Started"}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Current End Date:</span>
                  <span className="text-sm text-white/70">
                    {selectedShop?.subscription_end_date 
                      ? new Date(selectedShop.subscription_end_date).toLocaleDateString() 
                      : "Not set"}
                  </span>
                </div>
                
                {selectedShop?.subscription_status === "active" && selectedShop.subscription_end_date && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Days Remaining:</span>
                    <span className={`text-sm ${
                      calculateDaysRemaining(selectedShop.subscription_end_date) <= 3 ? "text-red-500" :
                      calculateDaysRemaining(selectedShop.subscription_end_date) <= 7 ? "text-amber-500" :
                      "text-green-500"
                    }`}>
                      {calculateDaysRemaining(selectedShop.subscription_end_date)} days
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium">Extend Subscription</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm whitespace-nowrap">Choose end date:</span>
                    <SimpleDatePicker
                      selected={endDate}
                      onSelect={setEndDate}
                      minDate={new Date()}
                      className="flex-grow"
                    />
                  </div>
                  <p className="text-xs text-white/70">Or extend by days:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[7, 14, 30, 90].map(days => (
                      <Button
                        key={days}
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setExtendDays(days);
                          
                          if (selectedShop?.subscription_end_date) {
                            const newEndDate = new Date(selectedShop.subscription_end_date);
                            if (newEndDate < new Date()) {
                              // If already expired, extend from today
                              newEndDate.setTime(new Date().getTime());
                            }
                            newEndDate.setDate(newEndDate.getDate() + days);
                            setEndDate(newEndDate);
                          } else {
                            // No existing end date, extend from today
                            const newEndDate = new Date();
                            newEndDate.setDate(newEndDate.getDate() + days);
                            setEndDate(newEndDate);
                          }
                        }}
                      >
                        {days} days
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 justify-between">
            <Button 
              variant="destructive"
              onClick={handleDeactivateSubscription}
              disabled={isUpdating || !selectedShop?.is_active}
            >
              Deactivate
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button 
                onClick={handleExtendSubscription}
                disabled={isUpdating || !endDate}
              >
                {selectedShop?.subscription_status === "active" ? "Update Subscription" : "Activate Subscription"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 