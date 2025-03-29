"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink, AlertCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export default function ShopVerificationPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [pendingShops, setPendingShops] = useState<any[]>([]);
  const [verifiedShops, setVerifiedShops] = useState<any[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // Fetch shops
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchShops();
    }
  }, [isAuthenticated, isAdmin]);

  // Add mock data for demonstration if no shops are found - COMMENTED OUT TO USE REAL DATA
  /*
  useEffect(() => {
    if (!isLoadingShops && pendingShops.length === 0 && verifiedShops.length === 0) {
      // Only add mock data if no shops were found in the database
      const mockPendingShops = [
        {
          id: 'mock-pending-1',
          name: 'Siargao Scooter Rentals',
          owner_id: 'mock-user-1',
          address: '123 Beach Road',
          city: 'General Luna',
          phone_number: '+63 912 345 6789',
          email: 'info@siargaoscooter.com',
          whatsapp: '+63 912 345 6789',
          description: 'We offer the latest models of scooters and motorcycles for rent at affordable prices. All our bikes are well-maintained and regularly serviced.',
          is_verified: false,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          users: {
            first_name: 'Juan',
            last_name: 'Santos',
            email: 'juan@siargaoscooter.com',
            phone_number: '+63 912 345 6789',
            avatar_url: null
          }
        },
        {
          id: 'mock-pending-2',
          name: 'Island Explorer Bikes',
          owner_id: 'mock-user-2',
          address: '45 Tourism Road',
          city: 'Cloud 9',
          phone_number: '+63 918 765 4321',
          email: 'explore@islandbikes.com',
          whatsapp: null,
          description: 'Explorer Bikes offers a wide selection of motorcycles perfect for exploring the beautiful island of Siargao. Daily, weekly, and monthly rates available.',
          is_verified: false,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          users: {
            first_name: 'Maria',
            last_name: 'Reyes',
            email: 'maria@islandbikes.com',
            phone_number: '+63 918 765 4321',
            avatar_url: null
          }
        }
      ];
      
      const mockVerifiedShops = [
        {
          id: 'mock-verified-1',
          name: 'Surf & Ride Rentals',
          owner_id: 'mock-user-3',
          address: '78 Sunset Boulevard',
          city: 'General Luna',
          phone_number: '+63 917 123 4567',
          email: 'hello@surfandride.com',
          whatsapp: '+63 917 123 4567',
          description: 'Premier motorbike rental service located in the heart of General Luna, just 5 minutes from Cloud 9.',
          is_verified: true,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
          users: {
            first_name: 'Carlos',
            last_name: 'Mendoza',
            email: 'carlos@surfandride.com',
            phone_number: '+63 917 123 4567',
            avatar_url: null
          }
        }
      ];
      
      // Set mock data
      setPendingShops(mockPendingShops);
      setVerifiedShops(mockVerifiedShops);
    }
  }, [isLoadingShops, pendingShops.length, verifiedShops.length]);
  */

  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      // Fetch all shops
      const { data, error } = await supabase
        .from("rental_shops")
        .select(`
          *,
          users:owner_id (
            id,
            email,
            first_name,
            last_name,
            avatar_url,
            phone_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching shops:", error.message || error);
      } else {
        // Split shops into pending and verified
        const pending = data?.filter(shop => !shop.is_verified) || [];
        const verified = data?.filter(shop => shop.is_verified) || [];
        
        setPendingShops(pending);
        setVerifiedShops(verified);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error fetching shops:", errorMessage);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const handleApprove = async (shopId: string) => {
    setProcessingId(shopId);
    setStatusMessage(null);
    
    try {
      // Check if it's a mock ID
      if (shopId.startsWith('mock-')) {
        // Handle mock data approval
        const shop = pendingShops.find(s => s.id === shopId);
        if (shop) {
          setPendingShops(pendingShops.filter(s => s.id !== shopId));
          setVerifiedShops([{ 
            ...shop, 
            is_verified: true,
            updated_at: new Date().toISOString()
          }, ...verifiedShops]);
          setStatusMessage({ type: 'success', text: `Shop "${shop.name}" has been approved.` });
        }
      } else {
        // Call our new API endpoint
        const response = await fetch('/api/shops/verify', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopId,
            approve: true
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to approve shop');
        }
        
        // Move shop from pending to verified list in the UI
        const shop = pendingShops.find(s => s.id === shopId);
        if (shop) {
          setPendingShops(pendingShops.filter(s => s.id !== shopId));
          setVerifiedShops([{ ...shop, is_verified: true }, ...verifiedShops]);
          setStatusMessage({ type: 'success', text: `Shop "${shop.name}" has been approved.` });
        }
      }
    } catch (error: any) {
      console.error('Error approving shop:', error);
      setStatusMessage({ type: 'error', text: `Failed to approve shop: ${error.message}` });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (shopId: string) => {
    // In a real application, you might want to add a confirmation dialog
    if (!confirm('Are you sure you want to reject this shop application? This action cannot be undone.')) {
      return;
    }
    
    setProcessingId(shopId);
    setStatusMessage(null);
    
    try {
      // Check if it's a mock ID
      if (shopId.startsWith('mock-')) {
        // Handle mock data rejection
        const shop = pendingShops.find(s => s.id === shopId);
        if (shop) {
          setPendingShops(pendingShops.filter(s => s.id !== shopId));
          setStatusMessage({ type: 'success', text: `Shop application "${shop.name}" has been rejected.` });
        }
      } else {
        // Call our new API endpoint
        const response = await fetch('/api/shops/verify', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopId,
            approve: false
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reject shop');
        }
        
        // Remove shop from the pending list in the UI
        const shop = pendingShops.find(s => s.id === shopId);
        if (shop) {
          setPendingShops(pendingShops.filter(s => s.id !== shopId));
          setStatusMessage({ type: 'success', text: `Shop application "${shop.name}" has been rejected.` });
        }
      }
    } catch (error: any) {
      console.error('Error rejecting shop:', error);
      setStatusMessage({ type: 'error', text: `Failed to reject shop: ${error.message}` });
    } finally {
      setProcessingId(null);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Loading verification page...</div>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
          <p className="mb-6">You don't have permission to access the shop verification page.</p>
          <Button asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24">
      <div className="bg-black text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Shop Verification</h1>
              <p className="text-lg">Review and manage rental shop applications</p>
            </div>
            <Button asChild variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              <Link href="/admin">
                ← Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {statusMessage && (
            <div 
              className={`p-4 mb-6 rounded-md flex items-center ${
                statusMessage.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="mr-2 h-5 w-5" />
              ) : (
                <AlertCircle className="mr-2 h-5 w-5" />
              )}
              {statusMessage.text}
            </div>
          )}
          
          {/* Tab navigation */}
          <div className="border-b border-border mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 font-medium text-sm relative ${
                  activeTab === 'pending'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending Applications
                {pendingShops.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {pendingShops.length}
                  </span>
                )}
                {activeTab === 'pending' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`py-4 font-medium text-sm relative ${
                  activeTab === 'verified'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Verified Shops
                {activeTab === 'verified' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </button>
            </div>
          </div>
          
          {/* Shop List */}
          <div>
            {activeTab === 'pending' ? (
              <>
                {isLoadingShops ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-pulse">Loading shop applications...</div>
                  </div>
                ) : pendingShops.length === 0 ? (
                  <div className="text-center py-16 bg-muted/20 rounded-lg border border-border">
                    <div className="mb-3 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Pending Applications</h3>
                    <p className="text-muted-foreground">
                      All shop applications have been processed. Check back later for new ones.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingShops.map((shop) => (
                      <div key={shop.id} className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-4">
                          {/* Shop info */}
                          <div className="p-6 md:col-span-3">
                            <div className="flex items-center mb-4">
                              <div className="mr-4">
                                <Avatar 
                                  src={shop.logo_url || shop.users?.avatar_url} 
                                  alt={shop.name}
                                  size="md"
                                />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold">{shop.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Submitted {new Date(shop.created_at).toLocaleDateString()} by {shop.users?.first_name} {shop.users?.last_name}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Shop Details</h4>
                                <div className="space-y-2 text-sm">
                                  <p><span className="font-medium">Address:</span> {shop.address}, {shop.city}</p>
                                  <p><span className="font-medium">Phone:</span> {shop.phone_number}</p>
                                  <p><span className="font-medium">Email:</span> {shop.email}</p>
                                  <p><span className="font-medium">WhatsApp:</span> {shop.whatsapp || 'Not provided'}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-2">Owner Information</h4>
                                <div className="space-y-2 text-sm">
                                  <p><span className="font-medium">Name:</span> {shop.users?.first_name} {shop.users?.last_name}</p>
                                  <p><span className="font-medium">Email:</span> {shop.users?.email}</p>
                                  <p><span className="font-medium">Phone:</span> {shop.users?.phone_number || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Description</h4>
                              <p className="text-sm">{shop.description || 'No description provided.'}</p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="bg-muted/30 p-6 border-t md:border-t-0 md:border-l border-border flex flex-col justify-between">
                            <div className="space-y-3">
                              <Button 
                                className="w-full justify-center"
                                onClick={() => handleApprove(shop.id)}
                                disabled={processingId === shop.id}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              
                              <Button 
                                variant="outline"
                                className="w-full justify-center"
                                onClick={() => handleReject(shop.id)}
                                disabled={processingId === shop.id}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                            
                            <div className="mt-6">
                              <Button 
                                variant="ghost" 
                                className="w-full justify-center text-muted-foreground"
                                asChild
                              >
                                <Link href={`/shop/${shop.id}`}>
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {isLoadingShops ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-pulse">Loading verified shops...</div>
                  </div>
                ) : verifiedShops.length === 0 ? (
                  <div className="text-center py-16 bg-muted/20 rounded-lg border border-border">
                    <h3 className="text-xl font-medium mb-2">No Verified Shops</h3>
                    <p className="text-muted-foreground">
                      No shops have been verified yet.
                    </p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium">Shop</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Owner</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Location</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Verified On</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {verifiedShops.map((shop) => (
                            <tr key={shop.id}>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <Avatar 
                                    src={shop.logo_url || shop.users?.avatar_url} 
                                    alt={shop.name}
                                    size="sm"
                                    className="mr-3"
                                  />
                                  <span className="font-medium">{shop.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {shop.users?.first_name} {shop.users?.last_name}
                              </td>
                              <td className="px-4 py-3">
                                {shop.city}
                              </td>
                              <td className="px-4 py-3">
                                {new Date(shop.updated_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  asChild
                                >
                                  <Link href={`/shop/${shop.id}`}>
                                    View
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
