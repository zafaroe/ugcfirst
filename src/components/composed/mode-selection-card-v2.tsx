'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faBolt } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { DropAndGoIcon } from './svg-illustrations/drop-and-go-icon'
import { StudioIcon } from './svg-illustrations/studio-icon'
import { SpotlightIcon } from './svg-illustrations/spotlight-icon'

export interface ModeSelectionCardProps {
  mode: 'diy' | 'concierge' | 'spotlight'
  className?: string
}

const modeConfig = {
  diy: {
    title: 'Studio',
    description: 'Direct your video, step by step.',
    tagText: 'You direct',
    credits: 10,
    buttonText: 'Open Studio',
    href: '/create/diy',
    accentColor: '#10B981', // mint
    accentColorLight: '#34D399',
    accentBg: 'bg-mint/10',
    glowColor: 'rgba(16, 185, 129, 0.2)',
    borderHover: '#10B98140',
  },
  concierge: {
    title: 'Drop & Go',
    description: 'Paste a link, get a viral video.',
    tagText: 'AI handles it',
    credits: 15,
    buttonText: 'Drop a Link',
    href: '/create/concierge',
    accentColor: '#F43F5E', // coral
    accentColorLight: '#FB7185',
    accentBg: 'bg-coral/10',
    glowColor: 'rgba(244, 63, 94, 0.2)',
    borderHover: '#F43F5E40',
  },
  spotlight: {
    title: 'Spotlight',
    description: 'Cinematic product animations.',
    tagText: 'No avatar',
    credits: 10,
    buttonText: 'Create Animation',
    href: '/create/spotlight',
    accentColor: '#F59E0B', // amber
    accentColorLight: '#FBBF24',
    accentBg: 'bg-amber-400/10',
    glowColor: 'rgba(251, 191, 36, 0.2)',
    borderHover: '#F59E0B40',
  },
}

export function ModeSelectionCard({ mode, className }: ModeSelectionCardProps) {
  const config = modeConfig[mode]
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={config.href}>
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden cursor-pointer',
          'border transition-all duration-300 ease-out',
          'bg-surface',
          className
        )}
        style={{
          borderColor: isHovered ? config.borderHover : '#44403C',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered
            ? `0 20px 40px -10px rgba(0,0,0,0.3), 0 0 20px ${config.glowColor}`
            : '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Accent stripe at top */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${config.accentColor}, ${config.accentColorLight})`,
          }}
        />

        <div className="p-6 flex flex-col items-center gap-4">
          {/* Tags row - Credit badge + Mode tag */}
          <div className="flex items-center justify-between w-full">
            {/* Credit badge */}
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faBolt}
                className="w-3.5 h-3.5"
                style={{ color: config.accentColor }}
              />
              <span className="text-sm text-text-muted">
                {config.credits} Credits
              </span>
            </div>

            {/* Mode tag pill */}
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                config.accentBg
              )}
              style={{ color: config.accentColor }}
            >
              {config.tagText}
            </span>
          </div>

          {/* Icon */}
          <div className="py-2">
            {mode === 'diy' && <StudioIcon size="lg" hovered={isHovered} />}
            {mode === 'concierge' && <DropAndGoIcon size="lg" hovered={isHovered} />}
            {mode === 'spotlight' && <SpotlightIcon size="lg" hovered={isHovered} />}
          </div>

          {/* Text */}
          <div className="text-center">
            <h3 className="text-base font-bold text-text-primary mb-1">
              {config.title}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Button */}
          <button
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white tracking-wide"
            style={{ backgroundColor: config.accentColor }}
          >
            {config.buttonText} →
          </button>
        </div>
      </div>
    </Link>
  )
}

// Compact variant for other contexts
export function ModeSelectionCardCompact({ mode, className }: ModeSelectionCardProps) {
  const config = modeConfig[mode]
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={config.href}>
      <motion.div
        className={cn(
          'relative rounded-xl p-4 cursor-pointer overflow-hidden',
          'border border-border-default',
          'bg-surface',
          className
        )}
        whileHover={{
          y: -2,
          boxShadow: '0 10px 25px -5px rgba(120, 113, 108, 0.15)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: config.accentColor }}
        />

        <div className="flex items-center gap-4 pl-2">
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden',
              config.accentBg
            )}
          >
            {mode === 'diy' && <StudioIcon size="sm" hovered={isHovered} />}
            {mode === 'concierge' && <DropAndGoIcon size="sm" hovered={isHovered} />}
            {mode === 'spotlight' && <SpotlightIcon size="sm" hovered={isHovered} />}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-text-primary">{config.title}</h4>
            <div className="flex items-center gap-1 text-sm text-text-muted">
              <FontAwesomeIcon
                icon={faBolt}
                className="w-3 h-3"
                style={{ color: config.accentColor }}
              />
              <span>{config.credits} Credits</span>
            </div>
          </div>
          <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-text-muted" />
        </div>
      </motion.div>
    </Link>
  )
}
