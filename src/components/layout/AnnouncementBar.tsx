"use client"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { X, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Create a context to share the announcement visibility state
export const AnnouncementContext = createContext<{
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
}>({ isVisible: true, setIsVisible: () => {} })

// Hook to use the announcement context
export const useAnnouncement = () => useContext(AnnouncementContext)

const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  // Debounce function to delay execution
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Only handle scroll events, no localStorage persistence
  useEffect(() => {
    // Check if device is mobile
    const checkIfMobile = () => {
      const isMobile = window.innerWidth < 768
      return isMobile
    }

    let isMobile = checkIfMobile()

    // Handle scroll events with debounce for mobile
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    // Create scroll handler based on device type
    const createScrollHandler = () => {
      isMobile = checkIfMobile()
      return isMobile
        ? debounce(handleScroll, 150) // 150ms delay for mobile
        : handleScroll
    }

    // Initial scroll handler
    let debouncedHandleScroll = createScrollHandler()

    // Handle window resize
    const handleResize = () => {
      // Remove old listener
      window.removeEventListener("scroll", debouncedHandleScroll)
      // Create new listener based on updated device type
      debouncedHandleScroll = createScrollHandler()
      // Add new listener
      window.addEventListener("scroll", debouncedHandleScroll)
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", debouncedHandleScroll)

    return () => {
      window.removeEventListener("scroll", debouncedHandleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    // Only dispatch event for current session, no localStorage persistence
    window.dispatchEvent(new Event('announcement-dismissed'))
  }

  return (
    <AnnouncementContext.Provider value={{ isVisible, setIsVisible }}>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              y: isScrolled ? -100 : 0
            }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="fixed top-0 left-0 right-0 z-[1001] bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 backdrop-blur-md border-b border-white/10 text-white hidden md:block"
          >
            {/* Desktop version - full width with all content */}
            <div className="hidden md:block container mx-auto px-4 py-2">
              <div className="flex items-center justify-center text-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                <p className="flex-1">
                  <span className="font-semibold">BETA</span> - We're currently in BETA so there may be bugs, but we're working on it! At this moment of time it's cash only for bookings, card payments coming soon!
                </p>
                <button
                  onClick={handleDismiss}
                  className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                  aria-label="Dismiss announcement"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile version removed as requested */}
          </motion.div>
        )}
      </AnimatePresence>
    </AnnouncementContext.Provider>
  )
}

export default AnnouncementBar
