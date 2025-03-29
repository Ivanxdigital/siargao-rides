"use client"

import { useState, useEffect } from "react"
import { Upload, Info, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "@/contexts/AuthContext"
import { uploadFile } from "@/lib/storage"
import { createShop } from "@/lib/service"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterShopPage() {
  const { user, isAuthenticated, isLoading: authLoading, resendVerificationEmail } = useAuth()
  const router = useRouter()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState(user?.email || "")
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [debugDetails, setDebugDetails] = useState<any>(null)
  const [manualVerificationRequested, setManualVerificationRequested] = useState(false)
  const [creatingUserRecord, setCreatingUserRecord] = useState(false)
  const [userRecordCreated, setUserRecordCreated] = useState(false)
  const [checkingUserRecord, setCheckingUserRecord] = useState(false)
  const [userRecordExists, setUserRecordExists] = useState<boolean | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: "",
    shopName: "",
    email: "",
    phone: "",
    address: "",
    governmentId: null as File | null,
    businessPermit: null as File | null
  })
  
  // Check if user is authenticated and email is verified
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/sign-in?callback=/register")
      } else if (!user?.email_confirmed_at) {
        setError("Please verify your email address before registering a shop. Check your inbox for the verification link.")
      }
    }
  }, [authLoading, isAuthenticated, router, user])
  
  // Update verification email when user changes
  useEffect(() => {
    if (user?.email && !verificationEmail) {
      setVerificationEmail(user.email)
    }
  }, [user, verificationEmail])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'governmentId' | 'businessPermit') => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        [field]: e.target.files[0]
      })
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!user) {
      setError("You must be logged in to register a shop")
      return
    }

    if (!user.email_confirmed_at) {
      setError("Please verify your email address before registering a shop")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Check if we're using mock data mode
      const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
      
      if (useMockData) {
        // In mock data mode, we can skip the actual API calls
        console.log('Using mock data mode - skipping actual API calls');
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsSubmitted(true);
        return;
      }
      
      console.log('Starting shop registration process...');
      
      // Upload government ID
      let governmentIdUrl = null
      if (formData.governmentId) {
        console.log('Uploading government ID...');
        const { url, error: uploadError } = await uploadFile(
          formData.governmentId, 
          'shop-documents', 
          `${user.id}/government-id`
        )
        
        if (uploadError) {
          console.error('Government ID upload error:', uploadError);
          throw new Error(`Failed to upload government ID: ${uploadError.message}`)
        }
        
        governmentIdUrl = url
        console.log('Government ID uploaded successfully:', governmentIdUrl);
      } else {
        throw new Error("Government ID is required")
      }
      
      // Upload business permit (optional)
      let businessPermitUrl = null
      if (formData.businessPermit) {
        console.log('Uploading business permit...');
        const { url, error: uploadError } = await uploadFile(
          formData.businessPermit, 
          'shop-documents', 
          `${user.id}/business-permit`
        )
        
        if (uploadError) {
          console.error('Business permit upload error:', uploadError);
          throw new Error(`Failed to upload business permit: ${uploadError.message}`)
        }
        
        businessPermitUrl = url
        console.log('Business permit uploaded successfully:', businessPermitUrl);
      }
      
      // Create the shop in the database
      console.log('Creating shop with data:', {
        owner_id: user.id,
        name: formData.shopName,
        address: formData.address,
        city: "Siargao",
        phone_number: formData.phone,
        email: formData.email,
      });
      
      try {
        const newShop = await createShop({
          owner_id: user.id,
          name: formData.shopName,
          description: `Motorbike rental shop in Siargao. Documents: ${governmentIdUrl ? `ID:${governmentIdUrl}` : ''} ${businessPermitUrl ? `Permit:${businessPermitUrl}` : ''}`,
          address: formData.address || "Siargao Island",
          city: "Siargao",
          phone_number: formData.phone,
          email: formData.email,
        })
        
        if (!newShop) {
          console.error('Failed to create shop - no error thrown but returned null');
          throw new Error("Failed to create shop")
        }
        
        console.log('Shop created successfully:', newShop);
        setIsSubmitted(true)
      } catch (shopError) {
        // Check if this is a "User not found" error
        if (shopError instanceof Error && 
            (shopError.message.includes('User not found') || 
            shopError.message.includes('Failed to create shop'))) {
          setError("User not found in the database. Please create a user record first.")
        } else {
          throw shopError; // Re-throw if it's a different error
        }
      }
    } catch (err) {
      console.error("Error registering shop:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleResendVerification = async () => {
    if (!verificationEmail) {
      setError("Please provide an email address to send the verification link")
      return
    }
    
    setIsResending(true)
    setResendSuccess(false)
    setDebugDetails(null)
    setError(null)
    
    const { success, error, details } = await resendVerificationEmail(verificationEmail)
    
    setIsResending(false)
    setDebugDetails(details)
    
    if (success) {
      setResendSuccess(true)
    } else {
      setError(`Verification email failed: ${error?.message || 'Unknown error'}`)
    }
  }
  
  const handleRequestManualVerification = async () => {
    try {
      // Send request to backend for manual verification
      await fetch('/api/auth/request-manual-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: verificationEmail,
          userId: user?.id,
        }),
      });
      setManualVerificationRequested(true);
    } catch (err) {
      console.error("Error requesting manual verification:", err);
      setError("Failed to request manual verification. Please try again later.");
    }
  }
  
  const handleCreateUserRecord = async () => {
    try {
      setCreatingUserRecord(true)
      setError(null)
      
      console.log('Attempting to create user record for:', user?.id)
      
      const response = await fetch('/api/auth/create-missing-user-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: user?.user_metadata?.first_name || '',
          lastName: user?.user_metadata?.last_name || '',
          role: 'shop_owner',
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error response from API:', data)
        throw new Error(data.error || 'Failed to create user record')
      }
      
      setUserRecordCreated(true)
      console.log('User record created successfully:', data)
      
      // Display success message for 2 seconds, then refresh
      setTimeout(() => {
        window.location.reload() // Use full page reload to ensure all states are reset
      }, 2000)
    } catch (err) {
      console.error('Error creating user record:', err)
      
      // Show specific error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to create user record: ${errorMessage}. Please try the backup method.`)
      
      // Add a button to retry in the error message
      setUserRecordCreated(false)
    } finally {
      setCreatingUserRecord(false)
    }
  }
  
  const handleCreateUserRecordBackup = async () => {
    try {
      setCreatingUserRecord(true)
      setError(null)
      
      console.log('Attempting to create user record using backup method for:', user?.id)
      
      const response = await fetch('/api/auth/create-user-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error response from backup API:', data)
        throw new Error(data.error || 'Failed to create user record with backup method')
      }
      
      setUserRecordCreated(true)
      console.log('User record created successfully with backup method:', data)
      
      // Display success message for 2 seconds, then refresh
      setTimeout(() => {
        window.location.reload() // Use full page reload to ensure all states are reset
      }, 2000)
    } catch (err) {
      console.error('Error creating user record with backup method:', err)
      
      // Show specific error message for the backup method
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to create user record with backup method: ${errorMessage}. Please contact support.`)
    } finally {
      setCreatingUserRecord(false)
    }
  }
  
  // Check if user has a database record
  const checkUserRecord = async () => {
    if (!user?.id) return
    
    try {
      setCheckingUserRecord(true)
      
      // Make a simple API call to check if the user record exists
      const response = await fetch(`/api/users/check?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserRecordExists(data.exists)
        
        // If user record doesn't exist, show the message
        if (!data.exists) {
          setError("User not found in the database. Please create a user record first.")
        }
      } else {
        // If the endpoint doesn't exist, we'll assume the record doesn't exist
        // This is a fallback in case the check endpoint isn't implemented
        setUserRecordExists(false)
        setError("User not found in the database. Please create a user record first.")
      }
    } catch (err) {
      console.error('Error checking user record:', err)
      // If there's an error checking, we'll just continue and let the form submission handle it
      setUserRecordExists(null)
    } finally {
      setCheckingUserRecord(false)
    }
  }
  
  // Call checkUserRecord when the user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !checkingUserRecord && userRecordExists === null) {
      checkUserRecord()
    }
  }, [isAuthenticated, user, checkingUserRecord, userRecordExists])
  
  if (isSubmitted) {
    return (
      <div className="pt-24">
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Registration Submitted!</h1>
            <Badge variant="verified" className="mx-auto mb-6">Pending Verification</Badge>
            <p className="text-muted-foreground mb-6">
              Thank you for registering your shop. Your application is now being reviewed.
              We&apos;ll contact you via email once the verification process is complete.
            </p>
            <Button asChild>
              <Link href="/">Return to Homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="pt-24">
      <>
        <div className="bg-black text-white">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-4">Register Your Shop</h1>
            <p className="text-lg">Join our platform and start renting your motorbikes to tourists in Siargao</p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {userRecordExists === false && (
            <div className="bg-blue-100 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300 rounded-md p-4 mb-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Info size={20} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Your account is missing a database record</p>
                    <p className="text-sm mt-1">
                      Your account was authenticated but we need to create a database record for you
                      before you can register a shop. This is a one-time step.
                    </p>
                  </div>
                </div>
                
                {userRecordCreated ? (
                  <div className="ml-8 text-green-600 dark:text-green-400 text-sm font-medium">
                    User record created successfully! Refreshing the page...
                  </div>
                ) : (
                  <div className="ml-8 space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCreateUserRecord}
                      disabled={creatingUserRecord}
                      className="w-fit mr-2"
                    >
                      {creatingUserRecord ? "Creating..." : "Create User Record"}
                    </Button>
                    
                    {error && error.includes("Failed to create user record") && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCreateUserRecordBackup}
                        disabled={creatingUserRecord}
                        className="w-fit bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800"
                      >
                        Try Backup Method
                      </Button>
                    )}
                    
                    {error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {error && error.includes("verify your email") ? (
            <div className="bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300 rounded-md p-4 mb-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
                
                {manualVerificationRequested ? (
                  <div className="ml-8 text-green-600 dark:text-green-400 text-sm font-medium">
                    Manual verification requested. Our team will review your request and contact you soon.
                  </div>
                ) : resendSuccess ? (
                  <div className="ml-8 text-green-600 dark:text-green-400 text-sm font-medium">
                    Verification email sent to {verificationEmail}! Please check your inbox.
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      If you don't see it, check your spam folder or try a different email address.
                    </div>
                  </div>
                ) : (
                  <div className="ml-8 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                      <input
                        type="email"
                        value={verificationEmail}
                        onChange={(e) => setVerificationEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1 px-3 py-2 text-sm bg-white/10 border border-amber-300/30 dark:border-amber-700/30 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="whitespace-nowrap sm:self-start"
                      >
                        {isResending ? "Sending..." : "Resend verification"}
                      </Button>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Enter the email where you want to receive the verification link
                      </p>
                      
                      {/* Debug toggle */}
                      <button
                        onClick={() => setShowDebugInfo(!showDebugInfo)}
                        className="text-xs text-amber-700 dark:text-amber-500 underline self-start"
                      >
                        {showDebugInfo ? "Hide" : "Show"} technical details
                      </button>
                      
                      {/* Alternative verification options */}
                      <button
                        onClick={handleRequestManualVerification}
                        className="text-xs text-amber-700 dark:text-amber-500 underline self-start"
                      >
                        Request manual verification
                      </button>
                    </div>
                    
                    {/* Debug information */}
                    {showDebugInfo && debugDetails && (
                      <div className="mt-2 p-2 bg-black/20 rounded-md text-xs font-mono whitespace-pre-wrap">
                        <p className="font-semibold">Debug information:</p>
                        <pre>{JSON.stringify(debugDetails, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : error && !error.includes("User not found") && userRecordExists !== false ? (
            <div className="bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-md p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}
          
          <div className="bg-card border border-border rounded-lg p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Owner Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="shopName" className="block text-sm font-medium mb-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      id="shopName"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-1">
                      Shop Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      placeholder="e.g., Tourism Road, General Luna"
                    />
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Verification Documents */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Verification Documents</h2>
                
                <div className="bg-muted/30 border border-border rounded-md p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      For security and verification purposes, we require a government-issued ID. 
                      A business permit is recommended but optional. This helps us maintain 
                      a trusted marketplace for our users.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="governmentId" className="block text-sm font-medium mb-1">
                      Government-issued ID (required)
                    </label>
                    <div className="flex items-center justify-center border border-dashed border-border rounded-md h-32 cursor-pointer relative overflow-hidden bg-background/50">
                      <input
                        type="file"
                        id="governmentId"
                        name="governmentId"
                        onChange={(e) => handleFileChange(e, 'governmentId')}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        accept="image/*,.pdf"
                        required
                      />
                      <div className="text-center">
                        <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, PDF</p>
                      </div>
                      
                      {formData.governmentId && (
                        <div className="absolute inset-0 flex items-center justify-center bg-card/90 z-0">
                          <p className="text-sm font-medium">{formData.governmentId.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="businessPermit" className="block text-sm font-medium mb-1">
                      Business/Municipal Permit (optional)
                    </label>
                    <div className="flex items-center justify-center border border-dashed border-border rounded-md h-32 cursor-pointer relative overflow-hidden bg-background/50">
                      <input
                        type="file"
                        id="businessPermit"
                        name="businessPermit"
                        onChange={(e) => handleFileChange(e, 'businessPermit')}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        accept="image/*,.pdf"
                      />
                      <div className="text-center">
                        <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, PDF</p>
                      </div>
                      
                      {formData.businessPermit && (
                        <div className="absolute inset-0 flex items-center justify-center bg-card/90 z-0">
                          <p className="text-sm font-medium">{formData.businessPermit.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Submit Registration"}
              </Button>
            </form>
          </div>
        </div>
      </>
    </div>
  )
} 