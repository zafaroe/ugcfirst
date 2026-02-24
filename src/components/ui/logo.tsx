'use client'

import { cn } from '@/lib/utils'

export interface LogoProps {
  variant?: 'colored' | 'light' | 'dark' | 'icon'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizeMap = {
  sm: { width: 120, height: 32, iconSize: 28 },
  md: { width: 150, height: 40, iconSize: 36 },
  lg: { width: 180, height: 48, iconSize: 44 },
  xl: { width: 240, height: 64, iconSize: 56 },
  '2xl': { width: 320, height: 86, iconSize: 72 },
}

// Use a static gradient ID - all logos share the same gradient colors
// This avoids hydration mismatches from useId() generating different IDs
const GRADIENT_ID = 'vidnary-logo-gradient'

export function Logo({ variant = 'colored', size = 'md', className }: LogoProps) {
  const dimensions = sizeMap[size]
  const gradientId = GRADIENT_ID

  // Icon only variant
  if (variant === 'icon') {
    return (
      <svg
        className={cn('flex-shrink-0', className)}
        width={dimensions.iconSize}
        height={dimensions.iconSize}
        viewBox="0 0 1024 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="240"
            y1="200"
            x2="820"
            y2="824"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="1" stopColor="#D946EF" />
          </linearGradient>
        </defs>
        {/* Rounded play button shape */}
        <path
          d="M338 182 C300 204 274 246 274 294 V730 C274 778 300 820 338 842 C376 864 422 861 458 836 L792 630 C825 610 846 574 846 536 C846 498 825 462 792 442 L458 188 C422 163 376 160 338 182Z"
          fill={`url(#${gradientId})`}
        />
        {/* Lightning bolt cutout */}
        <path
          d="M560 228 L404 540 H518 L464 796 L628 486 H520 L560 228Z"
          fill="#0F172A"
        />
      </svg>
    )
  }

  // Determine colors based on variant
  const isLight = variant === 'light'
  const isDark = variant === 'dark'
  const textColor = isLight ? '#F8FAFC' : '#0F172A'
  const iconFill = isDark ? '#0F172A' : (isLight ? '#F8FAFC' : `url(#${gradientId})`)
  const boltFill = isDark ? '#F8FAFC' : '#0F172A'

  return (
    <svg
      className={cn('flex-shrink-0', className)}
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 1200 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="240"
          y1="200"
          x2="820"
          y2="824"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#D946EF" />
        </linearGradient>
      </defs>

      {/* Icon - scaled to fit */}
      <g transform="translate(40,40)">
        <svg width="240" height="240" viewBox="0 0 1024 1024">
          <defs>
            <linearGradient
              id={`${gradientId}_icon`}
              x1="240"
              y1="200"
              x2="820"
              y2="824"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#6366F1" />
              <stop offset="1" stopColor="#D946EF" />
            </linearGradient>
          </defs>
          {/* Rounded play button shape */}
          <path
            d="M338 182 C300 204 274 246 274 294 V730 C274 778 300 820 338 842 C376 864 422 861 458 836 L792 630 C825 610 846 574 846 536 C846 498 825 462 792 442 L458 188 C422 163 376 160 338 182Z"
            fill={isDark ? '#0F172A' : (isLight ? '#F8FAFC' : `url(#${gradientId}_icon)`)}
          />
          {/* Lightning bolt cutout */}
          <path
            d="M560 228 L404 540 H518 L464 796 L628 486 H520 L560 228Z"
            fill={isDark ? '#F8FAFC' : '#0F172A'}
          />
        </svg>
      </g>

      {/* Text: Vidnary */}
      <text
        x="330"
        y="205"
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
        fontWeight="800"
        fontSize="144"
        fill={textColor}
      >
        Vidnary
      </text>
    </svg>
  )
}
