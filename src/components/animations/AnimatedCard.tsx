"use client"

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ReactNode, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useScrollAnimation'
import { cardHoverVariants, quickSpring } from '@/lib/animations'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  enableMagnetic?: boolean
  enableTilt?: boolean
  enableGlow?: boolean
  glowColor?: string
  href?: string
  onClick?: () => void
}

export function AnimatedCard({ 
  children, 
  className = '', 
  enableMagnetic = true,
  enableTilt = true, 
  enableGlow = false,
  glowColor = 'rgba(45, 212, 191, 0.3)',
  href,
  onClick
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  // Motion values for smooth interactions
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !enableTilt) return

    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseXPos = (e.clientX - centerX) / (rect.width / 2)
    const mouseYPos = (e.clientY - centerY) / (rect.height / 2)

    mouseX.set(mouseXPos)
    mouseY.set(mouseYPos)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const cardContent = (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      variants={shouldReduceMotion ? {} : cardHoverVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      style={shouldReduceMotion ? {} : {
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        transformStyle: "preserve-3d"
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      transition={quickSpring}
    >
      {/* Glow effect */}
      {enableGlow && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-xl blur-xl -z-10"
          style={{
            background: glowColor
          }}
          animate={{
            opacity: isHovered ? 0.6 : 0,
            scale: isHovered ? 1.05 : 0.95
          }}
          transition={quickSpring}
        />
      )}

      {/* Card content with 3D transform */}
      <div 
        style={shouldReduceMotion ? {} : { 
          transform: enableTilt ? "translateZ(20px)" : undefined 
        }}
        className="relative w-full h-full"
      >
        {children}
      </div>

      {/* Subtle highlight overlay */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.1) 0%, transparent 50%)`
          }}
          animate={{
            opacity: isHovered ? 1 : 0
          }}
          transition={quickSpring}
        />
      )}
    </motion.div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {cardContent}
      </a>
    )
  }

  return cardContent
}

interface StaggeredCardsProps {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
}

export function StaggeredCards({ children, className = '', staggerDelay = 0.1 }: StaggeredCardsProps) {
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : 0.1
      }
    }
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 40,
      scale: shouldReduceMotion ? 1 : 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: shouldReduceMotion ? { duration: 0.3 } : {
        type: "spring",
        stiffness: 100,
        damping: 15,
        mass: 0.8
      }
    }
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}