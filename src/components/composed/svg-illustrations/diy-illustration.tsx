'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DIYIllustrationProps {
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
const SLIDER_1_DURATION = 3.0
const SLIDER_2_DURATION = 3.5
const TOGGLE_DURATION = 2.0
const WAVEFORM_DURATION = 2.0
const PULSE_DURATION = 2.0

// Staggered entry delays
const staggerDelays = {
  slider1: 0,
  slider2: 0.1,
  toggles: 0.2,
  waveform: 0.35,
  vuDotsRight: 0.45,
  vuDotsLeft: 0.5,
  sparkles: 0.6,
}

// Toggle switch configuration
const toggles = [
  { x: 55, initialOn: false },
  { x: 100, initialOn: true, animated: true },
  { x: 145, initialOn: false },
]

export function DIYIllustration({ size = 'lg', animated = true, className }: DIYIllustrationProps) {
  const { width, height } = sizes[size]

  // Pre-calculated waveform paths for animation
  const waveformPath1 = "M 35 150 Q 48 138, 61 150 Q 74 162, 87 150 Q 100 138, 113 150 Q 126 162, 139 150 Q 152 138, 165 150"
  const waveformPath2 = "M 35 150 Q 48 162, 61 150 Q 74 138, 87 150 Q 100 162, 113 150 Q 126 138, 139 150 Q 152 162, 165 150"

  // Shared transition configs
  const slider1Transition = animated ? {
    duration: SLIDER_1_DURATION,
    repeat: Infinity,
    ease: "easeInOut" as const
  } : {}

  const slider2Transition = animated ? {
    duration: SLIDER_2_DURATION,
    repeat: Infinity,
    ease: "easeInOut" as const
  } : {}

  const pulseTransition = animated ? {
    duration: PULSE_DURATION,
    repeat: Infinity,
    ease: "easeInOut" as const
  } : {}

  // Entry animation config
  const entryAnimation = (delay: number) => animated ? {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4, ease: "easeOut" as const }
  } : {}

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
          {/* Primary neon gradient */}
          <linearGradient id="diyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#D946EF" />
          </linearGradient>

          {/* Secondary gradient (reversed) */}
          <linearGradient id="diyGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D946EF" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>

          {/* Glow filter for neon effect */}
          <filter id="diyGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Brighter glow for pulse effect */}
          <filter id="diyGlowBright" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle glow for tracks */}
          <filter id="trackGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Noise texture filter for premium feel */}
          <filter id="noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
          </filter>
        </defs>

        {/* ===== NOISE TEXTURE OVERLAY ===== */}
        <rect
          x="0"
          y="0"
          width="200"
          height="200"
          fill="white"
          opacity="0.025"
          style={{ mixBlendMode: 'overlay' }}
        />

        {/* ===== SLIDER 1 (Top) ===== */}
        <motion.g {...entryAnimation(staggerDelays.slider1)}>
          {/* Track background */}
          <line
            x1="35"
            y1="50"
            x2="165"
            y2="50"
            stroke="#334155"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Track reflection (Premium Polish) */}
          <line
            x1="35"
            y1="57"
            x2="165"
            y2="57"
            stroke="url(#diyGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.1"
          />
          {/* Active track portion (glowing) */}
          <motion.line
            x1="35"
            y1="50"
            x2="100"
            y2="50"
            stroke="url(#diyGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#trackGlow)"
            initial={{ x2: 70 }}
            animate={animated ? { x2: [70, 130, 70] } : { x2: 100 }}
            transition={slider1Transition}
          />
          {/* Knob with pulse */}
          <motion.circle
            cy="50"
            r="10"
            fill="url(#diyGrad)"
            filter="url(#diyGlow)"
            initial={{ cx: 70 }}
            animate={animated ? {
              cx: [70, 130, 70],
              opacity: [0.9, 1, 0.9]
            } : { cx: 100 }}
            transition={slider1Transition}
          />
          {/* Knob highlight arc (3D effect) */}
          <motion.ellipse
            cy="45"
            rx="5"
            ry="1.5"
            fill="rgba(255,255,255,0.3)"
            initial={{ cx: 70 }}
            animate={animated ? { cx: [70, 130, 70] } : { cx: 100 }}
            transition={slider1Transition}
          />
          {/* Knob inner circle */}
          <motion.circle
            cy="50"
            r="4"
            fill="#1E293B"
            initial={{ cx: 70 }}
            animate={animated ? { cx: [70, 130, 70] } : { cx: 100 }}
            transition={slider1Transition}
          />
        </motion.g>

        {/* ===== SLIDER 2 (Bottom) ===== */}
        <motion.g {...entryAnimation(staggerDelays.slider2)}>
          {/* Track background */}
          <line
            x1="35"
            y1="80"
            x2="165"
            y2="80"
            stroke="#334155"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Track reflection (Premium Polish) */}
          <line
            x1="35"
            y1="87"
            x2="165"
            y2="87"
            stroke="url(#diyGrad2)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.1"
          />
          {/* Active track portion */}
          <motion.line
            x1="35"
            y1="80"
            x2="100"
            y2="80"
            stroke="url(#diyGrad2)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#trackGlow)"
            initial={{ x2: 130 }}
            animate={animated ? { x2: [130, 70, 130] } : { x2: 100 }}
            transition={slider2Transition}
          />
          {/* Knob with pulse */}
          <motion.circle
            cy="80"
            r="10"
            fill="url(#diyGrad2)"
            filter="url(#diyGlow)"
            initial={{ cx: 130 }}
            animate={animated ? {
              cx: [130, 70, 130],
              opacity: [0.9, 1, 0.9]
            } : { cx: 100 }}
            transition={slider2Transition}
          />
          {/* Knob highlight arc (3D effect) */}
          <motion.ellipse
            cy="75"
            rx="5"
            ry="1.5"
            fill="rgba(255,255,255,0.3)"
            initial={{ cx: 130 }}
            animate={animated ? { cx: [130, 70, 130] } : { cx: 100 }}
            transition={slider2Transition}
          />
          {/* Knob inner circle */}
          <motion.circle
            cy="80"
            r="4"
            fill="#1E293B"
            initial={{ cx: 130 }}
            animate={animated ? { cx: [130, 70, 130] } : { cx: 100 }}
            transition={slider2Transition}
          />
        </motion.g>

        {/* ===== TOGGLE SWITCHES ===== */}
        <motion.g {...entryAnimation(staggerDelays.toggles)}>
          {toggles.map((toggle, index) => (
            <g key={index} transform={`translate(${toggle.x}, 115)`}>
              {/* Toggle track */}
              <rect
                x="-14"
                y="-8"
                width="28"
                height="16"
                rx="8"
                fill={toggle.initialOn ? "rgba(99, 102, 241, 0.3)" : "#334155"}
                stroke={toggle.initialOn ? "url(#diyGrad)" : "#475569"}
                strokeWidth="1.5"
              />
              {/* Toggle knob */}
              {toggle.animated && animated ? (
                <motion.g
                  animate={{ x: [6, -6, 6] }}
                  transition={{
                    duration: TOGGLE_DURATION,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <motion.circle
                    cy="0"
                    cx="0"
                    r="5"
                    fill="url(#diyGrad)"
                    filter="url(#diyGlow)"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={pulseTransition}
                  />
                  {/* Toggle knob highlight */}
                  <ellipse
                    cx="0"
                    cy="-2"
                    rx="3"
                    ry="1"
                    fill="rgba(255,255,255,0.25)"
                  />
                </motion.g>
              ) : (
                <g>
                  <circle
                    cx={toggle.initialOn ? 6 : -6}
                    cy="0"
                    r="5"
                    fill={toggle.initialOn ? "url(#diyGrad)" : "#64748B"}
                    filter={toggle.initialOn ? "url(#diyGlow)" : undefined}
                  />
                  {/* Static knob highlight */}
                  {toggle.initialOn && (
                    <ellipse
                      cx={6}
                      cy="-2"
                      rx="3"
                      ry="1"
                      fill="rgba(255,255,255,0.25)"
                    />
                  )}
                </g>
              )}
            </g>
          ))}
        </motion.g>

        {/* ===== WAVEFORM ===== */}
        <motion.g
          filter="url(#diyGlow)"
          {...entryAnimation(staggerDelays.waveform)}
        >
          <motion.path
            d={waveformPath1}
            stroke="url(#diyGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            initial={{ d: waveformPath1 }}
            animate={animated ? {
              d: [waveformPath1, waveformPath2, waveformPath1],
              opacity: [0.75, 1, 0.75]
            } : {}}
            transition={animated ? {
              duration: WAVEFORM_DURATION,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          />
          {/* Waveform reflection */}
          <motion.path
            d={waveformPath1}
            stroke="url(#diyGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.12"
            transform="translate(0, 12)"
            initial={{ d: waveformPath1 }}
            animate={animated ? {
              d: [waveformPath1, waveformPath2, waveformPath1]
            } : {}}
            transition={animated ? {
              duration: WAVEFORM_DURATION,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          />
        </motion.g>

        {/* ===== DECORATIVE DOTS (VU Meter style - Right) ===== */}
        <motion.g {...entryAnimation(staggerDelays.vuDotsRight)}>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.circle
              key={i}
              cx={175}
              cy={45 + i * 12}
              r="3"
              fill={i < 3 ? "url(#diyGrad)" : "#475569"}
              initial={{ opacity: i < 3 ? 1 : 0.4 }}
              animate={animated ? {
                opacity: i < 3 ? [0.85, 1, 0.85] : [0.4, 0.7, 0.4],
                scale: i < 3 ? [1, 1.15, 1] : 1
              } : {}}
              transition={animated ? {
                duration: PULSE_DURATION,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut"
              } : {}}
            />
          ))}
        </motion.g>

        {/* ===== DECORATIVE DOTS (Left side) ===== */}
        <motion.g {...entryAnimation(staggerDelays.vuDotsLeft)}>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.circle
              key={i}
              cx={25}
              cy={45 + i * 12}
              r="3"
              fill={i < 2 ? "url(#diyGrad2)" : "#475569"}
              initial={{ opacity: i < 2 ? 1 : 0.4 }}
              animate={animated ? {
                opacity: i < 2 ? [0.85, 1, 0.85] : [0.4, 0.65, 0.4],
                scale: i < 2 ? [1, 1.15, 1] : 1
              } : {}}
              transition={animated ? {
                duration: PULSE_DURATION,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              } : {}}
            />
          ))}
        </motion.g>

        {/* ===== SPARKLE ACCENTS ===== */}
        {animated && (
          <motion.g {...entryAnimation(staggerDelays.sparkles)}>
            <motion.circle
              cx="45"
              cy="35"
              r="1.5"
              fill="#D946EF"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.5,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="155"
              cy="65"
              r="1.5"
              fill="#6366F1"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: 1.2,
                ease: "easeInOut"
              }}
            />
            <motion.circle
              cx="100"
              cy="175"
              r="2"
              fill="#D946EF"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1.2, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 2,
                ease: "easeInOut"
              }}
            />
            {/* Extra sparkle for premium feel */}
            <motion.circle
              cx="70"
              cy="95"
              r="1"
              fill="#818CF8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: 0.8,
                ease: "easeInOut"
              }}
            />
          </motion.g>
        )}
      </svg>
    </div>
  )
}
