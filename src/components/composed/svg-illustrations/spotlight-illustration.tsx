'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SpotlightIllustrationProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

const sizes = {
  sm: { width: 120, height: 120 },
  md: { width: 160, height: 160 },
  lg: { width: 200, height: 200 },
}

// Animation timing constants
const GLOW_DURATION = 2.5
const SPARKLE_DURATION = 3.0
const BEAM_DURATION = 4.0

export function SpotlightIllustration({ size = 'lg', animated = true, className }: SpotlightIllustrationProps) {
  const { width, height } = sizes[size]

  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Primary gradient - warm gold/amber for spotlight */}
          <linearGradient id="spotlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>

          {/* Light beam gradient */}
          <linearGradient id="beamGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </linearGradient>

          {/* Radial glow for product */}
          <radialGradient id="productGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </radialGradient>

          {/* Strong glow filter */}
          <filter id="spotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft glow */}
          <filter id="softSpotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ===== LIGHT BEAMS ===== */}
        <motion.g
          animate={animated ? { opacity: [0.3, 0.6, 0.3] } : {}}
          transition={animated ? { duration: BEAM_DURATION, repeat: Infinity, ease: "easeInOut" } : {}}
        >
          {/* Center beam */}
          <polygon
            points="100,30 85,90 115,90"
            fill="url(#beamGrad)"
            opacity="0.5"
          />
          {/* Left beam */}
          <polygon
            points="100,30 50,100 75,105"
            fill="url(#beamGrad)"
            opacity="0.3"
          />
          {/* Right beam */}
          <polygon
            points="100,30 125,105 150,100"
            fill="url(#beamGrad)"
            opacity="0.3"
          />
        </motion.g>

        {/* ===== SPOTLIGHT SOURCE (top circle) ===== */}
        <motion.circle
          cx="100"
          cy="25"
          r="12"
          fill="url(#spotlightGrad)"
          filter="url(#spotGlow)"
          animate={animated ? {
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          } : {}}
          transition={animated ? {
            duration: GLOW_DURATION,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
          style={{ transformOrigin: '100px 25px' }}
        />

        {/* ===== PRODUCT BOX (center stage) ===== */}
        <g>
          {/* Glow behind product */}
          <motion.ellipse
            cx="100"
            cy="130"
            rx="45"
            ry="25"
            fill="url(#productGlow)"
            animate={animated ? {
              opacity: [0.3, 0.6, 0.3],
              rx: [45, 50, 45],
              ry: [25, 28, 25]
            } : {}}
            transition={animated ? {
              duration: GLOW_DURATION,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          />

          {/* Product box - 3D isometric style */}
          <motion.g
            animate={animated ? {
              y: [0, -3, 0]
            } : {}}
            transition={animated ? {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          >
            {/* Box front face */}
            <path
              d="M70,105 L70,145 L100,160 L130,145 L130,105 L100,90 Z"
              fill="#FAFAF9"
              stroke="url(#spotlightGrad)"
              strokeWidth="2"
            />
            {/* Box top face */}
            <path
              d="M70,105 L100,90 L130,105 L100,120 Z"
              fill="#F5F5F4"
              stroke="url(#spotlightGrad)"
              strokeWidth="2"
            />
            {/* Box side face highlight */}
            <path
              d="M100,120 L100,160 L130,145 L130,105 Z"
              fill="#E7E5E4"
              stroke="url(#spotlightGrad)"
              strokeWidth="2"
            />
            {/* Decorative line on box */}
            <line
              x1="85"
              y1="125"
              x2="100"
              y2="135"
              stroke="url(#spotlightGrad)"
              strokeWidth="1.5"
              opacity="0.6"
            />
          </motion.g>
        </g>

        {/* ===== SPARKLES ===== */}
        {animated && (
          <>
            <motion.circle
              cx="55"
              cy="75"
              r="2.5"
              fill="#FBBF24"
              filter="url(#softSpotGlow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: SPARKLE_DURATION,
                repeat: Infinity,
                delay: 0.5,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="145"
              cy="80"
              r="2"
              fill="#F97316"
              filter="url(#softSpotGlow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.7, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: SPARKLE_DURATION,
                repeat: Infinity,
                delay: 1.2,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="65"
              cy="160"
              r="1.5"
              fill="#FBBF24"
              filter="url(#softSpotGlow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1.2, 0]
              }}
              transition={{
                duration: SPARKLE_DURATION,
                repeat: Infinity,
                delay: 2.0,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="140"
              cy="155"
              r="2"
              fill="#F59E0B"
              filter="url(#softSpotGlow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: SPARKLE_DURATION,
                repeat: Infinity,
                delay: 0.8,
                ease: "easeInOut"
              }}
            />
            {/* Star sparkle */}
            <motion.polygon
              points="100,165 102,170 107,170 103,174 105,179 100,176 95,179 97,174 93,170 98,170"
              fill="#FBBF24"
              filter="url(#softSpotGlow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 180]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: 1.5,
                ease: "easeInOut"
              }}
              style={{ transformOrigin: '100px 172px' }}
            />
          </>
        )}

        {/* ===== REFLECTION LINE (stage/surface) ===== */}
        <motion.line
          x1="45"
          y1="170"
          x2="155"
          y2="170"
          stroke="url(#spotlightGrad)"
          strokeWidth="1.5"
          opacity="0.4"
          strokeLinecap="round"
          animate={animated ? {
            opacity: [0.2, 0.5, 0.2]
          } : {}}
          transition={animated ? {
            duration: GLOW_DURATION,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        />
      </svg>
    </div>
  )
}
