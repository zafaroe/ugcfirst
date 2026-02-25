'use client'

import { motion, AnimatePresence, type HTMLMotionProps, type Variants } from 'framer-motion'
import { forwardRef } from 'react'

// ============================================
// ANIMATION PRESETS
// ============================================

export const DURATIONS = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const

export const EASINGS = {
  ease: [0.25, 0.1, 0.25, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
} as const

export const SPRING = {
  gentle: { type: 'spring' as const, stiffness: 120, damping: 20 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  stiff: { type: 'spring' as const, stiffness: 600, damping: 35 },
}

// ============================================
// ANIMATION VARIANTS
// ============================================

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
}

// Stagger container variants
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
    },
  },
}

// ============================================
// MOTION COMPONENTS
// ============================================

interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number
  duration?: number
  children: React.ReactNode
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, duration = DURATIONS.normal, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInVariants}
      transition={{ duration, delay, ease: EASINGS.easeOut }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
FadeIn.displayName = 'FadeIn'

interface SlideUpProps extends HTMLMotionProps<'div'> {
  delay?: number
  duration?: number
  children: React.ReactNode
}

export const SlideUp = forwardRef<HTMLDivElement, SlideUpProps>(
  ({ children, delay = 0, duration = DURATIONS.normal, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideUpVariants}
      transition={{ duration, delay, ease: EASINGS.easeOut }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
SlideUp.displayName = 'SlideUp'

interface SlideDownProps extends HTMLMotionProps<'div'> {
  delay?: number
  duration?: number
  children: React.ReactNode
}

export const SlideDown = forwardRef<HTMLDivElement, SlideDownProps>(
  ({ children, delay = 0, duration = DURATIONS.normal, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideDownVariants}
      transition={{ duration, delay, ease: EASINGS.easeOut }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
SlideDown.displayName = 'SlideDown'

interface ScaleInProps extends HTMLMotionProps<'div'> {
  delay?: number
  duration?: number
  children: React.ReactNode
}

export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  ({ children, delay = 0, duration = DURATIONS.normal, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleInVariants}
      transition={{ duration, delay, ease: EASINGS.easeOut }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
ScaleIn.displayName = 'ScaleIn'

// Stagger Container - wraps items that should stagger in
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  staggerDelay?: number
  initialDelay?: number
  children: React.ReactNode
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, staggerDelay = 0.1, initialDelay = 0.1, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
StaggerContainer.displayName = 'StaggerContainer'

// Stagger Item - individual items within a StaggerContainer
interface StaggerItemProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerItemVariants}
      {...props}
    >
      {children}
    </motion.div>
  )
)
StaggerItem.displayName = 'StaggerItem'

// ============================================
// HOVER/TAP PRESETS
// ============================================

export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: SPRING.bouncy,
}

export const hoverLift = {
  whileHover: { y: -4, boxShadow: '0 10px 40px rgba(16, 185, 129, 0.2)' },
  transition: { duration: DURATIONS.fast },
}

export const hoverGlow = {
  whileHover: { boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' },
  transition: { duration: DURATIONS.fast },
}

// ============================================
// MICRO-INTERACTION VARIANTS
// ============================================

// Path drawing animation variant
export const pathDrawVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.8, ease: 'easeInOut' },
      opacity: { duration: 0.2 },
    },
  },
}

// Sparkle burst variant for celebrations
export const sparkleBurstVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: [0, 1.2, 0],
    opacity: [0, 1, 0],
    x: Math.cos((i / 8) * Math.PI * 2) * 30,
    y: Math.sin((i / 8) * Math.PI * 2) * 30,
    transition: {
      duration: 0.6,
      delay: i * 0.05,
      ease: 'easeOut',
    },
  }),
}

// Pulse glow variant for energy effects
export const pulseGlowVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: [1, 1.3, 1],
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Energy ripple variant
export const energyRippleVariants: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: [0.5, 1.5],
    opacity: [0.6, 0],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeOut',
    },
  },
}

// Floating particle variant
export const floatingParticleVariants: Variants = {
  hidden: { y: 0, opacity: 0 },
  visible: (i: number) => ({
    y: [-5, 5, -5],
    opacity: [0.3, 0.8, 0.3],
    transition: {
      y: {
        duration: 2 + i * 0.3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
      opacity: {
        duration: 2 + i * 0.3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }),
}

// Magic wand wave variant
export const wandWaveVariants: Variants = {
  idle: {
    rotate: [-8, 8, -8],
    x: [0, 3, -3, 0],
    y: [0, -2, 2, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  active: {
    rotate: [-15, 25, -10, 20, -15],
    x: [0, 8, -5, 6, 0],
    y: [0, -8, 3, -5, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Scan line variant for analyzing
export const scanLineVariants: Variants = {
  hidden: { y: 0, opacity: 0 },
  visible: {
    y: [0, 30, 0],
    opacity: [0, 1, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

// Waveform bar variant for audio
export const waveformBarVariants: Variants = {
  hidden: { scaleY: 0.3 },
  visible: (i: number) => ({
    scaleY: [0.3, 1, 0.5, 0.8, 0.3],
    transition: {
      duration: 0.8 + Math.random() * 0.4,
      repeat: Infinity,
      delay: i * 0.1,
      ease: 'easeInOut',
    },
  }),
}

// Film frame slide variant
export const filmFrameVariants: Variants = {
  hidden: { x: -50, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      delay: i * 0.15,
      ease: 'easeOut',
    },
  }),
}

// Checkmark draw variant
export const checkmarkDrawVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: 'easeOut' },
      opacity: { duration: 0.1 },
    },
  },
}

// Circuit node activation variant
export const circuitNodeVariants: Variants = {
  idle: {
    scale: 1,
    opacity: 0.5,
  },
  active: (i: number) => ({
    scale: [1, 1.5, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      delay: i * 0.2,
      ease: 'easeInOut',
    },
  }),
}

// Data particle flow variant
export const dataFlowVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: [0, 1, 0],
    opacity: [0, 1, 0],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      delay: i * 0.15,
      ease: 'linear',
    },
  }),
}

// ============================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================

export { motion, AnimatePresence }
export type { Variants }
