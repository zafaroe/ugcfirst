'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StudioIllustrationProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

const sizes = {
  sm: { width: 120, height: 120 },
  md: { width: 160, height: 160 },
  lg: { width: 200, height: 200 },
}

// Animation timing - staggered entry then settle
const ENTRY_DURATION = 0.4
const PLAYHEAD_DURATION = 2.5
const STAGGER_DELAY = 0.1

export function StudioIllustration({ size = 'lg', animated = true, className }: StudioIllustrationProps) {
  const { width, height } = sizes[size]

  // Timeline section blocks
  const timelineBlocks = [
    { x: 45, width: 30, label: 'Hook', color: '#10B981' },
    { x: 80, width: 45, label: 'Story', color: '#3B82F6' },
    { x: 130, width: 25, label: 'CTA', color: '#F43F5E' },
  ]

  // Side panel tool icons
  const toolIcons = [
    { y: 60, type: 'layers' },
    { y: 80, type: 'type' },
    { y: 100, type: 'palette' },
  ]

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
          {/* Material drop shadow */}
          <filter id="studioShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#78716C" floodOpacity="0.15" />
          </filter>

          {/* Deeper shadow for window */}
          <filter id="studioShadowDeep" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#78716C" floodOpacity="0.2" />
          </filter>

          {/* Mint accent */}
          <linearGradient id="studioMint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>

        {/* ===== MAIN WINDOW FRAME ===== */}
        <motion.g
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ENTRY_DURATION, ease: "easeOut" }}
        >
          {/* Window background */}
          <rect
            x="15"
            y="25"
            width="170"
            height="150"
            rx="10"
            fill="#FAFAF9"
            filter="url(#studioShadowDeep)"
          />

          {/* Window title bar */}
          <rect
            x="15"
            y="25"
            width="170"
            height="24"
            rx="10"
            fill="#F5F5F4"
          />
          <rect
            x="15"
            y="39"
            width="170"
            height="10"
            fill="#F5F5F4"
          />

          {/* Traffic light dots */}
          <circle cx="30" cy="37" r="4" fill="#EF4444" />
          <circle cx="44" cy="37" r="4" fill="#FBBF24" />
          <circle cx="58" cy="37" r="4" fill="#22C55E" />

          {/* Window title */}
          <text
            x="100"
            y="41"
            textAnchor="middle"
            fontSize="8"
            fontWeight="500"
            fill="#78716C"
            fontFamily="system-ui, sans-serif"
          >
            UGCFirst Studio
          </text>
        </motion.g>

        {/* ===== LEFT SIDE PANEL (Tools) ===== */}
        <motion.g
          initial={animated ? { opacity: 0, x: -10 } : {}}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: ENTRY_DURATION, delay: STAGGER_DELAY, ease: "easeOut" }}
        >
          {/* Panel background */}
          <rect
            x="20"
            y="54"
            width="28"
            height="70"
            rx="4"
            fill="#F5F5F4"
            stroke="#E7E5E4"
            strokeWidth="1"
          />

          {/* Tool icons */}
          {toolIcons.map((tool, i) => (
            <motion.g
              key={i}
              initial={animated ? { opacity: 0, scale: 0.8 } : {}}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: STAGGER_DELAY * (i + 2), ease: "easeOut" }}
            >
              {tool.type === 'layers' && (
                <g transform={`translate(34, ${tool.y})`}>
                  <rect x="-6" y="-4" width="12" height="3" rx="1" fill="#A8A29E" />
                  <rect x="-6" y="1" width="12" height="3" rx="1" fill="#78716C" />
                </g>
              )}
              {tool.type === 'type' && (
                <text
                  x="34"
                  y={tool.y + 3}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#78716C"
                  fontFamily="system-ui, sans-serif"
                >
                  T
                </text>
              )}
              {tool.type === 'palette' && (
                <g transform={`translate(34, ${tool.y})`}>
                  <circle cx="-3" cy="0" r="3" fill="#10B981" />
                  <circle cx="3" cy="0" r="3" fill="#F43F5E" />
                </g>
              )}
            </motion.g>
          ))}
        </motion.g>

        {/* ===== PREVIEW AREA (Center) ===== */}
        <motion.g
          initial={animated ? { opacity: 0, scale: 0.95 } : {}}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: ENTRY_DURATION, delay: STAGGER_DELAY * 2, ease: "easeOut" }}
        >
          {/* Preview container */}
          <rect
            x="55"
            y="54"
            width="70"
            height="70"
            rx="6"
            fill="#E7E5E4"
            stroke="#D6D3D1"
            strokeWidth="1"
          />

          {/* Phone mockup inside preview */}
          <rect
            x="72"
            y="58"
            width="36"
            height="62"
            rx="4"
            fill="white"
            stroke="#D6D3D1"
            strokeWidth="1"
          />

          {/* Phone content placeholder */}
          <rect
            x="75"
            y="62"
            width="30"
            height="40"
            rx="2"
            fill="#F5F5F4"
          />

          {/* Avatar placeholder */}
          <motion.circle
            cx="90"
            cy="75"
            r="8"
            fill="url(#studioMint)"
            initial={animated ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: STAGGER_DELAY * 4, ease: "backOut" }}
          />

          {/* Text lines placeholder */}
          <rect x="78" y="88" width="24" height="3" rx="1" fill="#D6D3D1" />
          <rect x="82" y="94" width="16" height="3" rx="1" fill="#E7E5E4" />
        </motion.g>

        {/* ===== RIGHT SIDE PANEL (Properties) ===== */}
        <motion.g
          initial={animated ? { opacity: 0, x: 10 } : {}}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: ENTRY_DURATION, delay: STAGGER_DELAY * 3, ease: "easeOut" }}
        >
          {/* Panel background */}
          <rect
            x="132"
            y="54"
            width="48"
            height="70"
            rx="4"
            fill="#F5F5F4"
            stroke="#E7E5E4"
            strokeWidth="1"
          />

          {/* Property rows */}
          <rect x="137" y="62" width="38" height="6" rx="2" fill="#E7E5E4" />
          <rect x="137" y="72" width="28" height="6" rx="2" fill="#E7E5E4" />
          <rect x="137" y="82" width="35" height="6" rx="2" fill="#E7E5E4" />

          {/* Color swatches */}
          <rect x="137" y="95" width="10" height="10" rx="2" fill="#10B981" />
          <rect x="150" y="95" width="10" height="10" rx="2" fill="#F43F5E" />
          <rect x="163" y="95" width="10" height="10" rx="2" fill="#3B82F6" />

          {/* Toggle */}
          <rect x="137" y="112" width="18" height="8" rx="4" fill="#10B981" />
          <circle cx="151" cy="116" r="3" fill="white" />
        </motion.g>

        {/* ===== TIMELINE (Bottom) ===== */}
        <motion.g
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ENTRY_DURATION, delay: STAGGER_DELAY * 4, ease: "easeOut" }}
        >
          {/* Timeline background */}
          <rect
            x="20"
            y="130"
            width="160"
            height="40"
            rx="6"
            fill="#F5F5F4"
            stroke="#E7E5E4"
            strokeWidth="1"
          />

          {/* Timeline track */}
          <rect
            x="40"
            y="142"
            width="120"
            height="16"
            rx="3"
            fill="#E7E5E4"
          />

          {/* Timeline section blocks - slide in */}
          {timelineBlocks.map((block, i) => (
            <motion.g key={i}>
              <motion.rect
                x={block.x}
                y="144"
                width={block.width}
                height="12"
                rx="2"
                fill={block.color}
                initial={animated ? { scaleX: 0, opacity: 0 } : {}}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{
                  duration: 0.4,
                  delay: STAGGER_DELAY * 5 + i * 0.15,
                  ease: "easeOut"
                }}
                style={{ transformOrigin: `${block.x}px 150px` }}
              />
              <motion.text
                x={block.x + block.width / 2}
                y="152"
                textAnchor="middle"
                fontSize="6"
                fontWeight="600"
                fill="white"
                fontFamily="system-ui, sans-serif"
                initial={animated ? { opacity: 0 } : {}}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: STAGGER_DELAY * 5 + i * 0.15 + 0.2 }}
              >
                {block.label}
              </motion.text>
            </motion.g>
          ))}

          {/* Playhead diamond */}
          <motion.g
            initial={animated ? { x: 0 } : {}}
            animate={animated ? { x: [0, 100, 0] } : {}}
            transition={animated ? {
              duration: PLAYHEAD_DURATION,
              repeat: Infinity,
              ease: "linear",
              delay: STAGGER_DELAY * 8
            } : {}}
          >
            <polygon
              points="45,140 49,136 53,140 49,144"
              fill="#F43F5E"
            />
            <line
              x1="49"
              y1="140"
              x2="49"
              y2="160"
              stroke="#F43F5E"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </motion.g>

          {/* Time marker */}
          <text
            x="27"
            y="153"
            fontSize="7"
            fontWeight="500"
            fill="#78716C"
            fontFamily="system-ui, sans-serif"
          >
            0:00
          </text>
        </motion.g>

        {/* ===== DECORATIVE ELEMENTS ===== */}
        {animated && (
          <>
            {/* Small indicator dot - top right */}
            <motion.circle
              cx="175"
              cy="35"
              r="3"
              fill="#10B981"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
      </svg>
    </div>
  )
}
