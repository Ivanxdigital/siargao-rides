'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, Search, MapPin, Bike } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundClient() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* 404 Visual */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 mb-4">
              404
            </div>
            <Bike className="w-16 h-16 mx-auto text-primary/60" />
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              Oops! This Road Doesn't Lead Anywhere
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-md mx-auto">
              The page you're looking for has taken a different route. Let's get you back on track to explore Siargao Island.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
                <Home className="w-4 h-4" />
                Back to Homepage
              </Button>
            </Link>
            
            <Link href="/browse">
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Search className="w-4 h-4" />
                Browse Vehicles
              </Button>
            </Link>
          </motion.div>

          {/* Popular Links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="border-t border-white/10 pt-8"
          >
            <p className="text-sm text-gray-500 mb-4">Or try these popular pages:</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link 
                href="/browse?type=motorcycle" 
                className="text-primary hover:text-primary/80 underline decoration-dotted transition-colors"
              >
                Motorbike Rentals
              </Link>
              <Link 
                href="/browse?type=car" 
                className="text-primary hover:text-primary/80 underline decoration-dotted transition-colors"
              >
                Car Rentals
              </Link>
              <Link 
                href="/browse/shops" 
                className="text-primary hover:text-primary/80 underline decoration-dotted transition-colors"
              >
                Rental Shops
              </Link>
              <Link 
                href="/guides" 
                className="text-primary hover:text-primary/80 underline decoration-dotted transition-colors"
              >
                Travel Guides
              </Link>
            </div>
          </motion.div>

          {/* Location Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-12 flex items-center justify-center gap-2 text-xs text-gray-600"
          >
            <MapPin className="w-3 h-3" />
            <span>Siargao Island, Philippines</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}