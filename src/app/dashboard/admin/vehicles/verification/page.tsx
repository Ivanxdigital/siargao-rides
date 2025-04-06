"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink, AlertCircle, FileText, Car, Bike } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/Dialog";

// Define vehicle document type
type VehicleDocument = {
  type: 'registration' | 'insurance' | 'other';
  url: string;
  name?: string;
  uploaded_at: string;
};

// Define vehicle type with documents
type VerifiableVehicle = {
  id: string;
  name: string;
  description: string | null;
  vehicle_type_id: string;
  vehicle_types: {
    id: string;
    name: string;
  };
  category_id: string;
  categories: {
    id: string;
    name: string;
  };
  price_per_day: number;
  is_verified: boolean;
  verification_status: string;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  documents: VehicleDocument[];
  shop_id: string;
  rental_shops: {
    id: string;
    name: string;
    owner: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      phone_number: string | null;
    };
  };
  vehicle_images: {
    image_url: string;
    is_primary: boolean;
  }[];
  specifications: {
    features: string[];
    [key: string]: any;
  };
  color?: string;
  year?: number;
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

// Document preview component
const DocumentPreview = ({ type, url, name }: { type: 'registration' | 'insurance' | 'other', url: string, name?: string }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  // Clean the URL by removing any trailing punctuation or whitespace
  const cleanUrl = url.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
  const fileType = getFileType(cleanUrl);
  
  const getDocumentTitle = () => {
    switch (type) {
      case 'registration':
        return 'Vehicle Registration';
      case 'insurance':
        return 'Vehicle Insurance';
      case 'other':
        return name || 'Additional Document';
      default:
        return 'Document';
    }
  };
  
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
                <FileText className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium">
                {getDocumentTitle()}
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
                alt={`${getDocumentTitle()} Document`}
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

// Get vehicle icon based on type
const getVehicleIcon = (vehicleTypeName: string) => {
  switch (vehicleTypeName.toLowerCase()) {
    case 'motorcycle':
      return <Bike className="text-primary" size={24} />;
    case 'car':
      return <Car className="text-primary" size={24} />;
    case 'tuktuk':
      return <Car className="text-primary" size={24} />;
    default:
      return <Bike className="text-primary" size={24} />;
  }
};

export default function VehicleVerificationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [pendingVehicles, setPendingVehicles] = useState<VerifiableVehicle[]>([]);
  const [verifiedVehicles, setVerifiedVehicles] = useState<VerifiableVehicle[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string>('');
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // Fetch vehicles
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchVehicles();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      // Fetch all vehicles with their related data
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_types (id, name),
          categories (id, name),
          vehicle_images (image_url, is_primary),
          documents,
          rental_shops (
            id,
            name,
            owner:owner_id (
              id,
              email,
              first_name,
              last_name,
              avatar_url,
              phone_number
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching vehicles:", error.message || error);
      } else {
        // Cast the data to the correct type
        const typedData = data as unknown as Array<VerifiableVehicle>;
        
        // Split vehicles into pending and verified
        const pending = typedData?.filter(vehicle => vehicle.verification_status === 'pending') || [];
        const verified = typedData?.filter(vehicle => vehicle.verification_status === 'approved') || [];
        
        setPendingVehicles(pending);
        setVerifiedVehicles(verified);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error fetching vehicles:", errorMessage);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleApprove = async (vehicleId: string) => {
    setProcessingId(vehicleId);
    setStatusMessage(null);
    
    try {
      // Call our API endpoint
      const response = await fetch('/api/vehicles/verify', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          approve: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve vehicle');
      }
      
      // Get response data
      const responseData = await response.json();
      
      // Move vehicle from pending to verified list in the UI
      const vehicle = pendingVehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setPendingVehicles(pendingVehicles.filter(v => v.id !== vehicleId));
        setVerifiedVehicles([{ 
          ...vehicle, 
          is_verified: true,
          verification_status: 'approved' 
        }, ...verifiedVehicles]);
        setStatusMessage({ 
          type: 'success', 
          text: `Vehicle "${vehicle.name}" has been approved.`
        });
      }
    } catch (error: any) {
      console.error('Error approving vehicle:', error);
      setStatusMessage({ type: 'error', text: `Failed to approve vehicle: ${error.message}` });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectionDialog = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setRejectionNotes('');
    setIsRejectionDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedVehicleId) return;
    
    setProcessingId(selectedVehicleId);
    setStatusMessage(null);
    setIsRejectionDialogOpen(false);
    
    try {
      // Call our API endpoint
      const response = await fetch('/api/vehicles/verify', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          approve: false,
          notes: rejectionNotes
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject vehicle');
      }
      
      // Get response data
      const responseData = await response.json();
      
      // Remove vehicle from pending list in the UI
      const vehicle = pendingVehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        setPendingVehicles(pendingVehicles.filter(v => v.id !== selectedVehicleId));
        setStatusMessage({ type: 'success', text: `Vehicle "${vehicle.name}" has been rejected.` });
      }
    } catch (error: any) {
      console.error('Error rejecting vehicle:', error);
      setStatusMessage({ type: 'error', text: `Failed to reject vehicle: ${error.message}` });
    } finally {
      setProcessingId(null);
      setSelectedVehicleId(null);
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
        <p className="mb-6 text-white/70">You don't have permission to access vehicle verification.</p>
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
          Vehicle Verification
        </h1>
        <p className="text-white/70 text-sm md:text-base">
          Verify vehicle documents and manage vehicle listings
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
          {pendingVehicles.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs">
              {pendingVehicles.length}
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
          Verified Vehicles
        </button>
      </div>

      {/* Content */}
      <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
        {isLoadingVehicles ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <>
                {pendingVehicles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-white/10 rounded-full p-3 mb-4">
                      <CheckCircle size={24} className="text-white/60" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-white/90">No pending vehicles</h3>
                    <p className="text-white/60">All vehicle verifications have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-6 p-6">
                    {pendingVehicles.map((vehicle) => (
                      <div key={vehicle.id} className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-4">
                          {/* Vehicle info */}
                          <div className="p-6 md:col-span-3">
                            <div className="flex items-center mb-4">
                              <div className="mr-4 bg-primary/10 p-2 rounded-lg">
                                {getVehicleIcon(vehicle.vehicle_types?.name || 'motorcycle')}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold">{vehicle.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Added {new Date(vehicle.created_at).toLocaleDateString()} by {vehicle.rental_shops?.owner?.first_name} {vehicle.rental_shops?.owner?.last_name}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Vehicle Details</h4>
                                <div className="space-y-2 text-sm">
                                  <p><span className="font-medium">Type:</span> {vehicle.vehicle_types?.name}</p>
                                  <p><span className="font-medium">Category:</span> {vehicle.categories?.name}</p>
                                  <p><span className="font-medium">Daily Price:</span> ₱{vehicle.price_per_day}</p>
                                  {vehicle.color && <p><span className="font-medium">Color:</span> {vehicle.color}</p>}
                                  {vehicle.year && <p><span className="font-medium">Year:</span> {vehicle.year}</p>}
                                  {vehicle.specifications?.features?.length > 0 && (
                                    <p>
                                      <span className="font-medium">Features:</span>{" "}
                                      {vehicle.specifications.features.join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-2">Shop Information</h4>
                                <div className="space-y-2 text-sm">
                                  <p><span className="font-medium">Shop:</span> {vehicle.rental_shops?.name}</p>
                                  <p><span className="font-medium">Owner:</span> {vehicle.rental_shops?.owner?.first_name} {vehicle.rental_shops?.owner?.last_name}</p>
                                  <p><span className="font-medium">Email:</span> {vehicle.rental_shops?.owner?.email}</p>
                                  <p><span className="font-medium">Phone:</span> {vehicle.rental_shops?.owner?.phone_number || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                            
                            {vehicle.description && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Description</h4>
                                <p className="text-sm">{vehicle.description}</p>
                              </div>
                            )}
                            
                            {/* Display vehicle image */}
                            {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Primary Image</h4>
                                <div className="relative h-48 w-full md:w-2/3 lg:w-1/2 rounded-lg overflow-hidden border border-border">
                                  {vehicle.vehicle_images.find(img => img.is_primary)?.image_url ? (
                                    <Image
                                      src={vehicle.vehicle_images.find(img => img.is_primary)?.image_url || vehicle.vehicle_images[0].image_url}
                                      alt={vehicle.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-muted">
                                      <p className="text-muted-foreground">No image available</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Document preview section */}
                            {vehicle.documents && vehicle.documents.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-3">Uploaded Documents</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {vehicle.documents.map((doc, index) => (
                                    <DocumentPreview 
                                      key={index} 
                                      type={doc.type} 
                                      url={doc.url} 
                                      name={doc.name}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="bg-muted/30 p-6 border-t md:border-t-0 md:border-l border-border flex flex-col justify-between">
                            <div className="space-y-3">
                              <Button 
                                className="w-full justify-center"
                                onClick={() => handleApprove(vehicle.id)}
                                disabled={processingId === vehicle.id}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              
                              <Button 
                                variant="outline"
                                className="w-full justify-center"
                                onClick={() => openRejectionDialog(vehicle.id)}
                                disabled={processingId === vehicle.id}
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
                                <Link href={`/shop/${vehicle.shop_id}/vehicles/${vehicle.id}`}>
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
                {verifiedVehicles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-white/10 rounded-full p-3 mb-4">
                      <CheckCircle size={24} className="text-white/60" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-white/90">No verified vehicles</h3>
                    <p className="text-white/60">No vehicles have been verified yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-medium">Vehicle</th>
                          <th className="text-left px-4 py-3 text-sm font-medium">Shop</th>
                          <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
                          <th className="text-left px-4 py-3 text-sm font-medium">Verified On</th>
                          <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {verifiedVehicles.map((vehicle) => (
                          <tr key={vehicle.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 ? (
                                  <div className="h-10 w-10 rounded overflow-hidden mr-3">
                                    <Image 
                                      src={vehicle.vehicle_images.find(img => img.is_primary)?.image_url || vehicle.vehicle_images[0].image_url} 
                                      alt={vehicle.name}
                                      width={40}
                                      height={40}
                                      className="object-cover h-full w-full"
                                      unoptimized
                                    />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center mr-3">
                                    {getVehicleIcon(vehicle.vehicle_types?.name || 'motorcycle')}
                                  </div>
                                )}
                                <span className="font-medium">{vehicle.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {vehicle.rental_shops?.name}
                            </td>
                            <td className="px-4 py-3">
                              {vehicle.vehicle_types?.name}, {vehicle.categories?.name}
                            </td>
                            <td className="px-4 py-3">
                              {new Date(vehicle.updated_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                asChild
                              >
                                <Link href={`/shop/${vehicle.shop_id}/vehicles/${vehicle.id}`}>
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

      {/* Rejection Dialog */}
      {isRejectionDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Reject Vehicle</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this vehicle. This information will be shared with the shop owner.
            </p>
            
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background h-32 mb-4"
              placeholder="Rejection reason (e.g., documents unclear, expired registration, etc.)"
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
            />
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsRejectionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionNotes.trim()}
              >
                Reject Vehicle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 