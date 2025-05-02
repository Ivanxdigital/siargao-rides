"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Upload, Info, Check, AlertCircle, ArrowRight, BarChart, Calendar, ShieldCheck, CreditCard, Users, Rocket, MapPin, Gift, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { uploadFile } from "@/lib/storage"
import { createShop, getShops, createReferral } from "@/lib/service"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { registerTranslations } from "@/translations/register"
import { dashboardTranslations } from "@/translations/dashboard"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { verificationDocumentsSchema } from "@/lib/validation"
import { getCurrentUser } from '@/lib/api'
import { supabase } from "@/lib/supabase"
import { isFeatureEnabled } from "@/lib/featureFlags"

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

// Define validation schema for the form
const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^(\+?63|0)?[0-9]{10}$/, "Please enter a valid Philippine phone number (e.g., +639123456789 or 09123456789)"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  referral: z.string().optional(),
  // File validation will be handled separately
})

// Type for the form data
type FormData = z.infer<typeof formSchema>

// Add the InteractiveDashboardShowcase component
const InteractiveDashboardShowcase = ({ t, language, languageTransition }: { t: (key: string) => string, language: string, languageTransition?: any }) => {
  const [activeTab, setActiveTab] = useState('analytics')

  // Tab content configuration
  const tabContent = {
    analytics: {
      title: t('performance_analytics'),
      description: t('track_business'),
      image: "/images/dashboard-analytics.png",
      icon: <BarChart className="w-4 h-4" />
    },
    vehicles: {
      title: t('vehicle_management'),
      description: t('easily_manage'),
      image: "/images/dashboard-manage-vehicles.png",
      icon: <Rocket className="w-4 h-4" />
    },
    bookings: {
      title: t('booking_management'),
      description: t('streamline_booking'),
      image: "/images/dashboard-manage-bookings.png",
      icon: <Calendar className="w-4 h-4" />
    },
    shop: {
      title: t('shop_management'),
      description: t('customize_shop'),
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
            <AnimatePresence mode="wait">
              <motion.h3
                key={language + '-tab-title-' + activeTab}
                className="text-2xl font-bold text-white mb-3"
                initial={languageTransition?.initial}
                animate={languageTransition?.animate}
                exit={languageTransition?.exit}
              >
                {tabContent[activeTab].title}
              </motion.h3>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={language + '-tab-desc-' + activeTab}
                className="text-gray-300 max-w-3xl mx-auto"
                initial={languageTransition?.initial}
                animate={languageTransition.animate}
                exit={languageTransition?.exit}
              >
                {tabContent[activeTab].description}
              </motion.p>
            </AnimatePresence>
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
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-tab-button-' + key}
                  initial={languageTransition?.initial}
                  animate={languageTransition?.animate}
                  exit={languageTransition?.exit}
                >
                  {tab.title}
                </motion.span>
              </AnimatePresence>
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


    </motion.div>
  )
}

// Wrap the component with TranslationProvider
function RegisterShopPageContent({
  t,
  language,
  toggleLanguage,
  languageTransition
}: {
  t: (key: string) => string,
  language: string,
  toggleLanguage: () => void,
  languageTransition: any
}) {
  const { user, isAuthenticated, isLoading: authLoading, resendVerificationEmail } = useAuth()
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [governmentId, setGovernmentId] = useState<File | null>(null)
  const [businessPermit, setBusinessPermit] = useState<File | null>(null)
  const [showReferralField, setShowReferralField] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [referralStatus, setReferralStatus] = useState<'idle' | 'valid' | 'invalid' | 'validating'>('idle')
  const [progress, setProgress] = useState(0)
  const [shopExists, setShopExists] = useState(false)
  const [shopExistenceChecked, setShopExistenceChecked] = useState(false)
  const [verificationEmailSent, setVerificationEmailSent] = useState(false)
  const [verificationRequested, setVerificationRequested] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [checkingUserRecord, setCheckingUserRecord] = useState(false)
  const [userRecordExists, setUserRecordExists] = useState<boolean | null>(null)
  const [existingShop, setExistingShop] = useState<any>(null)
  const [checkingExistingShop, setCheckingExistingShop] = useState(false)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [formStep, setFormStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [userRecordCreated, setUserRecordCreated] = useState(false)
  const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null)
  const [emailVerificationSuccess, setEmailVerificationSuccess] = useState<string | null>(null)
  const [manualVerificationRequested, setManualVerificationRequested] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified')
  const [userRecordError, setUserRecordError] = useState<string | null>(null)

  // Check for form=true query parameter to auto-show the registration form
  useEffect(() => {
    // Check if we have a 'form=true' query parameter
    const queryParams = new URLSearchParams(window.location.search);
    const showForm = queryParams.get('form') === 'true';

    if (showForm) {
      // Immediately show the form and scroll to it
      setShowRegistrationForm(true);

      // Small delay to ensure the component is rendered
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  // Check existing shop
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

  // Rest of the function remains unchanged
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState(user?.email || "")
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [debugDetails, setDebugDetails] = useState<any>(null)
  const [creatingUserRecord, setCreatingUserRecord] = useState(false)
  const [referrerId, setReferrerId] = useState<string | null>(null)

  // Form validation with React Hook Form
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors, isValid, isDirty, isSubmitting: formSubmitting },
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Validate on change
    defaultValues: {
      fullName: "",
      shopName: "",
      email: "",
      phone: "",
      address: "",
      referral: ""
    }
  })

  // Watch form values for progress indicator
  const watchedValues = watch()

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
    checkExistingShop()
  }, [isAuthenticated, user, checkingExistingShop, existingShop])

  // Check if user is authenticated and email is verified when form is requested
  useEffect(() => {
    if (showRegistrationForm && !authLoading) {
      if (!isAuthenticated) {
        router.push("/sign-in?callback=/register")
      } else if (user?.user_metadata?.role === "shop_owner" && isFeatureEnabled('ONBOARDING_V2')) {
        // If user is a shop owner and ONBOARDING_V2 is enabled, redirect to dashboard
        // The dashboard will show the ShopOnboardingBanner component
        router.push("/dashboard")
      }
    }
  }, [showRegistrationForm, authLoading, isAuthenticated, router, user])

  // NEW: Check for query parameter to auto-display the form
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams(window.location.search);
      const showForm = queryParams.get('form') === 'true';

      if (showForm) {
        // Immediately show the form and scroll to it
        setShowRegistrationForm(true);

        // Small delay to ensure the component is rendered
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    }
  }, []);

  // File validation function
  const validateFile = (file: File | null, isRequired: boolean = false) => {
    if (isRequired && !file) return "This file is required";

    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        return "File must be an image (JPEG, PNG, GIF) or PDF";
      }

      const fiveMB = 5 * 1024 * 1024;
      if (file.size > fiveMB) {
        return "File must be smaller than 5MB";
      }
    }

    return true;
  };

  // Handle file changes with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'governmentId' | 'businessPermit') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationResult = validateFile(file, field === 'governmentId');

      if (validationResult === true) {
        if (field === 'governmentId') {
          setGovernmentId(file);
        } else {
          setBusinessPermit(file);
        }
      } else {
        // Show validation error
        setError(validationResult);
        // Reset the file input
        e.target.value = '';
      }
    }
  }

  // Calculate form completion percentage for progress indicator
  const calculateFormProgress = () => {
    const totalFields = Object.keys(formSchema.shape).length + 1; // +1 for governmentId
    let filledFields = 0;

    // Count filled text fields
    Object.entries(watchedValues).forEach(([key, value]) => {
      if (value && String(value).trim() !== '') {
        filledFields++;
      }
    });

    // Count files
    if (governmentId) filledFields++;

    return Math.round((filledFields / totalFields) * 100);
  };

  // Validate referral code or email before submit
  const validateReferral = async (referralValue: string): Promise<string | null> => {
    if (!referralValue) return null;
    // Try to treat as user ID first
    if (referralValue.length >= 10) {
      // Optionally, add more robust UUID validation
      return referralValue;
    }
    // Otherwise, try to look up by email
    const user = await getCurrentUser(); // Replace with actual user lookup by email if available
    if (user && user.email === referralValue) {
      return user.id;
    }
    return null;
  };

  // Form submission handler with React Hook Form
  const handleFormSubmit = hookFormSubmit(async (data) => {
    setIsSubmitting(true);
    setReferralError(null);
    let resolvedReferrerId: string | null = null;
    if (data.referral) {
      resolvedReferrerId = await validateReferral(data.referral.trim());
      if (!resolvedReferrerId) {
        setReferralError('Invalid referral code or email.');
        setIsSubmitting(false);
        return;
      }
      setReferrerId(resolvedReferrerId);
    }

    setError(null);

    if (!user) {
      setError("You must be logged in to register a shop");
      return;
    }

    // Check if user already has a shop
    if (existingShop) {
      setError("You already have a registered shop. Only one shop is allowed per account.");
      return;
    }

    // Validate government ID
    const governmentIdValidation = validateFile(governmentId, true);
    if (governmentIdValidation !== true) {
      setError(governmentIdValidation);
      return;
    }

    // Remove reCAPTCHA verification check and always proceed
    try {
      setIsSubmitting(true);

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

      // Update user role to shop_owner before proceeding
      console.log('Updating user role to shop_owner...');
      try {
        const updateRoleResponse = await fetch('/api/users/update-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'shop_owner'
          })
        });

        if (!updateRoleResponse.ok) {
          const errorData = await updateRoleResponse.json();
          throw new Error(`Failed to update user role: ${errorData.error || 'Unknown error'}`);
        }

        console.log('User role updated successfully to shop_owner');
      } catch (roleError) {
        console.error('Error updating user role:', roleError);
        setError(`Failed to update user role: ${roleError instanceof Error ? roleError.message : 'Unknown error'}`);
        setIsSubmitting(false);
        return;
      }

      // Upload government ID
      let governmentIdUrl: string | null = null;
      if (governmentId) {
        console.log('Uploading government ID...');
        const { url, error: uploadError } = await uploadFile(
          governmentId,
          'shop-documents',
          `${user.id}/government-id`
        );

        if (uploadError) {
          console.error('Government ID upload error:', uploadError);
          throw new Error(`Failed to upload government ID: ${uploadError.message}`);
        }

        governmentIdUrl = url;
        console.log('Government ID uploaded successfully:', governmentIdUrl);
      } else {
        throw new Error("Government ID is required");
      }

      // Upload business permit (optional)
      let businessPermitUrl: string | null = null;
      if (businessPermit) {
        console.log('Uploading business permit...');
        const { url, error: uploadError } = await uploadFile(
          businessPermit,
          'shop-documents',
          `${user.id}/business-permit`
        );

        if (uploadError) {
          console.error('Business permit upload error:', uploadError);
          throw new Error(`Failed to upload business permit: ${uploadError.message}`);
        }

        businessPermitUrl = url;
        console.log('Business permit uploaded successfully:', businessPermitUrl);
      }

      // Create the shop in the database
      const verificationDocuments = {
        government_id: governmentIdUrl || '',  // Ensure it's always a string, never null
        business_permit: businessPermitUrl || ''  // Ensure it's always a string, never null
      };

      // Ensure we have a valid government ID URL
      if (!governmentIdUrl) {
        setError("Government ID upload failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const validation = verificationDocumentsSchema.safeParse(verificationDocuments);
      if (!validation.success) {
        setError(validation.error.errors[0]?.message || "Invalid document URLs");
        setIsSubmitting(false);
        return;
      }
      try {
        const newShop = await createShop({
          owner_id: user.id,
          name: data.shopName,
          description: `Motorbike rental shop in Siargao.${data.referral ? ` Referred by: ${data.referral}.` : ''}`,
          address: data.address || "Siargao Island",
          city: "Siargao",
          phone_number: data.phone,
          email: data.email,
          verification_documents: validation.data,
          referrer_id: resolvedReferrerId || undefined // Pass to DB if present
        });

        if (!newShop) {
          console.error('Failed to create shop - no error thrown but returned null');
          throw new Error("Failed to create shop");
        }

        console.log('Shop created successfully:', newShop);
        setIsSubmitted(true);

        // If referral, create referral record
        if (resolvedReferrerId && newShop.id) {
          await createReferral({
            referrer_id: resolvedReferrerId,
            shop_id: newShop.id
          });
        }
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
              name: data.shopName,
              description: `Motorbike rental shop in Siargao.${data.referral ? ` Referred by: ${data.referral}.` : ''}`,
              address: data.address || "Siargao Island",
              city: "Siargao",
              phone_number: data.phone,
              email: data.email,
              verification_documents: validation.data,
              referrer_id: resolvedReferrerId || undefined // Pass to DB if present
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
      console.error("Error registering shop:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  });

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

  // Add this useEffect near the beginning of the component after other useEffects
  useEffect(() => {
    // Skip if user is not available yet
    if (!user) return;

    const checkAndSendOnboardingEmail = async () => {
      try {
        // Check if this user is a shop_owner and hasn't received an onboarding email
        const { data } = await supabase
          .from('users')
          .select('role, onboarding_email_sent')
          .eq('id', user.id)
          .single();

        // If the user is a shop_owner and hasn't received an onboarding email, send one
        if (data?.role === 'shop_owner' && data?.onboarding_email_sent !== true) {
          const response = await fetch('/api/send-onboarding-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              firstName: user.user_metadata?.first_name || '',
            }),
          });

          if (!response.ok) {
            console.error('Failed to send fallback onboarding email:', await response.text());
          }
        }
      } catch (error) {
        console.error('Error checking or sending onboarding email:', error);
      }
    };

    checkAndSendOnboardingEmail();
  }, [user]);

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
              {t('registration_submitted')}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="inline-block"
            >
              <Badge variant="pending" className="text-sm px-3 py-1">
                <span className="mr-1.5">●</span>
                {t('pending_verification')}
              </Badge>
            </motion.div>
            <motion.p
              className="text-muted-foreground mt-6 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {t('thank_you')}
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
                <Link href="/">{t('return_homepage')}</Link>
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
            {/* Language Switcher */}
            <div className="flex justify-end mb-4">
              <motion.div
                className=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLanguage}
                  className="text-sm border-white/20 text-white hover:bg-white/10 relative overflow-hidden px-2 py-1"
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={language}
                      className="flex items-center space-x-1"
                      initial={languageTransition.initial}
                      animate={languageTransition.animate}
                      exit={languageTransition.exit}
                    >
                      <span className="text-base">{language === 'en' ? '🇵🇭' : '🇬🇧'}</span>
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
            <motion.div variants={slideUp}>
              <Badge className="mb-6 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                {t('become_partner')}
              </Badge>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight relative"
              variants={slideUp}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-heading1'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('turn_motorbikes')} <span className="text-primary">{t('profitable_business')}</span>
                </motion.span>
              </AnimatePresence>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-gray-300 mb-8 relative"
              variants={slideUp}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-description'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('no_physical_store')}
                </motion.span>
              </AnimatePresence>
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
                    {t('register_shop')} <ArrowRight className="ml-2 h-4 w-4" />
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
                      {t('create_account')} <ArrowRight className="ml-2 h-4 w-4" />
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
                  <a href="#benefits">{t('learn_more')}</a>
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
              <p className="text-sm md:text-base text-gray-300">{t('active_tourists')}</p>
            </motion.div>
            <motion.div className="text-center p-2 md:p-3" variants={cardVariants}>
              <p className="text-3xl md:text-4xl font-bold text-primary">10%</p>
              <p className="text-sm md:text-base text-gray-300">
                {t('commission_fee')}<br />
                <span className="text-primary font-semibold text-xs">{t('first_2_months')}</span>
              </p>
            </motion.div>
            <motion.div className="text-center p-2 md:p-3" variants={cardVariants}>
              <p className="text-3xl md:text-4xl font-bold text-primary">10+</p>
              <p className="text-sm md:text-base text-gray-300">{t('partner_shops')}</p>
            </motion.div>
            <motion.div className="text-center p-2 md:p-3" variants={cardVariants}>
              <p className="text-3xl md:text-4xl font-bold text-primary">5 min</p>
              <p className="text-sm md:text-base text-gray-300">{t('setup_time')}</p>
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
            <Badge className="mb-4 text-sm">
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-why-join'}
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('why_join_us')}
                </motion.span>
              </AnimatePresence>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-benefits'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('benefits_partnering')}
                </motion.span>
              </AnimatePresence>
            </h2>
            <p className="text-gray-300 text-lg">
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-join-dozens'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('join_dozens')}
                </motion.span>
              </AnimatePresence>
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
              <h3 className="text-xl font-semibold mb-3 text-white">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={language + '-no-store'}
                    className="block"
                    initial={languageTransition.initial}
                    animate={languageTransition.animate}
                    exit={languageTransition.exit}
                  >
                    {t('no_physical_store_required')}
                  </motion.span>
                </AnimatePresence>
              </h3>
              <p className="text-gray-400">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={language + '-save-rent'}
                    className="block"
                    initial={languageTransition.initial}
                    animate={languageTransition.animate}
                    exit={languageTransition.exit}
                  >
                    {t('save_on_rent')}
                  </motion.span>
                </AnimatePresence>
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
              <h3 className="text-xl font-semibold mb-3 text-white">{t('increased_visibility')}</h3>
              <p className="text-gray-400">
                {t('reach_thousands')}
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
              <h3 className="text-xl font-semibold mb-3 text-white">{t('built_in_customer')}</h3>
              <p className="text-gray-400">
                {t('access_network')}
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
              <h3 className="text-xl font-semibold mb-3 text-white">{t('simplified_booking')}</h3>
              <p className="text-gray-400">
                {t('platform_handles')}
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
              <h3 className="text-xl font-semibold mb-3 text-white">{t('low_commission')}</h3>
              <p className="text-gray-400">
                {t('just_10_percent')}
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
              <h3 className="text-xl font-semibold mb-3 text-white">{t('verified_customers')}</h3>
              <p className="text-gray-400">
                {t('all_renters')}
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
            <Badge className="mb-4 text-sm">
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-simple-process'}
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('simple_process')}
                </motion.span>
              </AnimatePresence>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-how-to-start'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('how_to_start')}
                </motion.span>
              </AnimatePresence>
            </h2>
            <p className="text-gray-300 text-lg">
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-setting-up'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('setting_up')}
                </motion.span>
              </AnimatePresence>
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
              <h3 className="text-xl font-semibold mb-3 text-white">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={language + '-create-account'}
                    className="block"
                    initial={languageTransition.initial}
                    animate={languageTransition.animate}
                    exit={languageTransition.exit}
                  >
                    {t('create_account_step')}
                  </motion.span>
                </AnimatePresence>
              </h3>
              <p className="text-gray-400">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={language + '-sign-up'}
                    className="block"
                    initial={languageTransition.initial}
                    animate={languageTransition.animate}
                    exit={languageTransition.exit}
                  >
                    {t('sign_up')}
                  </motion.span>
                </AnimatePresence>
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div className="text-center relative" variants={cardVariants}>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              {/* Only show connector line on medium screens and up */}
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-1 bg-gray-800 -z-0"></div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('submit_documents')}</h3>
              <p className="text-gray-400">
                {t('provide_government')}
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div className="text-center" variants={cardVariants}>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('get_verified')}</h3>
              <p className="text-gray-400">
                {t('after_verification')}
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
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-powerful-dashboard'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('powerful_dashboard')}
                </motion.span>
              </AnimatePresence>
            </h2>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-16">
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-intuitive-interface'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('intuitive_interface')}
                </motion.span>
              </AnimatePresence>
            </p>

            {/* Interactive Dashboard Showcase - Using Framer Motion */}
            <InteractiveDashboardShowcase t={t} language={language} languageTransition={languageTransition} />
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
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-ready-to-start'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('ready_to_start')}
                </motion.span>
              </AnimatePresence>
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              <AnimatePresence mode="wait">
                <motion.span
                  key={language + '-join-growing'}
                  className="block"
                  initial={languageTransition.initial}
                  animate={languageTransition.animate}
                  exit={languageTransition.exit}
                >
                  {t('join_growing')}
                </motion.span>
              </AnimatePresence>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                  onClick={showFormAndScroll}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={language + '-register-shop-btn'}
                      className="flex items-center"
                      initial={languageTransition.initial}
                      animate={languageTransition.animate}
                      exit={languageTransition.exit}
                    >
                      {t('register_shop')} <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.span>
                  </AnimatePresence>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                  asChild
                >
                  <Link href="/sign-up?callback=/register">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={language + '-create-account-btn'}
                        className="flex items-center"
                        initial={languageTransition.initial}
                        animate={languageTransition.animate}
                        exit={languageTransition.exit}
                      >
                        {t('create_account')} <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.span>
                    </AnimatePresence>
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={language + '-contact-us'}
                      className="block"
                      initial={languageTransition.initial}
                      animate={languageTransition.animate}
                      exit={languageTransition.exit}
                    >
                      {t('contact_us')}
                    </motion.span>
                  </AnimatePresence>
                </Link>
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
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={language + '-register-your-shop'}
                      className="block"
                      initial={languageTransition.initial}
                      animate={languageTransition.animate}
                      exit={languageTransition.exit}
                    >
                      {t('register_your_shop')}
                    </motion.span>
                  </AnimatePresence>
                </h2>
                <p className="text-gray-300">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={language + '-fill-out-form'}
                      className="block"
                      initial={languageTransition.initial}
                      animate={languageTransition.animate}
                      exit={languageTransition.exit}
                    >
                      {t('fill_out_form')}
                    </motion.span>
                  </AnimatePresence>
                </p>
              </motion.div>

              <motion.div
                className="bg-card border border-border rounded-lg p-6 md:p-8"
                variants={slideUp}
              >
                {existingShop ? (
                  <div className="text-center p-8">
                    <p className="mb-4 text-muted-foreground">
                      {t('already_registered')}
                    </p>
                  </div>
                ) : userRecordExists === false && creatingUserRecord ? (
                  // Show a loading indicator while automatically creating the user record
                  <div className="mb-6 p-4 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3">{t('creating_user')}</span>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* Form Progress Indicator */}
                    <motion.div variants={slideUp} className="mb-6">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Form completion</span>
                        <span>{calculateFormProgress()}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateFormProgress()}%` }}
                        ></div>
                      </div>
                    </motion.div>

                    {/* Display general errors */}
                    {error && (
                      <motion.div
                        className="bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-md p-4 mb-6"
                        variants={slideUp}
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Error</p>
                            <p className="text-sm">{error}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Owner Information */}
                    <motion.div variants={slideUp}>
                      <h2 className="text-xl font-semibold mb-4">{t('owner_information')}</h2>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                            {t('full_name')}
                          </label>
                          <input
                            {...register("fullName")}
                            id="fullName"
                            type="text"
                            className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.fullName ? "border-red-500 dark:border-red-500" : "border-input"}`}
                            aria-invalid={errors.fullName ? "true" : "false"}
                            aria-describedby={errors.fullName ? "fullName-error" : ""}
                          />
                          {errors.fullName && (
                            <p id="fullName-error" className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.fullName.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="shopName" className="block text-sm font-medium mb-1">
                            {t('shop_name')}
                          </label>
                          <input
                            {...register("shopName")}
                            id="shopName"
                            type="text"
                            className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.shopName ? "border-red-500 dark:border-red-500" : "border-input"}`}
                            aria-invalid={errors.shopName ? "true" : "false"}
                            aria-describedby={errors.shopName ? "shopName-error" : ""}
                          />
                          {errors.shopName && (
                            <p id="shopName-error" className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.shopName.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="address" className="block text-sm font-medium mb-1">
                            {t('shop_address')}
                          </label>
                          <input
                            {...register("address")}
                            id="address"
                            type="text"
                            className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.address ? "border-red-500 dark:border-red-500" : "border-input"}`}
                            placeholder="e.g., Tourism Road, General Luna"
                            aria-invalid={errors.address ? "true" : "false"}
                            aria-describedby={errors.address ? "address-error" : ""}
                          />
                          {errors.address && (
                            <p id="address-error" className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.address.message}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div variants={slideUp}>
                      <h2 className="text-xl font-semibold mb-4">{t('contact_information')}</h2>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium mb-1">
                            {t('email_address')}
                          </label>
                          <input
                            {...register("email")}
                            id="email"
                            type="email"
                            className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.email ? "border-red-500 dark:border-red-500" : "border-input"}`}
                            aria-invalid={errors.email ? "true" : "false"}
                            aria-describedby={errors.email ? "email-error" : ""}
                          />
                          {errors.email && (
                            <p id="email-error" className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.email.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium mb-1">
                            {t('phone_number')}
                          </label>
                          <div className="relative">
                            <input
                              {...register("phone")}
                              id="phone"
                              type="tel"
                              className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.phone ? "border-red-500 dark:border-red-500" : "border-input"}`}
                              placeholder="e.g., +639123456789 or 09123456789"
                              aria-invalid={errors.phone ? "true" : "false"}
                              aria-describedby={errors.phone ? "phone-error" : ""}
                            />
                          </div>
                          {errors.phone && (
                            <p id="phone-error" className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.phone.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="referral" className="block text-sm font-medium mb-1">
                            {t('referral')}
                          </label>
                          <input
                            {...register("referral")}
                            id="referral"
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder={t('who_referred')}
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Verification Documents */}
                    <motion.div variants={slideUp}>
                      <h2 className="text-xl font-semibold mb-4">{t('verification_documents')}</h2>

                      <div className="bg-muted/30 border border-border rounded-md p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <Info size={20} className="mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {t('security_verification')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <motion.div
                          whileHover={{ borderColor: "rgba(var(--color-primary), 0.5)" }}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <label htmlFor="governmentId" className="block text-sm font-medium">
                              {t('government_id')} <span className="text-red-500">*</span>
                            </label>
                            <span className="text-xs text-muted-foreground">Required</span>
                          </div>
                          <div
                            className={`flex items-center justify-center border border-dashed rounded-md h-32 cursor-pointer relative overflow-hidden bg-background/50 ${!governmentId ? "border-border" : "border-green-500/50 dark:border-green-700/50"}`}
                          >
                            <input
                              type="file"
                              id="governmentId"
                              name="governmentId"
                              onChange={(e) => handleFileChange(e, 'governmentId')}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                              accept="image/jpeg,image/png,image/gif,application/pdf"
                              aria-required="true"
                              aria-invalid={!governmentId ? "true" : "false"}
                              aria-describedby="governmentId-description governmentId-error"
                            />
                            <div className="text-center">
                              <Upload size={24} className={`mx-auto mb-2 ${!governmentId ? "text-muted-foreground" : "text-green-500 dark:text-green-400"}`} />
                              <p className="text-sm font-medium">{t('click_upload')}</p>
                              <p id="governmentId-description" className="text-xs text-muted-foreground">{t('accepted_formats')}</p>
                              <p className="text-xs text-muted-foreground mt-1">Max size: 5MB</p>
                            </div>

                            {governmentId && (
                              <motion.div
                                className="absolute inset-0 flex items-center justify-center bg-card/90 z-0"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="text-center">
                                  <Check className="mx-auto mb-2 text-green-500 dark:text-green-400" size={24} />
                                  <p className="text-sm font-medium">{governmentId.name}</p>
                                  <p className="text-xs text-muted-foreground">{(governmentId.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                              </motion.div>
                            )}
                          </div>
                          {!governmentId && (
                            <p id="governmentId-error" className="mt-1 text-sm text-red-500 dark:text-red-400">Government ID is required</p>
                          )}
                        </motion.div>

                        <motion.div
                          whileHover={{ borderColor: "rgba(var(--color-primary), 0.5)" }}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <label htmlFor="businessPermit" className="block text-sm font-medium">
                              {t('business_permit')}
                            </label>
                            <span className="text-xs text-muted-foreground">Optional</span>
                          </div>
                          <div
                            className={`flex items-center justify-center border border-dashed rounded-md h-32 cursor-pointer relative overflow-hidden bg-background/50 ${!businessPermit ? "border-border" : "border-green-500/50 dark:border-green-700/50"}`}
                          >
                            <input
                              type="file"
                              id="businessPermit"
                              name="businessPermit"
                              onChange={(e) => handleFileChange(e, 'businessPermit')}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                              accept="image/jpeg,image/png,image/gif,application/pdf"
                              aria-describedby="businessPermit-description"
                            />
                            <div className="text-center">
                              <Upload size={24} className={`mx-auto mb-2 ${!businessPermit ? "text-muted-foreground" : "text-green-500 dark:text-green-400"}`} />
                              <p className="text-sm font-medium">{t('click_upload')}</p>
                              <p id="businessPermit-description" className="text-xs text-muted-foreground">{t('accepted_formats')}</p>
                              <p className="text-xs text-muted-foreground mt-1">Max size: 5MB</p>
                            </div>

                            {businessPermit && (
                              <motion.div
                                className="absolute inset-0 flex items-center justify-center bg-card/90 z-0"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="text-center">
                                  <Check className="mx-auto mb-2 text-green-500 dark:text-green-400" size={24} />
                                  <p className="text-sm font-medium">{businessPermit.name}</p>
                                  <p className="text-xs text-muted-foreground">{(businessPermit.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
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
                        className={`w-full shadow-sm flex items-center justify-center ${isValid && governmentId ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white border border-primary/40'}`}
                        disabled={isSubmitting || !!existingShop || formSubmitting || (!isValid || !governmentId)}
                      >
                        {isSubmitting || formSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            {t('processing')}
                          </div>
                        ) : (
                          <>
                            {t('submit_registration')}
                            {isValid && governmentId && !isSubmitting && !existingShop && (
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
                      {(!isValid || !governmentId) && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Please complete all required fields to submit
                        </p>
                      )}
                    </motion.div>
                    {referralError && (
                      <p className="mt-1 text-sm text-red-500 dark:text-red-400">{referralError}</p>
                    )}
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

// Animation variants for language transitions
const languageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

// Let's use a simpler approach without the context
export default function RegisterShopPage() {
  const [language, setLanguage] = useState('en');

  // Merge translations
  const translations = {
    en: { ...registerTranslations.en, ...dashboardTranslations.en },
    tl: { ...registerTranslations.tl, ...dashboardTranslations.tl }
  };

  // Translation function with animation key
  const t = (key: string): string => {
    return translations[language as 'en' | 'tl'][key] || key;
  };

  // Toggle language function with smooth transition
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tl' : 'en');
  };

  return (
    <RegisterShopPageContent
      t={t}
      language={language}
      toggleLanguage={toggleLanguage}
      languageTransition={languageTransition}
    />
  );
}