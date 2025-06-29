"use client"

import { useEffect, useRef, useState } from 'react'
import { useAnimation, useMotionValue, useTransform } from 'framer-motion'
import { createOptimizedIntersectionObserver, WillChangeManager } from '@/lib/animation-performance'

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  delay?: number
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true, delay = 0 } = options
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const controls = useAnimation()

  useEffect(() => {
    if (!ref.current) return

    const element = ref.current

    const observer = createOptimizedIntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting
        
        if (inView) {
          // Add will-change for animation properties
          WillChangeManager.add(entry.target as HTMLElement, ['transform', 'opacity'])
          
          setTimeout(() => {
            setIsInView(true)
            controls.start('visible')
          }, delay)
          
          if (triggerOnce) {
            observer.unobserve(entry.target)
            // Clean up will-change after animation
            setTimeout(() => {
              WillChangeManager.remove(entry.target as HTMLElement, ['transform', 'opacity'])
            }, 1000)
          }
        } else if (!triggerOnce) {
          setIsInView(false)
          controls.start('hidden')
          WillChangeManager.remove(entry.target as HTMLElement, ['transform', 'opacity'])
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      WillChangeManager.clear(element)
    }
  }, [threshold, rootMargin, triggerOnce, delay, controls])

  return { ref, isInView, controls }
}

export function useScrollProgress() {
  const scrollY = useMotionValue(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateScrollY = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const currentY = window.scrollY
      scrollY.set(currentY)
      setScrollProgress(scrollHeight > 0 ? currentY / scrollHeight : 0)
    }

    window.addEventListener('scroll', updateScrollY, { passive: true })
    updateScrollY()

    return () => window.removeEventListener('scroll', updateScrollY)
  }, [scrollY])

  return { scrollY, scrollProgress }
}

export function useParallax(speed: number = 0.5) {
  const scrollY = useMotionValue(0)
  const y = useTransform(scrollY, [0, 1000], [0, 1000 * speed])

  useEffect(() => {
    const updateScrollY = () => scrollY.set(window.scrollY)
    window.addEventListener('scroll', updateScrollY, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollY)
  }, [scrollY])

  return y
}

export function useReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduceMotion(mediaQuery.matches)

    const handleChange = () => setShouldReduceMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return shouldReduceMotion
}