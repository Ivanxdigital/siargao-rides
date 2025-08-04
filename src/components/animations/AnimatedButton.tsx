"use client"

import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { ReactNode, useRef } from 'react'
import { useReducedMotion } from '@/hooks/useScrollAnimation'
import { buttonVariants, quickSpring } from '@/lib/animations'

interface AnimatedButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  enableMagnetic?: boolean
  enableRipple?: boolean
  enableGlow?: boolean
  glowColor?: string
  type?: 'button' | 'submit' | 'reset'
}

export function AnimatedButton({
  children,
  className = '',
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  href,
  enableMagnetic = true,
  enableRipple = true,
  enableGlow = false,
  glowColor = 'rgba(45, 212, 191, 0.4)',
  type = 'button'
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Motion values for magnetic effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  // Ripple effect motion values
  const rippleX = useMotionValue(0)
  const rippleY = useMotionValue(0)
  const rippleScale = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduceMotion || !enableMagnetic) return

    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = e.clientX - centerX
    const deltaY = e.clientY - centerY

    // Magnetic effect - subtle movement toward cursor
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const maxDistance = Math.max(rect.width, rect.height) / 2
    const force = Math.min(distance / maxDistance, 1)
    
    mouseX.set(deltaX * force * 0.3)
    mouseY.set(deltaY * force * 0.3)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    rippleScale.set(0)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return

    // Ripple effect
    if (enableRipple && !shouldReduceMotion) {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) {
        const rippleXPos = e.clientX - rect.left
        const rippleYPos = e.clientY - rect.top
        
        rippleX.set(rippleXPos)
        rippleY.set(rippleYPos)
        rippleScale.set(0)
        
        // Animate ripple
        rippleScale.set(Math.max(rect.width, rect.height) * 1.5)
      }
    }

    onClick?.()
  }

  // Base classes for different variants
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-teal-400 text-black border border-primary/20 shadow-lg hover:shadow-primary/30 font-semibold shadow-teal-500/20',
    secondary: 'bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-gray-600 shadow-lg hover:shadow-gray-800/20',
    ghost: 'bg-transparent text-white border border-white/20 hover:bg-white/5',
    outline: 'bg-transparent text-primary border border-primary/40 hover:bg-primary/10'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-base min-h-[44px]',
    xl: 'px-8 py-4 text-lg min-h-[52px]'
  }

  const gapClasses = {
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-2.5',
    xl: 'gap-3'
  }

  const baseClasses = `
    relative overflow-hidden rounded-lg font-medium
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `

  const buttonContent = (
    <>
      {/* Glow effect */}
      {enableGlow && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-lg blur-md -z-10"
          style={{
            background: glowColor
          }}
          whileHover={{ scale: 1.1, opacity: 0.8 }}
          initial={{ scale: 0.8, opacity: 0 }}
          transition={quickSpring}
        />
      )}

      {/* Ripple effect */}
      {enableRipple && !shouldReduceMotion && (
        <motion.div
          className="absolute pointer-events-none rounded-full bg-white/20"
          style={{
            left: rippleX,
            top: rippleY,
            width: rippleScale,
            height: rippleScale,
            x: useMotionTemplate`-${rippleScale}px / 2`,
            y: useMotionTemplate`-${rippleScale}px / 2`,
            scale: rippleScale
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      {/* Button content */}
      <span className={`relative z-10 flex items-center justify-center ${gapClasses[size]}`}>
        {children}
      </span>
    </>
  )

  const motionProps = shouldReduceMotion
    ? {}
    : {
        style: { x, y },
        variants: buttonVariants,
        initial: "initial",
        whileHover: "hover",
        whileTap: "tap",
        onMouseMove: handleMouseMove,
        onMouseLeave: handleMouseLeave
      }

  if (href) {
    return (
      <motion.a
        ref={buttonRef as any}
        href={href}
        className={baseClasses}
        onClick={handleClick}
        {...motionProps}
      >
        {buttonContent}
      </motion.a>
    )
  }

  return (
    <motion.button
      ref={buttonRef as any}
      type={type}
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled}
      {...motionProps}
    >
      {buttonContent}
    </motion.button>
  )
}

// Specialized button variants
export function PrimaryButton(props: Omit<AnimatedButtonProps, 'variant'>) {
  return <AnimatedButton {...props} variant="primary" enableGlow={true} />
}

export function SecondaryButton(props: Omit<AnimatedButtonProps, 'variant'>) {
  return <AnimatedButton {...props} variant="secondary" />
}

export function GhostButton(props: Omit<AnimatedButtonProps, 'variant'>) {
  return <AnimatedButton {...props} variant="ghost" />
}

export function OutlineButton(props: Omit<AnimatedButtonProps, 'variant'>) {
  return <AnimatedButton {...props} variant="outline" />
}