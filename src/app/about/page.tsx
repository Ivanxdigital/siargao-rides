"use client"

import { useState, useEffect } from "react"
import { Metadata } from "next"

// Export metadata for the About page
export const metadata: Metadata = {
  title: "About Siargao Rides - Your Trusted Vehicle Rental Platform",
  description: "Learn about Siargao Rides, the leading motorbike and car rental platform in Siargao Island, Philippines. Our story, mission, and commitment to connecting travelers with quality local rental shops.",
  keywords: [
    "about Siargao Rides",
    "vehicle rental platform Philippines",
    "Siargao motorbike rental company",
    "local business directory Siargao",
    "travel platform Philippines",
    "motorcycle rental service",
    "Siargao tourism",
    "local rental shops"
  ],
  openGraph: {
    title: "About Siargao Rides - Your Trusted Vehicle Rental Platform",
    description: "Learn about Siargao Rides, the leading motorbike and car rental platform in Siargao Island, Philippines.",
    type: "website",
    images: [
      {
        url: "/images/siargao-rides-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "About Siargao Rides - Vehicle Rental Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Siargao Rides - Your Trusted Vehicle Rental Platform",
    description: "Learn about Siargao Rides, the leading motorbike and car rental platform in Siargao Island, Philippines.",
    images: ["/images/siargao-rides-og-image.jpg"],
  },
  alternates: {
    canonical: "https://siargaorides.ph/about",
  },
}
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, MapPin, Calendar, Bike, Star, Heart, CheckCircle, XCircle } from "lucide-react"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
}

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
}

export default function AboutPage() {
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Set initial value
    checkIfMobile()

    // Add event listener
    window.addEventListener('resize', checkIfMobile)

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] bg-gradient-to-b from-black to-gray-900 overflow-hidden border-b border-white/10">
        {/* Background with overlay gradient */}
        <motion.div
          className="absolute inset-0 z-0 opacity-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/michael-louie-8bqoFf_Q1xw-unsplash.jpg')",
              backgroundSize: "cover"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-gray-900"></div>
        </motion.div>

        <div className="container mx-auto px-5 sm:px-6 py-16 sm:py-20 md:py-32 relative z-10 flex flex-col items-center justify-center h-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-center"
          >
            <Badge className="mb-3 sm:mb-4 text-xs sm:text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
              Our Story
            </Badge>
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 text-center max-w-4xl px-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Simplifying <span className="text-primary">Mobility</span> in Paradise
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-center mb-6 sm:mb-8 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            How a frustrating rental experience inspired us to create a better way to explore Siargao Island.
          </motion.p>
        </div>
      </section>

      {/* Founder's Story Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-5 sm:px-6">
          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideUp}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-white">The Beginning</h2>

            {/* Visual Timeline */}
            <div className="relative mb-16">
              {/* Timeline line - hidden on mobile, centered on desktop */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/30"></div>

              {/* Mobile timeline line - visible only on mobile, left-aligned */}
              <div className="md:hidden absolute left-4 top-0 bottom-0 w-0.5 bg-primary/30"></div>

              {/* Timeline Item 1 */}
              <motion.div
                className="relative mb-12 md:mb-24"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {/* Desktop layout */}
                <div className="hidden md:flex md:flex-row items-start">
                  <div className="w-1/2 pr-12 text-right">
                    <h3 className="text-xl font-bold text-white mb-3">The Search</h3>
                    <p className="text-white/80 leading-relaxed">
                      I have always wondered if there was a more organised way of finding a motorbike to rent here in Siargao. However, I found myself going to different Facebook pages, with some not being so reliable. It's quite a lot of effort to do my own research and go through all the motorbike socials, where some aren't active, and some barely have any comments.
                    </p>
                  </div>

                  <div className="w-1/2 pl-12 relative">
                    <div className="absolute left-0 top-3 w-6 h-6 rounded-full bg-primary -ml-3 z-10 shadow-lg shadow-primary/20"></div>
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-all duration-300">
                      <div className="text-white/90 italic">
                        "I've always thought I wish there could just be one place where I could compare all the stores, book directly through the site, and see exactly what I'm getting."
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="relative pl-12 mb-4">
                    <div className="absolute left-4 top-3 w-5 h-5 rounded-full bg-primary z-10 shadow-lg shadow-primary/20"></div>
                    <h3 className="text-xl font-bold text-white mb-2">The Search</h3>
                  </div>

                  <div className="pl-12 mb-4">
                    <p className="text-white/80 leading-relaxed text-sm">
                      I have always wondered if there was a more organised way of finding a motorbike to rent here in Siargao. However, I found myself going to different Facebook pages, with some not being so reliable.
                    </p>
                  </div>

                  <div className="pl-12">
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:border-primary/30 transition-all duration-300">
                      <div className="text-white/90 italic text-sm">
                        "I've always thought I wish there could just be one place where I could compare all the stores, book directly through the site, and see exactly what I'm getting."
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Timeline Item 2 */}
              <motion.div
                className="relative mb-12 md:mb-24"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Desktop layout */}
                <div className="hidden md:flex md:flex-row items-start">
                  <div className="w-1/2 pr-12 relative">
                    <div className="absolute right-0 top-3 w-6 h-6 rounded-full bg-primary -mr-3 z-10 shadow-lg shadow-primary/20"></div>
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-all duration-300">
                      <div className="text-white/90 italic">
                        "The side mirrors you could barely see behind you because it was so magnified, the indicator didn't work, and I didn't know till I had a bunch of people beeping me because I was turning thinking I was indicating when I wasn't."
                      </div>
                    </div>
                  </div>

                  <div className="w-1/2 pl-12">
                    <h3 className="text-xl font-bold text-white mb-3">The Disappointment</h3>
                    <p className="text-white/80 leading-relaxed">
                      I've had times where I was at a hotel in Siargao, I won't mention any names. But I asked them if they knew any motorbike rentals, they said yes. They have one for 500 PHP per day, so I thought "Oooo 500 PHP per day, I might get a decent bike." I said okay I'll get it, next thing you know I got a really basic Honda Beat and it was definitely beat... beaten up.
                    </p>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="relative pl-12 mb-4">
                    <div className="absolute left-4 top-3 w-5 h-5 rounded-full bg-primary z-10 shadow-lg shadow-primary/20"></div>
                    <h3 className="text-xl font-bold text-white mb-2">The Disappointment</h3>
                  </div>

                  <div className="pl-12 mb-4">
                    <p className="text-white/80 leading-relaxed text-sm">
                      I've had times where I was at a hotel in Siargao. They said they have a motorbike for 500 PHP per day, so I thought I might get a decent bike. Next thing you know I got a really basic Honda Beat and it was definitely beat... beaten up.
                    </p>
                  </div>

                  <div className="pl-12">
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:border-primary/30 transition-all duration-300">
                      <div className="text-white/90 italic text-sm">
                        "The side mirrors you could barely see behind you, the indicator didn't work, and I didn't know till I had people beeping me because I was turning thinking I was indicating when I wasn't."
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Timeline Item 3 */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {/* Desktop layout */}
                <div className="hidden md:flex md:flex-row items-start">
                  <div className="w-1/2 pr-12 text-right">
                    <h3 className="text-xl font-bold text-white mb-3">The Solution</h3>
                    <p className="text-white/80 leading-relaxed">
                      I just had enough, so I thought why not just build a site where it could be a platform to make peoples lives easier to book, know exactly what they're getting, compare prices, and more.
                    </p>
                  </div>

                  <div className="w-1/2 pl-12 relative">
                    <div className="absolute left-0 top-3 w-6 h-6 rounded-full bg-primary -ml-3 z-10 shadow-lg shadow-primary/20"></div>
                    <div className="bg-primary/10 backdrop-blur-sm border border-primary/30 rounded-lg p-6 hover:border-primary/50 transition-all duration-300">
                      <div className="text-white font-medium">
                        And that's how Siargao Rides was born — a platform dedicated to making vehicle rentals transparent, reliable, and hassle-free for everyone visiting our beautiful island.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="relative pl-12 mb-4">
                    <div className="absolute left-4 top-3 w-5 h-5 rounded-full bg-primary z-10 shadow-lg shadow-primary/20"></div>
                    <h3 className="text-xl font-bold text-white mb-2">The Solution</h3>
                  </div>

                  <div className="pl-12 mb-4">
                    <p className="text-white/80 leading-relaxed text-sm">
                      I just had enough, so I thought why not just build a site where it could be a platform to make peoples lives easier to book, know exactly what they're getting, compare prices, and more.
                    </p>
                  </div>

                  <div className="pl-12">
                    <div className="bg-primary/10 backdrop-blur-sm border border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all duration-300">
                      <div className="text-white font-medium text-sm">
                        And that's how Siargao Rides was born — a platform dedicated to making vehicle rentals transparent, reliable, and hassle-free for everyone visiting our beautiful island.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-black relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center"></div>
        </div>

        <div className="container mx-auto px-5 sm:px-6 relative z-10">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-16 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 sm:p-8 hover:border-primary/30 transition-all duration-300"
              variants={staggerItem}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6">
                <Bike size={28} className="text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Our Vision</h3>
              <p className="text-white/80 leading-relaxed text-sm sm:text-base">
                To create the most trusted and convenient vehicle rental platform in Siargao, connecting travelers with quality local rental shops and enabling seamless exploration of the island.
              </p>
            </motion.div>

            <motion.div
              className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 sm:p-8 hover:border-primary/30 transition-all duration-300"
              variants={staggerItem}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6">
                <Heart size={28} className="text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Our Mission</h3>
              <p className="text-white/80 leading-relaxed text-sm sm:text-base">
                To empower travelers with transparent, reliable vehicle rental options while supporting local businesses and promoting responsible tourism in Siargao Island.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center"></div>
        </div>

        <div className="container mx-auto px-5 sm:px-6 relative z-10">
          <motion.div
            className="text-center mb-10 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-3 sm:mb-4 text-xs sm:text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm inline-block">
              Our Services
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">What We Offer</h2>
            <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base">
              Siargao Rides is designed to solve common problems faced by travelers looking to rent vehicles on the island.
            </p>
          </motion.div>

          {/* Before & After Comparison */}
          <motion.div
            className="max-w-5xl mx-auto mb-12 sm:mb-16 md:mb-20 bg-gray-900/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-5 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/10">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
                    <XCircle size={18} className="text-red-500" />
                  </div>
                  Before Siargao Rides
                </h3>
                <ul className="space-y-2 sm:space-y-3 text-white/70 text-sm sm:text-base">
                  <li className="flex items-start">
                    <XCircle size={16} className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                    <span>Scattered information across multiple Facebook pages</span>
                  </li>
                  <li className="flex items-start">
                    <XCircle size={16} className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                    <span>Unreliable recommendations from hotels</span>
                  </li>
                  <li className="flex items-start">
                    <XCircle size={16} className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                    <span>Misleading prices for poor quality vehicles</span>
                  </li>
                  <li className="flex items-start">
                    <XCircle size={16} className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                    <span>No way to verify vehicle condition before renting</span>
                  </li>
                  <li className="flex items-start">
                    <XCircle size={16} className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                    <span>Time-consuming research process</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 sm:p-6 md:p-8">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <CheckCircle size={18} className="text-primary" />
                  </div>
                  With Siargao Rides
                </h3>
                <ul className="space-y-2 sm:space-y-3 text-white/70 text-sm sm:text-base">
                  <li className="flex items-start">
                    <CheckCircle size={16} className="text-primary mt-1 mr-2 flex-shrink-0" />
                    <span>All rental options in one convenient platform</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={16} className="text-primary mt-1 mr-2 flex-shrink-0" />
                    <span>Verified shops with real customer reviews</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={16} className="text-primary mt-1 mr-2 flex-shrink-0" />
                    <span>Transparent pricing with no hidden fees</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={16} className="text-primary mt-1 mr-2 flex-shrink-0" />
                    <span>Detailed vehicle information with photos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle size={16} className="text-primary mt-1 mr-2 flex-shrink-0" />
                    <span>Quick and easy online booking system</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              className="bg-gray-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-5 sm:p-6 hover:border-primary/30 transition-all duration-300 group"
              variants={staggerItem}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/30 transition-colors duration-300">
                <Star size={20} className="text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">Quality Assurance</h3>
              <p className="text-white/70 text-sm sm:text-base">
                We verify all rental shops and vehicles to ensure you get exactly what you see on our platform.
              </p>
            </motion.div>

            <motion.div
              className="bg-gray-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group"
              variants={staggerItem}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors duration-300">
                <Calendar size={20} className="text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Easy Booking</h3>
              <p className="text-white/70">
                Book your preferred vehicle in minutes with our streamlined reservation system.
              </p>
            </motion.div>

            <motion.div
              className="bg-gray-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group"
              variants={staggerItem}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors duration-300">
                <MapPin size={20} className="text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Local Connections</h3>
              <p className="text-white/70">
                Support local businesses while getting insider knowledge about the best places to explore.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 z-0 opacity-5">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center"></div>
        </div>

        <div className="container mx-auto px-5 sm:px-6 relative z-10">
          <motion.div
            className="text-center mb-10 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">Our Values</h2>
            <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base">
              The principles that guide everything we do at Siargao Rides.
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto space-y-5 sm:space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              className="flex items-start gap-4"
              variants={staggerItem}
            >
              <div className="mt-1 flex-shrink-0">
                <CheckCircle size={20} className="text-primary sm:hidden" />
                <CheckCircle size={24} className="text-primary hidden sm:block" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-white">Transparency</h3>
                <p className="text-white/70 text-sm sm:text-base">
                  We believe in complete honesty about the vehicles we list. What you see is what you get – no surprises.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start gap-4"
              variants={staggerItem}
            >
              <div className="mt-1 flex-shrink-0">
                <CheckCircle size={20} className="text-primary sm:hidden" />
                <CheckCircle size={24} className="text-primary hidden sm:block" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-white">Community</h3>
                <p className="text-white/70 text-sm sm:text-base">
                  We support local businesses and help them thrive by connecting them with travelers from around the world.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start gap-4"
              variants={staggerItem}
            >
              <div className="mt-1 flex-shrink-0">
                <CheckCircle size={20} className="text-primary sm:hidden" />
                <CheckCircle size={24} className="text-primary hidden sm:block" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-white">Reliability</h3>
                <p className="text-white/70 text-sm sm:text-base">
                  We ensure that every booking is honored and that customers receive the service they expect.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start gap-4"
              variants={staggerItem}
            >
              <div className="mt-1 flex-shrink-0">
                <CheckCircle size={20} className="text-primary sm:hidden" />
                <CheckCircle size={24} className="text-primary hidden sm:block" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-white">Sustainability</h3>
                <p className="text-white/70 text-sm sm:text-base">
                  We promote responsible tourism and encourage practices that help preserve Siargao's natural beauty.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat opacity-20"
            style={{
              backgroundImage: "url('/images/alejandro-luengo-clllGLYtLRA-unsplash.jpg')",
              backgroundSize: "cover"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/80"></div>
        </div>

        <div className="container mx-auto px-5 sm:px-6 relative z-10">
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 sm:p-8 md:p-12 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div>
                  <Badge className="mb-3 sm:mb-4 text-xs sm:text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm inline-block">
                    Start Your Journey
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">Ready to Explore Siargao?</h2>
                  <p className="text-white/80 text-base sm:text-lg mb-5 sm:mb-6">
                    Find the perfect ride for your adventure and experience the island like a local.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-black font-medium">
                      <Link href="/browse">
                        Browse Vehicles <ChevronRight size={16} className="ml-1" />
                      </Link>
                    </Button>

                    <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
                      <Link href="/contact">
                        Contact Us
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="hidden md:block">
                  <motion.div
                    className="relative h-64 w-full rounded-lg overflow-hidden border border-white/10"
                    whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                  >
                    <Image
                      src="/images/pexels-roamingmary-15931909.jpg"
                      alt="Exploring Siargao on a motorbike"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white font-medium text-sm">Experience the freedom of exploring Siargao on your own terms</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Add CSS keyframes for animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-10px) translateX(10px);
          }
          50% {
            transform: translateY(8px) translateX(-8px);
          }
          75% {
            transform: translateY(-4px) translateX(4px);
          }
        }

        /* Add mobile-specific keyframes */
        @media (max-width: 768px) {
          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0);
            }
            50% {
              transform: translateY(5px) translateX(-5px);
            }
          }
        }
      `}</style>
    </div>
  )
}
