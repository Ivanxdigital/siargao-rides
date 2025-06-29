"use client"

import { motion, MotionProps } from 'framer-motion'
import { ReactNode, forwardRef } from 'react'
import { useScrollAnimation, useReducedMotion } from '@/hooks/useScrollAnimation'
import { fadeInUpVariants, getVariants } from '@/lib/animations'

interface ScrollRevealProps extends Omit<MotionProps, 'ref'> {
  children: ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  delay?: number
  variants?: any
  as?: keyof typeof motion
}

export const ScrollReveal = forwardRef<HTMLElement, ScrollRevealProps>(
  ({ 
    children, 
    className = '', 
    threshold = 0.1, 
    rootMargin = '0px 0px -10%', 
    triggerOnce = true,
    delay = 0,
    variants = fadeInUpVariants,
    as = 'div',
    ...motionProps 
  }, forwardedRef) => {
    const { ref, controls } = useScrollAnimation({
      threshold,
      rootMargin,
      triggerOnce,
      delay
    })
    
    const shouldReduceMotion = useReducedMotion()
    const finalVariants = getVariants(shouldReduceMotion, variants)

    const MotionComponent = motion[as] as any

    return (
      <MotionComponent
        ref={(node: HTMLElement) => {
          // Handle both refs
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
          
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        className={className}
        initial="hidden"
        animate={controls}
        variants={finalVariants}
        {...motionProps}
      >
        {children}
      </MotionComponent>
    )
  }
)

ScrollReveal.displayName = 'ScrollReveal'