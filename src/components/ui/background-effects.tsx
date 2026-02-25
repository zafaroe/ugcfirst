'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================
// GRID BACKGROUND
// ============================================

interface GridBackgroundProps {
  className?: string
  animated?: boolean
  children?: React.ReactNode
}

export function GridBackground({ className, animated = true, children }: GridBackgroundProps) {
  return (
    <div className={cn('relative min-h-screen overflow-hidden', className)}>
      {/* Animated grid pattern */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          animated ? 'bg-grid bg-grid-animated' : 'bg-grid'
        )}
      />

      {/* Gradient overlay at top */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-mint/5 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// ============================================
// FLOATING STARS / SPARKLES
// ============================================

interface FloatingStarsProps {
  count?: number
  className?: string
}

const starPositions = [
  { top: '10%', right: '5%', size: 4, delay: 0 },
  { top: '20%', right: '15%', size: 3, delay: 0.5 },
  { top: '15%', left: '10%', size: 3, delay: 1 },
  { top: '30%', left: '5%', size: 4, delay: 1.5 },
  { bottom: '25%', right: '8%', size: 3, delay: 2 },
  { bottom: '15%', left: '12%', size: 4, delay: 0.3 },
  { top: '45%', right: '3%', size: 3, delay: 0.8 },
  { bottom: '35%', left: '3%', size: 3, delay: 1.2 },
]

export function FloatingStars({ count = 8, className }: FloatingStarsProps) {
  const stars = starPositions.slice(0, count)

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {stars.map((star, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            top: star.top,
            right: star.right,
            left: star.left,
            bottom: star.bottom,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: star.delay, duration: 0.5 }}
        >
          <motion.div
            className="relative"
            animate={{
              y: [-5, 5, -5],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 3 + index * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Star size={star.size} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

interface StarProps {
  size?: number
  className?: string
}

function Star({ size = 4, className }: StarProps) {
  return (
    <svg
      width={size * 4}
      height={size * 4}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* 4-pointed star */}
      <path
        d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
        fill="url(#star-gradient)"
      />
      <defs>
        <linearGradient id="star-gradient" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ============================================
// GRADIENT ORB (Ambient Light Effect)
// ============================================

interface GradientOrbProps {
  color?: 'mint' | 'coral' | 'mixed' | 'indigo' | 'fuchsia'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  position?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  className?: string
  animated?: boolean
}

const orbSizes = {
  sm: 'w-32 h-32',
  md: 'w-64 h-64',
  lg: 'w-96 h-96',
  xl: 'w-[500px] h-[500px]',
}

const orbColors = {
  mint: 'from-mint/30 to-transparent',
  coral: 'from-coral/20 to-transparent',
  mixed: 'from-mint/15 to-transparent',
  indigo: 'from-mint/30 to-transparent',
  fuchsia: 'from-coral/20 to-transparent',
}

export function GradientOrb({
  color = 'indigo',
  size = 'lg',
  position = { top: '-10%', right: '-10%' },
  className,
  animated = true,
}: GradientOrbProps) {
  // Use consistent values to avoid hydration mismatch
  // CSS will handle the theme-specific appearance via opacity
  const isCoral = color === 'coral' || color === 'fuchsia'
  const gradient = isCoral
    ? 'radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)'

  return (
    <motion.div
      className={cn(
        'absolute rounded-full blur-3xl pointer-events-none',
        orbSizes[size],
        className
      )}
      style={{
        ...position,
        background: gradient,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={animated ? {
        opacity: [0.5, 0.8, 0.5],
        scale: [1, 1.1, 1],
      } : { opacity: 0.6, scale: 1 }}
      transition={animated ? {
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      } : { duration: 1 }}
    />
  )
}

// ============================================
// SPARKLE BURST (For celebrations/actions)
// ============================================

interface SparkleBurstProps {
  count?: number
  trigger?: boolean
  className?: string
}

export function SparkleBurst({ count = 8, trigger = false, className }: SparkleBurstProps) {
  if (!trigger) return null

  const particles = Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * 360,
    delay: i * 0.05,
    distance: 40 + Math.random() * 30,
  }))

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
          style={{
            background: index % 2 === 0 ? '#10B981' : '#34D399',
          }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
            y: Math.sin((particle.angle * Math.PI) / 180) * particle.distance,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.6,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// DECORATIVE CORNER STAR
// ============================================

interface CornerStarProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}

const cornerPositions = {
  'top-right': 'top-8 right-8',
  'top-left': 'top-8 left-8',
  'bottom-right': 'bottom-8 right-8',
  'bottom-left': 'bottom-8 left-8',
}

export function CornerStar({ position = 'bottom-right', className }: CornerStarProps) {
  return (
    <motion.div
      className={cn(
        'absolute pointer-events-none',
        cornerPositions[position],
        className
      )}
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          {/* Multi-pointed decorative star */}
          <path
            d="M24 0L26 18L44 16L30 24L44 32L26 30L24 48L22 30L4 32L18 24L4 16L22 18L24 0Z"
            fill="url(#corner-star-gradient)"
            opacity="0.6"
          />
          <defs>
            <linearGradient id="corner-star-gradient" x1="4" y1="4" x2="44" y2="44">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </motion.div>
  )
}

// ============================================
// WAVE DECORATION (For bottom of sections)
// ============================================

interface WaveDecorationProps {
  className?: string
  color?: string
}

export function WaveDecoration({ className, color = '#FAFAF9' }: WaveDecorationProps) {
  return (
    <div className={cn('absolute bottom-0 left-0 right-0 pointer-events-none', className)}>
      <svg
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        preserveAspectRatio="none"
      >
        <path
          d="M0 50L48 45.8C96 41.7 192 33.3 288 37.5C384 41.7 480 58.3 576 62.5C672 66.7 768 58.3 864 50C960 41.7 1056 33.3 1152 35.4C1248 37.5 1344 50 1392 56.3L1440 62.5V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z"
          fill={color}
        />
      </svg>
    </div>
  )
}

// ============================================
// FLOATING ORBS (Large ambient orbs for light sections)
// ============================================

interface FloatingOrbsProps {
  count?: number
  className?: string
  color?: 'mint' | 'mixed'
}

// Deterministic positions for SSR safety
const orbConfigs = [
  { x: '10%', y: '20%', size: 400, duration: 25, delay: 0 },
  { x: '80%', y: '60%', size: 350, duration: 30, delay: 2 },
  { x: '50%', y: '80%', size: 300, duration: 22, delay: 1 },
  { x: '25%', y: '50%', size: 280, duration: 28, delay: 3 },
  { x: '70%', y: '15%', size: 320, duration: 26, delay: 1.5 },
]

export function FloatingOrbs({ count = 3, className, color = 'mint' }: FloatingOrbsProps) {
  const orbs = orbConfigs.slice(0, count)

  // Consistent gradient that works for both themes
  const gradient = color === 'mint'
    ? 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.04) 50%, transparent 70%)'

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: gradient,
            filter: 'blur(40px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.1, 0.95, 1],
            opacity: [0.5, 0.8, 0.4, 0.5],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// GLOWING GRID (Animated dot grid pattern)
// ============================================

interface GlowingGridProps {
  className?: string
  dotCount?: number
  color?: 'mint' | 'white'
}

// Deterministic grid positions
const gridDots = Array.from({ length: 24 }, (_, i) => ({
  x: (i % 6) * 20 + 5, // 6 columns, 20% spacing
  y: Math.floor(i / 6) * 25 + 10, // 4 rows, 25% spacing
  delay: (i % 5) * 0.4,
  duration: 3 + (i % 3),
}))

export function GlowingGrid({ className, dotCount = 24, color = 'mint' }: GlowingGridProps) {
  const dots = gridDots.slice(0, dotCount)

  // Consistent color for both themes
  const dotColor = color === 'mint' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.25)'

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            backgroundColor: dotColor,
          }}
          animate={{
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: dot.delay,
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// WAVE LINES (Flowing animated SVG lines)
// ============================================

interface WaveLinesProps {
  className?: string
  position?: 'top' | 'bottom'
  color?: 'mint' | 'white'
}

export function WaveLines({ className, position = 'bottom', color = 'mint' }: WaveLinesProps) {
  // Consistent color for both themes
  const strokeColor = color === 'mint' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.15)'

  return (
    <div
      className={cn(
        'absolute left-0 right-0 h-32 pointer-events-none overflow-hidden',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {/* Line 1 */}
        <motion.path
          d="M0,60 Q300,20 600,60 T1200,60"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        {/* Line 2 - offset */}
        <motion.path
          d="M0,80 Q300,40 600,80 T1200,80"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.75 }}
          transition={{ duration: 2.5, delay: 0.3, ease: 'easeInOut' }}
        />
        {/* Line 3 - offset */}
        <motion.path
          d="M0,40 Q300,0 600,40 T1200,40"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.55 }}
          transition={{ duration: 3, delay: 0.6, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  )
}

// ============================================
// AMBIENT PARTICLES (Lighter version for light backgrounds)
// ============================================

interface AmbientParticlesProps {
  count?: number
  className?: string
  color?: 'mint' | 'dark'
}

// Deterministic particle positions
const ambientParticleConfigs = Array.from({ length: 15 }, (_, i) => ({
  x: ((i * 7) % 100),
  y: ((i * 13) % 100),
  size: 2 + (i % 3),
  duration: 5 + (i % 4) * 2,
  delay: (i % 6) * 0.8,
  yOffset: -20 - (i % 4) * 10,
}))

export function AmbientParticles({ count = 12, className, color = 'mint' }: AmbientParticlesProps) {
  const particles = ambientParticleConfigs.slice(0, count)

  // Consistent color for both themes
  const particleColor = color === 'mint' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(128, 128, 128, 0.12)'

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: particleColor,
          }}
          animate={{
            y: [0, p.yOffset, 0],
            opacity: [0.25, 0.6, 0.25],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// PULSE RINGS (Expanding rings from center)
// ============================================

interface PulseRingsProps {
  className?: string
  count?: number
  color?: 'mint' | 'coral'
}

export function PulseRings({ className, count = 3, color = 'mint' }: PulseRingsProps) {
  const ringColor = color === 'mint' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'

  return (
    <div className={cn('absolute inset-0 flex items-center justify-center pointer-events-none', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            borderColor: ringColor,
            width: 100 + i * 100,
            height: 100 + i * 100,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1.2,
          }}
        />
      ))}
    </div>
  )
}
