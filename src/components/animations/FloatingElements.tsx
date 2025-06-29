"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useScrollAnimation'

interface FloatingElementsProps {
  count?: number
  className?: string
}

export function FloatingElements({ count = 6, className = '' }: FloatingElementsProps) {
  const shouldReduceMotion = useReducedMotion()
  const [elements, setElements] = useState<Array<{
    id: number
    size: number
    initialX: number
    initialY: number
    duration: number
    delay: number
  }>>([])

  // Generate elements only on client side to avoid hydration mismatch
  useEffect(() => {
    if (shouldReduceMotion) return

    const generatedElements = Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 8 + 4, // 4-12px
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      duration: Math.random() * 20 + 15, // 15-35s
      delay: Math.random() * 10
    }))
    
    setElements(generatedElements)
  }, [count, shouldReduceMotion])

  if (shouldReduceMotion || elements.length === 0) return null

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm"
          style={{
            width: element.size,
            height: element.size,
            left: `${element.initialX}%`,
            top: `${element.initialY}%`,
          }}
          initial={{
            opacity: 0,
            scale: 0
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
            x: [0, element.initialX - 50],
            y: [0, element.initialY - 50],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

interface ParticleFieldProps {
  density?: number
  className?: string
}

export function ParticleField({ density = 20, className = '' }: ParticleFieldProps) {
  const shouldReduceMotion = useReducedMotion()
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    size: number
    duration: number
    delay: number
  }>>([])

  // Generate particles only on client side to avoid hydration mismatch
  useEffect(() => {
    if (shouldReduceMotion) return

    const generatedParticles = Array.from({ length: density }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 20,
      delay: Math.random() * 5
    }))
    
    setParticles(generatedParticles)
  }, [density, shouldReduceMotion])

  if (shouldReduceMotion || particles.length === 0) return null

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.6) 0%, rgba(45, 212, 191, 0.1) 70%, transparent 100%)'
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [0.5, 1.2, 0.5],
            y: [0, -30, 0]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

interface OrganicShapeProps {
  className?: string
  color?: string
}

export function OrganicShape({ className = '', color = 'primary' }: OrganicShapeProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={`absolute rounded-full opacity-20 ${className}`}
      style={{
        background: `radial-gradient(ellipse at center, hsl(var(--${color})) 0%, transparent 70%)`
      }}
      animate={shouldReduceMotion ? {} : {
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
        borderRadius: ['50%', '60% 40% 60% 40%', '50%']
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}