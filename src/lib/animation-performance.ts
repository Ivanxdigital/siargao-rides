/**
 * Animation Performance Utilities
 * Optimizes animations for 60fps by using GPU-accelerated properties
 * and managing will-change declarations properly
 */

// GPU-accelerated properties that don't trigger layout or paint
export const GPU_PROPERTIES = [
  'transform',
  'opacity',
  'filter',
  'backdrop-filter'
] as const

// Properties that trigger expensive browser operations
export const EXPENSIVE_PROPERTIES = [
  'width',
  'height',
  'left',
  'top',
  'margin',
  'padding',
  'border',
  'box-shadow'
] as const

/**
 * Creates optimized motion values that prefer GPU-accelerated properties
 */
export function createOptimizedMotionValues(properties: Record<string, any>) {
  const optimized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(properties)) {
    // Convert expensive properties to transform equivalents when possible
    switch (key) {
      case 'x':
      case 'y':
      case 'scale':
      case 'rotate':
      case 'opacity':
        optimized[key] = value
        break
      case 'left':
        console.warn('Using left property in animation. Consider using x transform instead.')
        optimized.x = value
        break
      case 'top':
        console.warn('Using top property in animation. Consider using y transform instead.')
        optimized.y = value
        break
      default:
        optimized[key] = value
    }
  }
  
  return optimized
}

/**
 * Optimized spring configuration for 60fps performance
 */
export const PERFORMANCE_SPRINGS = {
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
    restDelta: 0.01,
    restSpeed: 0.01
  },
  smooth: {
    type: "spring" as const,
    stiffness: 120,
    damping: 25,
    mass: 1,
    restDelta: 0.01,
    restSpeed: 0.01
  },
  gentle: {
    type: "spring" as const,
    stiffness: 80,
    damping: 20,
    mass: 1.2,
    restDelta: 0.01,
    restSpeed: 0.01
  }
} as const

/**
 * Optimized easing curves for different animation types
 */
export const PERFORMANCE_EASINGS = {
  entrance: [0.25, 0.46, 0.45, 0.94],
  exit: [0.55, 0.06, 0.68, 0.19],
  smooth: [0.4, 0, 0.2, 1],
  snappy: [0.25, 0.46, 0.45, 0.94]
} as const

/**
 * Manages will-change property for optimal performance
 */
export class WillChangeManager {
  private static activeElements = new WeakMap<HTMLElement, Set<string>>()

  static add(element: HTMLElement, properties: string[]) {
    if (!this.activeElements.has(element)) {
      this.activeElements.set(element, new Set())
    }
    
    const currentProps = this.activeElements.get(element)!
    properties.forEach(prop => currentProps.add(prop))
    
    element.style.willChange = Array.from(currentProps).join(', ')
  }

  static remove(element: HTMLElement, properties: string[]) {
    const currentProps = this.activeElements.get(element)
    if (!currentProps) return

    properties.forEach(prop => currentProps.delete(prop))
    
    if (currentProps.size === 0) {
      element.style.willChange = 'auto'
      this.activeElements.delete(element)
    } else {
      element.style.willChange = Array.from(currentProps).join(', ')
    }
  }

  static clear(element: HTMLElement) {
    element.style.willChange = 'auto'
    this.activeElements.delete(element)
  }
}

/**
 * Performance monitoring for animations
 */
export class AnimationPerformanceMonitor {
  private static frameCallbacks: Array<() => void> = []
  private static isRunning = false
  private static frameCount = 0
  private static lastTime = 0
  private static fps = 0

  static start() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.lastTime = performance.now()
    this.tick()
  }

  static stop() {
    this.isRunning = false
    this.frameCallbacks = []
  }

  private static tick() {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    
    this.frameCount++
    
    // Calculate FPS every second
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime)
      this.frameCount = 0
      this.lastTime = currentTime
      
      // Warn if performance is poor
      if (this.fps < 55) {
        console.warn(`Animation performance warning: FPS is ${this.fps}`)
      }
    }

    // Execute frame callbacks
    this.frameCallbacks.forEach(callback => callback())

    requestAnimationFrame(() => this.tick())
  }

  static getFPS(): number {
    return this.fps
  }

  static onFrame(callback: () => void) {
    this.frameCallbacks.push(callback)
    
    return () => {
      const index = this.frameCallbacks.indexOf(callback)
      if (index > -1) {
        this.frameCallbacks.splice(index, 1)
      }
    }
  }
}

/**
 * Debounced intersection observer for better performance
 */
export function createOptimizedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
) {
  let timeoutId: NodeJS.Timeout
  
  const debouncedCallback: IntersectionObserverCallback = (entries, observer) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => callback(entries, observer), 16) // ~60fps
  }

  return new IntersectionObserver(debouncedCallback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  })
}

/**
 * Optimized animation variants for different device capabilities
 */
export function getOptimizedVariants(deviceInfo: {
  isMobile: boolean
  isLowEnd: boolean
  prefersReducedMotion: boolean
}) {
  if (deviceInfo.prefersReducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2, ease: "easeOut" }
    }
  }

  if (deviceInfo.isLowEnd) {
    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3, ease: PERFORMANCE_EASINGS.smooth }
    }
  }

  return {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -30, scale: 0.95 },
    transition: PERFORMANCE_SPRINGS.smooth
  }
}

/**
 * Check if device is low-end based on various factors
 */
export function isLowEndDevice(): boolean {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4
  if (cores < 4) return true

  // Check memory (if available)
  const memory = (navigator as any).deviceMemory
  if (memory && memory < 4) return true

  // Check connection speed
  const connection = (navigator as any).connection
  if (connection) {
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      return true
    }
  }

  // Check user agent for known low-end devices
  const userAgent = navigator.userAgent.toLowerCase()
  const lowEndPatterns = [
    'android 4',
    'android 5',
    'android 6',
    'iphone os 12',
    'iphone os 13'
  ]

  return lowEndPatterns.some(pattern => userAgent.includes(pattern))
}

/**
 * Initialize performance optimizations
 */
export function initializeAnimationPerformance() {
  // Start performance monitoring in development
  if (process.env.NODE_ENV === 'development') {
    AnimationPerformanceMonitor.start()
  }

  // Apply CSS optimizations
  const style = document.createElement('style')
  style.textContent = `
    /* GPU acceleration hints */
    .gpu-accelerated {
      transform: translateZ(0);
      will-change: transform;
    }
    
    /* Optimize animations for better performance */
    .optimized-animation {
      backface-visibility: hidden;
      perspective: 1000px;
    }
    
    /* Reduce motion for accessibility */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `
  document.head.appendChild(style)
}