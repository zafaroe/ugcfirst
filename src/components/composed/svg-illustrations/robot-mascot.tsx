'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RobotMascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  className?: string
}

const sizes = {
  sm: { width: 120, height: 120 },
  md: { width: 180, height: 180 },
  lg: { width: 240, height: 240 },
  xl: { width: 320, height: 320 },
}

export function RobotMascot({ size = 'lg', animated = true, className }: RobotMascotProps) {
  const { width, height } = sizes[size]

  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Main gradient */}
          <linearGradient id="robot-body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>

          {/* Highlight gradient */}
          <linearGradient id="robot-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Eye glow */}
          <radialGradient id="eye-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Antenna base */}
        <motion.g
          animate={animated ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Antenna stick */}
          <rect x="96" y="25" width="8" height="20" rx="4" fill="url(#robot-body-gradient)" />

          {/* Antenna orb */}
          <motion.circle
            cx="100"
            cy="20"
            r="8"
            fill="url(#eye-glow)"
            filter="url(#glow)"
            animate={animated ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.g>

        {/* Head */}
        <motion.g
          animate={animated ? { y: [0, -2, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Head shape */}
          <rect x="55" y="45" width="90" height="70" rx="20" fill="url(#robot-body-gradient)" />

          {/* Face plate */}
          <rect x="65" y="55" width="70" height="50" rx="12" fill="#FAFAF9" opacity="0.9" />

          {/* Left eye */}
          <motion.ellipse
            cx="82"
            cy="80"
            rx="10"
            ry="12"
            fill="url(#eye-glow)"
            filter="url(#glow)"
            animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          />

          {/* Right eye */}
          <motion.ellipse
            cx="118"
            cy="80"
            rx="10"
            ry="12"
            fill="url(#eye-glow)"
            filter="url(#glow)"
            animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
          />

          {/* Smile */}
          <path
            d="M85 95 Q100 105 115 95"
            stroke="#34D399"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Ear pieces */}
          <rect x="45" y="65" width="12" height="30" rx="6" fill="url(#robot-highlight)" />
          <rect x="143" y="65" width="12" height="30" rx="6" fill="url(#robot-highlight)" />
        </motion.g>

        {/* Body */}
        <motion.g
          animate={animated ? { y: [0, -1, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        >
          {/* Main body */}
          <rect x="60" y="120" width="80" height="55" rx="15" fill="url(#robot-body-gradient)" />

          {/* Chest panel */}
          <rect x="75" y="130" width="50" height="35" rx="8" fill="#FAFAF9" opacity="0.9" />

          {/* Chest lights */}
          <motion.circle
            cx="90"
            cy="145"
            r="5"
            fill="#10B981"
            animate={animated ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.circle
            cx="110"
            cy="145"
            r="5"
            fill="#10B981"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />

          {/* Progress bar on chest */}
          <rect x="82" y="155" width="36" height="4" rx="2" fill="#0C0A09" />
          <motion.rect
            x="82"
            y="155"
            height="4"
            rx="2"
            fill="url(#robot-body-gradient)"
            animate={animated ? { width: [0, 36, 0] } : { width: 24 }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.g>

        {/* Arms */}
        {/* Left arm */}
        <motion.g
          animate={animated ? { rotate: [-5, 5, -5] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '55px 130px' }}
        >
          <rect x="35" y="125" width="25" height="40" rx="10" fill="url(#robot-highlight)" />
          <circle cx="47" cy="170" r="10" fill="url(#robot-body-gradient)" />
        </motion.g>

        {/* Right arm - holding tablet */}
        <motion.g
          animate={animated ? { rotate: [5, -5, 5] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '145px 130px' }}
        >
          <rect x="140" y="125" width="25" height="40" rx="10" fill="url(#robot-highlight)" />
          <circle cx="153" cy="170" r="10" fill="url(#robot-body-gradient)" />
        </motion.g>
      </svg>

      {/* Floating elements around robot */}
      {animated && (
        <>
          {/* Play button */}
          <motion.div
            className="absolute -right-2 top-1/4"
            animate={{ y: [-5, 5, -5], x: [0, 3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mint to-mint-dark flex items-center justify-center shadow-lg">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                <path d="M2 1L10 6L2 11V1Z" />
              </svg>
            </div>
          </motion.div>

          {/* Video frame */}
          <motion.div
            className="absolute -left-4 top-1/3"
            animate={{ y: [5, -5, 5], rotate: [-5, 5, -5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-10 h-7 rounded border-2 border-coral/60 bg-surface/80 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-coral" />
            </div>
          </motion.div>

          {/* Sparkle */}
          <motion.div
            className="absolute right-0 bottom-1/4"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0L9 7L16 8L9 9L8 16L7 9L0 8L7 7L8 0Z" fill="#F43F5E" />
            </svg>
          </motion.div>
        </>
      )}
    </div>
  )
}

// Simpler version for smaller uses
export function RobotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-6 h-6', className)}
    >
      <defs>
        <linearGradient id="robot-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="16" height="12" rx="3" fill="url(#robot-icon-gradient)" />
      <circle cx="9" cy="14" r="2" fill="white" />
      <circle cx="15" cy="14" r="2" fill="white" />
      <rect x="11" y="3" width="2" height="5" rx="1" fill="url(#robot-icon-gradient)" />
      <circle cx="12" cy="2" r="2" fill="#34D399" />
    </svg>
  )
}
