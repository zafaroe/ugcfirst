'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ReelIllustrationProps {
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
const PULSE_DURATION = 2.0
const ORBIT_DURATION = 3.5
const PLAY_PULSE = 1.5

// Pre-calculated orbiting icons - spiral inward from edges to center
// Icons: Heart (likes), Dollar (revenue), Star (quality/featured)
const orbitingIcons = [
  { type: 'heart',  startX: 25,  startY: 45,  midX: 50,  midY: 70,  endX: 78,  endY: 88,  delay: 0,   color: '#EC4899' },
  { type: 'dollar', startX: 175, startY: 55,  midX: 150, midY: 78,  endX: 122, endY: 92,  delay: 0.6, color: '#FBBF24' },
  { type: 'star',   startX: 30,  startY: 155, midX: 55,  midY: 130, endX: 78,  endY: 112, delay: 1.2, color: '#FBBF24' },
  { type: 'heart',  startX: 170, startY: 145, midX: 145, midY: 125, endX: 122, endY: 108, delay: 1.8, color: '#EC4899' },
  { type: 'dollar', startX: 100, startY: 20,  midX: 100, midY: 50,  endX: 100, endY: 78,  delay: 2.4, color: '#FBBF24' },
  { type: 'star',   startX: 100, startY: 180, midX: 100, midY: 150, endX: 100, endY: 122, delay: 3.0, color: '#FBBF24' },
]

// Pulse ring configurations (staggered)
const pulseRings = [
  { delay: 0, initialRadius: 35 },
  { delay: 0.7, initialRadius: 35 },
  { delay: 1.4, initialRadius: 35 },
]

// Pre-calculated burst particle directions (6 particles at 60° intervals)
// No runtime Math.sin/cos to avoid hydration errors
const burstDirections = [
  { x: 12, y: 0 },      // 0°
  { x: 6, y: 10.4 },    // 60°
  { x: -6, y: 10.4 },   // 120°
  { x: -12, y: 0 },     // 180°
  { x: -6, y: -10.4 },  // 240°
  { x: 6, y: -10.4 },   // 300°
]

export function ReelIllustration({ size = 'lg', animated = true, className }: ReelIllustrationProps) {
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
          {/* Primary gradient */}
          <linearGradient id="reelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>

          {/* Reversed gradient */}
          <linearGradient id="reelGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Strong glow filter */}
          <filter id="reelGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft glow */}
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Icon glow */}
          <filter id="iconGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Trail gradient - Pink (for hearts) */}
          <linearGradient id="trailPink" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.7" />
          </linearGradient>

          {/* Trail gradient - Gold (for dollars and stars) */}
          <linearGradient id="trailGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.7" />
          </linearGradient>

          {/* Burst glow filter */}
          <filter id="burstGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ===== MAGNETIC PULSE RINGS (Expanding outward) ===== */}
        {pulseRings.map((ring, i) => (
          <motion.circle
            key={`pulse-${i}`}
            cx="100"
            cy="100"
            r={ring.initialRadius}
            fill="none"
            stroke="url(#reelGrad)"
            strokeWidth="2"
            opacity="0.5"
            style={{ transformOrigin: '100px 100px' }}
            animate={animated ? {
              scale: [1, 2.8],
              opacity: [0.5, 0]
            } : {}}
            transition={animated ? {
              duration: PULSE_DURATION,
              repeat: Infinity,
              delay: ring.delay,
              ease: "easeOut"
            } : {}}
          />
        ))}

        {/* ===== CENTRAL VIDEO FRAME (LARGER) ===== */}
        <motion.g>
          {/* Absorption glow - pulses when icons are absorbed */}
          {animated && (
            <motion.rect
              x="52"
              y="64"
              width="96"
              height="71"
              rx="16"
              fill="none"
              stroke="url(#reelGrad)"
              strokeWidth="4"
              filter="url(#reelGlow)"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.8, 0, 0.8, 0, 0.8, 0, 0.8, 0, 0.8, 0, 0.8, 0]
              }}
              transition={{
                duration: ORBIT_DURATION * 2,
                repeat: Infinity,
                times: [0, 0.045, 0.09, 0.13, 0.18, 0.22, 0.27, 0.31, 0.36, 0.41, 0.45, 0.5, 1],
                ease: "easeOut"
              }}
            />
          )}

          {/* Outer glow frame */}
          <motion.rect
            x="55"
            y="67"
            width="90"
            height="65"
            rx="14"
            fill="none"
            stroke="url(#reelGrad)"
            strokeWidth="3"
            filter="url(#reelGlow)"
            opacity="0.6"
            animate={animated ? {
              opacity: [0.4, 0.7, 0.4]
            } : {}}
            transition={animated ? {
              duration: PLAY_PULSE,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          />

          {/* Main video frame */}
          <rect
            x="55"
            y="67"
            width="90"
            height="65"
            rx="14"
            fill="#FAFAF9"
            stroke="url(#reelGrad)"
            strokeWidth="2.5"
          />

          {/* Play button triangle (larger) */}
          <motion.polygon
            points="88,88 88,112 118,100"
            fill="url(#reelGrad)"
            filter="url(#softGlow)"
            animate={animated ? {
              scale: [1, 1.1, 1],
              opacity: [0.9, 1, 0.9]
            } : {}}
            transition={animated ? {
              duration: PLAY_PULSE,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
            style={{ transformOrigin: '100px 100px' }}
          />

          {/* Play button highlight */}
          <polygon
            points="92,92 92,100 103,96"
            fill="rgba(255,255,255,0.3)"
          />
        </motion.g>

        {/* ===== ORBITING ICONS (Heart, Dollar, Star) ===== */}
        {orbitingIcons.map((icon, i) => (
          <motion.g
            key={`orbit-${i}`}
            filter="url(#iconGlow)"
            initial={{ opacity: 0 }}
            animate={animated ? {
              x: [icon.startX - 100, icon.midX - 100, icon.endX - 100],
              y: [icon.startY - 100, icon.midY - 100, icon.endY - 100],
              scale: [1, 0.85, 0.5],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360]
            } : { x: icon.midX - 100, y: icon.midY - 100, opacity: 0.7 }}
            transition={animated ? {
              duration: ORBIT_DURATION,
              repeat: Infinity,
              delay: icon.delay,
              ease: "easeIn"
            } : {}}
            style={{ transformOrigin: '100px 100px' }}
          >
            {/* Heart Icon (Likes) */}
            {icon.type === 'heart' && (
              <g transform="translate(100, 100)">
                <path
                  d="M0,-3 C-3,-8 -10,-5 0,7 C10,-5 3,-8 0,-3"
                  fill={icon.color}
                />
              </g>
            )}

            {/* Dollar Icon (Revenue) */}
            {icon.type === 'dollar' && (
              <g transform="translate(100, 100)">
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="18"
                  fontWeight="bold"
                  fill={icon.color}
                >
                  $
                </text>
              </g>
            )}

            {/* Star Icon (Quality/Featured) */}
            {icon.type === 'star' && (
              <g transform="translate(100, 100)">
                <polygon
                  points="0,-9 2.3,-3 9,-3 3.5,1.5 5.5,8 0,4 -5.5,8 -3.5,1.5 -9,-3 -2.3,-3"
                  fill={icon.color}
                />
              </g>
            )}
          </motion.g>
        ))}

        {/* ===== COMET TRAILS ===== */}
        {animated && orbitingIcons.map((icon, i) => (
          <motion.path
            key={`trail-${i}`}
            d={`M ${icon.startX} ${icon.startY} Q ${icon.midX} ${icon.midY} ${icon.endX} ${icon.endY}`}
            fill="none"
            stroke={icon.type === 'heart' ? 'url(#trailPink)' : 'url(#trailGold)'}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 0.3, 0],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: ORBIT_DURATION,
              repeat: Infinity,
              delay: icon.delay,
              ease: "easeIn"
            }}
          />
        ))}

        {/* ===== ABSORPTION BURST PARTICLES ===== */}
        {animated && orbitingIcons.map((icon, iconIndex) => (
          <g key={`burst-group-${iconIndex}`}>
            {burstDirections.map((dir, dirIndex) => (
              <motion.circle
                key={`burst-${iconIndex}-${dirIndex}`}
                cx={icon.endX}
                cy={icon.endY}
                r="2.5"
                fill={icon.color}
                filter="url(#burstGlow)"
                initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1.3, 0],
                  opacity: [0, 1, 0],
                  x: [0, dir.x],
                  y: [0, dir.y]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: icon.delay + ORBIT_DURATION - 0.4,
                  repeatDelay: ORBIT_DURATION - 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </g>
        ))}

        {/* ===== AMBIENT SPARKLES ===== */}
        {animated && (
          <>
            <motion.circle
              cx="45"
              cy="35"
              r="2"
              fill="#EC4899"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: 0.3,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="160"
              cy="40"
              r="1.5"
              fill="#FBBF24"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.7, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                delay: 1.0,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="35"
              cy="165"
              r="1.5"
              fill="#FBBF24"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1.2, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 1.8,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="165"
              cy="160"
              r="1"
              fill="#EC4899"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: 0.8,
                ease: "easeInOut"
              }}
            />
          </>
        )}
      </svg>
    </div>
  )
}
