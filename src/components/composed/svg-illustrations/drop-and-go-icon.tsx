'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * Drop & Go Icon V2 — Abstract & Iconic
 *
 * Link pulse radiating into play triangle
 * Dark themed, 80-160px, gentle ambient + hover motion
 */

interface DropAndGoIconProps {
  size?: 'sm' | 'md' | 'lg' | number
  hovered?: boolean
  className?: string
}

const C = {
  bg: '#0C0A09',
  surface: '#1C1917',
  raised: '#292524',
  border: '#44403C',
  borderSubtle: '#35302C',
  textPrimary: '#F8FAFC',
  textMuted: '#A8A29E',
  textFaint: '#57534E',
  mint: '#10B981',
  mintLight: '#34D399',
  mintGlow: 'rgba(16, 185, 129, 0.2)',
  coral: '#F43F5E',
  coralLight: '#FB7185',
  coralGlow: 'rgba(244, 63, 94, 0.2)',
  coralGlowStrong: 'rgba(244, 63, 94, 0.35)',
  amber: '#FBBF24',
}

const sizes = {
  sm: 80,
  md: 120,
  lg: 160,
}

export function DropAndGoIcon({ size = 'lg', hovered = false, className }: DropAndGoIconProps) {
  const [tick, setTick] = useState(0)
  const pixelSize = typeof size === 'number' ? size : sizes[size]

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 50)
    return () => clearInterval(id)
  }, [])

  const t = tick * 0.05
  const breathe = Math.sin(t * 0.8) * 0.5 + 0.5
  const orbit = t * 0.3

  // Pulse rings expand outward
  const pulse1 = (t * 0.6) % 1 // 0-1 repeating
  const pulse2 = ((t * 0.6) + 0.5) % 1

  return (
    <div className={cn('relative', className)} style={{ width: pixelSize, height: pixelSize }}>
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 160 160"
        fill="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="d-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.coralLight} />
            <stop offset="100%" stopColor={C.coral} />
          </linearGradient>
          <filter id="d-glow">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
          <filter id="d-soft">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        {/* Ambient glow */}
        <circle
          cx="80"
          cy="80"
          r={48 + breathe * 6}
          fill={C.coralGlow}
          filter="url(#d-soft)"
          opacity={0.4 + breathe * 0.15}
        />

        {/* Outer ring */}
        <circle cx="80" cy="80" r="54" fill="none" stroke={C.border} strokeWidth="1.5" />

        {/* Dashed orbit */}
        <circle
          cx="80"
          cy="80"
          r="47"
          fill="none"
          stroke={C.coral}
          strokeWidth="0.6"
          strokeOpacity={0.25 + breathe * 0.1}
          strokeDasharray="3 5"
          transform={`rotate(${-orbit * (180 / Math.PI)} 80 80)`}
        />

        {/* Background disc */}
        <circle cx="80" cy="80" r="42" fill={C.raised} />

        {/* Pulse rings — radiating from center */}
        <circle
          cx="80"
          cy="80"
          r={14 + pulse1 * 26}
          fill="none"
          stroke={C.coral}
          strokeWidth={1.5 - pulse1 * 1}
          opacity={0.4 * (1 - pulse1)}
        />
        <circle
          cx="80"
          cy="80"
          r={14 + pulse2 * 26}
          fill="none"
          stroke={C.coral}
          strokeWidth={1.5 - pulse2 * 1}
          opacity={0.4 * (1 - pulse2)}
        />

        {/* Core: Link icon morphing/connected to play */}

        {/* Central link chain — two interlocked rounded rects */}
        <g filter="url(#d-glow)">
          {/* Top-left link */}
          <rect
            x="58"
            y="66"
            width="28"
            height="14"
            rx="7"
            fill="none"
            stroke="url(#d-grad)"
            strokeWidth="2.5"
            transform={`rotate(-30 72 73) translate(${hovered ? -1 : 0} ${hovered ? -1 : 0})`}
            style={{ transition: 'transform 0.35s ease' }}
          />

          {/* Bottom-right link */}
          <rect
            x="74"
            y="80"
            width="28"
            height="14"
            rx="7"
            fill="none"
            stroke="url(#d-grad)"
            strokeWidth="2.5"
            transform={`rotate(-30 88 87) translate(${hovered ? 1 : 0} ${hovered ? 1 : 0})`}
            style={{ transition: 'transform 0.35s ease' }}
          />
        </g>

        {/* Tiny play triangle at center intersection */}
        <g
          opacity={0.7 + breathe * 0.3}
          transform={`scale(${hovered ? 1.15 : 1})`}
          style={{ transformOrigin: '80px 80px', transition: 'transform 0.35s ease' }}
        >
          <path d="M76 75L89 81.5L76 88Z" fill={C.coral} />
        </g>

        {/* Lightning bolt accent — speed/auto feel */}
        <g
          opacity={0.5 + breathe * 0.3}
          transform={`translate(${hovered ? 0 : 0} ${hovered ? -2 : 0})`}
          style={{ transition: 'transform 0.35s ease' }}
        >
          <path
            d="M102 58L98 67H103L99 76"
            stroke={C.amber}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* Orbiting dots */}
        <circle
          cx={80 + Math.cos(orbit * 2.2) * 50}
          cy={80 + Math.sin(orbit * 2.2) * 50}
          r="2"
          fill={C.coral}
          opacity={0.3 + breathe * 0.3}
        />
        <circle
          cx={80 + Math.cos(orbit * 2.2 + Math.PI) * 50}
          cy={80 + Math.sin(orbit * 2.2 + Math.PI) * 50}
          r="1.5"
          fill={C.coralLight}
          opacity={0.2 + breathe * 0.2}
        />

        {/* Corner sparkles */}
        <g opacity={0.4 + breathe * 0.3}>
          <path
            d="M38 48L39.5 52L43.5 53.5L39.5 55L38 59L36.5 55L32.5 53.5L36.5 52Z"
            fill={C.mint}
          />
        </g>
        <g opacity={0.3 + (1 - breathe) * 0.3}>
          <path
            d="M122 112L123 115L126 116L123 117L122 120L121 117L118 116L121 115Z"
            fill={C.amber}
          />
        </g>
      </svg>
    </div>
  )
}
