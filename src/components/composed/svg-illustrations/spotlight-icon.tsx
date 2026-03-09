'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * Spotlight Icon — Cinematic Product Animation
 *
 * Light beam illuminating a product with radiating glow
 * Dark themed, 80-160px, gentle ambient + hover motion
 */

interface SpotlightIconProps {
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
  coral: '#F43F5E',
  coralLight: '#FB7185',
  amber: '#F59E0B',
  amberLight: '#FBBF24',
  amberDark: '#D97706',
  amberGlow: 'rgba(251, 191, 36, 0.2)',
  amberGlowStrong: 'rgba(251, 191, 36, 0.4)',
  gold: '#FCD34D',
}

const sizes = {
  sm: 80,
  md: 120,
  lg: 160,
}

export function SpotlightIcon({ size = 'lg', hovered = false, className }: SpotlightIconProps) {
  const [tick, setTick] = useState(0)
  const pixelSize = typeof size === 'number' ? size : sizes[size]

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 50)
    return () => clearInterval(id)
  }, [])

  const t = tick * 0.05
  const breathe = Math.sin(t * 0.8) * 0.5 + 0.5 // 0-1 slow pulse
  const orbit = t * 0.3 // slow rotation
  const flicker = Math.sin(t * 3) * 0.1 + 0.9 // subtle light flicker

  // Light ray animation
  const rayPulse = (Math.sin(t * 1.2) + 1) / 2

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
          <linearGradient id="sp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.gold} />
            <stop offset="100%" stopColor={C.amberDark} />
          </linearGradient>
          <linearGradient id="sp-beam" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={C.amberLight} stopOpacity="0.7" />
            <stop offset="100%" stopColor={C.amberLight} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sp-box-face" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3D3834" />
            <stop offset="100%" stopColor={C.raised} />
          </linearGradient>
          <radialGradient id="sp-floor-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.amberLight} stopOpacity="0.3" />
            <stop offset="100%" stopColor={C.amberLight} stopOpacity="0" />
          </radialGradient>
          <filter id="sp-glow">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
          <filter id="sp-soft">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="sp-bulb-glow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
          <clipPath id="sp-circle-clip">
            <circle cx="80" cy="80" r="42" />
          </clipPath>
        </defs>

        {/* Ambient glow */}
        <circle
          cx="80"
          cy="80"
          r={48 + breathe * 6}
          fill={C.amberGlow}
          filter="url(#sp-soft)"
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
          stroke={C.amber}
          strokeWidth="0.6"
          strokeOpacity={0.25 + breathe * 0.1}
          strokeDasharray="3 5"
          transform={`rotate(${orbit * (180 / Math.PI)} 80 80)`}
        />

        {/* Background disc */}
        <circle cx="80" cy="80" r="42" fill={C.raised} />

        {/* Content clipped to circle */}
        <g clipPath="url(#sp-circle-clip)">
          {/* Floor glow where light hits */}
          <ellipse
            cx="80"
            cy="108"
            rx={24 + rayPulse * 4}
            ry={8 + rayPulse * 2}
            fill="url(#sp-floor-glow)"
            opacity={0.6 + breathe * 0.2}
          />

          {/* Light beam from spotlight */}
          <path
            d={`M80 50 L${64 - rayPulse * 2} 115 L${96 + rayPulse * 2} 115 Z`}
            fill="url(#sp-beam)"
            opacity={(0.35 + breathe * 0.15) * flicker}
            style={{ transition: 'opacity 0.1s ease' }}
          />

          {/* Secondary subtle beam edges */}
          <path
            d="M80 50 L62 115"
            stroke={C.amberLight}
            strokeWidth="0.5"
            strokeOpacity={0.2 * flicker}
          />
          <path
            d="M80 50 L98 115"
            stroke={C.amberLight}
            strokeWidth="0.5"
            strokeOpacity={0.2 * flicker}
          />

          {/* Product box — 3D isometric */}
          <g
            transform={`translate(0 ${hovered ? -4 : 0})`}
            style={{ transition: 'transform 0.4s ease' }}
            filter="url(#sp-glow)"
          >
            {/* Box shadow */}
            <ellipse
              cx="80"
              cy="108"
              rx="14"
              ry="4"
              fill="black"
              opacity={hovered ? 0.2 : 0.3}
              style={{ transition: 'opacity 0.4s ease' }}
            />

            {/* Box left face */}
            <path
              d="M66 85 L66 100 L80 108 L80 93 Z"
              fill={C.surface}
              stroke={C.amber}
              strokeWidth="1"
              strokeOpacity={0.3 + breathe * 0.2}
            />

            {/* Box right face */}
            <path
              d="M80 93 L80 108 L94 100 L94 85 Z"
              fill="url(#sp-box-face)"
              stroke={C.amber}
              strokeWidth="1"
              strokeOpacity={0.3 + breathe * 0.2}
            />

            {/* Box top face */}
            <path
              d="M66 85 L80 77 L94 85 L80 93 Z"
              fill={C.raised}
              stroke="url(#sp-grad)"
              strokeWidth="1.5"
            />

            {/* Highlight on top edge */}
            <path
              d="M68 85 L80 78 L92 85"
              fill="none"
              stroke={C.gold}
              strokeWidth="1"
              strokeOpacity={0.4 + breathe * 0.3}
              strokeLinecap="round"
            />
          </g>

          {/* Spotlight source at top */}
          <g
            transform={`translate(0 ${hovered ? 2 : 0})`}
            style={{ transition: 'transform 0.4s ease' }}
          >
            {/* Spotlight housing */}
            <ellipse
              cx="80"
              cy="48"
              rx="10"
              ry="4"
              fill={C.border}
            />
            <path
              d="M72 48 L74 55 L86 55 L88 48"
              fill={C.raised}
              stroke={C.border}
              strokeWidth="1"
            />

            {/* Light bulb/source */}
            <circle
              cx="80"
              cy="55"
              r={4 + breathe * 0.5}
              fill={C.amberLight}
              filter="url(#sp-bulb-glow)"
              opacity={0.8 + breathe * 0.2}
            />
            <circle
              cx="80"
              cy="55"
              r="2.5"
              fill={C.gold}
              opacity={flicker}
            />
          </g>

          {/* Floating particles in light beam */}
          <circle
            cx={75 + Math.sin(t * 1.5) * 5}
            cy={70 + (t * 8) % 30}
            r="1.2"
            fill={C.gold}
            opacity={(0.3 + breathe * 0.4) * (1 - ((t * 8) % 30) / 30)}
          />
          <circle
            cx={85 + Math.cos(t * 1.8) * 4}
            cy={65 + (t * 6 + 15) % 35}
            r="0.8"
            fill={C.amberLight}
            opacity={(0.4 + breathe * 0.3) * (1 - ((t * 6 + 15) % 35) / 35)}
          />
          <circle
            cx={78 + Math.sin(t * 2.2) * 6}
            cy={75 + (t * 10 + 8) % 25}
            r="1"
            fill={C.gold}
            opacity={(0.35 + breathe * 0.35) * (1 - ((t * 10 + 8) % 25) / 25)}
          />
        </g>

        {/* Orbiting dots outside circle */}
        <circle
          cx={80 + Math.cos(orbit * 2) * 50}
          cy={80 + Math.sin(orbit * 2) * 50}
          r="2"
          fill={C.amber}
          opacity={0.3 + breathe * 0.3}
        />
        <circle
          cx={80 + Math.cos(orbit * 2 + Math.PI) * 50}
          cy={80 + Math.sin(orbit * 2 + Math.PI) * 50}
          r="1.5"
          fill={C.amberLight}
          opacity={0.2 + breathe * 0.2}
        />

        {/* Corner sparkles — 4-point stars */}
        <g opacity={0.4 + breathe * 0.3}>
          <path
            d="M38 56L39.5 60L43.5 61.5L39.5 63L38 67L36.5 63L32.5 61.5L36.5 60Z"
            fill={C.mint}
          />
        </g>
        <g opacity={0.3 + (1 - breathe) * 0.3}>
          <path
            d="M124 106L125 109L128 110L125 111L124 114L123 111L120 110L123 109Z"
            fill={C.coral}
          />
        </g>
        <g opacity={0.35 + breathe * 0.25}>
          <path
            d="M120 44L121.5 48L125.5 49.5L121.5 51L120 55L118.5 51L114.5 49.5L118.5 48Z"
            fill={C.gold}
          />
        </g>
      </svg>
    </div>
  )
}
