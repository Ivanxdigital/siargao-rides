"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import {
  Store,
  MoreVertical,
  Search,
  Filter,
  Edit,
  Trash,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Car,
  Calendar,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ShopOwner {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

interface ShopStats {
  vehicleCount: number;
  activeRentalsCount: number;
  totalRentalsCount: number;
  averageRating: number;
  reviewCount: number;
}

interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone_number?: string;
  whatsapp?: string;
  email?: string;
  opening_hours?: any;
  logo_url?: string;
  banner_url?: string;
  is_verified: boolean;
  is_active: boolean;
  is_showcase: boolean;
  location_area?: string;
  offers_delivery?: boolean;
  delivery_fee?: number;
  requires_id_deposit?: boolean;
  requires_cash_deposit?: boolean;
  cash_deposit_amount?: number;
  created_at: string;
  updated_at: string;
  subscription_status?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  owner?: ShopOwner;
  stats?: ShopStats;
}

export default function ShopManagementPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  
  // State management
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShops, setTotalShops] = useState(0);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState<Partial<Shop>>({});

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
  
  const DropdownSeparator = () => {
    return <div className="h-px bg-gray-700 my-1" />;
  };

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // Fetch shops
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchShops();
    }
  }, [isAuthenticated, isAdmin, currentPage, searchTerm, statusFilter]);

  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        search: searchTerm,
        status: statusFilter,
        sortBy: "created_at",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/admin/shops?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch shops");
      }

      const data = await response.json();
      setShops(data.shops);
      setTotalPages(data.pagination.totalPages);
      setTotalShops(data.pagination.total);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to load shops");
    } finally {
      setIsLoadingShops(false);
    }
  };

  const handleEditClick = (shop: Shop) => {
    setSelectedShop(shop);
    setEditFormData({
      name: shop.name,
      description: shop.description,
      address: shop.address,
      city: shop.city,
      phone_number: shop.phone_number,
      whatsapp: shop.whatsapp,
      email: shop.email,
      location_area: shop.location_area,
      offers_delivery: shop.offers_delivery,
      delivery_fee: shop.delivery_fee,
      requires_id_deposit: shop.requires_id_deposit,
      requires_cash_deposit: shop.requires_cash_deposit,
      cash_deposit_amount: shop.cash_deposit_amount,
      is_verified: shop.is_verified,
      is_active: shop.is_active,
      is_showcase: shop.is_showcase,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateShop = async () => {
    if (!selectedShop) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/shops/${selectedShop.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update shop");
      }

      const result = await response.json();
      toast.success("Shop updated successfully");
      
      // Refresh shops list
      await fetchShops();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating shop:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update shop");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (shop: Shop) => {
    setSelectedShop(shop);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteShop = async () => {
    if (!selectedShop) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/shops/${selectedShop.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete shop");
      }

      toast.success("Shop deleted successfully");
      
      // Refresh shops list
      await fetchShops();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting shop:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete shop");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleVisibility = async (shop: Shop) => {
    try {
      const response = await fetch(`/api/admin/shops/${shop.id}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !shop.is_active }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle visibility");
      }

      toast.success(`Shop ${shop.is_active ? "deactivated" : "activated"} successfully`);
      await fetchShops();
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to toggle shop visibility");
    }
  };

  // Status badge component
  const StatusBadge = ({ shop }: { shop: Shop }) => {
    const badges = [];

    if (shop.is_verified) {
      badges.push(
        <Badge key="verified" variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    } else {
      badges.push(
        <Badge key="unverified" variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Unverified
        </Badge>
      );
    }

    if (shop.is_active) {
      badges.push(
        <Badge key="active" variant="default" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
          <Eye className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else {
      badges.push(
        <Badge key="inactive" variant="secondary" className="bg-red-500/20 text-red-500 border-red-500/30">
          <EyeOff className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }

    if (shop.is_showcase) {
      badges.push(
        <Badge key="showcase" variant="default" className="bg-purple-500/20 text-purple-500 border-purple-500/30">
          <Star className="w-3 h-3 mr-1" />
          Showcase
        </Badge>
      );
    }

    return <div className="flex flex-wrap gap-2">{badges}</div>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="mb-6 text-muted-foreground">You don't have permission to access the admin dashboard.</p>
        <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="pt-2 md:pt-4 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">Shop Management</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage all rental shops on the platform
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Total Shops</h3>
              <p className="text-2xl font-bold">{totalShops}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Verified</h3>
              <p className="text-2xl font-bold">
                {shops.filter(s => s.is_verified).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Active</h3>
              <p className="text-2xl font-bold">
                {shops.filter(s => s.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Showcase</h3>
              <p className="text-2xl font-bold">
                {shops.filter(s => s.is_showcase).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search shops by name, city, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shops</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
            <SelectItem value="showcase">Showcase</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shops Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingShops ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-2">Loading shops...</p>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No shops found.
                  </td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-muted">
                          {shop.logo_url ? (
                            <Image
                              src={shop.logo_url}
                              alt={shop.name}
                              width={40}
                              height={40}
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
                            {shop.city}, {shop.location_area || shop.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {shop.owner?.first_name} {shop.owner?.last_name}
                        </div>
                        <div className="text-muted-foreground">{shop.owner?.email}</div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <StatusBadge shop={shop} />
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>{shop.stats?.vehicleCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{shop.stats?.activeRentalsCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>
                            {shop.stats?.averageRating
                              ? shop.stats.averageRating.toFixed(1)
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(shop.created_at).toLocaleDateString()}
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      <SimpleDropdown
                        trigger={
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                      >
                        <DropdownItem onClick={() => handleEditClick(shop)}>
                          <Edit className="h-4 w-4" />
                          Edit Details
                        </DropdownItem>
                        
                        <DropdownItem onClick={() => handleToggleVisibility(shop)}>
                          {shop.is_active ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Deactivate Shop
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Activate Shop
                            </>
                          )}
                        </DropdownItem>
                        
                        <DropdownItem
                          onClick={() => window.open(`/shop/${shop.id}`, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                          View Shop Page
                        </DropdownItem>
                        
                        <DropdownSeparator />
                        
                        <DropdownItem
                          onClick={() => handleDeleteClick(shop)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash className="h-4 w-4" />
                          Delete Shop
                        </DropdownItem>
                      </SimpleDropdown>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shop Details</DialogTitle>
            <DialogDescription>
              Update shop information for {selectedShop?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Shop Name</Label>
                <Input
                  id="name"
                  value={editFormData.name || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editFormData.city || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, city: e.target.value })
                  }
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editFormData.address || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, address: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editFormData.description || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editFormData.phone_number || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone_number: e.target.value })
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={editFormData.whatsapp || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, whatsapp: e.target.value })
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Shop Settings</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={editFormData.is_verified || false}
                  onCheckedChange={(checked) =>
                    setEditFormData({ ...editFormData, is_verified: checked as boolean })
                  }
                />
                <Label htmlFor="verified" className="cursor-pointer">
                  Shop is verified
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={editFormData.is_active || false}
                  onCheckedChange={(checked) =>
                    setEditFormData({ ...editFormData, is_active: checked as boolean })
                  }
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Shop is active (visible to customers)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showcase"
                  checked={editFormData.is_showcase || false}
                  onCheckedChange={(checked) =>
                    setEditFormData({ ...editFormData, is_showcase: checked as boolean })
                  }
                />
                <Label htmlFor="showcase" className="cursor-pointer">
                  Show in showcase mode
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delivery"
                  checked={editFormData.offers_delivery || false}
                  onCheckedChange={(checked) =>
                    setEditFormData({ ...editFormData, offers_delivery: checked as boolean })
                  }
                />
                <Label htmlFor="delivery" className="cursor-pointer">
                  Offers delivery service
                </Label>
              </div>
            </div>
            
            {editFormData.offers_delivery && (
              <div>
                <Label htmlFor="delivery_fee">Delivery Fee</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  value={editFormData.delivery_fee || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      delivery_fee: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShop} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Shop"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shop</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedShop?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-500 mb-1">Warning</p>
                  <p className="text-muted-foreground">
                    This action cannot be undone. This will permanently delete the shop,
                    all its vehicles, and associated data.
                  </p>
                  {selectedShop?.stats?.activeRentalsCount && selectedShop.stats.activeRentalsCount > 0 && (
                    <p className="text-red-500 mt-2">
                      This shop has {selectedShop.stats.activeRentalsCount} active rental(s).
                      You cannot delete it until these are completed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteShop}
              disabled={isUpdating || (selectedShop?.stats?.activeRentalsCount || 0) > 0}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Shop"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}