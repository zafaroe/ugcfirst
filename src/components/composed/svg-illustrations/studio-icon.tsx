'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * Studio Icon V2 — Abstract & Iconic
 *
 * Stacked composition layers with alignment snap
 * Dark themed, 80-160px, gentle ambient + hover motion
 */

interface StudioIconProps {
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
  mintDark: '#059669',
  mintGlow: 'rgba(16, 185, 129, 0.2)',
  mintGlowStrong: 'rgba(16, 185, 129, 0.35)',
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

export function StudioIcon({ size = 'lg', hovered = false, className }: StudioIconProps) {
  const [tick, setTick] = useState(0)
  const pixelSize = typeof size === 'number' ? size : sizes[size]

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 50)
    return () => clearInterval(id)
  }, [])

  const t = tick * 0.05
  const breathe = Math.sin(t * 0.8) * 0.5 + 0.5 // 0-1 slow pulse
  const orbit = t * 0.3 // slow rotation

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
          <linearGradient id="s-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.mintLight} />
            <stop offset="100%" stopColor={C.mintDark} />
          </linearGradient>
          <filter id="s-glow">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
          <filter id="s-soft">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        {/* Ambient glow */}
        <circle
          cx="80"
          cy="80"
          r={48 + breathe * 6}
          fill={C.mintGlow}
          filter="url(#s-soft)"
          opacity={0.4 + breathe * 0.15}
        />

        {/* Outer ring */}
        <circle cx="80" cy="80" r="54" fill="none" stroke={C.border} strokeWidth="1.5" />

        {/* Dashed orbit ring */}
        <circle
          cx="80"
          cy="80"
          r="47"
          fill="none"
          stroke={C.mint}
          strokeWidth="0.6"
          strokeOpacity={0.25 + breathe * 0.1}
          strokeDasharray="3 5"
          transform={`rotate(${orbit * (180 / Math.PI)} 80 80)`}
        />

        {/* Background disc */}
        <circle cx="80" cy="80" r="42" fill={C.raised} />

        {/* Core Icon: 3 stacked composition layers */}

        {/* Layer 3 (back) — largest, most faded */}
        <rect
          x="56"
          y="68"
          width="48"
          height="32"
          rx="4"
          fill={C.surface}
          stroke={C.mint}
          strokeWidth="0.8"
          strokeOpacity="0.2"
          transform={`translate(0 ${hovered ? -2 : 0})`}
          style={{ transition: 'transform 0.4s ease' }}
        />

        {/* Layer 2 (mid) */}
        <rect
          x="60"
          y="62"
          width="44"
          height="32"
          rx="4"
          fill={C.raised}
          stroke={C.mint}
          strokeWidth="1"
          strokeOpacity="0.35"
          transform={`translate(0 ${hovered ? -4 : 0})`}
          style={{ transition: 'transform 0.4s ease' }}
        />
        {/* Fake content lines on layer 2 */}
        <rect
          x="66"
          y="70"
          width="20"
          height="2.5"
          rx="1.25"
          fill={C.border}
          opacity="0.6"
          transform={`translate(0 ${hovered ? -4 : 0})`}
          style={{ transition: 'transform 0.4s ease' }}
        />
        <rect
          x="66"
          y="76"
          width="14"
          height="2"
          rx="1"
          fill={C.border}
          opacity="0.35"
          transform={`translate(0 ${hovered ? -4 : 0})`}
          style={{ transition: 'transform 0.4s ease' }}
        />

        {/* Layer 1 (front, active) — highlighted */}
        <g
          transform={`translate(0 ${hovered ? -6 : 0})`}
          style={{ transition: 'transform 0.4s ease' }}
          filter="url(#s-glow)"
        >
          <rect
            x="64"
            y="56"
            width="40"
            height="32"
            rx="5"
            fill={C.raised}
            stroke="url(#s-grad)"
            strokeWidth="1.5"
          />
          {/* Mini play triangle inside active layer */}
          <path d="M78 68L88 74L78 80Z" fill={C.mint} opacity={0.7 + breathe * 0.3} />
          {/* Timeline bar at bottom of active layer */}
          <rect x="69" y="83" width="30" height="2" rx="1" fill={C.border} />
          <rect
            x="69"
            y="83"
            width={12 + breathe * 8}
            height="2"
            rx="1"
            fill={C.mint}
            opacity="0.6"
          />
        </g>

        {/* Selection indicator — mint checkmark dot */}
        <g
          transform={`translate(0 ${hovered ? -6 : 0})`}
          style={{ transition: 'transform 0.4s ease' }}
        >
          <circle cx="100" cy="56" r="6" fill={C.mint} opacity={0.8 + breathe * 0.2} />
          <path
            d="M97.5 56L99.5 58L103 54.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Alignment crosshair lines (subtle) */}
        <line
          x1="84"
          y1="48"
          x2="84"
          y2="52"
          stroke={C.mint}
          strokeWidth="0.5"
          strokeOpacity={hovered ? 0.5 : 0}
          style={{ transition: 'stroke-opacity 0.3s ease' }}
        />
        <line
          x1="108"
          y1="72"
          x2="112"
          y2="72"
          stroke={C.mint}
          strokeWidth="0.5"
          strokeOpacity={hovered ? 0.5 : 0}
          style={{ transition: 'stroke-opacity 0.3s ease' }}
        />

        {/* Sparkle accents */}
        <circle
          cx={80 + Math.cos(orbit * 2) * 50}
          cy={80 + Math.sin(orbit * 2) * 50}
          r="2"
          fill={C.mint}
          opacity={0.3 + breathe * 0.3}
        />
        <circle
          cx={80 + Math.cos(orbit * 2 + Math.PI) * 50}
          cy={80 + Math.sin(orbit * 2 + Math.PI) * 50}
          r="1.5"
          fill={C.mintLight}
          opacity={0.2 + breathe * 0.2}
        />

        {/* Corner sparkle — 4-point star */}
        <g opacity={0.4 + breathe * 0.3}>
          <path
            d="M120 42L121.5 46L125.5 47.5L121.5 49L120 53L118.5 49L114.5 47.5L118.5 46Z"
            fill={C.amber}
          />
        </g>
        <g opacity={0.3 + (1 - breathe) * 0.3}>
          <path
            d="M40 112L41 115L44 116L41 117L40 120L39 117L36 116L39 115Z"
            fill={C.coral}
          />
        </g>
      </svg>
    </div>
  )
}
