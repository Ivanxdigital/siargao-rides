"use client"

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useScrollAnimation'

interface MagneticCursorProps {
  children?: React.ReactNode
  className?: string
}

export function MagneticCursor({ children, className = '' }: MagneticCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)

  useEffect(() => {
    if (shouldReduceMotion) return

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      setIsVisible(true)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    // Handle hover over interactive elements
    const handleInteractiveHover = (e: Event) => {
      const target = e.target as HTMLElement
      const isInteractive = target.closest('button, a, [role="button"], input, textarea, select')
      setIsHovering(!!isInteractive)
    }

    const handleInteractiveLeave = () => {
      setIsHovering(false)
    }

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)
    
    // Add listeners for interactive elements
    const interactiveElements = document.querySelectorAll('button, a, [role="button"]')
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleInteractiveHover)
      el.addEventListener('mouseleave', handleInteractiveLeave)
    })

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
      
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleInteractiveHover)
        el.removeEventListener('mouseleave', handleInteractiveLeave)
      })
    }
  }, [mouseX, mouseY, shouldReduceMotion])

  if (shouldReduceMotion) return null

  return (
    <motion.div
      ref={cursorRef}
      className={`fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference ${className}`}
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%'
      }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isHovering ? 1.5 : 1
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { type: "spring", stiffness: 400, damping: 25 }
      }}
    >
      {children || (
        <div className="w-6 h-6 bg-white rounded-full shadow-lg backdrop-blur-sm border border-white/20">
          {/* Inner dot */}
          <div className="w-1 h-1 bg-primary rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      )}
    </motion.div>
  )
}

interface MagneticElementProps {
  children: React.ReactNode
  className?: string
  strength?: number
  disabled?: boolean
}

export function MagneticElement({ 
  children, 
  className = '', 
  strength = 0.3,
  disabled = false 
}: MagneticElementProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduceMotion || disabled) return

    const rect = elementRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = e.clientX - centerX
    const deltaY = e.clientY - centerY

    // Calculate magnetic effect
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const maxDistance = Math.max(rect.width, rect.height) / 2
    const force = Math.min(distance / maxDistance, 1)
    
    mouseX.set(deltaX * force * strength)
    mouseY.set(deltaY * force * strength)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      ref={elementRef}
      className={className}
      style={shouldReduceMotion ? {} : { x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}