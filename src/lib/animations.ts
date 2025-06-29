import { Variants } from 'framer-motion'
import { PERFORMANCE_SPRINGS, createOptimizedMotionValues } from './animation-performance'

// Performance-optimized spring configurations
export const organicSpring = {
  ...PERFORMANCE_SPRINGS.smooth,
  stiffness: 100,
  damping: 15,
  mass: 0.8
}

export const quickSpring = {
  ...PERFORMANCE_SPRINGS.snappy,
  stiffness: 300,
  damping: 30,
  mass: 0.6
}

export const smoothSpring = {
  ...PERFORMANCE_SPRINGS.gentle,
  stiffness: 60,
  damping: 20,
  mass: 1.2
}

// Enhanced animation variants with organic motion and GPU optimization
export const fadeInUpVariants: Variants = {
  hidden: createOptimizedMotionValues({
    opacity: 0,
    y: 40,
    scale: 0.95
  }),
  visible: createOptimizedMotionValues({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...organicSpring,
      staggerChildren: 0.1
    }
  })
}

export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: organicSpring
  }
}

export const slideInLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -50,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: organicSpring
  }
}

export const slideInRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: organicSpring
  }
}

export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: organicSpring
  }
}

export const cardHoverVariants: Variants = {
  initial: createOptimizedMotionValues({
    y: 0,
    scale: 1,
    // Use filter instead of boxShadow for GPU acceleration
    filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
  }),
  hover: createOptimizedMotionValues({
    y: -8,
    scale: 1.02,
    filter: "drop-shadow(0 20px 25px rgba(0, 0, 0, 0.1))",
    transition: quickSpring
  }),
  tap: createOptimizedMotionValues({
    scale: 0.98,
    transition: { duration: 0.1 }
  })
}

export const magneticHoverVariants: Variants = {
  initial: { x: 0, y: 0 },
  hover: { 
    x: 0, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
}

export const buttonVariants: Variants = {
  initial: {
    scale: 1,
    y: 0
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: quickSpring
  },
  tap: {
    scale: 0.95,
    y: 0,
    transition: { duration: 0.1 }
  }
}

export const floatingVariants: Variants = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Stagger container variants for multiple children
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
      ...smoothSpring
    }
  }
}

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: organicSpring
  }
}

// Hero section specific animations
export const heroTitleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...organicSpring,
      delay: 0.2
    }
  }
}

export const heroSubtitleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...organicSpring,
      delay: 0.4
    }
  }
}

export const heroSearchVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...organicSpring,
      delay: 0.6
    }
  }
}

// Reduced motion alternatives
export const reducedMotionVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

export const getVariants = (reduceMotion: boolean, variants: Variants) => {
  return reduceMotion ? reducedMotionVariants : variants
}