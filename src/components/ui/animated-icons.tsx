'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface IconProps {
  size?: number
  className?: string
}

// Design System Colors - High contrast for visibility on gradient backgrounds
const COLORS = {
  // Vibrant accents
  indigo: '#6366F1',
  fuchsia: '#D946EF',
  success: '#10B981',
  successDark: '#059669',

  // Light neutrals for icon elements (visible on indigo→fuchsia gradients)
  iconLight: '#F1F5F9',   // Main structural elements
  iconMid: '#CBD5E1',     // Secondary elements
  iconDark: '#94A3B8',    // Subtle details
  white: '#FFFFFF',       // Pure white for highlights

  // Legacy (kept for paper/text)
  paper: '#F8FAFC',
  textLine: '#CBD5E1',
}

// ============================================
// STAGE 1: AnalyzingIcon
// Product box with magnifying glass scanning
// ============================================
export function AnalyzingIcon({ size = 64, className }: IconProps) {
  const scale = size / 64

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="analyzing-box-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.iconLight} />
            <stop offset="100%" stopColor={COLORS.iconMid} />
          </linearGradient>
          <linearGradient id="analyzing-scan-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={COLORS.indigo} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="analyzing-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Product Box - Static */}
        <g transform="translate(7, 2)">
          <rect
            x="0"
            y="0"
            width="50"
            height="60"
            rx="6"
            fill="url(#analyzing-box-gradient)"
            stroke={COLORS.iconDark}
            strokeWidth="2"
          />
          {/* Product label lines inside box */}
          <rect x="8" y="12" width="34" height="3" rx="1.5" fill={COLORS.iconDark} opacity="0.7" />
          <rect x="8" y="20" width="28" height="3" rx="1.5" fill={COLORS.iconDark} opacity="0.6" />
          <rect x="8" y="28" width="32" height="3" rx="1.5" fill={COLORS.iconDark} opacity="0.5" />
          {/* Product image placeholder */}
          <rect x="12" y="38" width="26" height="16" rx="3" fill={COLORS.iconDark} opacity="0.5" />
        </g>

        {/* Scan Line - Sweeps vertically */}
        <motion.rect
          x="10"
          y="5"
          width="44"
          height="3"
          rx="1.5"
          fill="url(#analyzing-scan-gradient)"
          filter="url(#analyzing-glow)"
          animate={{
            y: [5, 55, 5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Magnifying Glass - Moves diagonally */}
        <motion.g
          animate={{
            x: [8, -4, 8],
            y: [-4, 8, -4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Glass circle */}
          <circle
            cx="48"
            cy="16"
            r="12"
            fill={`${COLORS.white}33`}
            stroke={COLORS.white}
            strokeWidth="3"
          />
          {/* Handle */}
          <line
            x1="56"
            y1="24"
            x2="62"
            y2="30"
            stroke={COLORS.white}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Lens reflection */}
          <path
            d="M42 12 Q44 10 48 11"
            stroke={COLORS.white}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </motion.g>
      </svg>
    </div>
  )
}

// ============================================
// STAGE 2: WritingIcon
// Paper document with text lines appearing
// ============================================
export function WritingIcon({ size = 64, className }: IconProps) {
  const lineWidths = [36, 30, 34, 24, 28]
  const lineYPositions = [18, 26, 34, 42, 50]
  const CYCLE = 4 // Total cycle duration

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <filter id="writing-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Paper background */}
        <rect
          x="8"
          y="4"
          width="48"
          height="56"
          rx="4"
          fill={COLORS.paper}
          filter="url(#writing-shadow)"
        />

        {/* Folded corner effect */}
        <path
          d="M44 4 L56 4 L56 16 Z"
          fill="#E2E8F0"
        />
        <path
          d="M44 4 L44 16 L56 16"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1"
        />

        {/* Text lines that type in */}
        {lineWidths.map((width, i) => (
          <motion.rect
            key={i}
            x="14"
            y={lineYPositions[i]}
            height="4"
            rx="2"
            fill={COLORS.textLine}
            initial={{ width: 0 }}
            animate={{
              width: [0, 0, width, width, 0],
            }}
            transition={{
              duration: CYCLE,
              repeat: Infinity,
              times: [0, 0.1 + i * 0.12, 0.2 + i * 0.12, 0.85, 1],
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Blinking cursor */}
        <motion.rect
          x="14"
          y="18"
          width="2"
          height="8"
          rx="1"
          fill={COLORS.indigo}
          animate={{
            opacity: [1, 0, 1],
            x: [14, 14, 50, 44, 48, 38, 42, 14],
            y: [18, 18, 18, 26, 34, 42, 50, 18],
          }}
          transition={{
            opacity: { duration: 0.5, repeat: Infinity },
            x: {
              duration: CYCLE,
              repeat: Infinity,
              times: [0, 0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 1],
            },
            y: {
              duration: CYCLE,
              repeat: Infinity,
              times: [0, 0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 1],
            },
          }}
        />
      </svg>
    </div>
  )
}

// ============================================
// STAGE 3: CastingIcon
// Three avatar silhouettes, middle gets selected
// ============================================
export function CastingIcon({ size = 64, className }: IconProps) {
  const CYCLE = 3

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="casting-selected-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.indigo} />
            <stop offset="100%" stopColor={COLORS.fuchsia} />
          </linearGradient>
          <filter id="casting-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Avatar 1 - Left (briefly highlights) */}
        <motion.g
          animate={{
            opacity: [0.6, 1, 0.6, 0.6],
            scale: [1, 1.05, 1, 1],
          }}
          transition={{
            duration: CYCLE,
            repeat: Infinity,
            times: [0, 0.15, 0.3, 1],
          }}
          style={{ transformOrigin: '14px 28px' }}
        >
          <circle cx="14" cy="18" r="7" fill={COLORS.white} fillOpacity="0.9" stroke={COLORS.white} strokeWidth="1.5" />
          <rect x="6" y="28" width="16" height="20" rx="4" fill={COLORS.white} fillOpacity="0.9" stroke={COLORS.white} strokeWidth="1.5" />
        </motion.g>

        {/* Avatar 2 - Middle (gets selected and STAYS) */}
        <motion.g
          animate={{
            scale: [1, 1, 1.15, 1.15, 1],
          }}
          transition={{
            duration: CYCLE,
            repeat: Infinity,
            times: [0, 0.3, 0.45, 0.8, 1],
          }}
          style={{ transformOrigin: '32px 28px' }}
        >
          {/* Background glow when selected */}
          <motion.circle
            cx="32"
            cy="28"
            r="20"
            fill={COLORS.indigo}
            animate={{
              opacity: [0, 0, 0.3, 0.3, 0],
            }}
            transition={{
              duration: CYCLE,
              repeat: Infinity,
              times: [0, 0.3, 0.45, 0.8, 1],
            }}
          />
          {/* Head */}
          <motion.circle
            cx="32"
            cy="18"
            r="7"
            stroke={COLORS.white}
            strokeWidth="1.5"
            animate={{
              fill: [COLORS.white, COLORS.white, 'url(#casting-selected-gradient)', 'url(#casting-selected-gradient)', COLORS.white],
              fillOpacity: [0.9, 0.9, 1, 1, 0.9],
            }}
            transition={{
              duration: CYCLE,
              repeat: Infinity,
              times: [0, 0.3, 0.45, 0.8, 1],
            }}
          />
          {/* Body */}
          <motion.rect
            x="24"
            y="28"
            width="16"
            height="20"
            rx="4"
            stroke={COLORS.white}
            strokeWidth="1.5"
            animate={{
              fill: [COLORS.white, COLORS.white, 'url(#casting-selected-gradient)', 'url(#casting-selected-gradient)', COLORS.white],
              fillOpacity: [0.9, 0.9, 1, 1, 0.9],
            }}
            transition={{
              duration: CYCLE,
              repeat: Infinity,
              times: [0, 0.3, 0.45, 0.8, 1],
            }}
          />
        </motion.g>

        {/* Avatar 3 - Right (static, dimmed) */}
        <g opacity="0.7">
          <circle cx="50" cy="18" r="7" fill={COLORS.white} fillOpacity="0.9" stroke={COLORS.white} strokeWidth="1.5" />
          <rect x="42" y="28" width="16" height="20" rx="4" fill={COLORS.white} fillOpacity="0.9" stroke={COLORS.white} strokeWidth="1.5" />
        </g>

        {/* Checkmark Badge - appears below selected */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 0, 0, 1.2, 1, 1, 0],
            opacity: [0, 0, 0, 1, 1, 1, 0],
          }}
          transition={{
            duration: CYCLE,
            repeat: Infinity,
            times: [0, 0.45, 0.5, 0.55, 0.6, 0.85, 1],
          }}
          style={{ transformOrigin: '32px 56px' }}
        >
          <circle cx="32" cy="56" r="6" fill={COLORS.success} />
          <path
            d="M28 56 L31 59 L36 53"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.g>
      </svg>
    </div>
  )
}

// ============================================
// STAGE 4: VoiceoverIcon
// Microphone with sound waves and waveform bars
// ============================================
export function VoiceoverIcon({ size = 64, className }: IconProps) {
  const barHeights = [8, 16, 12, 20, 10, 14, 8]

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="voice-mic-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={COLORS.white} stopOpacity="0.95" />
            <stop offset="100%" stopColor={COLORS.white} stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="voice-bar-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={COLORS.indigo} />
            <stop offset="100%" stopColor={COLORS.fuchsia} />
          </linearGradient>
        </defs>

        {/* Sound Wave Rings */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx="32"
            cy="18"
            r={14 + i * 8}
            fill="none"
            stroke={COLORS.white}
            strokeWidth="2"
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{
              scale: [0.5, 1.2],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: '32px 18px' }}
          />
        ))}

        {/* Microphone */}
        <g>
          {/* Mic head */}
          <rect
            x="18"
            y="4"
            width="28"
            height="28"
            rx="14"
            fill="url(#voice-mic-gradient)"
            stroke={COLORS.white}
            strokeWidth="2"
          />
          {/* Grille lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="22"
              y1={10 + i * 5}
              x2="42"
              y2={10 + i * 5}
              stroke={COLORS.white}
              strokeWidth="1.5"
              opacity="0.5"
            />
          ))}
          {/* Stand */}
          <rect x="28" y="32" width="8" height="10" fill={COLORS.white} fillOpacity="0.8" />
          {/* Base */}
          <rect x="20" y="40" width="24" height="4" rx="2" fill={COLORS.white} fillOpacity="0.7" />
        </g>

        {/* Waveform Bars at bottom */}
        <g transform="translate(4, 48)">
          {barHeights.map((height, i) => (
            <motion.rect
              key={i}
              x={i * 8}
              y={16 - height / 2}
              width="6"
              height={height}
              rx="3"
              fill="url(#voice-bar-gradient)"
              animate={{
                scaleY: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: `${i * 8 + 3}px ${16}px` }}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}

// ============================================
// STAGE 5: AssemblingIcon
// Video clips flying into central frame
// ============================================
export function AssemblingIcon({ size = 64, className }: IconProps) {
  const CYCLE = 2

  // Clip positions: [startX, startY, endX, endY]
  const clips = [
    { start: [-20, -15], end: [2, 10], delay: 0 },      // top-left
    { start: [84, -15], end: [32, 10], delay: 0.1 },    // top-right
    { start: [-20, 55], end: [2, 25], delay: 0.2 },     // bottom-left
    { start: [84, 55], end: [32, 25], delay: 0.3 },     // bottom-right
  ]

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="assemble-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.indigo} />
            <stop offset="100%" stopColor={COLORS.fuchsia} />
          </linearGradient>
        </defs>

        {/* Main Video Frame */}
        <rect
          x="2"
          y="10"
          width="60"
          height="35"
          rx="4"
          fill={`${COLORS.white}1A`}
          stroke={COLORS.white}
          strokeWidth="3"
        />
        {/* Play icon inside frame */}
        <path
          d="M26 20 L42 27.5 L26 35 Z"
          fill={COLORS.white}
          opacity="0.6"
        />

        {/* Flying Clips */}
        {clips.map((clip, i) => (
          <motion.g
            key={i}
            initial={{ x: clip.start[0], y: clip.start[1], opacity: 0 }}
            animate={{
              x: [clip.start[0], clip.end[0], clip.end[0], clip.start[0]],
              y: [clip.start[1], clip.end[1], clip.end[1], clip.start[1]],
              opacity: [0, 1, 0, 0],
            }}
            transition={{
              duration: CYCLE,
              repeat: Infinity,
              times: [0, 0.4, 0.6, 1],
              delay: clip.delay,
              ease: 'easeOut',
            }}
          >
            <rect
              width="28"
              height="18"
              rx="2"
              fill={i % 2 === 0 ? COLORS.iconLight : COLORS.iconMid}
              stroke={COLORS.iconDark}
              strokeWidth="1"
            />
            {/* Small play icon on clip */}
            <path
              d="M10 6 L18 9 L10 12 Z"
              fill={COLORS.iconDark}
            />
          </motion.g>
        ))}

        {/* Timeline Bar at bottom */}
        <rect
          x="2"
          y="52"
          width="60"
          height="6"
          rx="3"
          fill={`${COLORS.white}33`}
        />
        <motion.rect
          x="2"
          y="52"
          height="6"
          rx="3"
          fill="url(#assemble-gradient)"
          initial={{ width: 0 }}
          animate={{
            width: [0, 60, 60, 0],
          }}
          transition={{
            duration: CYCLE,
            repeat: Infinity,
            times: [0, 0.5, 0.8, 1],
            ease: 'easeInOut',
          }}
        />
      </svg>
    </div>
  )
}

// ============================================
// STAGE 6: RenderingIcon
// Screen/monitor with processing bars and progress
// ============================================
export function RenderingIcon({ size = 64, className }: IconProps) {
  const CYCLE = 3

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="render-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.indigo} />
            <stop offset="100%" stopColor={COLORS.fuchsia} />
          </linearGradient>
        </defs>

        {/* Screen/Monitor */}
        <rect
          x="2"
          y="4"
          width="60"
          height="40"
          rx="4"
          fill={`${COLORS.white}40`}
          stroke={COLORS.white}
          strokeWidth="3"
        />

        {/* Processing Bars inside screen */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.rect
            key={i}
            x={10 + i * 10}
            y="12"
            width="6"
            height="24"
            rx="3"
            fill={COLORS.white}
            animate={{
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Monitor stand */}
        <rect x="26" y="44" width="12" height="4" fill={COLORS.white} fillOpacity="0.8" />
        <rect x="20" y="48" width="24" height="3" rx="1.5" fill={COLORS.white} fillOpacity="0.7" />

        {/* Progress Bar */}
        <rect
          x="2"
          y="56"
          width="60"
          height="6"
          rx="3"
          fill={`${COLORS.white}4D`}
        />
        <motion.rect
          x="2"
          y="56"
          height="6"
          rx="3"
          fill="url(#render-gradient)"
          initial={{ width: 0 }}
          animate={{
            width: [0, 60],
          }}
          transition={{
            duration: CYCLE,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Sparkles */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={12 + i * 20}
            cy="8"
            r="4"
            fill={COLORS.white}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

// ============================================
// STAGE 7: CompleteIcon
// Green success circle with checkmark + confetti
// ============================================
export function CompleteIcon({ size = 64, className }: IconProps) {
  const CYCLE = 2
  const confettiColors = [COLORS.indigo, COLORS.fuchsia, '#F59E0B', COLORS.success, '#EF4444', '#8B5CF6']

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="complete-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.success} />
            <stop offset="100%" stopColor={COLORS.successDark} />
          </linearGradient>
          <filter id="complete-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Success Circle with pop animation */}
        <motion.circle
          cx="32"
          cy="32"
          r="24"
          fill="url(#complete-gradient)"
          filter="url(#complete-glow)"
          initial={{ scale: 0 }}
          animate={{
            scale: [0, 1.1, 1, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: CYCLE - 0.5,
            times: [0, 0.6, 0.8, 1],
          }}
          style={{ transformOrigin: '32px 32px' }}
        />

        {/* Checkmark with draw animation */}
        <motion.path
          d="M20 32 L28 40 L44 24"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: [0, 1, 1],
          }}
          transition={{
            duration: 0.4,
            delay: 0.3,
            repeat: Infinity,
            repeatDelay: CYCLE - 0.4,
          }}
        />
      </svg>

      {/* Confetti Particles */}
      {confettiColors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute rounded"
          style={{
            width: 8,
            height: 8,
            backgroundColor: color,
            left: '50%',
            top: '50%',
            borderRadius: 2,
          }}
          initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: [0, Math.cos((i / 6) * Math.PI * 2) * 35],
            y: [0, Math.sin((i / 6) * Math.PI * 2) * 35],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: CYCLE - 1.5,
            delay: i * 0.05,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// SparkleIcon - Utility sparkle for AI effects
// ============================================
export function SparkleIcon({ size = 64, className }: IconProps) {
  return (
    <svg
      className={cn('text-electric-indigo', className)}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
    >
      <defs>
        <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.indigo} />
          <stop offset="100%" stopColor={COLORS.fuchsia} />
        </linearGradient>
      </defs>
      <motion.path
        d="M32 4 L36 28 L60 32 L36 36 L32 60 L28 36 L4 32 L28 28 Z"
        fill="url(#sparkle-gradient)"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ transformOrigin: '32px 32px' }}
      />
      <motion.path
        d="M52 8 L54 16 L62 18 L54 20 L52 28 L50 20 L42 18 L50 16 Z"
        fill={COLORS.fuchsia}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.6, 1],
        }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        style={{ transformOrigin: '52px 18px' }}
      />
      <motion.path
        d="M14 42 L16 48 L24 50 L16 52 L14 58 L12 52 L4 50 L12 48 Z"
        fill={COLORS.indigo}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.6, 1],
        }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
        style={{ transformOrigin: '14px 50px' }}
      />
    </svg>
  )
}
