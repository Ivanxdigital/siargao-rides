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
  Shield
} from 'lucide-react'
import { ScrollReveal } from '@/components/animations/ScrollReveal'
import { AnimatedCard, StaggeredCards } from '@/components/animations/AnimatedCard'
import { PrimaryButton } from '@/components/animations/AnimatedButton'
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { WelcomeTooltip } from '@/components/ui/welcome-tooltip'

// WhatsApp configuration
const WHATSAPP_NUMBER = '+639993702550'

// Van hire booking message template
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hi! I would like to book your private van hire service for airport transfer.\n\n' +
  'Number of passengers: \n' +
  'Travel date: \n' +
  'Pickup time: \n' +
  'Flight number: \n' +
  'Pickup location: Sayak Airport\n' +
  'Drop-off destination: \n\n' +
  'Pricing: ₱2,000 (2 pax) | ₱2,500 (3-10 pax)'
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

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`, '_blank')
  }

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Same Day Booking",
      description: "Book today for immediate pickup - no advance planning required"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Fixed Transparent Pricing",
      description: "No surge pricing or hidden fees - know exactly what you&apos;ll pay upfront"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Comfortable Seating",
      description: "Spacious interior accommodating up to 10 passengers with room for luggage"
    },
    {
      icon: <Droplets className="w-6 h-6" />,
      title: "Complimentary Water",
      description: "Free bottled water provided for all passengers during your transfer"
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "Professional Local Driver",
      description: "Experienced drivers who know Siargao&apos;s roads and optimal routes"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Name Sign Greeting",
      description: "Easy airport pickup with personalized name sign at arrivals gate"
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
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Flight Tracking",
      description: "We monitor your flight status and adjust pickup times for delays automatically"
    }
  ]

  const faqs = [
    {
      question: "Can I book airport transfer for today or tomorrow?",
      answer: "Yes! Our van hire service is available for immediate booking. Contact us via WhatsApp and we can arrange pickup for today or tomorrow with our professional drivers at ₱2,000 (2 pax) or ₱2,500 (3-10 pax)."
    },
    {
      question: "How do I book the van hire service?",
      answer: "Simply click 'Book Transfer Now' and message us via WhatsApp with your travel details including number of passengers, flight information, and destination. We respond within minutes to confirm your booking."
    },
    {
      question: "What are your pricing rates?",
      answer: "₱2,000 for 2 passengers, ₱2,500 for 3-10 passengers. All prices include professional driver, door-to-door service, complimentary water, and flight tracking. No hidden fees or surge pricing."
    },
    {
      question: "What happens if my flight is delayed?",
      answer: "No worries! We monitor flight arrivals and adjust pickup times accordingly. Just provide your flight number when booking and we'll track your flight status automatically."
    },
    {
      question: "What areas in Siargao do you service?",
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
      answer: "Our service includes: professional local driver, complimentary bottled water, door-to-door pickup and drop-off, flight tracking, luggage assistance, and surf rack storage for your boards."
    },
    {
      question: "How many passengers can you accommodate?",
      answer: "Our vans can comfortably seat up to 10 passengers with their luggage. We have space for surf boards, diving gear, and other travel equipment you might have."
    },
    {
      question: "Do you provide child seats?",
      answer: "We don't provide child seats for safety and hygiene reasons. Please bring your own child seat if needed - our drivers can help you install it properly."
    },
    {
      question: "Can I cancel or modify my booking?",
      answer: "Yes! You can cancel up to 2 hours before pickup for a full refund. For modifications, just message us on WhatsApp and we'll update your booking details."
    },
    {
      question: "Why choose private van over shared shuttle?",
      answer: "Private van means no waiting for other passengers, direct route to your destination, departure on your schedule, and privacy for your group. Plus you get dedicated surf rack space and personal attention from your driver."
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
                <span className="text-white/80">Book Today, Travel Today</span>
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
              Reliable private van service with professional drivers and door-to-door service. Book today for immediate pickup.
            </motion.p>

            {/* Primary CTA */}
            <motion.div 
              variants={fadeInUpVariants}
              className="mb-6 sm:mb-8"
            >
              <div className="flex flex-col items-center justify-center gap-4 mb-4">
                <PrimaryButton
                  onClick={handleWhatsAppClick}
                  size="lg"
                  className="flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 text-base sm:text-lg font-semibold w-full sm:w-auto min-w-[280px]"
                  enableMagnetic={!isMobile}
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  Book Transfer Now
                </PrimaryButton>
              </div>
              
              {/* Pricing Display */}
              <div className="text-center text-white/80 text-sm sm:text-base space-y-1">
                <div>
                  <span className="font-medium text-lg">₱2,000</span>
                  <span className="text-white/60 mx-2">for 2 passengers</span>
                </div>
                <div>
                  <span className="font-medium text-lg">₱2,500</span>
                  <span className="text-white/60 mx-2">for 3-10 passengers</span>
                </div>
                <div className="text-white/60 text-sm mt-2">
                  Same day booking available • Professional drivers • Door-to-door service
                </div>
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

      {/* Value Proposition Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        {!shouldReduceMotion && (
          <ParticleField density={5} className="absolute inset-0 opacity-20" />
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Reliable Private Van Service
              </span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg">
              Professional drivers, immediate availability, and transparent pricing for your airport transfer needs
            </p>
          </ScrollReveal>

          <ScrollReveal className="max-w-4xl mx-auto">
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(45, 212, 191, 0.2)"
              className="bg-gradient-to-br from-primary/10 to-green-900/10 border border-primary/20 rounded-xl p-8 md:p-12 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2 text-sm font-medium text-primary mb-6">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Available Now
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Private Van Transfer</h3>
              <p className="text-gray-400 mb-8 text-lg">Skip the shared vans and crowded shuttles. Travel directly to your destination in comfort.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-black text-primary mb-2">₱2,000</div>
                  <p className="text-gray-300 text-lg">For 2 passengers</p>
                  <p className="text-gray-500 text-sm">Direct to destination</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-primary mb-2">₱2,500</div>
                  <p className="text-gray-300 text-lg">For 3-10 passengers</p>
                  <p className="text-gray-500 text-sm">Group-friendly pricing</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Professional driver</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Free bottled water</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Door-to-door service</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Same day booking</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Flight tracking</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Surf rack included</span>
                </div>
              </div>

              <PrimaryButton
                onClick={handleWhatsAppClick}
                size="lg"
                className="px-8 py-4 text-lg"
                enableMagnetic={!isMobile}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Book Your Transfer Now
              </PrimaryButton>
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

      {/* Service Highlights */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Comfort & Reliability
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Well-maintained vans that comfortably seat up to 10 passengers with space for all your luggage
            </p>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(45, 212, 191, 0.1)"
              className="bg-gray-900/50 border border-white/10 rounded-xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Spacious Interior</h3>
              <p className="text-gray-400">Comfortable seating for up to 10 passengers with ample legroom and luggage space</p>
            </AnimatedCard>
            
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(45, 212, 191, 0.1)"
              className="bg-gray-900/50 border border-white/10 rounded-xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Safety First</h3>
              <p className="text-gray-400">Well-maintained vehicles with experienced local drivers who prioritize your safety</p>
            </AnimatedCard>
            
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(45, 212, 191, 0.1)"
              className="bg-gray-900/50 border border-white/10 rounded-xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Always On Time</h3>
              <p className="text-gray-400">We track your flight status and adjust pickup times to ensure you&apos;re never left waiting</p>
            </AnimatedCard>
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
            <PrimaryButton
              onClick={handleWhatsAppClick}
              size="lg"
              className="flex items-center justify-center gap-2 px-8 py-4 text-lg mx-auto"
              enableMagnetic={!isMobile}
            >
              <MessageCircle className="w-5 h-5" />
              Book Your Transfer Now
            </PrimaryButton>
            
            <p className="text-gray-400 text-sm mt-4 max-w-md mx-auto">
              Quick response guaranteed - we&apos;ll confirm your booking within minutes
            </p>
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

      {/* Pricing & Value Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Transparent Pricing, No Surprises
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Fixed rates with no hidden fees, surge pricing, or booking charges
            </p>
          </ScrollReveal>

          <ScrollReveal className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <AnimatedCard
                enableMagnetic={!isMobile}
                enableTilt={!isMobile}
                enableGlow={true}
                glowColor="rgba(45, 212, 191, 0.2)"
                className="bg-gradient-to-br from-primary/10 to-green-900/10 border border-primary/20 rounded-xl p-8 text-center"
              >
                <div className="text-5xl font-black text-primary mb-4">₱2,000</div>
                <h3 className="text-xl font-bold text-white mb-2">For 2 Passengers</h3>
                <p className="text-gray-400 mb-6">Perfect for couples or solo travelers with a companion</p>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>✓ Direct to destination</p>
                  <p>✓ Professional driver</p>
                  <p>✓ Complimentary water</p>
                  <p>✓ Flight tracking</p>
                </div>
              </AnimatedCard>

              <AnimatedCard
                enableMagnetic={!isMobile}
                enableTilt={!isMobile}
                enableGlow={true}
                glowColor="rgba(45, 212, 191, 0.2)"
                className="bg-gradient-to-br from-primary/10 to-green-900/10 border border-primary/20 rounded-xl p-8 text-center"
              >
                <div className="text-5xl font-black text-primary mb-4">₱2,500</div>
                <h3 className="text-xl font-bold text-white mb-2">For 3-10 Passengers</h3>
                <p className="text-gray-400 mb-6">Great value for groups, families, or surf crews</p>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>✓ Group-friendly pricing</p>
                  <p>✓ Ample luggage space</p>
                  <p>✓ Surf rack included</p>
                  <p>✓ Same great service</p>
                </div>
              </AnimatedCard>
            </div>

            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(255, 255, 255, 0.1)"
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-xl p-8 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm font-medium text-white/60 mb-6">
                <Shield className="w-4 h-4" />
                What&apos;s Always Included
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-300">
                <div className="flex flex-col items-center gap-2">
                  <Check className="w-6 h-6 text-primary" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Check className="w-6 h-6 text-primary" />
                  <span>Flight tracking</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Check className="w-6 h-6 text-primary" />
                  <span>24/7 support</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Check className="w-6 h-6 text-primary" />
                  <span>Local expertise</span>
                </div>
              </div>
            </AnimatedCard>
          </ScrollReveal>

          <ScrollReveal className="text-center mt-12">
            <p className="text-gray-400 text-sm max-w-3xl mx-auto">
              All prices include pickup from Sayak Airport, professional driver, and door-to-door service to destinations across Siargao. 
              Additional charges may apply for destinations beyond our standard service areas.
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
              Ready to skip the hassle of shared shuttles? Book your private van transfer now.
            </p>

            <div className="mb-8">
              <PrimaryButton
                onClick={handleWhatsAppClick}
                size="lg"
                className="flex items-center gap-2 justify-center px-8 py-4 text-lg mx-auto"
                enableMagnetic={!isMobile}
              >
                <MessageCircle className="w-5 h-5" />
                Book Your Transfer Now
              </PrimaryButton>
              
              <p className="text-gray-500 text-sm mt-4">
                Quick response time • Same day booking available • No advance payment required
              </p>
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
            onClick={handleWhatsAppClick}
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