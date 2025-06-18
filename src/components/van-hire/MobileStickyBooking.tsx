"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MobileStickyBooking() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling down 100vh (past hero section)
      const shouldShow = window.scrollY > window.innerHeight && !isDismissed
      setIsVisible(shouldShow)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDismissed])

  const handleBookNow = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          <div className="bg-black/95 backdrop-blur-md border-t border-zinc-700 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-white font-semibold text-sm">Private Van Hire</div>
                    <div className="text-primary font-bold text-lg">₱2,500 All-in</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBookNow}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white px-6"
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Book Now
                </Button>
                
                <button
                  onClick={handleDismiss}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}