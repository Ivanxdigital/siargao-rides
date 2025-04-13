"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Calendar, Calendar as CalendarIcon, Plus, RefreshCw, ExternalLink, MoreVertical, ArrowUpRight, EyeOff, Eye } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ManageableSubscription } from "../types";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";

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
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

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
          ),
          is_showcase
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
    
    try {
      if (shop.subscription_end_date) {
        const endDate = new Date(shop.subscription_end_date);
        console.log("Setting initial end date:", endDate.toISOString());
        setEndDate(endDate);
      } else {
        // If no end date, set a default 30 days from now
        const defaultEndDate = new Date();
        defaultEndDate.setDate(defaultEndDate.getDate() + 30);
        console.log("Setting default end date:", defaultEndDate.toISOString());
        setEndDate(defaultEndDate);
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      // Set a default date if parsing fails
      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 30);
      setEndDate(defaultEndDate);
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
    setStatusMessage(null);
    console.log("Extending subscription with end date:", endDate);
    
    try {
      // Use the selected date from DatePicker
      if (!endDate) {
        throw new Error("No end date selected");
      }
      
      // Ensure we're using a proper date object
      const newEndDate = new Date(endDate.getTime());
      console.log("New end date for subscription:", newEndDate.toISOString());
      
      // Create update data
      const updateData: {
        subscription_status: string;
        is_active: boolean;
        subscription_end_date: string;
        updated_at: string;
        subscription_start_date?: string;
      } = {
        subscription_status: "active",
        is_active: true,
        subscription_end_date: newEndDate.toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add start date if it doesn't exist
      if (!selectedShop.subscription_start_date) {
        updateData.subscription_start_date = new Date().toISOString();
      }
      
      console.log("Updating shop with data:", updateData);
      
      // Update the subscription in the database
      const { data, error } = await supabase
        .from("rental_shops")
        .update(updateData)
        .eq("id", selectedShop.id)
        .select();

      if (error) {
        console.error("Error updating subscription:", error.message || error);
        setStatusMessage({
          type: 'error',
          message: 'Failed to update subscription. Please try again.'
        });
      } else {
        console.log("Subscription updated successfully:", data);
        
        // Refresh data and wait for completion before closing dialog
        await fetchShops();
        
        // Call the refresh shop status API to ensure all related data is updated
        try {
          console.log("Calling refresh shop status API for shop:", selectedShop.id);
          const refreshResponse = await fetch('/api/shops/refresh-active-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shop_id: selectedShop.id }),
          });
          
          const refreshResult = await refreshResponse.json();
          console.log("Refresh shop status result:", refreshResult);
        } catch (refreshError) {
          console.error("Error refreshing shop status:", refreshError);
          // Continue anyway, as this is just an extra precaution
        }
        
        // Format the date nicely
        const formattedDate = newEndDate.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Set success message
        setStatusMessage({
          type: 'success',
          message: `Subscription for ${selectedShop.name} has been updated successfully until ${formattedDate}.`
        });
        
        // Show toast notification
        toast.success(`Subscription for ${selectedShop.name} updated until ${formattedDate}`);
        
        // Close dialog after a short delay to show the success message
        setTimeout(() => {
          setIsEditDialogOpen(false);
          setStatusMessage(null);
        }, 2000);
        
        // Force a router refresh to update any other components
        router.refresh();
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error updating subscription:", errorMessage);
      setStatusMessage({
        type: 'error',
        message: `An error occurred: ${errorMessage}`
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to manually refresh a shop's status
  const handleRefreshShopStatus = async () => {
    if (!selectedShop) return;
    
    setIsUpdating(true);
    setStatusMessage({
      type: 'info',
      message: 'Refreshing shop status...'
    });
    
    try {
      // Call the refresh API endpoint
      const response = await fetch('/api/shops/refresh-active-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop_id: selectedShop.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.details ? 
          `Failed to refresh shop status: ${errorData.details} (Code: ${errorData.code})` : 
          errorData.error || `Failed to refresh shop status: ${response.status}`
        );
      }
      
      const result = await response.json();
      console.log("Shop status refresh result:", result);
      
      // Refresh the shops data
      await fetchShops();
      
      // Set success message
      setStatusMessage({
        type: 'success',
        message: `Shop status refreshed. Current status: ${result.current_status ? 'Active' : 'Inactive'}`
      });
      
      // Show toast notification
      toast.success(`Shop status refreshed successfully`);
    } catch (error) {
      console.error("Error refreshing shop status:", error);
      setStatusMessage({
        type: 'error',
        message: `Failed to refresh shop status: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
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

  // Function to toggle showcase status
  const handleToggleShowcase = async (shopId: string) => {
    setStatusMessage(null);
    
    try {
      // Call the toggle-showcase API endpoint
      const response = await fetch('/api/shops/toggle-showcase-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop_id: shopId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.details ? 
          `Failed to toggle showcase status: ${errorData.details} (Code: ${errorData.code})` : 
          errorData.error || `Failed to toggle showcase status: ${response.status}`
        );
      }
      
      const result = await response.json();
      console.log("Showcase toggle result:", result);
      
      // Get the new showcase status from result
      let newShowcaseStatus: boolean | undefined;
      
      if (result && result.shop && typeof result.shop.is_showcase === 'boolean') {
        newShowcaseStatus = result.shop.is_showcase;
      } else if (result && typeof result.showcase_status === 'boolean') {
        // Fallback to showcase_status if available
        newShowcaseStatus = result.showcase_status;
      }
      
      if (typeof newShowcaseStatus === 'boolean') {
        // Update the shop in the local state with the new status
        setShops(prevShops => 
          prevShops.map(shop => 
            shop.id === shopId 
              ? { ...shop, is_showcase: newShowcaseStatus } 
              : shop
          )
        );
        
        // Show success message
        const message = result.message || `Shop showcase mode ${newShowcaseStatus ? 'enabled' : 'disabled'} successfully`;
        toast.success(message);
      } else {
        console.error("Invalid response format - missing showcase status:", result);
        toast.error("Could not determine the new showcase status");
      }
      
      // Refresh data regardless of status to ensure UI is up-to-date
      await fetchShops();
      
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error toggling showcase status:", errorMessage);
      toast.error(`Failed to toggle showcase status: ${errorMessage}`);
      
      // Refresh data anyway to ensure UI state is consistent
      await fetchShops();
    }
  };

  // Handler for direct activation button
  const handleDirectActivation = async (shopId: string, activate: boolean) => {
    try {
      setStatusMessage({
        type: 'info',
        message: `${activate ? 'Activating' : 'Deactivating'} shop directly...`
      });
      
      const response = await fetch('/api/shops/admin-set-active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: shopId,
          is_active: activate
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update shop status');
      }
      
      console.log("Direct activation result:", result);
      
      // Refresh data
      await fetchShops();
      
      // Show success message
      toast.success(`Shop ${activate ? 'activated' : 'deactivated'} successfully!`);
      setStatusMessage({
        type: 'success',
        message: `Shop ${activate ? 'activated' : 'deactivated'} successfully!`
      });
      
      // Clear message after delay
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error during direct activation:', error);
      toast.error(`Failed to ${activate ? 'activate' : 'deactivate'} shop: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusMessage({
        type: 'error',
        message: `Failed to ${activate ? 'activate' : 'deactivate'} shop: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

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
    const formattedValue = selected ? new Date(selected.getTime() - (selected.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : '';
    const formattedMinDate = minDate ? new Date(minDate.getTime() - (minDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : undefined;

    return (
      <div className={cn("relative", className)}>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            className="w-full rounded-md border border-white/10 bg-black/50 pl-10 pr-3 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary"
            value={formattedValue}
            min={formattedMinDate}
            onChange={(e) => {
              if (e.target.value) {
                // Create a date object at midnight in local timezone
                const selectedDate = new Date(e.target.value);
                console.log("Date selected:", selectedDate.toISOString());
                onSelect(selectedDate);
              }
            }}
          />
        </div>
      </div>
    );
  };

  // Simple Dropdown Menu Component
  const SimpleDropdown = ({ 
    trigger, 
    children 
  }: { 
    trigger: React.ReactNode, 
    children: React.ReactNode 
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Calculate position when dropdown opens
    const updatePosition = () => {
      if (!triggerRef.current) return;
      
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 200; // Approximate max height for dropdown
      
      // Set position based on available space
      const newPosition = spaceBelow < dropdownHeight ? 'top' : 'bottom';
      setPosition(newPosition);
      
      // Set coordinates for the dropdown portal
      // Align dropdown to the right edge of the trigger
      setCoords({
        left: rect.right - 192, // 192px is the width of the dropdown (w-48)
        top: newPosition === 'top' ? rect.top : rect.bottom,
        width: rect.width
      });
    };

    // Handle position calculation when dropdown opens
    useEffect(() => {
      if (isOpen) {
        updatePosition();
        // Recalculate on resize
        window.addEventListener('resize', updatePosition);
        // Recalculate on scroll
        window.addEventListener('scroll', updatePosition, true);
      }
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }, [isOpen]);

    // Handle clicks outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          triggerRef.current && 
          !triggerRef.current.contains(event.target as Node) &&
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    return (
      <>
        <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>
        
        {isOpen && typeof window !== 'undefined' && createPortal(
          <div 
            ref={dropdownRef}
            className="fixed z-[9999] shadow-lg"
            style={{
              top: position === 'top' ? coords.top - 8 - 200 : coords.top + 8, // Offset for spacing
              left: coords.left,
              width: 192, // Fixed dropdown width (w-48 = 12rem = 192px)
              maxHeight: 'calc(100vh - 20px)',
              overflow: 'auto'
            }}
          >
            <div className="rounded-md bg-black border border-gray-700 py-1 overflow-hidden" onClick={() => setIsOpen(false)}>
              {children}
            </div>
          </div>,
          document.body
        )}
      </>
    );
  };

  // Dropdown Item
  const DropdownItem = ({ 
    onClick, 
    children,
    className
  }: { 
    onClick?: () => void, 
    children: React.ReactNode,
    className?: string
  }) => {
    return (
      <button
        onClick={(e) => {
          if (onClick) {
            onClick();
          }
        }}
        className={cn("w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 flex items-center gap-2", className)}
      >
        {children}
      </button>
    );
  };

  // Add this StatusBadge component
  const StatusBadge = ({ 
    status, 
    isActive,
    isShowcase
  }: { 
    status: string | null; 
    isActive: boolean;
    isShowcase?: boolean;
  }) => {
    if (status === "active" && isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-500 border border-green-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div>
          Active
        </span>
      );
    }
    
    if (status === "trial" && isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500 border border-blue-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
          Trial
        </span>
      );
    }
    
    if (!isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-500 border border-red-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></div>
          Inactive
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-700/30">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></div>
        {status || "Unknown"}
      </span>
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
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Shop</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingShops ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-2">Loading subscription data...</p>
                  </td>
                </tr>
              ) : filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
                            <div className="font-medium flex items-center gap-2">
                              {shop.name}
                              {shop.is_showcase && (
                                <span className="px-1.5 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                  Showcase
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {shop.owner?.first_name && shop.owner?.last_name
                                ? `${shop.owner.first_name} ${shop.owner.last_name}`
                                : shop.owner?.email || "Unknown owner"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge 
                          status={shop.subscription_status} 
                          isActive={shop.is_active}
                          isShowcase={shop.is_showcase}
                        />
                        
                        <div className="mt-3 flex items-center space-x-2">
                          <SimpleDropdown 
                            trigger={
                              <Button size="sm" variant="outline" className="flex items-center gap-1">
                                <span>Actions</span>
                                <MoreVertical size={14} />
                              </Button>
                            }
                          >
                            {!shop.is_active && (
                              <DropdownItem 
                                onClick={() => handleDirectActivation(shop.id, true)}
                                className="text-green-400"
                              >
                                <CheckCircle size={14} className="mr-1.5" />
                                Force Activate
                              </DropdownItem>
                            )}
                            
                            {shop.is_active && (
                              <DropdownItem 
                                onClick={() => handleDirectActivation(shop.id, false)}
                                className="text-red-400"
                              >
                                <XCircle size={14} className="mr-1.5" />
                                Force Deactivate
                              </DropdownItem>
                            )}
                            
                            {/* Add Showcase Toggle Button */}
                            <DropdownItem 
                              onClick={() => handleToggleShowcase(shop.id)}
                              className={shop.is_showcase ? "text-purple-400" : "text-blue-400"}
                            >
                              {shop.is_showcase ? (
                                <>
                                  <Eye size={14} className="mr-1.5" />
                                  Disable Showcase Mode
                                </>
                              ) : (
                                <>
                                  <EyeOff size={14} className="mr-1.5" />
                                  Enable Showcase Mode
                                </>
                              )}
                            </DropdownItem>
                            
                            <DropdownItem onClick={() => window.open(`/browse?shop=${shop.id}`, '_blank')}>
                              <ArrowUpRight size={14} className="mr-1.5" />
                              View in Browse
                            </DropdownItem>
                            
                            <DropdownItem onClick={() => window.open(`/shop/${shop.id}`, '_blank')}>
                              <ArrowUpRight size={14} className="mr-1.5" />
                              View Shop Page
                            </DropdownItem>
                          </SimpleDropdown>
                          
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleEditClick(shop)}
                          >
                            Manage
                          </Button>
                        </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Manage Subscription</DialogTitle>
            <DialogDescription>
              Update subscription details for {selectedShop?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {statusMessage && (
              <div className={`p-3 mb-4 rounded-md ${
                statusMessage.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 
                statusMessage.type === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                'bg-blue-500/20 text-blue-500 border border-blue-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {statusMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : 
                   statusMessage.type === 'error' ? <XCircle className="h-5 w-5" /> :
                   <RefreshCw className="h-5 w-5 animate-spin" />}
                  <p>{statusMessage.message}</p>
                </div>
              </div>
            )}
          
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <h3 className="font-medium text-sm mb-3 text-gray-400">Current Status</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-sm">Status:</div>
                  <div className="text-sm font-medium text-right">
                    <StatusBadge 
                      status={selectedShop?.subscription_status || null} 
                      isActive={selectedShop?.is_active || false}
                      isShowcase={selectedShop?.is_showcase}
                    />
                  </div>
                  
                  {selectedShop?.is_showcase && (
                    <>
                      <div className="text-sm">Showcase Mode:</div>
                      <div className="text-sm font-medium text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <EyeOff size={10} className="mr-1.5" />
                          Enabled
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="text-sm">Start Date:</div>
                  <div className="text-sm text-right">
                    {selectedShop?.subscription_start_date 
                      ? new Date(selectedShop.subscription_start_date).toLocaleDateString() 
                      : "Not set"}
                  </div>
                  
                  <div className="text-sm">End Date:</div>
                  <div className="text-sm text-right">
                    {selectedShop?.subscription_end_date 
                      ? new Date(selectedShop.subscription_end_date).toLocaleDateString() 
                      : "Not set"}
                  </div>
                  
                  {selectedShop?.subscription_status === "active" && selectedShop.subscription_end_date && (
                    <>
                      <div className="text-sm">Days Remaining:</div>
                      <div className={`text-sm font-medium text-right ${
                        calculateDaysRemaining(selectedShop.subscription_end_date) <= 3 ? "text-red-500" :
                        calculateDaysRemaining(selectedShop.subscription_end_date) <= 7 ? "text-amber-500" :
                        "text-green-500"
                      }`}>
                        {calculateDaysRemaining(selectedShop.subscription_end_date)} days
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-medium">Extend Subscription</h3>
                
                <div className="space-y-2">
                  <label className="text-sm text-white/80 block">Set End Date:</label>
                  <SimpleDatePicker
                    selected={endDate}
                    onSelect={setEndDate}
                    minDate={new Date()}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be the new expiration date for the subscription.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-white/80 block">Quick Options:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[7, 14, 30, 90].map(days => (
                      <Button
                        key={days}
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setExtendDays(days);
                          
                          // Calculate new end date
                          const baseDate = new Date();
                          // If there's a valid subscription that hasn't expired, use that as base
                          if (selectedShop?.subscription_status === "active" && 
                              selectedShop.subscription_end_date &&
                              new Date(selectedShop.subscription_end_date) > new Date()) {
                            baseDate.setTime(new Date(selectedShop.subscription_end_date).getTime());
                          }
                          
                          // Add the selected days
                          baseDate.setDate(baseDate.getDate() + days);
                          console.log(`Adding ${days} days, new date:`, baseDate.toISOString());
                          setEndDate(baseDate);
                        }}
                        className="flex flex-col items-center justify-center py-2"
                      >
                        <span>+{days}</span>
                        <span className="text-xs text-muted-foreground">days</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {endDate && (
                <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
                  <h4 className="text-sm font-medium text-primary flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Subscription Summary
                  </h4>
                  <p className="text-sm mt-2">
                    The subscription for <strong>{selectedShop?.name}</strong> will be {selectedShop?.subscription_status === "active" ? "extended" : "activated"} until:
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {endDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshShopStatus}
                disabled={isUpdating}
                className="flex items-center gap-1 text-sm"
              >
                <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
                Refresh Status
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800">
              <h3 className="text-sm font-medium mb-2">Quick Links:</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start text-sm"
                >
                  <Link href="/browse" target="_blank" className="flex items-center gap-1.5">
                    <ExternalLink size={14} />
                    Browse Page
                  </Link>
                </Button>
                
                {selectedShop && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="justify-start text-sm"
                  >
                    <Link href={`/shop/${selectedShop.id}`} target="_blank" className="flex items-center gap-1.5">
                      <ExternalLink size={14} />
                      Shop Detail
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4 flex-col sm:flex-row sm:justify-between sm:space-x-2">
            <Button 
              variant="destructive"
              onClick={handleDeactivateSubscription}
              disabled={isUpdating || !selectedShop?.is_active}
              className="mb-2 sm:mb-0"
              size="sm"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Deactivate Shop
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating} size="sm">
                Cancel
              </Button>
              <Button 
                onClick={handleExtendSubscription}
                disabled={isUpdating || !endDate}
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {selectedShop?.subscription_status === "active" ? "Update Subscription" : "Activate Subscription"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 