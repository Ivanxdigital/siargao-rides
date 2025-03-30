"use client"

import { useState, useEffect } from "react"
import { Upload, Info, Check, AlertCircle, ArrowRight, BarChart, Calendar, ShieldCheck, CreditCard, Users, Rocket, MapPin } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "@/contexts/AuthContext"
import { uploadFile } from "@/lib/storage"
import { createShop, getShops } from "@/lib/service"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import Image from "next/image"

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
  const [existingShop, setExistingShop] = useState<any>(null)
  const [checkingExistingShop, setCheckingExistingShop] = useState(false)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: "",
    shopName: "",
    email: "",
    phone: "",
    address: "",
    governmentId: null as File | null,
    businessPermit: null as File | null
  })
  
  // We now check authentication only when accessing the form, not on initial page load
  // This allows non-authenticated users to view the landing page
  // See the useEffect with showRegistrationForm dependency below
  
  // Update verification email when user changes
  useEffect(() => {
    if (user?.email && !verificationEmail) {
      setVerificationEmail(user.email)
    }
  }, [user, verificationEmail])
  
  // Check if user already has a shop
  useEffect(() => {
    const checkExistingShop = async () => {
      if (isAuthenticated && user?.id && !checkingExistingShop && !existingShop) {
        try {
          setCheckingExistingShop(true)
          
          // Get all shops and filter by owner ID
          const allShops = await getShops()
          const userShops = allShops.filter(shop => shop.owner_id === user.id)
          
          if (userShops && userShops.length > 0) {
            // User already has at least one shop
            setExistingShop(userShops[0])
          }
        } catch (err) {
          console.error("Error checking for existing shops:", err)
        } finally {
          setCheckingExistingShop(false)
        }
      }
    }
    
    checkExistingShop()
  }, [isAuthenticated, user, checkingExistingShop, existingShop])
  
  // Check if user is authenticated and email is verified when form is requested
  useEffect(() => {
    if (showRegistrationForm && !authLoading) {
      if (!isAuthenticated) {
        router.push("/sign-in?callback=/register")
      } else if (!user?.email_confirmed_at) {
        console.log("Email verification status:", {
          email: user?.email,
          email_confirmed_at: user?.email_confirmed_at,
          userMetadata: user?.user_metadata,
          appMetadata: user?.app_metadata,
          userObject: user
        });
        
        // Check for email verification in various places it might be stored
        const isEmailVerified = !!user?.email_confirmed_at || 
                               !!user?.app_metadata?.email_confirmed_at ||
                               !!user?.user_metadata?.email_confirmed_at ||
                               user?.app_metadata?.provider !== 'email' || // OAuth providers are pre-verified
                               // @ts-ignore - property might exist in the runtime object but not in TypeScript type
                               user?.email_verified === true;
        
        if (!isEmailVerified) {
          setError("Please verify your email address before registering a shop. Check your inbox for the verification link.")
        }
      }
    }
  }, [showRegistrationForm, authLoading, isAuthenticated, router, user])
  
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
    
    // Check if user already has a shop
    if (existingShop) {
      setError("You already have a registered shop. Only one shop is allowed per account.")
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
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden">
        {/* Background with overlay gradient */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge className="mb-6 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
              Become a Partner
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Turn Your Motorbikes Into a <span className="text-primary">Profitable Business</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              No physical store needed. Just your bikes and our platform.
              Start earning today with Siargao's premier motorbike rental directory.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  Register Your Shop <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                  asChild
                >
                  <Link href="/sign-up?callback=/register">
                    Create an Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <a href="#benefits">Learn More</a>
              </Button>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12 backdrop-blur-sm bg-black/30 p-4 md:p-6 rounded-xl border border-white/10">
            <div className="text-center p-2 md:p-3">
              <p className="text-3xl md:text-4xl font-bold text-primary">200+</p>
              <p className="text-sm md:text-base text-gray-300">Active Tourists Daily</p>
            </div>
            <div className="text-center p-2 md:p-3">
              <p className="text-3xl md:text-4xl font-bold text-primary">15%</p>
              <p className="text-sm md:text-base text-gray-300">Commission Fee</p>
            </div>
            <div className="text-center p-2 md:p-3">
              <p className="text-3xl md:text-4xl font-bold text-primary">10+</p>
              <p className="text-sm md:text-base text-gray-300">Partner Shops</p>
            </div>
            <div className="text-center p-2 md:p-3">
              <p className="text-3xl md:text-4xl font-bold text-primary">5 min</p>
              <p className="text-sm md:text-base text-gray-300">Setup Time</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section id="benefits" className="py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 text-sm">Why Join Us</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Benefits of Partnering With Siargao Rides
            </h2>
            <p className="text-gray-300 text-lg">
              Join dozens of successful motorbike rental shops already earning with us
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit Card 1 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">No Physical Store Required</h3>
              <p className="text-gray-400">
                Save on rent and operating costs. Manage your rentals from anywhere with just a smartphone.
              </p>
            </div>
            
            {/* Benefit Card 2 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Increased Visibility</h3>
              <p className="text-gray-400">
                Reach thousands of tourists looking for bike rentals in Siargao through our marketing efforts.
              </p>
            </div>
            
            {/* Benefit Card 3 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Built-in Customer Base</h3>
              <p className="text-gray-400">
                Access our growing network of tourists already using our platform to find rentals.
              </p>
            </div>
            
            {/* Benefit Card 4 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Simplified Booking Management</h3>
              <p className="text-gray-400">
                Our platform handles scheduling, availability, and booking confirmations automatically.
              </p>
            </div>
            
            {/* Benefit Card 5 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Low Commission Fees</h3>
              <p className="text-gray-400">
                Just 15% commission on bookings - significantly lower than typical tourism platforms.
              </p>
            </div>
            
            {/* Benefit Card 6 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Verified Customers</h3>
              <p className="text-gray-400">
                All renters are verified through our platform, reducing risks and ensuring safety.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4 text-sm">Simple Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              How To Get Started
            </h2>
            <p className="text-gray-300 text-lg">
              Setting up your shop takes just a few minutes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto hidden md:grid">
            {/* Step 1 */}
            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-1 bg-gray-800 -z-0"></div>
              <h3 className="text-xl font-semibold mb-3 text-white">Create Account</h3>
              <p className="text-gray-400">
                Sign up for a free account and verify your email.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center relative">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-1 bg-gray-800 -z-0"></div>
              <h3 className="text-xl font-semibold mb-3 text-white">Submit Documents</h3>
              <p className="text-gray-400">
                Provide government ID and proof of bike ownership.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Start Earning</h3>
              <p className="text-gray-400">
                Get verified and start receiving booking requests.
              </p>
            </div>
          </div>
          
          {/* Mobile-friendly version with vertical timeline */}
          <div className="md:hidden mt-6 relative max-w-xs mx-auto">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800"></div>
            
            {/* Step 1 - Mobile */}
            <div className="ml-12 mb-8 relative">
              <div className="absolute left-0 top-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center -translate-x-16">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Create Account</h3>
              <p className="text-sm text-gray-400">
                Sign up for a free account and verify your email.
              </p>
            </div>
            
            {/* Step 2 - Mobile */}
            <div className="ml-12 mb-8 relative">
              <div className="absolute left-0 top-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center -translate-x-16">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Submit Documents</h3>
              <p className="text-sm text-gray-400">
                Provide government ID and proof of bike ownership.
              </p>
            </div>
            
            {/* Step 3 - Mobile */}
            <div className="ml-12 relative">
              <div className="absolute left-0 top-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center -translate-x-16">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Start Earning</h3>
              <p className="text-sm text-gray-400">
                Get verified and start receiving booking requests.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-t from-black to-gray-900 relative overflow-hidden">
        {/* Background with overlay gradient */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-900/20"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Start Your Motorbike Rental Business?
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Join our growing network of successful shop owners on Siargao Rides.
              Get started in minutes and turn your motorbikes into a profitable business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  Register Your Shop <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                  asChild
                >
                  <Link href="/sign-up?callback=/register">
                    Create an Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Registration Form Section - Only show when requested or authenticated */}
      {showRegistrationForm || existingShop || userRecordExists === false || error ? (
        <>
          <div className="bg-black text-white">
            <div className="container mx-auto px-4 py-12">
              <h1 className="text-4xl font-bold mb-4">Register Your Shop</h1>
              <p className="text-lg">Join our platform and start renting your motorbikes to tourists in Siargao</p>
            </div>
          </div>
          
          <div className="container mx-auto px-4 py-8">
            {existingShop && (
              <div className="bg-yellow-100 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/50 dark:text-yellow-300 rounded-md p-4 mb-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">You already have a registered shop</p>
                      <p className="text-sm mt-1">
                        Currently, we only allow one shop per account. Your existing shop is "{existingShop.name}".
                        You can manage your existing shop from your dashboard.
                      </p>
                    </div>
                  </div>
                  <div className="ml-8">
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                      className="w-fit"
                    >
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
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
            
            {/* Only show email verification error if there's no existing shop */}
            {!existingShop && error && error.includes("verify your email") ? (
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
              {existingShop ? (
                <div className="text-center p-8">
                  <p className="mb-4 text-muted-foreground">
                    Registration form is disabled as you already have a registered shop.
                  </p>
                </div>
              ) : (
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
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm flex items-center justify-center"
                    disabled={isSubmitting || !!existingShop}
                  >
                    {isSubmitting ? "Processing..." : "Submit Registration"} {!isSubmitting && !existingShop && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
} 