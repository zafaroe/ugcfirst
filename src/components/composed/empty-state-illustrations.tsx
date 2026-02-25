'use client'

import { motion } from 'framer-motion'

const COLORS = {
  indigo: '#10B981',
  fuchsia: '#F43F5E',
  light: '#F8FAFC',
  muted: '#94A3B8',
  surface: '#FAFAF9',
}

// Floating animation for all illustrations
const floatAnimation = {
  y: [0, -6, 0],
}

const floatTransition = {
  duration: 3,
  repeat: Infinity,
  ease: 'easeInOut' as const,
}

interface IllustrationProps {
  size?: number
  className?: string
}

// Film Reel - Empty reel with dotted frames
export function FilmReelIllustration({ size = 64, className }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      animate={floatAnimation}
      transition={floatTransition}
    >
      <defs>
        <linearGradient id="reel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.indigo} />
          <stop offset="100%" stopColor={COLORS.fuchsia} />
        </linearGradient>
      </defs>

      {/* Outer reel circle */}
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        stroke="url(#reel-gradient)"
        strokeWidth="2.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Inner hub */}
      <circle cx="32" cy="32" r="10" fill={COLORS.surface} stroke="url(#reel-gradient)" strokeWidth="2" />

      {/* Hub hole */}
      <circle cx="32" cy="32" r="4" fill={COLORS.indigo} fillOpacity="0.3" />

      {/* Film sprocket holes - around the reel */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const radian = (angle * Math.PI) / 180
        const x = 32 + Math.cos(radian) * 20
        const y = 32 + Math.sin(radian) * 20
        return (
          <motion.rect
            key={i}
            x={x - 3}
            y={y - 2}
            width="6"
            height="4"
            rx="1"
            fill={COLORS.muted}
            fillOpacity="0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.1 * i, duration: 0.3 }}
          />
        )
      })}

      {/* Empty center indicator (dotted) */}
      <motion.circle
        cx="32"
        cy="32"
        r="6"
        stroke={COLORS.muted}
        strokeWidth="1"
        strokeDasharray="3 3"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '32px 32px' }}
      />
    </motion.svg>
  )
}

// Clapperboard - With "NEW" sparkle
export function ClapperboardIllustration({ size = 64, className }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      animate={floatAnimation}
      transition={floatTransition}
    >
      <defs>
        <linearGradient id="clapper-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.indigo} />
          <stop offset="100%" stopColor={COLORS.fuchsia} />
        </linearGradient>
      </defs>

      {/* Clapper top (hinged part with stripes) */}
      <motion.g
        initial={{ rotate: -20 }}
        animate={{ rotate: [-20, 0, -20] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '10px 22px' }}
      >
        <rect x="8" y="14" width="48" height="10" rx="2" fill={COLORS.surface} stroke="url(#clapper-gradient)" strokeWidth="2" />
        {/* Diagonal stripes */}
        {[0, 8, 16, 24, 32, 40].map((x, i) => (
          <rect
            key={i}
            x={12 + x}
            y="16"
            width="4"
            height="6"
            fill={i % 2 === 0 ? COLORS.indigo : COLORS.fuchsia}
            fillOpacity="0.6"
          />
        ))}
      </motion.g>

      {/* Clapperboard body */}
      <rect x="8" y="24" width="48" height="32" rx="3" fill={COLORS.surface} stroke="url(#clapper-gradient)" strokeWidth="2" />

      {/* Text lines (scene info) */}
      <rect x="14" y="30" width="24" height="3" rx="1" fill={COLORS.muted} fillOpacity="0.4" />
      <rect x="14" y="36" width="36" height="3" rx="1" fill={COLORS.muted} fillOpacity="0.3" />
      <rect x="14" y="42" width="20" height="3" rx="1" fill={COLORS.muted} fillOpacity="0.3" />

      {/* Sparkle (NEW indicator) */}
      <motion.g
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <path
          d="M52 12l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z"
          fill={COLORS.fuchsia}
        />
      </motion.g>
    </motion.svg>
  )
}

// Camera - Focusing on empty frame
export function CameraIllustration({ size = 64, className }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      animate={floatAnimation}
      transition={floatTransition}
    >
      <defs>
        <linearGradient id="camera-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.indigo} />
          <stop offset="100%" stopColor={COLORS.fuchsia} />
        </linearGradient>
      </defs>

      {/* Camera body */}
      <rect x="6" y="20" width="40" height="28" rx="4" fill={COLORS.surface} stroke="url(#camera-gradient)" strokeWidth="2" />

      {/* Lens */}
      <circle cx="26" cy="34" r="10" fill={COLORS.surface} stroke="url(#camera-gradient)" strokeWidth="2" />
      <circle cx="26" cy="34" r="6" fill={COLORS.indigo} fillOpacity="0.2" />

      {/* Focus ring animation */}
      <motion.circle
        cx="26"
        cy="34"
        r="8"
        stroke={COLORS.fuchsia}
        strokeWidth="1"
        strokeDasharray="4 2"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '26px 34px' }}
      />

      {/* Film magazine (top) */}
      <rect x="40" y="14" width="14" height="20" rx="3" fill={COLORS.surface} stroke="url(#camera-gradient)" strokeWidth="1.5" />
      <circle cx="47" cy="20" r="3" fill={COLORS.muted} fillOpacity="0.4" />
      <circle cx="47" cy="28" r="3" fill={COLORS.muted} fillOpacity="0.4" />

      {/* Viewfinder */}
      <rect x="10" y="14" width="12" height="6" rx="1" fill={COLORS.surface} stroke="url(#camera-gradient)" strokeWidth="1.5" />

      {/* REC indicator */}
      <motion.circle
        cx="40"
        cy="26"
        r="2"
        fill="#EF4444"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.svg>
  )
}

// Script - Blank with cursor
export function ScriptIllustration({ size = 64, className }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      animate={floatAnimation}
      transition={floatTransition}
    >
      <defs>
        <linearGradient id="script-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.indigo} />
          <stop offset="100%" stopColor={COLORS.fuchsia} />
        </linearGradient>
      </defs>

      {/* Paper shadow */}
      <rect x="14" y="10" width="40" height="48" rx="3" fill={COLORS.muted} fillOpacity="0.1" />

      {/* Main paper */}
      <rect x="10" y="6" width="40" height="48" rx="3" fill={COLORS.surface} stroke="url(#script-gradient)" strokeWidth="2" />

      {/* Fold corner */}
      <path d="M40 6v10h10" fill={COLORS.surface} stroke="url(#script-gradient)" strokeWidth="1.5" />
      <path d="M40 6l10 10" stroke={COLORS.muted} strokeWidth="1" strokeOpacity="0.3" />

      {/* Blank lines (placeholder for content) */}
      <rect x="16" y="22" width="28" height="2" rx="1" fill={COLORS.muted} fillOpacity="0.3" />
      <rect x="16" y="28" width="22" height="2" rx="1" fill={COLORS.muted} fillOpacity="0.25" />
      <rect x="16" y="34" width="26" height="2" rx="1" fill={COLORS.muted} fillOpacity="0.2" />
      <rect x="16" y="40" width="18" height="2" rx="1" fill={COLORS.muted} fillOpacity="0.15" />

      {/* Blinking cursor */}
      <motion.rect
        x="16"
        y="18"
        width="2"
        height="10"
        fill="url(#script-gradient)"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* Pencil icon */}
      <motion.g
        animate={{ x: [0, 2, 0], y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <rect x="46" y="44" width="4" height="14" rx="1" fill="url(#script-gradient)" transform="rotate(-45 48 51)" />
        <polygon points="44,56 42,62 48,60" fill={COLORS.fuchsia} transform="rotate(-45 45 59)" />
      </motion.g>
    </motion.svg>
  )
}

// Spotlight - Pointing at empty stage
export function SpotlightIllustration({ size = 64, className }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      animate={floatAnimation}
      transition={floatTransition}
    >
      <defs>
        <linearGradient id="spotlight-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.indigo} />
          <stop offset="100%" stopColor={COLORS.fuchsia} />
        </linearGradient>
        <linearGradient id="light-beam" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={COLORS.fuchsia} stopOpacity="0.4" />
          <stop offset="100%" stopColor={COLORS.fuchsia} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Light beam */}
      <motion.path
        d="M32 24L18 56h28L32 24z"
        fill="url(#light-beam)"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Stage floor */}
      <rect x="12" y="54" width="40" height="4" rx="1" fill={COLORS.surface} stroke="url(#spotlight-gradient)" strokeWidth="1" />

      {/* Spotlight housing */}
      <ellipse cx="32" cy="14" rx="12" ry="8" fill={COLORS.surface} stroke="url(#spotlight-gradient)" strokeWidth="2" />

      {/* Lens */}
      <motion.circle
        cx="32"
        cy="18"
        r="6"
        fill={COLORS.indigo}
        fillOpacity="0.3"
        stroke="url(#spotlight-gradient)"
        strokeWidth="1.5"
        animate={{ fillOpacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Mount bar */}
      <rect x="30" y="6" width="4" height="4" fill={COLORS.muted} />

      {/* Ceiling mount */}
      <rect x="24" y="4" width="16" height="4" rx="1" fill={COLORS.surface} stroke="url(#spotlight-gradient)" strokeWidth="1" />

      {/* Empty stage indicator - dotted circle */}
      <motion.circle
        cx="32"
        cy="48"
        r="6"
        stroke={COLORS.muted}
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  )
}

// Director Chair - With "?" overlay
export function DirectorChairIllustration({ size = 64, className }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      animate={floatAnimation}
      transition={floatTransition}
    >
      <defs>
        <linearGradient id="chair-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.indigo} />
          <stop offset="100%" stopColor={COLORS.fuchsia} />
        </linearGradient>
      </defs>

      {/* Chair back */}
      <rect x="16" y="8" width="32" height="16" rx="2" fill={COLORS.surface} stroke="url(#chair-gradient)" strokeWidth="2" />

      {/* DIRECTOR text placeholder */}
      <rect x="20" y="13" width="24" height="6" rx="1" fill={COLORS.indigo} fillOpacity="0.2" />

      {/* Chair seat */}
      <rect x="14" y="32" width="36" height="8" rx="2" fill={COLORS.surface} stroke="url(#chair-gradient)" strokeWidth="2" />

      {/* Left leg (X shape) */}
      <motion.line x1="18" y1="40" x2="12" y2="58" stroke="url(#chair-gradient)" strokeWidth="2.5" strokeLinecap="round" />
      <motion.line x1="12" y1="40" x2="22" y2="58" stroke="url(#chair-gradient)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Right leg (X shape) */}
      <motion.line x1="46" y1="40" x2="52" y2="58" stroke="url(#chair-gradient)" strokeWidth="2.5" strokeLinecap="round" />
      <motion.line x1="52" y1="40" x2="42" y2="58" stroke="url(#chair-gradient)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Back support poles */}
      <line x1="20" y1="24" x2="20" y2="32" stroke="url(#chair-gradient)" strokeWidth="2" />
      <line x1="44" y1="24" x2="44" y2="32" stroke="url(#chair-gradient)" strokeWidth="2" />

      {/* Question mark overlay */}
      <motion.g
        animate={{ opacity: [0.7, 1, 0.7], y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <circle cx="48" cy="12" r="8" fill={COLORS.fuchsia} fillOpacity="0.9" />
        <text x="48" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill={COLORS.light}>?</text>
      </motion.g>
    </motion.svg>
  )
}

// Export illustration map for easy access
export const illustrations = {
  'film-reel': FilmReelIllustration,
  'clapperboard': ClapperboardIllustration,
  'camera': CameraIllustration,
  'script': ScriptIllustration,
  'spotlight': SpotlightIllustration,
  'director-chair': DirectorChairIllustration,
} as const

export type IllustrationType = keyof typeof illustrations
