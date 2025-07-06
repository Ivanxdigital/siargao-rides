"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Clock, TrendingUp, MapPin, Calendar } from 'lucide-react'
import { SocialProofData } from '@/data/socialProofData'
import { useReducedMotion } from '@/hooks/useScrollAnimation'
import { quickSpring } from '@/lib/animations'

interface SocialProofNotificationProps {
  notification: SocialProofData & { isVisible: boolean }
  onDismiss: () => void
}

export function SocialProofNotification({ 
  notification, 
  onDismiss 
}: SocialProofNotificationProps) {
  const shouldReduceMotion = useReducedMotion()

  const getServiceText = (service: string, type: string) => {
    if (type !== 'booking') return ''
    
    switch (service) {
      case 'airport-transfer':
        return 'pre-booked airport transfer to'
      case 'van-hire':
        return 'pre-booked van hire to'
      default:
        return 'pre-booked transfer to'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'activity':
        return <Calendar className="w-5 h-5 text-primary" />
      case 'demand':
        return <MapPin className="w-5 h-5 text-primary" />
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-primary" />
      default:
        return <Users className="w-5 h-5 text-primary" />
    }
  }

  const getGroupText = (size: number) => {
    if (size === 1) return ''
    if (size === 2) return ' (2 people)'
    return ` (${size} people)`
  }

  const slideVariants = {
    hidden: {
      x: 400,
      opacity: 0,
      scale: 0.8
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: shouldReduceMotion ? 
        { duration: 0.3, ease: "easeOut" } : 
        quickSpring
    },
    exit: {
      x: 400,
      opacity: 0,
      scale: 0.8,
      transition: shouldReduceMotion ? 
        { duration: 0.2, ease: "easeIn" } :
        { ...quickSpring, duration: 0.3 }
    }
  }

  return (
    <AnimatePresence>
      {notification.isVisible && (
        <motion.div
          variants={slideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-6 left-6 z-60 max-w-sm"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-xl">
            <div className="flex items-start gap-3">
              {/* Avatar/Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                {getIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-white leading-relaxed">
                      {notification.type === 'booking' ? (
                        <>
                          <span className="font-semibold text-primary">
                            {notification.name}
                          </span>
                          {' '}
                          <span className="text-white/80">
                            {getServiceText(notification.service, notification.type)} {notification.destination}
                          </span>
                          <span className="text-white/60">
                            {getGroupText(notification.groupSize || 0)}
                          </span>
                        </>
                      ) : (
                        <span className="text-white/90">
                          {notification.message}
                        </span>
                      )}
                    </p>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-white/40" />
                      <span className="text-xs text-white/60">
                        {notification.timeAgo}
                      </span>
                    </div>
                  </div>

                  {/* Dismiss Button */}
                  <button
                    onClick={onDismiss}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 ml-2"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3 h-3 text-white/40 hover:text-white/60" />
                  </button>
                </div>
              </div>
            </div>

            {/* Subtle bottom border for brand accent */}
            <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface SocialProofContainerProps {
  notifications: Array<SocialProofData & { id: string; isVisible: boolean }>
  onDismiss: (id: string) => void
}

export function SocialProofContainer({ 
  notifications, 
  onDismiss 
}: SocialProofContainerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-60">
      <AnimatePresence mode="multiple">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              bottom: `${24 + (index * 80)}px`,
              left: '24px'
            }}
          >
            <SocialProofNotification
              notification={notification}
              onDismiss={() => onDismiss(notification.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}