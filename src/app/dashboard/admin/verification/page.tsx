"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink, AlertCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiableRentalShop } from "../types";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/Dialog";

// Add this type definition before the component function
type RentalShopWithUser = {
  id: string;
  name: string;
  address: string;
  city: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  email: string | null;
  phone_number: string | null;
  whatsapp: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    phone_number: string | null;
  };
};

// Add this helper function at the top level
const extractDocuments = (description: string) => {
  const documents: { type: 'id' | 'permit', url: string }[] = [];
  
  if (!description || !description.includes('Documents:')) {
    console.log('No documents section found in description:', description);
    return documents;
  }
  
  console.log('Extracting documents from:', description);
  
  // Extract ID URL - more robust pattern with lookahead to handle URLs that might have spaces or end with quotes
  const idPattern = /ID:(https:\/\/[^\s"]+)(?:\s|"|$)/;
  const idMatch = description.match(idPattern);
  if (idMatch) {
    const url = idMatch[1].trim();
    // Only add if it looks like a valid URL
    if (url.startsWith('https://')) {
      documents.push({ type: 'id', url });
      console.log('Found ID document:', url);
    } else {
      console.log('Found ID match but URL is invalid:', url);
    }
  } else {
    console.log('No ID document found with pattern:', idPattern);
  }
  
  // Extract Permit URL - similar robust pattern for business permits
  const permitPattern = /Permit:(https:\/\/[^\s"]+)(?:\s|"|$)/;
  const permitMatch = description.match(permitPattern);
  if (permitMatch) {
    const url = permitMatch[1].trim();
    // Only add if it looks like a valid URL
    if (url.startsWith('https://')) {
      documents.push({ type: 'permit', url });
      console.log('Found Permit document:', url);
    } else {
      console.log('Found Permit match but URL is invalid:', url);
    }
  } else {
    console.log('No Permit document found with pattern:', permitPattern);
  }
  
  console.log('Extracted documents:', documents);
  return documents;
};

// Add this helper function to extract referral information
const extractReferral = (description: string): string | null => {
  if (!description) return null;
  
  const referralPattern = /Referred by: ([^.]+)\./i;
  const referralMatch = description.match(referralPattern);
  
  if (referralMatch && referralMatch[1]) {
    return referralMatch[1].trim();
  }
  
  return null;
};

// Add this helper function to detect file type
const getFileType = (url: string): 'image' | 'pdf' | 'unknown' => {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.endsWith('.pdf')) {
    return 'pdf';
  } else if (
    lowercaseUrl.endsWith('.jpg') || 
    lowercaseUrl.endsWith('.jpeg') || 
    lowercaseUrl.endsWith('.png') || 
    lowercaseUrl.endsWith('.gif') || 
    lowercaseUrl.endsWith('.webp')
  ) {
    return 'image';
  }
  
  // If no extension, try to guess from URL
  if (lowercaseUrl.includes('pdf')) {
    return 'pdf';
  } else if (
    lowercaseUrl.includes('image') || 
    lowercaseUrl.includes('jpg') || 
    lowercaseUrl.includes('jpeg') || 
    lowercaseUrl.includes('png')
  ) {
    return 'image';
  }
  
  return 'unknown';
};

// Update the DocumentPreview component
const DocumentPreview = ({ type, url }: { type: 'id' | 'permit', url: string }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  // Clean the URL by removing any trailing punctuation or whitespace
  const cleanUrl = url.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
  const fileType = getFileType(cleanUrl);
  
  return (
    <>
      <div className="relative group">
        <div className="bg-muted/30 border border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {fileType === 'pdf' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {type === 'id' ? (
                    <>
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="9" cy="10" r="2" />
                      <path d="M15 8h2" />
                      <path d="M15 12h2" />
                      <path d="M7 16h10" />
                    </>
                  ) : (
                    <>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M16 13H8" />
                      <path d="M16 17H8" />
                      <path d="M10 9H8" />
                    </>
                  )}
                </svg>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium">
                {type === 'id' ? 'Government ID' : 'Business Permit'}
                {fileType === 'pdf' && <span className="ml-2 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">PDF</span>}
                {fileType === 'image' && <span className="ml-2 text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">Image</span>}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={() => setIsPreviewOpen(true)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 group"
                >
                  {fileType === 'pdf' ? 'View PDF' : 'View Image'}
                  <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" />
                </button>
                <a 
                  href={cleanUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 group"
                  download={fileType === 'pdf'}
                >
                  {fileType === 'pdf' ? 'Download PDF' : 'Open in New Tab'}
                  <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
              {loadError && (
                <p className="text-xs text-red-500 mt-1">
                  Document preview unavailable. Try opening in new tab.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300" />
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-[80vh] p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">Unable to load document</h3>
              <p className="text-muted-foreground mb-4">
                The document could not be loaded. This might be due to the file being removed or insufficient permissions.
              </p>
              <a 
                href={cleanUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
                download={fileType === 'pdf'}
              >
                {fileType === 'pdf' ? 'Download PDF file' : 'Open image in new tab'}
                <ExternalLink size={16} />
              </a>
            </div>
          ) : fileType === 'pdf' ? (
            <div className="w-full h-[80vh] bg-gray-100">
              <object
                data={cleanUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                onError={() => setLoadError(true)}
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Your browser does not support embedded PDF viewing.
                  </p>
                  <a 
                    href={cleanUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                    download
                  >
                    Download PDF file
                    <ExternalLink size={16} />
                  </a>
                </div>
              </object>
            </div>
          ) : (
            <div className="relative w-full h-[80vh]">
              <Image
                src={cleanUrl}
                alt={`${type === 'id' ? 'Government ID' : 'Business Permit'} Document`}
                fill
                className="object-contain"
                unoptimized // Since we're loading from Supabase storage
                onError={() => setLoadError(true)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function ShopVerificationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [pendingShops, setPendingShops] = useState<VerifiableRentalShop[]>([]);
  const [verifiedShops, setVerifiedShops] = useState<VerifiableRentalShop[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Redirect if not authenticated or not admin
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
  }, [isAuthenticated, isAdmin]);

  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      // Fetch all shops
      const { data, error } = await supabase
        .from("rental_shops")
        .select(`
          *,
          owner:owner_id (
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
        // Cast the data to unknown first to avoid TypeScript errors
        const typedData = data as unknown as Array<VerifiableRentalShop>;
        
        // Split shops into pending and verified
        const pending = typedData?.filter(shop => !shop.is_verified) || [];
        const verified = typedData?.filter(shop => shop.is_verified) || [];
        
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
        
        // Get response data
        const responseData = await response.json();
        
        // Move shop from pending to verified list in the UI
        const shop = pendingShops.find(s => s.id === shopId);
        if (shop) {
          setPendingShops(pendingShops.filter(s => s.id !== shopId));
          setVerifiedShops([{ ...shop, is_verified: true }, ...verifiedShops]);
          setStatusMessage({ 
            type: 'success', 
            text: responseData.user_role_updated 
              ? `Shop "${shop.name}" has been approved and owner now has shop_owner role.` 
              : `Shop "${shop.name}" has been approved.`
          });
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
          setStatusMessage({ type: 'success', text: `Shop "${shop.name}" has been rejected.` });
        }
      } else {
        // Call our API endpoint
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
        
        // Remove shop from pending list in the UI
        const shop = pendingShops.find(s => s.id === shopId);
        if (shop) {
          setPendingShops(pendingShops.filter(s => s.id !== shopId));
          setStatusMessage({ type: 'success', text: `Shop "${shop.name}" has been rejected.` });
        }
      }
    } catch (error: any) {
      console.error('Error rejecting shop:', error);
      setStatusMessage({ type: 'error', text: `Failed to reject shop: ${error.message}` });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="mb-6 text-white/70">You don't have permission to access shop verification.</p>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="pt-2 md:pt-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-white">
          Shop Verification
        </h1>
        <p className="text-white/70 text-sm md:text-base">
          Verify new shop applications and manage existing shops
        </p>
      </div>
      
      {/* Status message */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          statusMessage.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <p className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle size={18} className="text-green-400" />
            ) : (
              <AlertCircle size={18} className="text-red-400" />
            )}
            {statusMessage.text}
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
            activeTab === 'pending'
              ? 'bg-primary/20 text-primary border-b-2 border-primary'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Verification
          {pendingShops.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs">
              {pendingShops.length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
            activeTab === 'verified'
              ? 'bg-primary/20 text-primary border-b-2 border-primary'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('verified')}
        >
          Verified Shops
        </button>
      </div>

      {/* Content */}
      <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
        {isLoadingShops ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <>
                {pendingShops.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-white/10 rounded-full p-3 mb-4">
                      <CheckCircle size={24} className="text-white/60" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-white/90">No pending shops</h3>
                    <p className="text-white/60">All shop applications have been processed.</p>
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
                                  src={shop.logo_url || shop.owner?.avatar_url} 
                                  alt={shop.name}
                                  size="md"
                                />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold">{shop.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Submitted {new Date(shop.created_at).toLocaleDateString()} by {shop.owner?.first_name} {shop.owner?.last_name}
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
                                  
                                  {/* Add referral information */}
                                  {shop.description && extractReferral(shop.description) && (
                                    <p>
                                      <span className="font-medium">Referred by:</span>{" "}
                                      <span className="text-primary">{extractReferral(shop.description)}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-2">Owner Information</h4>
                                <div className="space-y-2 text-sm">
                                  <p><span className="font-medium">Name:</span> {shop.owner?.first_name} {shop.owner?.last_name}</p>
                                  <p><span className="font-medium">Email:</span> {shop.owner?.email}</p>
                                  <p><span className="font-medium">Phone:</span> {shop.owner?.phone_number || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Description</h4>
                              <p className="text-sm">
                                {shop.description 
                                  ? shop.description.replace(/Documents:.*$/, '').trim() || 'No description provided.'
                                  : 'No description provided.'
                                }
                              </p>
                            </div>
                            
                            {/* Add document preview section */}
                            {shop.description && (
                              <div>
                                <h4 className="text-sm font-medium mb-3">Uploaded Documents</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {extractDocuments(shop.description).length > 0 ? (
                                    extractDocuments(shop.description).map((doc, index) => (
                                      <DocumentPreview key={index} type={doc.type} url={doc.url} />
                                    ))
                                  ) : (
                                    <div className="col-span-2 p-4 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground">
                                      No documents were uploaded or document URLs couldn't be extracted from the description.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
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
            )}
            
            {activeTab === 'verified' && (
              <>
                {verifiedShops.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-white/10 rounded-full p-3 mb-4">
                      <CheckCircle size={24} className="text-white/60" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-white/90">No verified shops</h3>
                    <p className="text-white/60">No shops have been verified yet.</p>
                  </div>
                ) : (
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
                                  src={shop.logo_url || shop.owner?.avatar_url} 
                                  alt={shop.name}
                                  size="sm"
                                  className="mr-3"
                                />
                                <span className="font-medium">{shop.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {shop.owner?.first_name} {shop.owner?.last_name}
                            </td>
                            <td className="px-4 py-3">
                              {shop.city}
                            </td>
                            <td className="px-4 py-3">
                              {new Date(shop.updated_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button 
                                variant="ghost" 
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
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
