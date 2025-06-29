"use client"

import { useEffect } from 'react'
import { initializeAnimationPerformance } from '@/lib/animation-performance'

export function PerformanceInit() {
  useEffect(() => {
    // Initialize animation performance optimizations
    initializeAnimationPerformance()
  }, [])

  return null
}