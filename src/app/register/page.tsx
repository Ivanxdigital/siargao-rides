"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, Info, Check, AlertCircle, ArrowRight, BarChart, Calendar, ShieldCheck, CreditCard, Users, Rocket, MapPin, Gift, Star } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "@/contexts/AuthContext"
import { uploadFile } from "@/lib/storage"
import { createShop, getShops } from "@/lib/service"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

// Add animation variants for components
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
}

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 12 
    } 
  },
  hover: { 
    y: -8, 
    scale: 1.02, 
    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.2)",
    borderColor: "rgba(var(--color-primary), 0.5)",
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 10 
    } 
  }
}

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: "easeOut" 
    } 
  }
}

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.03, transition: { duration: 0.2 } },
  tap: { scale: 0.98, transition: { duration: 0.2 } }
}

// Add the InteractiveDashboardShowcase component
const InteractiveDashboardShowcase = () => {
  const [activeTab, setActiveTab] = useState('analytics')
  
  // Tab content configuration
  const tabContent = {
    analytics: {
      title: "Performance Analytics",
      description: "Track your business metrics with our powerful analytics dashboard. Monitor bookings, revenue streams, and customer trends in real time.",
      image: "/images/dashboard-analytics.png",
      icon: <BarChart className="w-4 h-4" />
    },
    vehicles: {
      title: "Vehicle Management",
      description: "Easily manage your entire fleet in one place. Add new vehicles, update availability, and set dynamic pricing based on demand.",
      image: "/images/dashboard-manage-vehicles.png",
      icon: <Rocket className="w-4 h-4" />
    },
    bookings: {
      title: "Booking Management",
      description: "Streamline your booking process with an intuitive interface. Track reservations, manage customer details, and optimize your schedule.",
      image: "/images/dashboard-manage-bookings.png",
      icon: <Calendar className="w-4 h-4" />
    },
    shop: {
      title: "Shop Management",
      description: "Customize your shop profile, update operating hours, and manage your business information all in one convenient dashboard.",
      image: "/images/dashboard-manage-shop-listing.png",
      icon: <Users className="w-4 h-4" />
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  }
  
  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      transition: { 
        duration: 0.3, 
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Main display area */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md mb-10"
        variants={itemVariants}
      >
        {/* Subtle grain texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c8TV1mAAAAG3RSTlNAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAvEOwtAAAFVklEQVR4XpWWB67c2BUFb3g557T/hRo9/WUMZHlgr4Bg8Z4qQgQJlHI4A8SzFVrapvmTF9O7dmYRFZ60YiBhJRCgh1FYhiLAmdvX0CzTOpNE77ME0Zty/nWWzchDtiqrmQDeuv3powQ5ta2eN0FY0InkqDD73lT9c9lEzwUNqgFHs9VQce3TVClFCQrSTfOiYkVJQBmpbq2L6iZavPnAPcoU0dSw0SUTqz/GtrGuXfbyyBniKykOWQWGqwwMA7QiYAxi+IlPdqo+hYHnUt5ZPfnsHJyNiDtnpJyayNBkF6cWoYGAMY92U2hXHF/C1M8uP/ZtYdiuj26UdAdQQSXQErwSOMzt/XWRWAz5GuSBIkwG1H3FabJ2OsUOUhGC6tK4EMtJO0ttC6IBD3kM0ve0tJwMdSfjZo+EEISaeTr9P3wYrGjXqyC1krcKdhMpxEnt5JetoulscpyzhXN5FRpuPHvbeQaKxFAEB6EN+cYN6xD7RYGpXpNndMmZgM5Dcs3YSNFDHUo2LGfZuukSWyUYirJAdYbF3MfqEKmjM+I2EfhA94iG3L7uKrR+GdWD73ydlIB+6hgref1QTlmgmbM3/LeX5GI1Ux1RWpgxpLuZ2+I+IjzZ8wqE4nilvQdkUdfhzI5QDWy+kw5Wgg2pGpeEVeCCA7b85BO3F9DzxB3cdqvBzWcmzbyMiqhzuYqtHRVG2y4x+KOlnyqla8AoWWpuBoYRxzXrfKuILl6SfiWCbjxoZJUaCBj1CjH7GIaDbc9kqBY3W/Rgjda1iqQcOJu2WW+76pZC9QG7M00dffe9hNnseupFL53r8F7YHSwJWUKP2q+k7RdsxyOB11n0xtOvnW4irMMFNV4H0uqwS5ExsmP9AxbDTc9JwgneAT5vTiUSm1E7BSflSt3bfa1tv8Di3R8n3Af7MNWzs49hmauE2wP+ttrq+AsWpFG2awvsuOqbipWHgtuvuaAE+A1Z/7gC9hesnr+7wqCwG8c5yAg3AL1fm8T9AZtp/bbJGwl1pNrE7RuOX7PeMRUERVaPpEs+yqeoSmuOlokqw49pgomjLeh7icHNlG19yjs6XXOMedYm5xH2YxpV2tc0Ro2jJfxC50ApuxGob7lMsxfTbeUv07TyYxpeLucEH1gNd4IKH2LAg5TdVhlCafZvpskfncCfx8pOhJzd76bJWeYFnFciwcYfubRc12Ip/ppIhA1/mSZ/RxjFDrJC5xifFjJpY2Xl5zXdguFqYyTR1zSp1Y9p+tktDYYSNflcxI0iyO4TPBdlRcpeqjK/piF5bklq77VSEaA+z8qmJTFzIWiitbnzR794USKBUaT0NTEsVjZqLaFVqJoPN9ODG70IPbfBHKK+/q/AWR0tJzYHRULOa4MP+W/HfGadZUbfw177G7j/OGbIs8TahLyynl4X4RinF793Oz+BU0saXtUHrVBFT/DnA3ctNPoGbs4hRIjTok8i+algT1lTHi4SxFvONKNrgQFAq2/gFnWMXgwffgYMJpiKYkmW3tTg3ZQ9Jq+f8XN+A5eeUKHWvJWJ2sgJ1Sop+wwhqFVijqWaJhwtD8MNlSBeWNNWTa5Z5kPZw5+LbVT99wqTdx29lMUH4OIG/D86ruKEauBjvH5xy6um/Sfj7ei6UUVk4AIl3MyD4MSSTOFgSwsH/QJWaQ5as7ZcmgBZkzjjU1UrQ74ci1gWBCSGHtuV1H2mhSnO3Wp/3fEV5a+4wz//6qy8JxjZsmxxy5+4w9CDNJY09T072iKG0EnOS0arEYgXqYnXcYHwjTtUNAcMelOd4xpkoqiTYICWFq0JSiPfPDQdnt+4/wuqcXY47QILbgAAAABJRU5ErkJggg==")`,
          }}
        ></div>
        
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black/10 to-purple-900/20 opacity-80"></div>
        
        {/* Top toolbar design element */}
        <div className="relative z-10 border-b border-white/10 p-4 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
          </div>
          <div className="flex items-center px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-gray-400">
            https://siargaorides.ph/dashboard
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-white/10"></div>
            <div className="w-3 h-3 rounded-full bg-white/10"></div>
          </div>
        </div>
        
        {/* Dashboard content area */}
        <div className="relative aspect-[16/9] md:aspect-[16/8] w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={imageVariants}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="relative w-full h-full">
                <Image
                  src={tabContent[activeTab].image}
                  alt={tabContent[activeTab].title}
                  fill
                  className="object-contain"
                  priority
                />
                
                {/* Reflection effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Content description */}
      <motion.div
        className="text-center mb-12 px-4"
        variants={itemVariants}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-[6rem]"
          >
            <h3 className="text-2xl font-bold text-white mb-3">
              {tabContent[activeTab].title}
            </h3>
            <p className="text-gray-300 max-w-3xl mx-auto">
              {tabContent[activeTab].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {/* Tab navigation */}
      <motion.div
        className="flex justify-center flex-wrap gap-2 md:gap-6"
        variants={itemVariants}
      >
        {Object.entries(tabContent).map(([key, tab]) => (
          <motion.button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 
              ${activeTab === key 
                ? 'text-white bg-blue-600/20 border border-blue-500/40' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center space-x-2">
              <span>{tab.icon}</span>
              <span>{tab.title}</span>
            </span>
            
            {activeTab === key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg border border-blue-500/40 bg-blue-600/10"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>
      
      {/* Call to Action */}
      <motion.div 
        className="text-center mt-10"
        variants={itemVariants}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link 
            href="/register/shop-owner" 
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition duration-300 shadow-lg hover:shadow-blue-500/20"
          >
            Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default function RegisterShopPage() {
  const { user, isAuthenticated, isLoading: authLoading, resendVerificationEmail } = useAuth()
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  
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
    referral: "",
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
      let governmentIdUrl: string | null = null
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
      let businessPermitUrl: string | null = null
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
          description: `Motorbike rental shop in Siargao. ${formData.referral ? `Referred by: ${formData.referral}. ` : ''}Documents: ${governmentIdUrl ? `ID:${governmentIdUrl}` : ''} ${businessPermitUrl ? `Permit:${businessPermitUrl}` : ''}`,
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
          
          console.log("User not found in the database. Attempting to create user record automatically...");
          
          // Attempt to create the user record automatically
          try {
            await handleCreateUserRecord();
            
            // Wait a moment for the record to be created
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try creating the shop again
            console.log("Retrying shop creation after creating user record...");
            const newShop = await createShop({
              owner_id: user.id,
              name: formData.shopName,
              description: `Motorbike rental shop in Siargao. ${formData.referral ? `Referred by: ${formData.referral}. ` : ''}Documents: ${governmentIdUrl ? `ID:${governmentIdUrl}` : ''} ${businessPermitUrl ? `Permit:${businessPermitUrl}` : ''}`,
              address: formData.address || "Siargao Island",
              city: "Siargao",
              phone_number: formData.phone,
              email: formData.email,
            });
            
            if (!newShop) {
              throw new Error("Failed to create shop on second attempt");
            }
            
            console.log('Shop created successfully on second attempt:', newShop);
            setIsSubmitted(true);
          } catch (retryError) {
            console.error("Error during automatic user record creation and shop retry:", retryError);
            setError("Failed to automatically create user record. Please refresh the page and try again.");
          }
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
        
        // If user record doesn't exist, automatically create it instead of showing error
        if (!data.exists) {
          console.log("User record doesn't exist. Automatically creating it...")
          await handleCreateUserRecord()
        }
      } else {
        // If the endpoint doesn't exist, we'll assume the record doesn't exist
        // and automatically create it
        setUserRecordExists(false)
        console.log("User check failed. Automatically creating user record...")
        await handleCreateUserRecord()
      }
    } catch (err) {
      console.error('Error checking user record:', err)
      // If there's an error checking, try to create the record anyway
      console.log("Error checking user record. Attempting to create it anyway...")
      await handleCreateUserRecord()
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
  
  // Function to handle showing the registration form and scrolling to it
  const showFormAndScroll = () => {
    setShowRegistrationForm(true)
    
    // Wait for the form to be rendered, then scroll to it
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }
  
  if (isSubmitted) {
    return (
      <div className="pt-24">
        <motion.div 
          className="container mx-auto px-4 py-16 max-w-md text-center"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <motion.div 
            className="bg-card border border-border rounded-lg p-8 shadow-lg shadow-primary/5"
            variants={slideUp}
          >
            <motion.div 
              className="w-16 h-16 bg-yellow-500/20 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                boxShadow: [
                  "0 0 0 rgba(234, 179, 8, 0.2)",
                  "0 0 30px rgba(234, 179, 8, 0.4)",
                  "0 0 0 rgba(234, 179, 8, 0.2)"
                ]
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 15,
                delay: 0.3,
                boxShadow: {
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 400,
                  damping: 10,
                  delay: 0.5
                }}
              >
                <Check size={32} className="text-yellow-500 dark:text-yellow-400" />
              </motion.div>
            </motion.div>
            <motion.h1 
              className="text-2xl font-bold mb-4 bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              Registration Submitted!
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="inline-block"
            >
              <Badge variant="pending" className="text-sm px-3 py-1">
                <span className="mr-1.5">●</span>
                Pending Verification
              </Badge>
            </motion.div>
            <motion.p 
              className="text-muted-foreground mt-6 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              Thank you for registering your shop. Your application is now being reviewed.
              We&apos;ll contact you via email once the verification process is complete.
            </motion.p>
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              <Button asChild className="bg-card hover:bg-card/80 border border-yellow-500/30 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                <Link href="/">Return to Homepage</Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    )
  }
  
  return (
    <motion.div 
      className="pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden">
        {/* Background with overlay gradient */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <motion.div variants={slideUp}>
              <Badge className="mb-6 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                Become a Partner
              </Badge>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              variants={slideUp}
            >
              Turn Your Motorbikes Into a <span className="text-primary">Profitable Business</span>
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl text-gray-300 mb-8"
              variants={slideUp}
            >
              No physical store needed. Just your bikes and our platform.
              Start earning today with Siargao's premier motorbike rental directory.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={slideUp}
            >
              {isAuthenticated ? (
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  <Button 
                    size="lg" 
                    className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                    onClick={showFormAndScroll}
                  >
                    Register Your Shop <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  <Button 
                    size="lg" 
                    className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                    asChild
                  >
                    <Link href="/sign-up?callback=/register">
                      Create an Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              )}
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <a href="#benefits">Learn More</a>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Stats Section */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12 backdrop-blur-sm bg-black/30 p-4 md:p-6 rounded-xl border border-white/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.div className="text-center p-2 md:p-3" variants={cardVariants}>
              <p className="text-3xl md:text-4xl font-bold text-primary">200+</p>
              <p className="text-sm md:text-base text-gray-300">Active Tourists Daily</p>
            </motion.div>
            <motion.div className="text-center p-2 md:p-3" variants={cardVariants}>
              <p className="text-3xl md:text-4xl font-bold text-primary">10%</p>
              <p className="text-sm md:text-base text-gray-300">
                Commission Fee<br />
                <span className="text-primary font-semibold text-xs">(First 2 Months: 0%)</span>
              </p>
            </motion.div>
            <motion.div className="text-center p-2 md:p-3" variants={cardVariants}>
              <p className="text-3xl md:text-4xl font-bold text-primary">10+</p>
              <p className="text-sm md:text-base text-gray-300">Partner Shops</p>
            </motion.div>
            <motion.div className="text-center p-2 md:p-3" variants={cardVariants}>
              <p className="text-3xl md:text-4xl font-bold text-primary">5 min</p>
              <p className="text-sm md:text-base text-gray-300">Setup Time</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section id="benefits" className="py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <Badge className="mb-4 text-sm">Why Join Us</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Benefits of Partnering With Siargao Rides
            </h2>
            <p className="text-gray-300 text-lg">
              Join dozens of successful motorbike rental shops already earning with us
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {/* Benefit Cards - add motion capabilities */}
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">No Physical Store Required</h3>
              <p className="text-gray-400">
                Save on rent and operating costs. Manage your rentals from anywhere with just a smartphone.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Increased Visibility</h3>
              <p className="text-gray-400">
                Reach thousands of tourists looking for bike rentals in Siargao through our marketing efforts.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Built-in Customer Base</h3>
              <p className="text-gray-400">
                Access our growing network of tourists already using our platform to find rentals.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Simplified Booking Management</h3>
              <p className="text-gray-400">
                Our platform handles scheduling, availability, and booking confirmations automatically.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Low Commission Fees</h3>
              <p className="text-gray-400">
                Just 15% commission on bookings - significantly lower than typical tourism platforms.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Verified Customers</h3>
              <p className="text-gray-400">
                All renters are verified through our platform, reducing risks and ensuring safety.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <Badge className="mb-4 text-sm">Simple Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              How To Get Started
            </h2>
            <p className="text-gray-300 text-lg">
              Setting up your shop takes just a few minutes
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            {/* Step 1 */}
            <motion.div className="text-center relative" variants={cardVariants}>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              {/* Only show connector line on medium screens and up */}
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-1 bg-gray-800 -z-0"></div>
              <h3 className="text-xl font-semibold mb-3 text-white">Create Account</h3>
              <p className="text-gray-400">
                Sign up for a free account and verify your email.
              </p>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div className="text-center relative" variants={cardVariants}>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              {/* Only show connector line on medium screens and up */}
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-1 bg-gray-800 -z-0"></div>
              <h3 className="text-xl font-semibold mb-3 text-white">Submit Documents</h3>
              <p className="text-gray-400">
                Provide government ID and proof of bike ownership.
              </p>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div className="text-center" variants={cardVariants}>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Get Verified & Earn</h3>
              <p className="text-gray-400">
                After verification, start receiving bookings and revenue.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Interactive Dashboard Showcase Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black opacity-70"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute right-0 top-1/3 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Dashboard Experience
            </h2>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-16">
              Our intuitive interface gives you complete control over your rental business
            </p>
            
            {/* Interactive Dashboard Showcase - Using Framer Motion */}
            <InteractiveDashboardShowcase />
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
                  onClick={showFormAndScroll}
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
      
      {/* Registration Form Section */}
      {showRegistrationForm && (
        <motion.div 
          ref={formRef}
          initial="hidden"
          animate="visible"
          variants={formVariants}
          className="py-16 bg-gradient-to-b from-black to-gray-900"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <motion.div 
                className="text-center mb-8"
                variants={slideUp}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Register Your Shop</h2>
                <p className="text-gray-300">
                  Fill out the form below to become a Siargao Rides partner
                </p>
              </motion.div>

              <motion.div 
                className="bg-card border border-border rounded-lg p-6 md:p-8"
                variants={slideUp}
              >
                {existingShop ? (
                  <div className="text-center p-8">
                    <p className="mb-4 text-muted-foreground">
                      Registration form is disabled as you already have a registered shop.
                    </p>
                  </div>
                ) : userRecordExists === false && creatingUserRecord ? (
                  // Show a loading indicator while automatically creating the user record
                  <div className="mb-6 p-4 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3">Creating user record...</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Display general errors */}
                    {error && (
                      <motion.div 
                        className="bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-md p-4 mb-6 flex items-start gap-3"
                        variants={slideUp}
                      >
                        <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                        <p>{error}</p>
                      </motion.div>
                    )}
                    
                    {/* Owner Information */}
                    <motion.div variants={slideUp}>
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
                    </motion.div>
                    
                    {/* Contact Information */}
                    <motion.div variants={slideUp}>
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
                        
                        <div>
                          <label htmlFor="referral" className="block text-sm font-medium mb-1">
                            Referral (optional)
                          </label>
                          <input
                            type="text"
                            id="referral"
                            name="referral"
                            value={formData.referral}
                            onChange={handleChange}
                            placeholder="Who referred you to Siargao Rides?"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Verification Documents */}
                    <motion.div variants={slideUp}>
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
                        <motion.div 
                          whileHover={{ borderColor: "rgba(var(--color-primary), 0.5)" }}
                        >
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
                              <motion.div 
                                className="absolute inset-0 flex items-center justify-center bg-card/90 z-0"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <p className="text-sm font-medium">{formData.governmentId.name}</p>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          whileHover={{ borderColor: "rgba(var(--color-primary), 0.5)" }}
                        >
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
                              <motion.div 
                                className="absolute inset-0 flex items-center justify-center bg-card/90 z-0"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <p className="text-sm font-medium">{formData.businessPermit.name}</p>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                    
                    {/* Submit Button */}
                    <motion.div
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                    >
                      <Button 
                        type="submit" 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm flex items-center justify-center"
                        disabled={isSubmitting || !!existingShop}
                      >
                        {isSubmitting ? (
                          <>Processing...</>
                        ) : (
                          <>
                            Submit Registration 
                            {!isSubmitting && !existingShop && (
                              <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ 
                                  repeat: Infinity, 
                                  repeatType: "mirror", 
                                  duration: 1.5,
                                  ease: "easeInOut" 
                                }}
                              >
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </motion.span>
                            )}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
} 