"use client"

import { useState, useEffect, ReactNode } from 'react'
import { X, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WelcomeTooltipProps {
  content: string
  title?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  id: string
  autoShowDelay?: number
  autoHideDuration?: number
}

export function WelcomeTooltip({
  content,
  title,
  icon = <MessageCircle className="w-4 h-4 text-primary" />,
  children,
  className,
  id,
  autoShowDelay = 2000,
  autoHideDuration = 6000
}: WelcomeTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Check if tooltip has been dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem(`welcome-tooltip-dismissed-${id}`)
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [id])

  // Show tooltip automatically on first visit
  useEffect(() => {
    if (!isDismissed) {
      const showTimer = setTimeout(() => {
        setIsVisible(true)
      }, autoShowDelay)

      return () => clearTimeout(showTimer)
    }
  }, [isDismissed, autoShowDelay])

  // Auto-hide after duration
  useEffect(() => {
    if (isVisible && !isDismissed) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
      }, autoHideDuration)

      return () => clearTimeout(hideTimer)
    }
  }, [isVisible, isDismissed, autoHideDuration])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem(`welcome-tooltip-dismissed-${id}`, 'true')
  }

  if (isDismissed) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ 
              duration: 0.3, 
              ease: "easeOut",
              type: "spring",
              damping: 20,
              stiffness: 300
            }}
            className={cn(
              "absolute bottom-full right-0 mb-4 z-50",
              "bg-white border border-gray-200/50 rounded-2xl shadow-2xl",
              "min-w-64 max-w-72 sm:max-w-80 px-5 py-4",
              "backdrop-blur-sm",
              className
            )}
          >
            {/* Chat bubble tail */}
            <div className="absolute top-full right-6">
              <svg 
                width="12" 
                height="8" 
                viewBox="0 0 12 8" 
                className="text-white drop-shadow-sm"
              >
                <path 
                  d="M0,0 L12,0 L6,8 Z" 
                  fill="currentColor"
                  className="filter drop-shadow-sm"
                />
              </svg>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full p-0.5 hover:bg-gray-100"
              aria-label="Dismiss tooltip"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="space-y-3 pr-4">
              {title && (
                <div className="flex items-center gap-2">
                  {icon}
                  <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
                </div>
              )}
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {content}
              </p>

              <p className="text-xs text-gray-400 mt-3">
                This tip won't show again
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}