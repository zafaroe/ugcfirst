'use client'

import { cn } from '@/lib/utils'

export interface LogoProps {
  variant?: 'colored' | 'light' | 'dark' | 'icon'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizeMap = {
  sm: { fontSize: 18, iconSize: 28, dotSize: 5, dotOffset: -1 },
  md: { fontSize: 22, iconSize: 36, dotSize: 6, dotOffset: -1 },
  lg: { fontSize: 28, iconSize: 44, dotSize: 7, dotOffset: -1 },
  xl: { fontSize: 36, iconSize: 56, dotSize: 9, dotOffset: -2 },
  '2xl': { fontSize: 48, iconSize: 72, dotSize: 12, dotOffset: -2 },
}

export function Logo({ variant = 'colored', size = 'md', className }: LogoProps) {
  const dimensions = sizeMap[size]

  // Icon only variant — "u" in mint rounded square
  if (variant === 'icon') {
    const s = dimensions.iconSize
    return (
      <svg
        className={cn('flex-shrink-0', className)}
        width={s}
        height={s}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ugcfirst-icon-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#10B981" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#ugcfirst-icon-grad)" />
        <text
          x="50%"
          y="54%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontFamily="Outfit, system-ui, sans-serif"
          fontWeight="800"
          fontSize="20"
          fill="white"
          letterSpacing="-0.5"
        >
          u
        </text>
      </svg>
    )
  }

  // Determine text color based on variant
  // Using CSS custom property for 'colored' variant to auto-adapt to theme
  let textStyle: React.CSSProperties = {}
  if (variant === 'light') {
    // Always white - for use on dark backgrounds
    textStyle = { color: '#FFFFFF' }
  } else if (variant === 'dark') {
    // Always dark - for use on light backgrounds
    textStyle = { color: '#1C1917' }
  } else {
    // 'colored' variant - uses CSS variable that changes with .dark class
    textStyle = { color: 'var(--color-logo-text)' }
  }

  return (
    <span
      className={cn('inline-flex items-baseline flex-shrink-0', className)}
      style={{
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontWeight: 800,
        fontSize: dimensions.fontSize,
        letterSpacing: '-0.5px',
        lineHeight: 1,
      }}
    >
      <span style={textStyle}>ugcfirst</span>
      <span
        style={{
          display: 'inline-block',
          width: dimensions.dotSize,
          height: dimensions.dotSize,
          borderRadius: '50%',
          backgroundColor: '#10B981',
          marginLeft: 2,
          marginBottom: dimensions.dotOffset,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
    </span>
  )
}
