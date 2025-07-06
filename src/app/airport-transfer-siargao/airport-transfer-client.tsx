"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Car, 
  Users, 
  Droplets, 
  UserCheck, 
  Clock, 
  MapPin,
  MessageCircle,
  Check,
  ChevronDown,
  Shield,
  Zap,
  Calendar
} from 'lucide-react'
import { ScrollReveal } from '@/components/animations/ScrollReveal'
import { AnimatedCard, StaggeredCards } from '@/components/animations/AnimatedCard'
import { PrimaryButton, SecondaryButton } from '@/components/animations/AnimatedButton'
import { FloatingElements, ParticleField } from '@/components/animations/FloatingElements'
import { useReducedMotion } from '@/hooks/useScrollAnimation'
import { useSocialProofNotifications } from '@/hooks/useSocialProofNotifications'
import { SocialProofContainer } from '@/components/SocialProofNotification'
import { 
  heroTitleVariants, 
  heroSubtitleVariants,
  staggerContainerVariants,
  staggerItemVariants,
  fadeInUpVariants
} from '@/lib/animations'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { WelcomeTooltip } from '@/components/ui/welcome-tooltip'

// WhatsApp configuration
const WHATSAPP_NUMBER = '+639993702550'

// Immediate booking message template
const WHATSAPP_MESSAGE_IMMEDIATE = encodeURIComponent(
  'Hi! I would like to book your private van hire service for airport transfer.\n\n' +
  'Service: Immediate Van Hire Booking\n' +
  'Number of passengers: \n' +
  'Travel date: \n' +
  'Pickup time: \n' +
  'Flight number: \n' +
  'Pickup location: Sayak Airport\n' +
  'Drop-off destination: \n\n' +
  'Pricing: ₱2,000 (2 pax) | ₱2,500 (3-10 pax)'
)

// Premium pre-booking message template
const WHATSAPP_MESSAGE_PREMIUM = encodeURIComponent(
  'Hi! I would like to pre-book your premium Hyundai Staria van service for airport transfer (August 2025 onwards).\n\n' +
  'Service: Premium Hyundai Staria Pre-Booking\n' +
  'Number of passengers: \n' +
  'Travel date (from August 2025): \n' +
  'Pickup time: \n' +
  'Flight number: \n' +
  'Pickup location: Sayak Airport\n' +
  'Drop-off destination: \n\n' +
  'Pricing: ₱2,500 (2 pax) | ₱3,500 (3-8 pax)'
)

export default function VanHireClient() {
  const [isMobile, setIsMobile] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const { notifications, dismissNotification } = useSocialProofNotifications(true)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const handleWhatsAppClick = (serviceType: 'immediate' | 'premium' = 'immediate') => {
    const message = serviceType === 'immediate' ? WHATSAPP_MESSAGE_IMMEDIATE : WHATSAPP_MESSAGE_PREMIUM
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
  }

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Guaranteed Availability",
      description: "Pre-book now to secure your spot for August 2025 launch - no waiting lists"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Locked-in Rates",
      description: "Pre-booking customers get current pricing locked in, protected from future increases"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Comfortable Leather Seating",
      description: "Premium soft leather seats with spacious interior for ultimate comfort"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "USB Type-C Charging",
      description: "Stay powered up with convenient USB Type-C ports throughout the van"
    },
    {
      icon: <Droplets className="w-6 h-6" />,
      title: "Complimentary Water",
      description: "Free bottled water provided for all passengers on pickup"
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "Professional Local Driver",
      description: "Experienced drivers who know Siargao's roads and best routes"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Name Sign Greeting",
      description: "Easy airport pickup with personalized name sign at arrivals"
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: "Surf Rack & Storage",
      description: (
        <>
          Secure surf board rack and ample luggage space for all your gear. Perfect for surfers heading to{' '}
          <Link href="/browse?location=Cloud+9" className="text-primary hover:text-primary/80 underline">
            Cloud 9
          </Link>
          {' '}or those planning to rent{' '}
          <Link href="/browse?type=motorcycle" className="text-primary hover:text-primary/80 underline">
            motorcycles
          </Link>
          {' '}for island exploration.
        </>
      )
    }
  ]

  const faqs = [
    {
      question: "Can I book airport transfer for today or tomorrow?",
      answer: "Yes! Our regular van hire service is available for immediate booking. Contact us via WhatsApp and we can arrange pickup for today or tomorrow with our professional drivers at ₱2,000 (2 pax) or ₱2,500 (3-10 pax)."
    },
    {
      question: "What's the difference between regular service and premium pre-booking?",
      answer: "Our regular service uses well-maintained vans with professional drivers, available for immediate booking. The premium service features luxury Hyundai Staria with leather seating and premium amenities, available for pre-booking from August 2025."
    },
    {
      question: "How do I book the van hire service?",
      answer: "For immediate booking: Click 'Book Now' and message us via WhatsApp with your travel details. For premium pre-booking: Click 'Pre-Book Premium' to secure your spot for August 2025. We respond within minutes to confirm your booking."
    },
    {
      question: "What are the current pricing rates?",
      answer: "Regular service (available now): ₱2,000 for 2 passengers, ₱2,500 for 3-10 passengers. Premium Hyundai Staria (August 2025): ₱2,500 for 2 passengers, ₱3,500 for 3-8 passengers. All prices include professional driver and door-to-door service."
    },
    {
      question: "What happens if my flight is delayed?",
      answer: "No worries! We monitor flight arrivals and adjust pickup times accordingly. Just provide your flight number when booking and we'll track your flight status automatically for both regular and premium services."
    },
    {
      question: "What areas do you service?",
      answer: (
        <>
          We provide transfers between Sayak Airport and all major destinations in Siargao including{' '}
          <Link href="/browse?location=General+Luna" className="text-primary hover:text-primary/80 underline">
            General Luna
          </Link>
          ,{' '}
          <Link href="/browse?location=Cloud+9" className="text-primary hover:text-primary/80 underline">
            Cloud 9
          </Link>
          ,{' '}
          <Link href="/browse?location=Pacifico" className="text-primary hover:text-primary/80 underline">
            Pacifico
          </Link>
          , Santa Monica, Burgos, Dapa, and other destinations across the island.
        </>
      )
    },
    {
      question: "What's included with the service?",
      answer: "Both services include: professional local driver, complimentary bottled water, door-to-door pickup and drop-off, flight tracking, and luggage assistance. Premium service additionally includes luxury leather seating, USB-C charging ports, and surf rack storage."
    },
    {
      question: "Do you provide child seats?",
      answer: "Unfortunately, we do not provide child seats for safety and hygiene reasons. Please bring your own child seat if needed for your transfer. Our drivers can help you install it properly."
    },
    {
      question: "Can I cancel or modify my booking?",
      answer: "Yes! For regular bookings, you can cancel up to 2 hours before pickup. For premium pre-bookings, you can modify or cancel anytime before payment is required since no upfront payment is needed."
    },
    {
      question: "Why should I pre-book the premium service?",
      answer: "Pre-booking the premium Hyundai Staria guarantees availability when the service launches in August 2025, locks in current pricing (protected from future increases), and gives you priority access to our luxury fleet."
    }
  ]

  return (
    <div className="flex flex-col min-h-screen w-full bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <Image
              src="/images/hero-bg-1.png"
              alt="Private van hire service Siargao - Luxury Hyundai Staria for airport transfer from Sayak to General Luna and Cloud 9"
              fill
              className="object-cover opacity-40"
              priority
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10"></div>
        </div>

        {/* Floating Elements */}
        {!shouldReduceMotion && (
          <>
            <FloatingElements count={4} className="z-5 opacity-30" />
            <ParticleField density={8} className="z-5" />
          </>
        )}

        {/* Hero Content */}
        <div className="container mx-auto relative z-20 min-h-screen flex flex-col justify-center items-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Availability Badge */}
            <motion.div 
              className="mb-8 md:mb-12"
              variants={staggerItemVariants}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Available Now</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">Same/Next Day Booking</span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 md:mb-8 tracking-tight"
              variants={heroTitleVariants}
            >
              Private Airport Transfer Siargao
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-white/80 mb-8 md:mb-12 max-w-2xl mx-auto"
              variants={heroSubtitleVariants}
            >
              Book now for immediate pickup or pre-book our premium service launching August 2025. Professional drivers, door-to-door service.
            </motion.p>

            {/* Primary CTA */}
            <motion.div 
              variants={fadeInUpVariants}
              className="mb-6 sm:mb-8"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <PrimaryButton
                  onClick={() => handleWhatsAppClick('immediate')}
                  size="lg"
                  className="flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 text-base sm:text-lg font-semibold w-full sm:w-auto min-w-[280px]"
                  enableMagnetic={!isMobile}
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  Book Transfer Now
                </PrimaryButton>
                
                <SecondaryButton
                  onClick={() => {
                    document.getElementById('service-comparison')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  size="lg"
                  className="text-white/80 border-white/30 hover:border-white/50 hover:text-white transition-colors min-h-[48px] px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto min-w-[280px]"
                  enableMagnetic={!isMobile}
                >
                  View All Options
                </SecondaryButton>
              </div>
              
              {/* Compact Pricing Display */}
              <div className="text-center text-white/80 text-sm sm:text-base">
                <span className="font-medium">From ₱2,000</span>
                <span className="text-white/40 mx-2">•</span>
                <span>Same day booking available</span>
              </div>
            </motion.div>

          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 text-white/40" />
          </motion.div>
        </div>
      </section>

      {/* Service Comparison Section */}
      <section id="service-comparison" className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        {!shouldReduceMotion && (
          <ParticleField density={5} className="absolute inset-0 opacity-20" />
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Two Service Options Available
              </span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg">
              Choose immediate pickup with our regular service or secure your spot for our premium Hyundai Staria launching August 2025
            </p>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Immediate Service Card */}
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(45, 212, 191, 0.2)"
              className="bg-gradient-to-br from-primary/10 to-green-900/10 border border-primary/20 rounded-xl p-8 relative"
            >
              <Badge className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white">
                Available Now
              </Badge>
              <div className="text-center mt-2">
                <h3 className="text-2xl font-bold text-white mb-2">Regular Van Service</h3>
                <p className="text-gray-400 mb-6">Book for immediate pickup</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">2 Passengers</span>
                    <span className="text-2xl font-bold text-primary">₱2,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">3-10 Passengers</span>
                    <span className="text-2xl font-bold text-primary">₱2,500</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 text-left">
                  {[
                    "Professional local driver",
                    "Free bottled water",
                    "Door-to-door service",
                    "Same/next day booking",
                    "Well-maintained vehicles",
                    "Flight tracking included"
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <PrimaryButton
                  onClick={() => handleWhatsAppClick('immediate')}
                  className="w-full"
                  enableMagnetic={!isMobile}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Book Now
                </PrimaryButton>
              </div>
            </AnimatedCard>

            {/* Premium Service Card */}
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(147, 51, 234, 0.2)"
              className="bg-gradient-to-br from-purple-900/10 to-gray-900/50 border border-purple-500/20 rounded-xl p-8 relative"
            >
              <Badge className="absolute -top-5 left-1/2 -translate-x-1/2 bg-purple-600 text-white">
                August 2025
              </Badge>
              <div className="text-center mt-2">
                <h3 className="text-2xl font-bold text-white mb-2">Premium Hyundai Staria</h3>
                <p className="text-gray-400 mb-6">Pre-book luxury service</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">2 Passengers</span>
                    <span className="text-2xl font-bold text-purple-400">₱2,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">3-8 Passengers</span>
                    <span className="text-2xl font-bold text-purple-400">₱3,500</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 text-left">
                  {[
                    "Luxury leather seating",
                    "USB Type-C charging ports",
                    "Surf rack & storage",
                    "Premium comfort features",
                    "Guaranteed availability",
                    "Locked-in pricing"
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <SecondaryButton
                  onClick={() => handleWhatsAppClick('premium')}
                  className="w-full border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-purple-200"
                  enableMagnetic={!isMobile}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Pre-Book Now
                </SecondaryButton>
              </div>
            </AnimatedCard>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        {!shouldReduceMotion && (
          <ParticleField density={5} className="absolute inset-0 opacity-20" />
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Why Choose Our Service?
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Professional drivers, reliable service, and transparent pricing
            </p>
          </ScrollReveal>

          <ScrollReveal 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            threshold={0.1}
          >
            <StaggeredCards className="contents" staggerDelay={0.1}>
              {features.map((feature) => (
                <AnimatedCard
                  key={feature.title}
                  enableMagnetic={!isMobile}
                  enableTilt={!isMobile}
                  enableGlow={true}
                  glowColor="rgba(45, 212, 191, 0.1)"
                  className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6"
                >
                  <motion.div 
                    className="text-primary mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </AnimatedCard>
              ))}
            </StaggeredCards>
          </ScrollReveal>
        </div>
      </section>

      {/* Vehicle Showcase */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Luxury Hyundai Staria
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Comfortably seats up to 8 passengers with premium amenities
            </p>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <Image
                src="/images/hyundai-staria-tropical.png"
                alt="Private van hire Siargao - Luxury Hyundai Staria for airport transfer service to General Luna, Cloud 9, and Pacifico"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <Image
                src="/images/interio-staria.png"
                alt="Siargao airport transfer van interior - Premium leather seating in Hyundai Staria for private pickup and drop-off service"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Booking Process */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Simple Booking Process
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Choose your service and book in 3 easy steps
            </p>
          </ScrollReveal>

          <div className="text-center mb-12">
            <p className="text-gray-400 max-w-2xl mx-auto">
              Both services follow simple, 3-step processes designed for your convenience
            </p>
          </div>

          <ScrollReveal 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            threshold={0.1}
          >
            <StaggeredCards className="contents" staggerDelay={0.2}>
              {[
                {
                  step: "1",
                  title: "Contact Us",
                  description: "Send us your travel details and service preference via WhatsApp"
                },
                {
                  step: "2",
                  title: "Get Confirmation",
                  description: "Receive instant confirmation with pricing and driver details"
                },
                {
                  step: "3",
                  title: "Enjoy Your Transfer",
                  description: "Meet your driver at Sayak Airport for door-to-door service"
                }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              ))}
            </StaggeredCards>
          </ScrollReveal>

          <motion.div 
            className="text-center mt-12"
            variants={fadeInUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <PrimaryButton
                onClick={() => handleWhatsAppClick('immediate')}
                size="lg"
                className="flex items-center gap-2"
                enableMagnetic={!isMobile}
              >
                <MessageCircle className="w-5 h-5" />
                Book Transfer Now
              </PrimaryButton>
              
              <SecondaryButton
                onClick={() => handleWhatsAppClick('premium')}
                size="lg"
                className="flex items-center gap-2 border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-purple-200"
                enableMagnetic={!isMobile}
              >
                <Calendar className="w-5 h-5" />
                Pre-Book Premium
              </SecondaryButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Private Transfer */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Private vs Shared Van
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gray-900/50 border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Private Van Benefits</h3>
                <ul className="space-y-3">
                  {[
                    "Guaranteed availability at launch",
                    "Locked-in current pricing",
                    "No waiting for other passengers",
                    "Direct to your destination",
                    "Privacy and comfort",
                    "Priority early access"
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="bg-gray-800/30 border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-400 mb-4">Shared Van Issues</h3>
                <ul className="space-y-3">
                  {[
                    "Wait for van to fill up",
                    "Multiple stops and detours",
                    "Fixed departure schedules",
                    "Crowded with strangers",
                    "Variable pricing",
                    "Less reliable timing"
                  ].map((issue) => (
                    <li key={issue} className="flex items-start gap-2 text-gray-500">
                      <span className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0">×</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            
            <ScrollReveal className="text-center mt-12 max-w-2xl mx-auto">
              <p className="text-gray-400 text-sm">
                After settling in at your destination, explore the island with our{' '}
                <Link href="/browse" className="text-primary hover:text-primary/80 underline">
                  motorcycle and car rentals
                </Link>
                {' '}for complete freedom to discover Siargao&apos;s hidden gems.
              </p>
            </ScrollReveal>
          </ScrollReveal>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Best Value on the Island
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Competitive pricing with no hidden fees. Choose what works for you.
            </p>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Immediate Pricing */}
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(45, 212, 191, 0.2)"
              className="bg-gradient-to-br from-primary/10 to-green-900/10 border border-primary/20 rounded-xl p-6 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-3 py-1 text-xs font-medium text-primary mb-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Available Now
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Regular Service</h3>
              <div className="space-y-2 mb-6">
                <div className="text-3xl font-black text-primary">₱2,000</div>
                <p className="text-sm text-gray-400">2 passengers</p>
                <div className="text-3xl font-black text-primary">₱2,500</div>
                <p className="text-sm text-gray-400">3-10 passengers</p>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ Same/next day booking</p>
                <p>✓ Professional driver</p>
                <p>✓ Free water included</p>
              </div>
            </AnimatedCard>

            {/* Premium Pricing */}
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(147, 51, 234, 0.2)"
              className="bg-gradient-to-br from-purple-900/10 to-gray-900/50 border border-purple-500/20 rounded-xl p-6 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-purple-600/20 rounded-full px-3 py-1 text-xs font-medium text-purple-400 mb-4">
                <Calendar className="w-3 h-3" />
                August 2025
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Premium Staria</h3>
              <div className="space-y-2 mb-6">
                <div className="text-3xl font-black text-purple-400">₱2,500</div>
                <p className="text-sm text-gray-400">2 passengers</p>
                <div className="text-3xl font-black text-purple-400">₱3,500</div>
                <p className="text-sm text-gray-400">3-8 passengers</p>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ Luxury leather seating</p>
                <p>✓ USB-C charging ports</p>
                <p>✓ Guaranteed availability</p>
              </div>
            </AnimatedCard>

            {/* Comparison */}
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(255, 255, 255, 0.1)"
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-xl p-6 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs font-medium text-white/60 mb-4">
                <Shield className="w-3 h-3" />
                Money-Back Guarantee
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Why Choose Us?</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Flight tracking included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>24/7 customer support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Local driver expertise</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Flexible cancellation</span>
                </div>
              </div>
            </AnimatedCard>
          </ScrollReveal>

          <ScrollReveal className="text-center mt-12">
            <p className="text-gray-400 text-sm max-w-3xl mx-auto">
              All prices include pickup from Sayak Airport, professional driver, and door-to-door service to any destination in Siargao. 
              Additional charges may apply for destinations beyond standard service areas.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Frequently Asked Questions
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-gray-900/50 border border-white/10 rounded-lg px-6 overflow-hidden"
                >
                  <AccordionTrigger className="text-white hover:text-primary transition-colors py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Ready to Book?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Book now for immediate pickup or pre-book our premium service launching August 2025
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              <PrimaryButton
                onClick={() => handleWhatsAppClick('immediate')}
                size="lg"
                className="flex items-center gap-2 justify-center"
                enableMagnetic={!isMobile}
              >
                <MessageCircle className="w-4 h-4" />
                Book Now
              </PrimaryButton>
              
              <SecondaryButton
                onClick={() => handleWhatsAppClick('premium')}
                size="lg"
                className="flex items-center gap-2 justify-center border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-purple-200"
                enableMagnetic={!isMobile}
              >
                <Calendar className="w-4 h-4" />
                Pre-Book Premium
              </SecondaryButton>
            </div>

            <div className="flex items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Available 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span>Quick Response</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <WelcomeTooltip
          id="whatsapp-booking-tooltip"
          title="👋 Hey there!"
          content="Tap here to book your transfer for today/tomorrow or ask questions via WhatsApp. We're quick to respond!"
          autoShowDelay={2000}
          autoHideDuration={6000}
          icon={<MessageCircle className="w-4 h-4 text-primary" />}
        >
          <PrimaryButton
            onClick={() => handleWhatsAppClick('immediate')}
            className="rounded-full w-14 h-14 p-0 shadow-lg"
            enableGlow={true}
          >
            <MessageCircle className="w-6 h-6" />
          </PrimaryButton>
        </WelcomeTooltip>
      </motion.div>

      {/* Social Proof Notifications */}
      <SocialProofContainer 
        notifications={notifications} 
        onDismiss={dismissNotification} 
      />
    </div>
  )
}