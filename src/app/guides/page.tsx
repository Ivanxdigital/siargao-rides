"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Clock, ArrowRight, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from '@/components/animations/ScrollReveal'
import { AnimatedCard, StaggeredCards } from '@/components/animations/AnimatedCard'

// Guide data
const guides = [
  {
    slug: "how-to-find-motorbike-rental-siargao",
    title: "How to Find a Motorbike Rental in Siargao",
    category: "Transportation",
    excerpt: "Complete guide to finding reliable motorbike rentals in Siargao Island. Learn where to look, what to expect, and how to get the best deals.",
    readTime: "5 min",
    image: "/images/siargao-motorbike-rental-siargao.png",
    featured: true
  },
  {
    slug: "where-to-rent-motorbike-siargao",
    title: "Where to Rent a Motorbike in Siargao",
    category: "Locations",
    excerpt: "Discover the best locations and rental shops in General Luna, Cloud 9, and other areas of Siargao Island.",
    readTime: "4 min",
    image: "/images/michael-louie-8bqoFf_Q1xw-unsplash.jpg",
    featured: true
  },
  {
    slug: "popular-vehicles-ride-siargao",
    title: "Most Popular Vehicles to Ride Around Siargao",
    category: "Vehicle Types",
    excerpt: "From scooters to motorcycles and cars - explore the most popular vehicle options for getting around Siargao Island.",
    readTime: "6 min",
    image: "/images/alejandro-luengo-clllGLYtLRA-unsplash.jpg",
    featured: true
  },
  {
    slug: "motorbike-rental-prices-siargao",
    title: "Motorbike Rental Prices in Siargao 2025",
    category: "Pricing",
    excerpt: "Current pricing guide for motorcycle and scooter rentals in Siargao. Compare costs and find budget-friendly options.",
    readTime: "4 min",
    image: "/images/pexels-roamingmary-15931909.jpg",
    featured: false
  },
  {
    slug: "siargao-transportation-guide",
    title: "Complete Siargao Transportation Guide",
    category: "Travel Tips",
    excerpt: "Everything you need to know about getting around Siargao Island, from rental options to public transport.",
    readTime: "8 min",
    image: "/images/siargao-motorbike-rental-siargao.png",
    featured: false
  }
]

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

export default function GuidesPage() {
  const featuredGuides = guides.filter(guide => guide.featured)
  const otherGuides = guides.filter(guide => !guide.featured)

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 sm:pb-20 md:pb-24 bg-gradient-to-b from-black to-gray-900 overflow-hidden">
        {/* Background Image with Overlay */}
        <motion.div
          className="absolute inset-0 z-0 opacity-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 0.8 }}
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/siargao-motorbike-rental-siargao.png')",
              backgroundSize: "cover"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-900/80"></div>
        </motion.div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            {/* Badge */}
            <motion.div
              className="mb-4"
              variants={slideUp}
            >
              <Badge variant="brand" className="inline-flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4" />
                Siargao Travel Guides
              </Badge>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              variants={slideUp}
            >
              Your Complete Guide to <span className="text-primary">Vehicle Rentals</span> in Siargao
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed"
              variants={slideUp}
            >
              Everything you need to know about renting motorbikes, cars, and scooters in Siargao Island. Expert tips from locals who know the island best.
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={slideUp}>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-black font-medium">
                <Link href="/browse">
                  Start Browsing Rentals <ArrowRight size={16} className="ml-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Guides Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8 text-center">
              Featured Guides
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {featuredGuides.map((guide, index) => (
              <ScrollReveal key={guide.slug} delay={index * 200}>
                <AnimatedCard
                  enableMagnetic={true}
                  enableTilt={true}
                  enableGlow={true}
                  glowColor="rgba(45, 212, 191, 0.15)"
                  href={`/guides/${guide.slug}`}
                  className={`bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden group h-full flex flex-col ${
                    index === 0 ? 'lg:col-span-2 lg:row-span-1' : ''
                  }`}
                >
                  <div className={`relative overflow-hidden ${
                    index === 0 ? 'aspect-[16/9] lg:aspect-[21/9]' : 'aspect-[16/9]'
                  }`}>
                    <Image
                      src={guide.image}
                      alt={guide.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes={index === 0 ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge variant="motorcycle" className="backdrop-blur-sm">
                        {guide.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className={`p-6 flex flex-col flex-grow ${index === 0 ? 'lg:p-8' : ''}`}>
                    <h3 className={`font-bold text-white mb-3 group-hover:text-primary transition-colors ${
                      index === 0 ? 'text-xl lg:text-2xl' : 'text-lg'
                    }`}>
                      {guide.title}
                    </h3>
                    <p className={`text-white/70 leading-relaxed mb-4 flex-grow ${
                      index === 0 ? 'text-base lg:text-lg' : 'text-sm'
                    }`}>
                      {guide.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-white/60 text-sm">
                        <Clock size={14} className="mr-1" />
                        {guide.readTime}
                      </div>
                      <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                        Read Guide <ArrowRight size={14} className="ml-1" />
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* All Guides Section */}
      <section className="py-12 sm:py-16 bg-black">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
              More Helpful Guides
            </h2>
          </ScrollReveal>

          <StaggeredCards className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto" staggerDelay={0.15}>
            {otherGuides.map((guide, index) => (
              <AnimatedCard
                key={guide.slug}
                enableMagnetic={true}
                enableTilt={true}
                enableGlow={true}
                glowColor="rgba(45, 212, 191, 0.1)"
                href={`/guides/${guide.slug}`}
                className="bg-gray-900/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden group"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={guide.image}
                    alt={guide.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge variant="motorcycle" className="backdrop-blur-sm">
                      {guide.category}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white/60 text-sm">
                      <Clock size={14} className="mr-1" />
                      {guide.readTime}
                    </div>
                    <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                      Read Guide <ArrowRight size={14} className="ml-1" />
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </StaggeredCards>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to Find Your Perfect Ride?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                Browse our verified rental shops and compare prices from trusted local providers in Siargao Island.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-black font-medium">
                  <Link href="/browse">
                    Browse All Vehicles <ArrowRight size={16} className="ml-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
                  <Link href="/browse/shops">
                    View Rental Shops
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}