"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Car, Clock, MapPin, MessageCircle, Shield, Users, Check, ChevronDown } from "lucide-react"
import { ScrollReveal } from "@/components/animations/ScrollReveal"
import { AnimatedCard, StaggeredCards } from "@/components/animations/AnimatedCard"
import { PrimaryButton, SecondaryButton } from "@/components/animations/AnimatedButton"
import { FloatingElements, ParticleField, OrganicShape } from "@/components/animations/FloatingElements"
import { useReducedMotion } from "@/hooks/useScrollAnimation"
import { useSocialProofNotifications } from "@/hooks/useSocialProofNotifications"
import { SocialProofContainer } from "@/components/SocialProofNotification"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_NUMBER } from "@/lib/whatsapp"
import {
  fadeInUpVariants,
  heroSubtitleVariants,
  heroTitleVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/animations"

const MESSAGE_ALL_DAY =
  "Hi Siargao Rides! I'd like to book all-day private van hire (₱8,000).\n\n" +
  "Date: \n" +
  "Pickup time: \n" +
  "Pickup location (exact): \n" +
  "Guests: \n" +
  "Preferred itinerary / stops: \n" +
  "Luggage / surfboards: \n\n" +
  "Notes: "

const MESSAGE_CUSTOM =
  "Hi Siargao Rides! I'd like a custom quote for private van hire.\n\n" +
  "Date: \n" +
  "Pickup time: \n" +
  "Pickup location (exact): \n" +
  "Drop-off (if different): \n" +
  "Guests: \n" +
  "Itinerary / stops: \n" +
  "Special requests: \n\n" +
  "Thank you!"

export default function PrivateVanHireClient() {
  const [isMobile, setIsMobile] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const { notifications, dismissNotification } = useSocialProofNotifications(true)

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768)
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const handleWhatsAppClick = (type: "allDay" | "custom") => {
    const message = type === "allDay" ? MESSAGE_ALL_DAY : MESSAGE_CUSTOM
    const url = buildWhatsAppUrl({ phoneNumber: DEFAULT_WHATSAPP_NUMBER, message })
    window.open(url, "_blank")
  }

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Private-only",
      description: "No shared rides. Just you and your group or couple.",
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: "Comfortable vans",
      description: "Air-conditioned and clean vehicles with a professional driver.",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Door-to-door",
      description: "Pickup and drop-off at your exact location in Siargao.",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Flexible itinerary",
      description: "Multi-stop land tours and custom routes coordinated via WhatsApp.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Trusted local team",
      description: "We coordinate with vetted drivers and our partnered provider.",
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "WhatsApp-first booking",
      description: "Fast quoting and confirmation with minimal back-and-forth.",
    },
  ]

  const itineraryExamples = [
    {
      title: "North Land Tour (example)",
      points: ["Magpupungko", "Maasin River", "Pacifico", "Optional coffee/food stops"],
    },
    {
      title: "General Luna Day (example)",
      points: ["Cafés & restaurants", "Cloud 9 area", "Photo stops", "Sunset spots"],
    },
    {
      title: "Custom Day (example)",
      points: ["Tell us your must-visits", "We suggest timing", "Private-only routing", "Driver coordination"],
    },
  ]

  const faqs = [
    {
      question: "How much is all-day private van hire in Siargao?",
      answer: "Our temporary fixed price is ₱8,000 for all-day private van hire. Message us on WhatsApp to confirm availability and details.",
    },
    {
      question: "Is this service private only?",
      answer: "Yes. We only offer private van hire for your group or couple. No shared rides.",
    },
    {
      question: "How do I book?",
      answer: "Booking is WhatsApp-first. Send your date, pickup location, number of guests, and itinerary/stops. We’ll confirm and coordinate the driver.",
    },
    {
      question: "Do you accept cash payments?",
      answer: "Yes. We accept cash on pickup / when the driver picks you up.",
    },
    {
      question: "What is your reconfirmation policy?",
      answer: "If no reservation fee is collected, we require reconfirmation a few hours before pickup. If you do not reconfirm, we automatically cancel the booking.",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen w-full bg-black">
      {/* Hero */}
      <section className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <Image
              src="/images/hero-bg-1.png"
              alt="All-day private van hire in Siargao for land tours"
              fill
              className="object-cover opacity-40"
              priority
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10" />
        </div>

        {!shouldReduceMotion && (
          <>
            <FloatingElements count={4} className="z-5 opacity-30" />
            <ParticleField density={8} className="z-5" />
            <OrganicShape className="w-96 h-96 -top-48 -left-48 z-5 opacity-10" color="primary" />
          </>
        )}

        <div className="container mx-auto relative z-20 min-h-screen flex flex-col justify-center items-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-5xl mx-auto"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="mb-6 md:mb-8" variants={staggerItemVariants}>
              <Badge className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm">
                <Car className="w-4 h-4" />
                <span className="text-white font-medium">Private Land Tours & All-day Hire</span>
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-6 tracking-tight"
              variants={heroTitleVariants}
            >
              All-day Private Van Hire Siargao
            </motion.h1>

            <motion.div className="mb-8 md:mb-12" variants={heroSubtitleVariants}>
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-3">
                <span className="text-primary font-black">₱8,000</span> all day (temporary rate)
              </p>
              <p className="text-base sm:text-lg text-white/70">
                Private-only • Flexible itinerary • Door-to-door • WhatsApp-first
              </p>
            </motion.div>

            <motion.div variants={fadeInUpVariants} className="flex flex-col sm:flex-row gap-3 justify-center">
              <PrimaryButton
                onClick={() => handleWhatsAppClick("allDay")}
                size="xl"
                className="flex items-center justify-center gap-2 min-h-[52px] px-8 text-lg font-semibold"
                enableMagnetic={!isMobile}
              >
                <MessageCircle className="w-5 h-5" />
                Book ₱8,000 All-day
              </PrimaryButton>
              <SecondaryButton
                onClick={() => handleWhatsAppClick("custom")}
                size="xl"
                className="flex items-center justify-center gap-2 min-h-[52px] px-8 text-lg font-semibold"
                enableMagnetic={!isMobile}
              >
                <MessageCircle className="w-5 h-5" />
                Get Custom Quote
              </SecondaryButton>
            </motion.div>

            <motion.div variants={fadeInUpVariants} className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Groups & couples</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Private-only</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Fast WhatsApp replies</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 text-white/40" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        {!shouldReduceMotion && <ParticleField density={5} className="absolute inset-0 opacity-20" />}
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Built for private, premium travel
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              A simple WhatsApp flow with a private-only experience from pickup to drop-off.
            </p>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" threshold={0.1}>
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

      {/* Itinerary examples */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        {!shouldReduceMotion && <ParticleField density={5} className="absolute inset-0 opacity-20" />}
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Land tour examples
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Tell us what you want to do and we&apos;ll coordinate the best private plan for your day.
            </p>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {itineraryExamples.map((itinerary) => (
              <AnimatedCard
                key={itinerary.title}
                enableMagnetic={!isMobile}
                enableTilt={!isMobile}
                enableGlow={true}
                glowColor="rgba(147, 51, 234, 0.12)"
                className="bg-gray-900/40 border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-4">{itinerary.title}</h3>
                <div className="space-y-2">
                  {itinerary.points.map((p) => (
                    <div key={p} className="flex items-start gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <PrimaryButton onClick={() => handleWhatsAppClick("allDay")} className="w-full" enableMagnetic={!isMobile}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Get a Quote
                  </PrimaryButton>
                </div>
              </AnimatedCard>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                FAQs
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
                  <AccordionContent className="text-gray-400 pb-4">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Ready for a private day out?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Message us on WhatsApp and we&apos;ll coordinate your private van, driver, and itinerary.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
              <PrimaryButton onClick={() => handleWhatsAppClick("allDay")} size="lg" className="flex items-center gap-2 justify-center" enableMagnetic={!isMobile}>
                <MessageCircle className="w-4 h-4" />
                Book ₱8,000 All-day
              </PrimaryButton>
              <SecondaryButton onClick={() => handleWhatsAppClick("custom")} size="lg" className="flex items-center gap-2 justify-center" enableMagnetic={!isMobile}>
                <MessageCircle className="w-4 h-4" />
                Custom Quote
              </SecondaryButton>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SocialProofContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  )
}

