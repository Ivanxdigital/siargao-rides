"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { usePathname } from "next/navigation"

interface WhatsAppFloatProps {
  phoneNumber?: string
  message?: string
  className?: string
  hiddenOnPages?: string[]
}

export default function WhatsAppFloat({ 
  phoneNumber = "+639993702550",
  message = "Hello! I'm interested in renting a vehicle in Siargao.",
  className = "",
  hiddenOnPages = []
}: WhatsAppFloatProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const pathname = usePathname()

  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  // Hide component if current pathname is in hiddenOnPages array
  if (hiddenOnPages.includes(pathname)) {
    return null
  }

  return (
    <>
      {/* WhatsApp Floating Button */}
      <motion.div
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 1.5 // Subtle delay for better UX
        }}
      >
        <div className="relative">
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg shadow-lg border border-white/10 whitespace-nowrap"
              >
                Here if you need us!
                {/* Tooltip arrow */}
                <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900/95"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Button */}
          <motion.button
            onClick={handleClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="relative group w-14 h-14 sm:w-16 sm:h-16 bg-primary hover:bg-primary/90 active:bg-primary/80 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-primary/30 flex items-center justify-center"
            whileHover={{ 
              scale: 1.05,
              y: -2,
              boxShadow: "0 10px 25px rgba(45, 212, 191, 0.4)"
            }}
            whileTap={{ scale: 0.98 }}
            aria-label="Contact us on WhatsApp"
            role="button"
            tabIndex={0}
          >
            {/* Glassmorphism background effect */}
            <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Pulse effect for attention */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary opacity-30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* WhatsApp Icon */}
            <motion.div
              className="relative z-10 text-white"
              whileHover={{ rotate: [0, -10, 0] }}
              transition={{ duration: 0.3 }}
            >
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            </motion.div>

            {/* Screen reader text */}
            <span className="sr-only">Open WhatsApp chat</span>
          </motion.button>

          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-full bg-primary opacity-20 blur-md scale-110 -z-10 group-hover:opacity-30 transition-opacity duration-300"></div>
        </div>
      </motion.div>
    </>
  )
}