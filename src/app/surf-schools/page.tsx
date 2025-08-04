"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Search, XCircle, CheckCircle, Star, Shield, Clock, Users, Award, Waves,
  MessageCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import SurfSchoolCard from "@/components/SurfSchoolCard"
import SurfSchoolFilterPanel from "@/components/surf-school/SurfSchoolFilterPanel"
import SurfSchoolMobileFilters from "@/components/surf-school/SurfSchoolMobileFilters"
import Pagination from "@/components/ui/pagination"
import { SurfSchoolFilters, SurfSchool, SurfSchoolLocation } from "@/lib/types"
import { mockBrowseSurfSchools } from "@/lib/mock-data/surf-schools"

export default function SurfSchoolsPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [filters, setFilters] = useState<SurfSchoolFilters>({
    page: 1,
    limit: 12,
    sort_by: 'rating_desc'
  })
  const [schools, setSchools] = useState<SurfSchool[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })
  const [availableLocations, setAvailableLocations] = useState<SurfSchoolLocation[]>([])
  const [priceRange, setPriceRange] = useState({ min: 1200, max: 3000 })

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setFilters(prev => ({ ...prev, page: 1, search: searchQuery || undefined }))
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch surf schools
  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoading(true)
      try {
        const response = await mockBrowseSurfSchools({
          ...filters,
          search: debouncedSearch || undefined
        })
        setSchools(response.schools)
        setPagination(response.pagination)
        setAvailableLocations(response.filters.locations as SurfSchoolLocation[])
        setPriceRange(response.filters.price_range)
      } catch (error) {
        console.error('Error fetching surf schools:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchools()
  }, [filters, debouncedSearch])

  // Handlers
  const handleFiltersChange = (newFilters: SurfSchoolFilters) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContactClick = (type: string, value: string) => {
    switch (type) {
      case 'whatsapp':
        window.open(`https://wa.me/${value.replace(/\D/g, '')}`, '_blank')
        break
      case 'phone':
        window.open(`tel:${value}`, '_blank')
        break
      case 'instagram':
        window.open(`https://instagram.com/${value}`, '_blank')
        break
      case 'facebook':
        window.open(`https://facebook.com/${value}`, '_blank')
        break
      case 'website':
        window.open(value, '_blank')
        break
    }
  }

  const handleViewProfile = (schoolId: string) => {
    // This will be implemented when we create the individual profile page
    console.log('View profile for school:', schoolId)
  }

  const hasActiveFilters = Boolean(
    filters.location || 
    filters.skill_levels?.length || 
    filters.price_min || 
    filters.price_max || 
    filters.verified_only || 
    filters.min_rating || 
    searchQuery
  )

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  }

  // FAQ data for SEO
  const faqData = [
    {
      question: "Which surf schools in Siargao are most trusted?",
      answer: "All surf schools listed on Siargao Rides are carefully vetted. Look for verified instructors with high ratings and proven experience. We recommend schools with verified badges and positive student reviews."
    },
    {
      question: "What's the best surf break for beginners in Siargao?",
      answer: "Beginners should start at gentler breaks like Daku Island or Guyam Island. Cloud 9 is more suited for intermediate to advanced surfers. Our instructors will recommend the best location based on your skill level."
    },
    {
      question: "How much do surf lessons cost in Siargao?",
      answer: "Surf lessons in Siargao typically range from ₱1,200-₱3,000 per hour depending on whether it's group or private lessons. Most packages include surfboard and safety equipment."
    },
    {
      question: "Do I need to bring my own surfboard?",
      answer: "No, all listed surf schools provide professional surfboards and safety equipment. Many also offer different board sizes to match your skill level and body type."
    }
  ]

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Surf Schools in Siargao Island",
            "description": "Directory of professional surf schools and instructors in Siargao Island, Philippines",
            "numberOfItems": pagination.total,
            "itemListElement": schools.map((school, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "LocalBusiness",
                "name": school.name,
                "description": school.description,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": school.location,
                  "addressRegion": "Siargao Island",
                  "addressCountry": "Philippines"
                },
                "telephone": school.contact.phone_number,
                "priceRange": "₱₱",
                "aggregateRating": school.average_rating ? {
                  "@type": "AggregateRating",
                  "ratingValue": school.average_rating,
                  "reviewCount": school.review_count
                } : undefined
              }
            }))
          })
        }}
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <motion.section
          className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden pt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="absolute inset-0 z-0 opacity-20"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-blue-900/30"></div>
          </motion.div>

          <div className="container mx-auto px-4 py-12 relative z-10 pt-20">
            <motion.div
              className="max-w-4xl mx-auto mb-8 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                  <Waves className="h-4 w-4 mr-1" />
                  Professional Surf Instruction
                </Badge>
              </motion.div>
              <motion.h1
                className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                {filters.location 
                  ? `Surf Schools & Instructors in ${filters.location}` 
                  : 'Surf Schools & Instructors in Siargao Island'
                }
              </motion.h1>
              <motion.p
                className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                Learn to surf at world-famous Cloud 9 and other incredible breaks around Siargao Island. 
                Connect with {pagination.total} verified surf schools and professional instructors offering 
                lessons for all skill levels.
              </motion.p>
              
              {/* Key Stats */}
              <motion.div 
                className="flex flex-wrap justify-center gap-6 mt-8 text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>Verified Instructors</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>Top Rated Schools</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>All Skill Levels</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span>Flexible Scheduling</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Trust Signals Section */}
        <section className="py-8 bg-gray-900 text-white border-b border-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div 
                className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-4 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Shield className="text-green-400 h-6 w-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Verified Instructors</h3>
                  <p className="text-gray-400 text-xs">Licensed & experienced professionals</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-4 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                <Award className="text-yellow-400 h-6 w-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">World-Class Breaks</h3>
                  <p className="text-gray-400 text-xs">Learn at famous Cloud 9 and more</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-4 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <Users className="text-blue-400 h-6 w-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">All Skill Levels</h3>
                  <p className="text-gray-400 text-xs">From beginner to advanced coaching</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-4 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
              >
                <MessageCircle className="text-green-400 h-6 w-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Direct Contact</h3>
                  <p className="text-gray-400 text-xs">WhatsApp & phone booking available</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 bg-gradient-to-b from-gray-900 to-black text-white">
          <div className="container mx-auto px-4">
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
                <input
                  type="text"
                  placeholder="Search surf schools by name or instructor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-card/30 backdrop-blur-xl border border-border/30 rounded-xl text-white placeholder-white/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    <XCircle size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Filters */}
            <SurfSchoolMobileFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              availableLocations={availableLocations}
              priceRange={priceRange}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
              {/* Desktop Filters Panel */}
              <motion.div
                className="md:col-span-1 hidden md:block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <SurfSchoolFilterPanel
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  availableLocations={availableLocations}
                  priceRange={priceRange}
                />
              </motion.div>

              {/* Surf School Listings */}
              <div className="md:col-span-3">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-400">Loading surf schools...</p>
                  </div>
                ) : schools.length === 0 ? (
                  <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center">
                    <h3 className="text-xl font-semibold mb-2">No surf schools found</h3>
                    <p className="text-gray-400 mb-4">Try adjusting your filters to see more results</p>
                    <button
                      onClick={() => setFilters({ page: 1, limit: 12, sort_by: 'rating_desc' })}
                      className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-md text-sm"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Results Header */}
                    <motion.div 
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-card/20 backdrop-blur-sm rounded-xl border border-border/20"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div>
                        <p className="text-white font-medium text-lg">
                          <span className="text-primary">{pagination.total}</span> {pagination.total === 1 ? 'surf school' : 'surf schools'} found
                        </p>
                        {pagination.total > pagination.limit && (
                          <p className="text-sm text-gray-400 mt-1">
                            Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {hasActiveFilters && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 text-sm">
                            Filters active
                          </Badge>
                        )}
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-sm text-gray-300">Professional instructors</span>
                      </div>
                    </motion.div>

                    {/* Schools Grid */}
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {schools.map((school) => (
                        <motion.div
                          key={school.id}
                          variants={itemVariants}
                          className="w-full"
                        >
                          <SurfSchoolCard
                            id={school.id}
                            name={school.name}
                            instructor_name={school.instructor_name}
                            experience_years={school.experience_years}
                            location={school.location}
                            description={school.description}
                            images={school.images.map(img => img.image_url)}
                            services={school.services}
                            contact={school.contact}
                            is_verified={school.is_verified}
                            average_rating={school.average_rating}
                            review_count={school.review_count}
                            starting_price={school.starting_price}
                            featured_image={school.featured_image}
                            created_at={school.created_at}
                            onContactClick={handleContactClick}
                            onViewProfileClick={() => handleViewProfile(school.id)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <motion.div 
                        className="mt-10 flex justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/30 p-6 shadow-lg">
                          <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                          />
                          <p className="text-center text-sm text-gray-400 mt-4">
                            Page {pagination.page} of {pagination.totalPages} • {pagination.total} total schools
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section for SEO */}
        <section className="py-12 bg-black text-white">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Frequently Asked Questions About Surf Schools
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Everything you need to know about learning to surf in Siargao Island
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {faqData.map((faq, index) => (
                  <motion.div
                    key={index}
                    className="bg-gray-800/50 rounded-xl p-6 h-full backdrop-blur-sm hover:bg-gray-800/70 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <h3 className="font-semibold mb-3 text-lg text-white">{faq.question}</h3>
                    <p className="text-gray-300 leading-relaxed text-sm">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
              
              {/* Call to Action */}
              <motion.div 
                className="text-center mt-10 p-8 bg-gradient-to-r from-primary/20 to-blue-900/20 rounded-xl border border-primary/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-xl font-bold mb-3">Ready to Catch Your First Wave?</h3>
                <p className="text-gray-300 mb-6">Connect with professional surf instructors and start your Siargao surf adventure today</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold tracking-wide px-8 py-3 rounded-lg border border-primary/30 shadow-lg hover:shadow-xl focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  >
                    <Waves className="h-4 w-4 mr-2" />
                    Find Surf Schools
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/browse', '_blank')}
                    className="border-border/50 hover:bg-card hover:border-border text-white font-semibold tracking-wide px-8 py-3 rounded-lg transition-all duration-200"
                  >
                    Browse Vehicles
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  )
}