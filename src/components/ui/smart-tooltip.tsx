"use client"

import { useState, useEffect, ReactNode } from 'react'
import { X, Info, HelpCircle, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SmartTooltipProps {
  content: string
  title?: string
  showOnFirstVisit?: boolean
  dismissible?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  icon?: ReactNode
  learnMoreUrl?: string
  children: ReactNode
  className?: string
  id?: string // Used for tracking dismissal
}

export function SmartTooltip({
  content,
  title,
  showOnFirstVisit = false,
  dismissible = true,
  position = 'top',
  delay = 0,
  icon = <Info className="w-4 h-4" />,
  learnMoreUrl,
  children,
  className,
  id
}: SmartTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasShownOnce, setHasShownOnce] = useState(false)

  // Check if tooltip has been dismissed before
  useEffect(() => {
    if (id) {
      const dismissed = localStorage.getItem(`tooltip-dismissed-${id}`)
      if (dismissed === 'true') {
        setIsDismissed(true)
      }
    }
  }, [id])

  // Show on first visit if enabled
  useEffect(() => {
    if (showOnFirstVisit && !isDismissed && !hasShownOnce) {
      const timer = setTimeout(() => {
        setIsOpen(true)
        setHasShownOnce(true)
      }, 1000) // Delay initial show by 1 second

      return () => clearTimeout(timer)
    }
  }, [showOnFirstVisit, isDismissed, hasShownOnce])

  const handleDismiss = () => {
    setIsOpen(false)
    if (id && dismissible) {
      setIsDismissed(true)
      localStorage.setItem(`tooltip-dismissed-${id}`, 'true')
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!isDismissed || !dismissible) {
      setIsOpen(open)
    }
  }

  if (isDismissed && dismissible) {
    return <>{children}</>
  }

  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip open={isOpen} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={position} 
          className={cn(
            "max-w-xs p-4 relative",
            className
          )}
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss tooltip"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              <div className="space-y-2 pr-6">
                {title && (
                  <div className="flex items-center gap-2">
                    {icon}
                    <h4 className="text-sm font-semibold">{title}</h4>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  {content}
                </p>

                {learnMoreUrl && (
                  <a
                    href={learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-primary hover:underline mt-2"
                  >
                    Learn more
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </a>
                )}

                {dismissible && (
                  <p className="text-xs text-muted-foreground/70 mt-3">
                    This tip won't show again
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Preset tooltip configurations for common use cases
export const TooltipPresets = {
  groupCreation: {
    id: 'group-creation',
    title: "Save Time with Groups!",
    content: "Have multiple identical vehicles? Create them all at once! Example: 5 Honda Click scooters = 1 group with 5 units.",
    icon: <HelpCircle className="w-4 h-4 text-primary" />,
    learnMoreUrl: "/help/vehicle-groups",
    showOnFirstVisit: true
  },
  
  bulkOperations: {
    id: 'bulk-operations',
    title: "Update All at Once",
    content: "Change prices or availability for all vehicles in this group with one click.",
    icon: <Info className="w-4 h-4 text-blue-500" />
  },
  
  namingPattern: {
    id: 'naming-pattern',
    title: "How Units Are Named",
    content: "Choose how to identify each unit. Examples:\n• 'Unit 1, Unit 2...'\n• 'Honda #1, Honda #2...'\n• Custom names you choose",
    icon: <HelpCircle className="w-4 h-4" />
  },
  
  availabilityBadge: {
    id: 'availability-badge',
    title: "Multiple Units Available",
    content: "This shop has multiple identical vehicles. You can book any available unit!",
    icon: <Info className="w-4 h-4 text-green-500" />
  },
  
  partialAvailability: {
    id: 'partial-availability',
    title: "Limited Availability",
    content: "Only some units are available for your selected dates. Book soon!",
    icon: <Info className="w-4 h-4 text-yellow-500" />
  }
}