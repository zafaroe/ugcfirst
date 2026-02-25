'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DropAndGoIllustrationProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

const sizes = {
  sm: { width: 120, height: 120 },
  md: { width: 160, height: 160 },
  lg: { width: 200, height: 200 },
}

// Animation timing - sequential choreography
const SEQUENCE_DURATION = 3.5
const LINK_DROP_DURATION = 0.8
const GATE_SHIMMER_DURATION = 0.4
const VIDEO_POP_DURATION = 0.5

export function DropAndGoIllustration({ size = 'lg', animated = true, className }: DropAndGoIllustrationProps) {
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
          {/* Material drop shadow - warm and soft */}
          <filter id="dropGoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#78716C" floodOpacity="0.15" />
          </filter>

          {/* Deeper shadow for lifted elements */}
          <filter id="dropGoShadowDeep" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#78716C" floodOpacity="0.2" />
          </filter>

          {/* Subtle shimmer for gate */}
          <linearGradient id="gateShimmer" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
          </linearGradient>

          {/* Mint accent gradient */}
          <linearGradient id="mintAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>

          {/* Coral accent */}
          <linearGradient id="coralAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>
        </defs>

        {/* ===== BACKGROUND CARD ===== */}
        <rect
          x="20"
          y="30"
          width="160"
          height="140"
          rx="16"
          fill="#FAFAF9"
          filter="url(#dropGoShadow)"
        />

        {/* ===== SHIMMER GATE (Center divider) ===== */}
        <motion.rect
          x="95"
          y="50"
          width="10"
          height="100"
          rx="5"
          fill="url(#gateShimmer)"
          initial={{ opacity: 0.3 }}
          animate={animated ? {
            opacity: [0.3, 0.6, 0.3],
          } : { opacity: 0.4 }}
          transition={animated ? {
            duration: SEQUENCE_DURATION,
            repeat: Infinity,
            times: [0, 0.3, 1],
            ease: "easeInOut"
          } : {}}
        />

        {/* Gate border lines */}
        <line x1="95" y1="50" x2="95" y2="150" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="105" y1="50" x2="105" y2="150" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

        {/* ===== LEFT SIDE: URL CARD ===== */}
        <g>
          {/* URL Card background */}
          <rect
            x="30"
            y="70"
            width="55"
            height="60"
            rx="8"
            fill="white"
            stroke="#E7E5E4"
            strokeWidth="1"
            filter="url(#dropGoShadow)"
          />

          {/* "URL" label */}
          <text
            x="57"
            y="88"
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#78716C"
            fontFamily="system-ui, sans-serif"
          >
            URL
          </text>

          {/* Link icon (chain link) */}
          <motion.g
            initial={{ y: 0, opacity: 1 }}
            animate={animated ? {
              y: [0, 10, 0],
              opacity: [1, 0.7, 1],
            } : {}}
            transition={animated ? {
              duration: SEQUENCE_DURATION,
              repeat: Infinity,
              times: [0, 0.25, 1],
              ease: "easeInOut"
            } : {}}
          >
            <g transform="translate(57, 112)">
              {/* Link chain icon */}
              <path
                d="M-8,-4 L-4,-4 C0,-4 2,-2 2,2 L2,4"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M8,4 L4,4 C0,4 -2,2 -2,-2 L-2,-4"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Small dot connector */}
              <circle cx="0" cy="0" r="2" fill="#10B981" />
            </g>
          </motion.g>
        </g>

        {/* ===== ANIMATED LINK DROPPING THROUGH GATE ===== */}
        {animated && (
          <motion.g
            initial={{ x: 57, y: 100, opacity: 0, scale: 0.8 }}
            animate={{
              x: [57, 100, 143],
              y: [100, 100, 100],
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1, 1, 0.8],
            }}
            transition={{
              duration: SEQUENCE_DURATION,
              repeat: Infinity,
              times: [0, 0.2, 0.5, 0.7],
              ease: "easeInOut"
            }}
          >
            {/* Moving link icon */}
            <circle r="6" fill="#10B981" />
            <path
              d="M-3,-1.5 L0,-1.5 C1.5,-1.5 2.5,-0.5 2.5,1 L2.5,1.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M3,1.5 L0,1.5 C-1.5,1.5 -2.5,0.5 -2.5,-1 L-2.5,-1.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>
        )}

        {/* ===== RIGHT SIDE: VIDEO CARD ===== */}
        <g>
          {/* Video Card background */}
          <motion.rect
            x="115"
            y="60"
            width="55"
            height="80"
            rx="8"
            fill="white"
            stroke="#E7E5E4"
            strokeWidth="1"
            filter="url(#dropGoShadow)"
            initial={{ scale: 1 }}
            animate={animated ? {
              scale: [1, 1.02, 1],
            } : {}}
            transition={animated ? {
              duration: SEQUENCE_DURATION,
              repeat: Infinity,
              times: [0.5, 0.65, 1],
              ease: "easeOut"
            } : {}}
            style={{ transformOrigin: '142px 100px' }}
          />

          {/* "VIDEO" label */}
          <text
            x="142"
            y="78"
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#78716C"
            fontFamily="system-ui, sans-serif"
          >
            VIDEO
          </text>

          {/* Phone/video frame */}
          <rect
            x="125"
            y="85"
            width="35"
            height="48"
            rx="4"
            fill="#F5F5F4"
            stroke="#D6D3D1"
            strokeWidth="1"
          />

          {/* Video content area */}
          <rect
            x="128"
            y="90"
            width="29"
            height="35"
            rx="2"
            fill="#E7E5E4"
          />

          {/* Play button */}
          <motion.g
            initial={{ scale: 1, opacity: 0.8 }}
            animate={animated ? {
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            } : {}}
            transition={animated ? {
              duration: SEQUENCE_DURATION,
              repeat: Infinity,
              times: [0.6, 0.75, 1],
              ease: "easeOut"
            } : {}}
            style={{ transformOrigin: '142px 107px' }}
          >
            <circle cx="142" cy="107" r="8" fill="url(#mintAccent)" />
            <polygon points="140,104 140,110 146,107" fill="white" />
          </motion.g>
        </g>

        {/* ===== SPARKLES (Warm dots, appear after video pops) ===== */}
        {animated && (
          <>
            {/* Mint sparkle */}
            <motion.circle
              cx="165"
              cy="65"
              r="3"
              fill="#10B981"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0, 1, 0],
                scale: [0, 0, 1, 0],
              }}
              transition={{
                duration: SEQUENCE_DURATION,
                repeat: Infinity,
                times: [0, 0.6, 0.75, 1],
                ease: "easeOut"
              }}
            />

            {/* Coral sparkle */}
            <motion.circle
              cx="120"
              cy="55"
              r="2.5"
              fill="#F43F5E"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0, 1, 0],
                scale: [0, 0, 1.2, 0],
              }}
              transition={{
                duration: SEQUENCE_DURATION,
                repeat: Infinity,
                times: [0, 0.65, 0.8, 1],
                ease: "easeOut"
              }}
            />

            {/* Amber sparkle */}
            <motion.circle
              cx="155"
              cy="145"
              r="2"
              fill="#FBBF24"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0, 1, 0],
                scale: [0, 0, 1, 0],
              }}
              transition={{
                duration: SEQUENCE_DURATION,
                repeat: Infinity,
                times: [0, 0.7, 0.85, 1],
                ease: "easeOut"
              }}
            />
          </>
        )}

        {/* ===== ARROW (Left to Right) ===== */}
        <motion.g
          initial={{ opacity: 0.6 }}
          animate={animated ? {
            opacity: [0.4, 0.8, 0.4],
          } : { opacity: 0.5 }}
          transition={animated ? {
            duration: SEQUENCE_DURATION,
            repeat: Infinity,
            times: [0, 0.35, 1],
            ease: "easeInOut"
          } : {}}
        >
          <line x1="75" y1="160" x2="115" y2="160" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" />
          <polyline points="110,155 118,160 110,165" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
      </svg>
    </div>
  )
}
