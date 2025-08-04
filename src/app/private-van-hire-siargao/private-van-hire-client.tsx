"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Car, 
  Users, 
  MapPin, 
  MessageCircle, 
  Check, 
  ChevronDown, 
  Shield, 
  Clock, 
  Star,
  Phone,
  Calendar,
  Navigation
} from 'lucide-react'
import { ScrollReveal } from '@/components/animations/ScrollReveal'
import { AnimatedCard, StaggeredCards } from '@/components/animations/AnimatedCard'
import { PrimaryButton, SecondaryButton } from '@/components/animations/AnimatedButton'
import { FloatingElements, ParticleField, OrganicShape } from '@/components/animations/FloatingElements'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// WhatsApp configuration
const WHATSAPP_NUMBER = '+639993702550'

// Fixed price booking message template
const WHATSAPP_MESSAGE_FIXED = encodeURIComponent(
  'Hi! I want to book private van hire for the fixed price route:\n\n' +
  'Route: General Luna ↔ Siargao Airport\n' +
  'Price: ₱2,500 one-way\n' +
  'Date: \n' +
  'Time: \n' +
  'Number of passengers: \n' +
  'Pickup location (specific address): \n' +
  'Drop-off location: \n' +
  'Contact number: \n\n' +
  'Additional notes: '
)

// Custom quote message template
const WHATSAPP_MESSAGE_CUSTOM = encodeURIComponent(
  'Hi! I need a custom quote for private van hire:\n\n' +
  'Route: FROM [location] TO [location]\n' +
  'Date: \n' +
  'Time: \n' +
  'Number of passengers: \n' +
  'Special requirements: \n' +
  'Contact number: \n\n' +
  'Please provide a quote for this custom route. Thank you!'
)

export default function PrivateVanHireClient() {
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState('fixed')
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

  const handleWhatsAppClick = (serviceType: 'fixed' | 'custom' = 'fixed') => {
    const message = serviceType === 'fixed' ? WHATSAPP_MESSAGE_FIXED : WHATSAPP_MESSAGE_CUSTOM
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
  }

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Up to 10 Passengers",
      description: "Comfortable seating for 8-10 people depending on luggage size"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Professional Drivers",
      description: "Licensed local drivers with excellent knowledge of Siargao roads"
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: "Clean Air-Conditioned Vans",
      description: "Well-maintained vehicles with AC for comfortable travel"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Free Waiting Time",
      description: "Up to 30 minutes free waiting time for pickups and arrivals"
    },
    {
      icon: <Navigation className="w-6 h-6" />,
      title: "Door-to-Door Service",
      description: "Pickup and drop-off at your exact location, no walking required"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "24/7 Support",
      description: "WhatsApp support available around the clock for bookings and inquiries"
    }
  ]

  const popularRoutes = [
    { from: "General Luna", to: "Siargao Airport", price: "₱2,500", type: "fixed" },
    { from: "Siargao Airport", to: "General Luna", price: "₱2,500", type: "fixed" },
    { from: "Cloud 9", to: "Airport", price: "Custom Quote", type: "custom" },
    { from: "Pacifico", to: "Airport", price: "Custom Quote", type: "custom" },
    { from: "Dapa", to: "Airport", price: "Custom Quote", type: "custom" },
    { from: "General Luna", to: "Cloud 9", price: "Custom Quote", type: "custom" },
    { from: "Hotel", to: "Island Hopping", price: "Custom Quote", type: "custom" },
    { from: "Any Location", to: "Custom Destination", price: "Custom Quote", type: "custom" }
  ]

  const faqs = [
    {
      question: "How much does private van hire cost in Siargao?",
      answer: "We offer fixed pricing for General Luna ↔ Airport transfers at ₱2,500 one-way for up to 10 passengers. All other routes require custom quotes based on distance and destination. Contact us via WhatsApp for instant quotes."
    },
    {
      question: "How many people can fit in the private van?",
      answer: "Our vans can accommodate 8-10 passengers depending on the amount of luggage. We prioritize comfort and safety, so the exact number depends on your group's luggage requirements."
    },
    {
      question: "Do you provide transfers to Cloud 9, Pacifico, and other destinations?",
      answer: (
        <>
          Yes! We provide transfers to all Siargao destinations including{' '}
          <Link href="/browse?location=Cloud+9" className="text-primary hover:text-primary/80 underline">
            Cloud 9
          </Link>
          ,{' '}
          <Link href="/browse?location=Pacifico" className="text-primary hover:text-primary/80 underline">
            Pacifico
          </Link>
          , Dapa, and anywhere else on the island. These routes require custom quotes - just message us with your details.
        </>
      )
    },
    {
      question: "How do I book private van hire?",
      answer: "For General Luna-Airport transfers (₱2,500), click our 'Book Fixed Price' button for instant booking. For other routes, click 'Get Custom Quote' and we'll respond within 30 minutes with personalized pricing."
    },
    {
      question: "What's included in the service?",
      answer: "All bookings include: professional local driver, door-to-door pickup and drop-off, luggage assistance, air-conditioned van, free waiting time (up to 30 minutes), and 24/7 WhatsApp support."
    },
    {
      question: "Can I cancel my booking?",
      answer: "Yes, you can cancel up to 24 hours before your scheduled pickup for a full refund. For cancellations within 24 hours, a 50% cancellation fee applies."
    },
    {
      question: "Do you operate 24/7?",
      answer: "Yes, we provide van hire services 24/7 including early morning airport pickups and late night arrivals. Our WhatsApp support is also available around the clock."
    },
    {
      question: "What if my flight is delayed?",
      answer: "No problem! We monitor flight arrivals and adjust pickup times accordingly. Just provide your flight number when booking and we'll track it automatically."
    },
    {
      question: "Do you provide child seats?",
      answer: "For safety and hygiene reasons, we don't provide child seats. Please bring your own if needed - our drivers can help install them properly in the van."
    },
    {
      question: "Can I book for same-day travel?",
      answer: "Yes! We accept same-day bookings subject to availability. For fixed price routes, instant booking is usually available. For custom routes, we'll confirm availability within 30 minutes."
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
              alt="Private van hire service in Siargao Island - General Luna to Airport and custom routes"
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
            <OrganicShape 
              className="w-96 h-96 -top-48 -left-48 z-5 opacity-10" 
              color="primary" 
            />
          </>
        )}

        {/* Hero Content */}
        <div className="container mx-auto relative z-20 min-h-screen flex flex-col justify-center items-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center max-w-5xl mx-auto"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Service Badge */}
            <motion.div 
              className="mb-6 md:mb-8"
              variants={staggerItemVariants}
            >
              <Badge className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="text-white font-medium">Siargao Island Van Service</span>
              </Badge>
            </motion.div>

            {/* Title */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-6 tracking-tight"
              variants={heroTitleVariants}
            >
              Private Van Hire Siargao
            </motion.h1>

            {/* Subtitle with dual pricing */}
            <motion.div 
              className="mb-8 md:mb-12"
              variants={heroSubtitleVariants}
            >
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-4">
                General Luna ↔ Airport: <span className="text-primary font-bold">₱2,500</span> Fixed Price
              </p>
              <p className="text-base sm:text-lg text-white/70">
                Other Routes: Custom Quote Available • Up to 10 Passengers
              </p>
            </motion.div>

            {/* Service Toggle Tabs */}
            <motion.div 
              variants={fadeInUpVariants}
              className="mb-8"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md mx-auto">
                <TabsList className="grid w-full grid-cols-2 bg-black/40 backdrop-blur-sm border border-white/10">
                  <TabsTrigger 
                    value="fixed" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-black text-white/70"
                  >
                    Fixed Price
                  </TabsTrigger>
                  <TabsTrigger 
                    value="custom"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/70"
                  >
                    Custom Routes
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="fixed" className="mt-6">
                  <div className="text-center space-y-4">
                    <div className="text-3xl sm:text-4xl font-black text-primary">₱2,500</div>
                    <p className="text-white/80">General Luna ↔ Airport</p>
                    <PrimaryButton
                      onClick={() => handleWhatsAppClick('fixed')}
                      size="lg"
                      className="flex items-center justify-center gap-2 min-h-[48px] px-8 text-lg font-semibold"
                      enableMagnetic={!isMobile}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Book Fixed Price
                    </PrimaryButton>
                  </div>
                </TabsContent>
                
                <TabsContent value="custom" className="mt-6">
                  <div className="text-center space-y-4">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400">Custom Quote</div>
                    <p className="text-white/80">Cloud 9, Pacifico, Dapa & More</p>
                    <SecondaryButton
                      onClick={() => handleWhatsAppClick('custom')}
                      size="lg"
                      className="flex items-center justify-center gap-2 min-h-[48px] px-8 text-lg font-semibold border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-purple-200"
                      enableMagnetic={!isMobile}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Get Custom Quote
                    </SecondaryButton>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Trust indicators */}
            <motion.div 
              variants={fadeInUpVariants}
              className="flex flex-wrap justify-center items-center gap-6 text-sm text-white/60"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Up to 10 Passengers</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Professional Drivers</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>24/7 Available</span>
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
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        {!shouldReduceMotion && (
          <ParticleField density={5} className="absolute inset-0 opacity-20" />
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Choose Your Service
              </span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg">
              Fixed price for popular routes or custom quotes for any destination in Siargao
            </p>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Fixed Price Service Card */}
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(45, 212, 191, 0.2)"
              className="bg-gradient-to-br from-primary/10 to-green-900/10 border border-primary/20 rounded-xl p-8 relative"
            >
              <Badge className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white">
                Most Popular
              </Badge>
              <div className="text-center mt-8">
                <h3 className="text-2xl font-bold text-white mb-2">Fixed Price Route</h3>
                <p className="text-gray-400 mb-6">General Luna ↔ Airport</p>
                
                <div className="mb-8">
                  <div className="text-4xl font-black text-primary mb-2">₱2,500</div>
                  <p className="text-gray-300">One-way • Up to 10 passengers</p>
                </div>

                <div className="space-y-3 mb-8 text-left">
                  {[
                    "Fixed price, no surprises",
                    "Instant WhatsApp booking",
                    "Both directions available",
                    "Professional driver included",
                    "Free waiting time (30 min)",
                    "Door-to-door service"
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <PrimaryButton
                  onClick={() => handleWhatsAppClick('fixed')}
                  className="w-full"
                  enableMagnetic={!isMobile}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Book Fixed Price
                </PrimaryButton>
              </div>
            </AnimatedCard>

            {/* Custom Quote Service Card */}
            <AnimatedCard
              enableMagnetic={!isMobile}
              enableTilt={!isMobile}
              enableGlow={true}
              glowColor="rgba(147, 51, 234, 0.2)"
              className="bg-gradient-to-br from-purple-900/10 to-gray-900/50 border border-purple-500/20 rounded-xl p-8 relative"
            >
              <Badge className="absolute -top-5 left-1/2 -translate-x-1/2 bg-purple-600 text-white">
                Custom Routes
              </Badge>
              <div className="text-center mt-8">
                <h3 className="text-2xl font-bold text-white mb-2">Custom Quote Routes</h3>
                <p className="text-gray-400 mb-6">Any destination in Siargao</p>
                
                <div className="mb-8">
                  <div className="text-3xl font-bold text-purple-400 mb-2">Custom Quote</div>
                  <p className="text-gray-300">Personalized pricing</p>
                </div>

                <div className="space-y-3 mb-8 text-left">
                  {[
                    "Cloud 9, Pacifico, Dapa routes",
                    "Island hopping tours",
                    "Multi-destination trips",
                    "Flexible scheduling",
                    "Quote within 30 minutes",
                    "Same professional service"
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <SecondaryButton
                  onClick={() => handleWhatsAppClick('custom')}
                  className="w-full border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-purple-200"
                  enableMagnetic={!isMobile}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Get Custom Quote
                </SecondaryButton>
              </div>
            </AnimatedCard>
          </ScrollReveal>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        {!shouldReduceMotion && (
          <ParticleField density={5} className="absolute inset-0 opacity-20" />
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Popular Routes
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Fixed pricing for General Luna-Airport routes, custom quotes for all other destinations
            </p>
          </ScrollReveal>

          <ScrollReveal className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularRoutes.map((route, index) => (
                <AnimatedCard
                  key={index}
                  enableMagnetic={!isMobile}
                  enableTilt={!isMobile}
                  enableGlow={true}
                  glowColor={route.type === 'fixed' ? "rgba(45, 212, 191, 0.1)" : "rgba(147, 51, 234, 0.1)"}
                  className={`p-4 rounded-lg border ${
                    route.type === 'fixed' 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-purple-900/5 border-purple-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <span>{route.from}</span>
                        <span className="text-gray-400">→</span>
                        <span>{route.to}</span>
                      </div>
                    </div>
                    <div className={`font-bold ${
                      route.type === 'fixed' ? 'text-primary' : 'text-purple-400'
                    }`}>
                      {route.price}
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal className="text-center mt-12">
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              Don't see your route? Contact us for a personalized quote to any destination in Siargao Island.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        {!shouldReduceMotion && (
          <ParticleField density={5} className="absolute inset-0 opacity-20" />
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Why Choose Our Van Service?
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Professional, reliable, and comfortable transportation across Siargao Island
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

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Ready to Book Your Ride?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Choose fixed price for General Luna-Airport or get a custom quote for any other route in Siargao
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              <PrimaryButton
                onClick={() => handleWhatsAppClick('fixed')}
                size="lg"
                className="flex items-center gap-2 justify-center"
                enableMagnetic={!isMobile}
              >
                <MessageCircle className="w-4 h-4" />
                Book ₱2,500 Route
              </PrimaryButton>
              
              <SecondaryButton
                onClick={() => handleWhatsAppClick('custom')}
                size="lg"
                className="flex items-center gap-2 justify-center border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-purple-200"
                enableMagnetic={!isMobile}
              >
                <MessageCircle className="w-4 h-4" />
                Get Custom Quote
              </SecondaryButton>
            </div>

            <div className="flex items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>24/7 Available</span>
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
          id="whatsapp-van-hire-tooltip"
          title="🚐 Book Van Hire!"
          content="Tap here to book ₱2,500 fixed price (General Luna-Airport) or get custom quotes for other routes!"
          autoShowDelay={3000}
          autoHideDuration={6000}
          icon={<MessageCircle className="w-4 h-4 text-primary" />}
        >
          <PrimaryButton
            onClick={() => handleWhatsAppClick('fixed')}
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