"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
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
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hi! I would like to pre-book your private van hire service for airport transfer (August 2025 onwards).\n\n' +
  'Service: Airport Transfer Pre-Booking\n' +
  'Number of passengers: \n' +
  'Travel date (from August 2025): \n' +
  'Pickup time: \n' +
  'Flight number: \n' +
  'Pickup location: \n' +
  'Drop-off destination: '
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
      description: "Secure surf board rack and ample luggage space for all your gear"
    }
  ]

  const faqs = [
    {
      question: "Why is the service only available from August 2025?",
      answer: "We're launching our premium van service in August 2025 to ensure we can provide the highest quality experience. Pre-booking now allows us to plan our fleet and guarantee availability for early customers."
    },
    {
      question: "What are the benefits of pre-booking now?",
      answer: "Pre-booking customers get guaranteed availability, locked-in current pricing (protected from future increases), priority booking status, and first access to our premium service when it launches."
    },
    {
      question: "When will I pay for my pre-booked transfer?",
      answer: "Payment is only required closer to your travel date in 2025. Pre-booking secures your spot with no upfront payment required - we'll contact you for payment details when your travel date approaches."
    },
    {
      question: "How do I pre-book the van hire service?",
      answer: "Simply click the WhatsApp button to send us a message with your travel dates (from August 2025 onwards), pickup details, and number of passengers. We'll confirm your pre-booking within minutes."
    },
    {
      question: "What happens if my flight is delayed?",
      answer: "No worries! We monitor flight arrivals and adjust pickup times accordingly. Just make sure to provide your flight number when pre-booking."
    },
    {
      question: "What areas do you service?",
      answer: "We provide transfers between Sayak Airport and all major destinations in Siargao including General Luna, Cloud 9, Pacifico, Santa Monica, and more."
    },
    {
      question: "Can I cancel or modify my pre-booking?",
      answer: "Yes, you can modify or cancel your pre-booking anytime before payment is required. Since there's no upfront payment, you have maximum flexibility to adjust your plans."
    },
    {
      question: "Do you provide child seats?",
      answer: "Unfortunately, we do not provide child seats. Please bring your own child seat if needed for your transfer."
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
            {/* Badge */}
            <motion.div 
              className="mb-6"
              variants={staggerItemVariants}
            >
              <Badge variant="brand" className="inline-flex items-center gap-2 text-sm px-4 py-2">
                <Calendar className="w-4 h-4" />
                Pre-Booking Available - Service Starts August 2025
              </Badge>
            </motion.div>

            {/* Timeline Element */}
            <motion.div 
              className="mb-8"
              variants={staggerItemVariants}
            >
              <div className="flex items-center justify-center max-w-md mx-auto">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-white font-medium">Pre-Booking Phase</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary to-white/20 mx-4"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                    <span>Launch August 2025</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight"
              variants={heroTitleVariants}
            >
              Private Pickup & Drop-Off Airport Transfer in Siargao
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto"
              variants={heroSubtitleVariants}
            >
              Secure your spot for our luxury van service launching August 2025. Pre-book now for guaranteed availability, locked-in rates, and priority service from Sayak Airport to all Siargao destinations.
            </motion.p>

            {/* Primary CTA */}
            <motion.div 
              variants={fadeInUpVariants}
              className="mb-6 sm:mb-8"
            >
              <PrimaryButton
                onClick={handleWhatsAppClick}
                size="lg"
                className="flex items-center justify-center gap-2 mx-auto mb-4 min-h-[48px] px-6 sm:px-8 text-base sm:text-lg font-semibold w-auto min-w-[280px] sm:min-w-[320px]"
                enableMagnetic={!isMobile}
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                Pre-Book via WhatsApp
              </PrimaryButton>
              
              {/* Compact Pricing Display */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 text-white/80 text-sm sm:text-base">
                <span className="font-medium">₱2,500 (2 pax)</span>
                <span className="text-white/40">|</span>
                <span className="font-medium">₱3,500 (3-8 pax)</span>
              </div>
            </motion.div>

            {/* Secondary Action */}
            <motion.div 
              variants={fadeInUpVariants}
              className="text-center mb-4 sm:mb-0"
            >
              <SecondaryButton
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
                size="md"
                enableMagnetic={!isMobile}
                className="text-white/60 border-white/20 hover:border-white/40 hover:text-white/80 transition-colors min-h-[44px] px-4 sm:px-6 text-sm sm:text-base"
              >
                Learn More
              </SecondaryButton>
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

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        {!shouldReduceMotion && (
          <ParticleField density={5} className="absolute inset-0 opacity-20" />
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Why Pre-Book Now?
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Secure your spot early and enjoy exclusive pre-booking benefits
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
          </ScrollReveal>

          <ScrollReveal 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            threshold={0.1}
          >
            <StaggeredCards className="contents" staggerDelay={0.2}>
              {[
                {
                  step: "1",
                  title: "WhatsApp Us",
                  description: "Send us your flight details and pickup requirements"
                },
                {
                  step: "2",
                  title: "Get Confirmation",
                  description: "Receive booking confirmation and driver information"
                },
                {
                  step: "3",
                  title: "Meet at Arrivals",
                  description: "Your driver will be waiting with a name sign"
                }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">{item.step}</span>
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
              className="flex items-center gap-2 mx-auto"
              enableMagnetic={!isMobile}
            >
              <MessageCircle className="w-5 h-5" />
              Pre-Book Your Transfer Now
            </PrimaryButton>
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
                    "No waiting for other passengers",
                    "Direct to your destination",
                    "Flexible pickup times",
                    "Privacy and comfort",
                    "Fixed transparent pricing",
                    "Personalized service"
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
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Transparent Pricing
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              All-inclusive rates with no hidden fees
            </p>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(45, 212, 191, 0.2)"
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-xl p-8 text-center"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Small Group</h3>
              <p className="text-gray-400 mb-4">Perfect for couples</p>
              <div className="text-5xl font-black text-primary mb-4">₱2,500</div>
              <p className="text-gray-300">For 2 passengers</p>
              <div className="mt-6 pt-6 border-t border-white/10">
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>Airport pickup & drop-off</li>
                  <li>Professional driver</li>
                  <li>Complimentary water</li>
                </ul>
              </div>
            </AnimatedCard>

            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(147, 51, 234, 0.2)"
              className="bg-gradient-to-br from-primary/10 to-purple-900/10 border border-primary/20 rounded-xl p-8 text-center relative"
            >
              <Badge className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white">
                Most Popular
              </Badge>
              <h3 className="text-2xl font-bold text-white mb-2 mt-2">Large Group</h3>
              <p className="text-gray-400 mb-4">Ideal for families & friends</p>
              <div className="text-5xl font-black text-primary mb-4">₱3,500</div>
              <p className="text-gray-300">For 3-8 passengers</p>
              <div className="mt-6 pt-6 border-t border-white/10">
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>Airport pickup & drop-off</li>
                  <li>Professional driver</li>
                  <li>Complimentary water</li>
                  <li>Luggage assistance</li>
                </ul>
              </div>
            </AnimatedCard>
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
                Ready to Pre-Book?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Pre-book now to secure your spot for our August 2025 launch
            </p>

            <PrimaryButton
              onClick={handleWhatsAppClick}
              size="lg"
              className="flex items-center gap-2 mx-auto mb-8"
              enableMagnetic={!isMobile}
            >
              <MessageCircle className="w-5 h-5" />
              Pre-Book via WhatsApp
            </PrimaryButton>

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
          content="Tap here to pre-book your transfer or ask questions via WhatsApp. We're quick to respond!"
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