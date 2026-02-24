'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface EmptyStateArtProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

const sizes = {
  sm: { width: 150, height: 150 },
  md: { width: 220, height: 220 },
  lg: { width: 300, height: 300 },
}

export function EmptyStateArt({ size = 'lg', animated = true, className }: EmptyStateArtProps) {
  const { width, height } = sizes[size]

  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      <svg
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="empty-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#D946EF" />
          </linearGradient>
          <linearGradient id="empty-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <radialGradient id="empty-eye-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F5FF" />
            <stop offset="100%" stopColor="#00D4E8" />
          </radialGradient>
          <filter id="empty-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Central Robot - simplified cute version */}
        <motion.g
          animate={animated ? { y: [0, -5, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Robot body */}
          <rect x="110" y="130" width="80" height="70" rx="20" fill="url(#empty-gradient)" />

          {/* Robot head */}
          <rect x="115" y="80" width="70" height="55" rx="16" fill="url(#empty-gradient)" />

          {/* Face screen */}
          <rect x="125" y="90" width="50" height="35" rx="10" fill="#1E293B" />

          {/* Eyes */}
          <motion.ellipse
            cx="140"
            cy="107"
            rx="7"
            ry="9"
            fill="url(#empty-eye-glow)"
            filter="url(#empty-glow)"
            animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
          />
          <motion.ellipse
            cx="160"
            cy="107"
            rx="7"
            ry="9"
            fill="url(#empty-eye-glow)"
            filter="url(#empty-glow)"
            animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
          />

          {/* Antenna */}
          <rect x="147" y="60" width="6" height="20" rx="3" fill="url(#empty-gradient)" />
          <motion.circle
            cx="150"
            cy="55"
            r="8"
            fill="url(#empty-eye-glow)"
            filter="url(#empty-glow)"
            animate={animated ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Chest panel */}
          <rect x="130" y="145" width="40" height="30" rx="6" fill="#1E293B" />

          {/* Heart/loading indicator on chest */}
          <motion.path
            d="M150 152C147 149 142 149 140 153C138 157 150 167 150 167C150 167 162 157 160 153C158 149 153 149 150 152Z"
            fill="url(#empty-gradient)"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ transformOrigin: '150px 160px' }}
          />

          {/* Arms down (sad/waiting pose) */}
          <rect x="85" y="140" width="25" height="12" rx="6" fill="url(#empty-gradient-2)" />
          <rect x="190" y="140" width="25" height="12" rx="6" fill="url(#empty-gradient-2)" />
        </motion.g>

        {/* Floating video camera - waiting to be used */}
        <motion.g
          animate={animated ? { y: [-8, 8, -8], x: [0, 5, 0], rotate: [-5, 5, -5] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="40" y="90" width="50" height="35" rx="8" fill="#1E293B" stroke="url(#empty-gradient)" strokeWidth="2" opacity="0.7" />
          <circle cx="65" cy="107" r="10" fill="#0F172A" stroke="#6366F1" strokeWidth="2" opacity="0.7" />
          <rect x="90" y="95" width="15" height="10" rx="2" fill="#1E293B" stroke="#6366F1" strokeWidth="1" opacity="0.5" />
        </motion.g>

        {/* Floating play button - waiting */}
        <motion.g
          animate={animated ? { y: [5, -10, 5], rotate: [5, -5, 5] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <circle cx="240" cy="100" r="20" fill="#1E293B" stroke="url(#empty-gradient)" strokeWidth="2" opacity="0.7" />
          <path d="M235 92L250 100L235 108V92Z" fill="url(#empty-gradient)" opacity="0.7" />
        </motion.g>

        {/* Floating script/document */}
        <motion.g
          animate={animated ? { y: [-5, 8, -5], x: [-3, 3, -3] } : {}}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <rect x="220" y="170" width="35" height="45" rx="4" fill="#1E293B" stroke="url(#empty-gradient)" strokeWidth="2" opacity="0.6" />
          <line x1="228" y1="182" x2="248" y2="182" stroke="#6366F1" strokeWidth="2" opacity="0.5" />
          <line x1="228" y1="192" x2="245" y2="192" stroke="#D946EF" strokeWidth="2" opacity="0.4" />
          <line x1="228" y1="202" x2="240" y2="202" stroke="#6366F1" strokeWidth="2" opacity="0.3" />
        </motion.g>

        {/* Question marks floating */}
        <motion.text
          x="60"
          y="170"
          fill="url(#empty-gradient)"
          fontSize="24"
          fontWeight="bold"
          opacity="0.5"
          animate={animated ? { y: [170, 160, 170], opacity: [0.3, 0.6, 0.3] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ?
        </motion.text>

        {/* Dashed circle around robot (placeholder/empty indicator) */}
        <motion.circle
          cx="150"
          cy="130"
          r="90"
          fill="none"
          stroke="url(#empty-gradient)"
          strokeWidth="2"
          strokeDasharray="10 10"
          opacity="0.3"
          animate={animated ? { rotate: 360 } : {}}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '150px 130px' }}
        />

        {/* Bottom text area placeholder */}
        <rect x="100" y="220" width="100" height="8" rx="4" fill="#1E293B" opacity="0.5" />
        <rect x="120" y="235" width="60" height="6" rx="3" fill="#1E293B" opacity="0.3" />
      </svg>

      {/* Sparkle decorations */}
      {animated && (
        <>
          <motion.div
            className="absolute top-8 right-12"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#6366F1" />
            </svg>
          </motion.div>
          <motion.div
            className="absolute bottom-16 left-8"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#D946EF" />
            </svg>
          </motion.div>
        </>
      )}
    </div>
  )
}
