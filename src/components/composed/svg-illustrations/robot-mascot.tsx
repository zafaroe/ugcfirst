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
          {/* Body gradient - visible against dark background */}
          <linearGradient id="robot-body-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3F4F3F" />
            <stop offset="50%" stopColor="#2D3D2D" />
            <stop offset="100%" stopColor="#1F2F1F" />
          </linearGradient>

          {/* Body highlight - top lighting effect */}
          <linearGradient id="robot-body-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5A6B5A" />
            <stop offset="40%" stopColor="#3F4F3F" />
            <stop offset="100%" stopColor="#2D3D2D" />
          </linearGradient>

          {/* Accent gradient - mint from design system */}
          <linearGradient id="robot-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Soft metallic highlight */}
          <linearGradient id="robot-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6B7B6B" />
            <stop offset="100%" stopColor="#4A5A4A" />
          </linearGradient>

          {/* Eye glow - vibrant mint */}
          <radialGradient id="eye-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="50%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </radialGradient>

          {/* Screen glass effect */}
          <linearGradient id="screen-glass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A2A1A" />
            <stop offset="100%" stopColor="#0D1D0D" />
          </linearGradient>

          {/* Antenna orb glow - bright mint */}
          <radialGradient id="antenna-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="60%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </radialGradient>

          {/* Ambient glow for depth */}
          <radialGradient id="ambient-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#10B981" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>

          {/* Soft outer glow filter */}
          <filter id="soft-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense glow for eyes */}
          <filter id="eye-filter" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Rim light effect - mint edge glow */}
          <linearGradient id="rim-light-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#34D399" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
          </linearGradient>

          {/* Drop shadow filter */}
          <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Ambient glow behind robot */}
        <motion.ellipse
          cx="100"
          cy="115"
          rx="80"
          ry="60"
          fill="url(#ambient-glow)"
          animate={animated ? {
            opacity: [0.8, 1, 0.8],
            rx: [75, 85, 75]
          } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Main robot group with drop shadow */}
        <g filter="url(#drop-shadow)">
          {/* Antenna group */}
          <motion.g
            animate={animated ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Antenna stem */}
            <rect x="96" y="28" width="8" height="18" rx="4" fill="url(#robot-highlight)" />

            {/* Antenna ring */}
            <circle cx="100" cy="28" r="6" fill="none" stroke="#5A6B5A" strokeWidth="2" />

            {/* Antenna orb */}
            <motion.circle
              cx="100"
              cy="18"
              r="8"
              fill="url(#antenna-glow)"
              filter="url(#soft-glow)"
              animate={animated ? {
                scale: [1, 1.1, 1],
                opacity: [0.9, 1, 0.9]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Antenna orb inner highlight */}
            <circle cx="97" cy="15" r="3" fill="white" opacity="0.7" />
          </motion.g>

          {/* Head */}
          <motion.g
            animate={animated ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Head main shape */}
            <rect x="52" y="45" width="96" height="74" rx="22" fill="url(#robot-body-highlight)" />

            {/* Head top rim light */}
            <rect x="52" y="45" width="96" height="30" rx="22" fill="url(#rim-light-top)" />

            {/* Head edge highlight - left */}
            <rect x="52" y="55" width="3" height="50" rx="1.5" fill="#10B981" opacity="0.2" />

            {/* Head edge highlight - right */}
            <rect x="145" y="55" width="3" height="50" rx="1.5" fill="#10B981" opacity="0.2" />

            {/* Face screen bezel */}
            <rect x="62" y="54" width="76" height="56" rx="14" fill="#1A2A1A" />

            {/* Face screen */}
            <rect x="65" y="57" width="70" height="50" rx="12" fill="url(#screen-glass)" />

            {/* Screen subtle reflection */}
            <rect x="68" y="60" width="35" height="5" rx="2.5" fill="white" opacity="0.08" />

            {/* Left eye */}
            <motion.g
              animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
              style={{ transformOrigin: '84px 82px' }}
            >
              <ellipse
                cx="84"
                cy="82"
                rx="12"
                ry="14"
                fill="url(#eye-glow)"
                filter="url(#eye-filter)"
              />
              {/* Eye highlight */}
              <ellipse cx="80" cy="77" rx="5" ry="6" fill="white" opacity="0.5" />
            </motion.g>

            {/* Right eye */}
            <motion.g
              animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
              style={{ transformOrigin: '116px 82px' }}
            >
              <ellipse
                cx="116"
                cy="82"
                rx="12"
                ry="14"
                fill="url(#eye-glow)"
                filter="url(#eye-filter)"
              />
              {/* Eye highlight */}
              <ellipse cx="112" cy="77" rx="5" ry="6" fill="white" opacity="0.5" />
            </motion.g>

            {/* Mouth - friendly smile */}
            <motion.path
              d="M86 98 Q100 108 114 98"
              stroke="#34D399"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              filter="url(#soft-glow)"
              animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Side panels (ears) */}
            <rect x="40" y="66" width="16" height="32" rx="8" fill="url(#robot-highlight)" />
            <rect x="144" y="66" width="16" height="32" rx="8" fill="url(#robot-highlight)" />

            {/* Ear accent lights */}
            <motion.circle
              cx="48"
              cy="82"
              r="4"
              fill="#34D399"
              filter="url(#soft-glow)"
              animate={animated ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.circle
              cx="152"
              cy="82"
              r="4"
              fill="#34D399"
              filter="url(#soft-glow)"
              animate={animated ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.g>

          {/* Body */}
          <motion.g
            animate={animated ? { y: [0, -1, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          >
            {/* Body main */}
            <rect x="56" y="120" width="88" height="58" rx="16" fill="url(#robot-body-highlight)" />

            {/* Body top rim light */}
            <rect x="56" y="120" width="88" height="25" rx="16" fill="url(#rim-light-top)" />

            {/* Body edge highlights */}
            <rect x="56" y="130" width="3" height="35" rx="1.5" fill="#10B981" opacity="0.15" />
            <rect x="141" y="130" width="3" height="35" rx="1.5" fill="#10B981" opacity="0.15" />

            {/* Chest panel bezel */}
            <rect x="72" y="130" width="56" height="38" rx="10" fill="#1A2A1A" />

            {/* Chest panel screen */}
            <rect x="75" y="133" width="50" height="32" rx="8" fill="url(#screen-glass)" />

            {/* Chest status indicators */}
            <motion.circle
              cx="88"
              cy="146"
              r="5"
              fill="#34D399"
              filter="url(#soft-glow)"
              animate={animated ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.circle
              cx="100"
              cy="146"
              r="5"
              fill="#34D399"
              filter="url(#soft-glow)"
              animate={animated ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.circle
              cx="112"
              cy="146"
              r="5"
              fill="#34D399"
              filter="url(#soft-glow)"
              animate={animated ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />

            {/* Progress bar container */}
            <rect x="82" y="157" width="36" height="4" rx="2" fill="#0D1D0D" />

            {/* Progress bar fill */}
            <motion.rect
              x="82"
              y="157"
              height="4"
              rx="2"
              fill="url(#robot-accent)"
              animate={animated ? { width: [0, 36, 0] } : { width: 24 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>

          {/* Arms */}
          {/* Left arm */}
          <motion.g
            animate={animated ? { rotate: [-5, 5, -5] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '52px 130px' }}
          >
            <rect x="30" y="123" width="26" height="40" rx="13" fill="url(#robot-highlight)" />
            {/* Hand */}
            <circle cx="43" cy="168" r="12" fill="url(#robot-body-main)" />
            <circle cx="43" cy="168" r="8" fill="#1A2A1A" />
            <motion.circle
              cx="43"
              cy="168"
              r="4"
              fill="#34D399"
              filter="url(#soft-glow)"
              animate={animated ? { opacity: [0.4, 0.8, 0.4] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.g>

          {/* Right arm */}
          <motion.g
            animate={animated ? { rotate: [5, -5, 5] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '148px 130px' }}
          >
            <rect x="144" y="123" width="26" height="40" rx="13" fill="url(#robot-highlight)" />
            {/* Hand */}
            <circle cx="157" cy="168" r="12" fill="url(#robot-body-main)" />
            <circle cx="157" cy="168" r="8" fill="#1A2A1A" />
            <motion.circle
              cx="157"
              cy="168"
              r="4"
              fill="#34D399"
              filter="url(#soft-glow)"
              animate={animated ? { opacity: [0.8, 0.4, 0.8] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.g>
        </g>
      </svg>

      {/* Floating UI elements around robot */}
      {animated && (
        <>
          {/* Video play indicator - top right */}
          <motion.div
            className="absolute -right-1 top-[28%]"
            animate={{ y: [-4, 4, -4], x: [0, 2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                <path d="M3 1.5L10 6L3 10.5V1.5Z" />
              </svg>
            </div>
          </motion.div>

          {/* Recording indicator - top left */}
          <motion.div
            className="absolute -left-3 top-[30%]"
            animate={{ y: [3, -3, 3], rotate: [-3, 3, -3] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-10 h-7 rounded-md bg-neutral-800/95 border border-neutral-600/60 flex items-center justify-center gap-1.5 backdrop-blur-sm shadow-lg">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <div className="w-3.5 h-0.5 bg-neutral-500 rounded" />
            </div>
          </motion.div>

          {/* Sparkle accent - bottom right */}
          <motion.div
            className="absolute right-3 bottom-[28%]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7], rotate: [0, 20, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0L9 7L16 8L9 9L8 16L7 9L0 8L7 7L8 0Z" fill="#34D399" />
            </svg>
          </motion.div>

          {/* Floating dots */}
          <motion.div
            className="absolute left-[12%] bottom-[22%] w-2 h-2 rounded-full bg-emerald-400/70"
            animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute right-[18%] top-[15%] w-1.5 h-1.5 rounded-full bg-emerald-400/50"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
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
        <linearGradient id="robot-icon-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A5A4A" />
          <stop offset="100%" stopColor="#2D3D2D" />
        </linearGradient>
        <linearGradient id="robot-icon-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="16" height="12" rx="3" fill="url(#robot-icon-body)" />
      <circle cx="9" cy="13" r="2.5" fill="url(#robot-icon-accent)" />
      <circle cx="15" cy="13" r="2.5" fill="url(#robot-icon-accent)" />
      <rect x="11" y="3" width="2" height="5" rx="1" fill="#5A6B5A" />
      <circle cx="12" cy="2" r="2.5" fill="url(#robot-icon-accent)" />
    </svg>
  )
}
