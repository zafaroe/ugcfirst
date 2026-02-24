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
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-electric-indigo/5 via-vibrant-fuchsia/3 to-transparent pointer-events-none" />

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
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ============================================
// GRADIENT ORB (Ambient Light Effect)
// ============================================

interface GradientOrbProps {
  color?: 'indigo' | 'fuchsia' | 'mixed'
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
  indigo: 'from-electric-indigo/30 to-transparent',
  fuchsia: 'from-vibrant-fuchsia/30 to-transparent',
  mixed: 'from-electric-indigo/20 via-vibrant-fuchsia/20 to-transparent',
}

export function GradientOrb({
  color = 'indigo',
  size = 'lg',
  position = { top: '-10%', right: '-10%' },
  className,
  animated = true,
}: GradientOrbProps) {
  return (
    <motion.div
      className={cn(
        'absolute rounded-full blur-3xl pointer-events-none bg-radial-gradient',
        orbSizes[size],
        `bg-gradient-radial ${orbColors[color]}`,
        className
      )}
      style={{
        ...position,
        background: color === 'mixed'
          ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(217, 70, 239, 0.1) 40%, transparent 70%)'
          : color === 'indigo'
          ? 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(217, 70, 239, 0.2) 0%, transparent 70%)',
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
            background: index % 2 === 0 ? '#6366F1' : '#D946EF',
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
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#D946EF" />
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

export function WaveDecoration({ className, color = '#1E293B' }: WaveDecorationProps) {
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
