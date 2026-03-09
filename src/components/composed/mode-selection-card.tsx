'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faBolt } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SPRING } from '@/components/ui/motion'
import { DIYIllustration } from './svg-illustrations/diy-illustration'
import { ReelIllustration } from './svg-illustrations/reel-illustration'
import { SpotlightIllustration } from './svg-illustrations/spotlight-illustration'

export interface ModeSelectionCardProps {
  mode: 'diy' | 'concierge' | 'spotlight'
  className?: string
}

const modeConfig = {
  diy: {
    title: 'DIY Mode',
    description: 'Full creative control over AI avatars, voices, and script.',
    credits: 10,
    buttonText: 'Create Video',
    href: '/create/diy',
    gradient: 'from-mint to-indigo-400',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    borderGradient: 'linear-gradient(135deg, #10B981, #34D399, #10B981)',
    accentColor: 'text-mint',
    buttonClass: 'bg-mint hover:bg-mint-dark',
  },
  concierge: {
    title: 'Auto Pilot',
    description: "Cast your topic and we'll reel in a viral video. AI does the heavy lifting.",
    credits: 15,
    buttonText: 'Cast Your Reel',
    href: '/create/concierge',
    gradient: 'from-coral to-pink-400',
    glowColor: 'rgba(244, 63, 94, 0.3)',
    borderGradient: 'linear-gradient(135deg, #F43F5E, #FB7185, #F43F5E)',
    accentColor: 'text-coral',
    buttonClass: 'bg-coral hover:bg-coral-light',
  },
  spotlight: {
    title: 'Spotlight',
    description: 'Cinematic product animations. No avatar, no script - pure visual showcase.',
    credits: 10,
    buttonText: 'Create Animation',
    href: '/create/spotlight',
    gradient: 'from-amber-400 to-orange-500',
    glowColor: 'rgba(251, 191, 36, 0.3)',
    borderGradient: 'linear-gradient(135deg, #F59E0B, #FBBF24, #F59E0B)',
    accentColor: 'text-amber-400',
    buttonClass: 'bg-amber-500 hover:bg-amber-600',
  },
}

export function ModeSelectionCard({ mode, className }: ModeSelectionCardProps) {
  const config = modeConfig[mode]

  return (
    <Link href={config.href}>
      <motion.div
        className={cn(
          'relative rounded-xl overflow-hidden h-full',
          'group cursor-pointer',
          'border border-border-default',
          'hover:border-transparent',
          'bg-stone-800',
          className
        )}
        initial={{ y: 0 }}
        whileHover={{
          y: -4,
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Gradient border on hover - uses CSS class for theme support */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: `linear-gradient(var(--color-surface-raised), var(--color-surface-raised)) padding-box, ${config.borderGradient} border-box`,
            border: '2px solid transparent',
          }}
        />

        <div className="relative p-6 h-full flex flex-col">
          {/* Credit badge - simplified */}
          <div className="flex items-center gap-1.5 mb-4">
            <FontAwesomeIcon
              icon={faBolt}
              className={cn('w-3.5 h-3.5', config.accentColor)}
            />
            <span className="text-sm font-medium text-text-muted">
              {config.credits} Credits
            </span>
          </div>

          {/* Illustration - reduced height */}
          <div className="flex items-center justify-center py-4" style={{ height: '160px' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="group-hover:scale-105 transition-transform duration-300"
            >
              {mode === 'diy' && <DIYIllustration size="lg" animated={false} />}
              {mode === 'concierge' && <ReelIllustration size="lg" animated={false} />}
              {mode === 'spotlight' && <SpotlightIllustration size="lg" animated={false} />}
            </motion.div>
          </div>

          {/* Content */}
          <div className="mt-auto space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                {config.title}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* Action button */}
            <Button className={cn('w-full', config.buttonClass)}>
              {config.buttonText}
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// Smaller variant for other contexts
export function ModeSelectionCardCompact({ mode, className }: ModeSelectionCardProps) {
  const config = modeConfig[mode]

  const bgColorClass = {
    diy: 'bg-mint/20',
    concierge: 'bg-coral/20',
    spotlight: 'bg-amber-400/20',
  }[mode]

  return (
    <Link href={config.href}>
      <motion.div
        className={cn(
          'relative rounded-xl p-4 gradient-border-glow cursor-pointer',
          className
        )}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING.bouncy}
      >
        <div className="flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', bgColorClass)}>
            {mode === 'diy' && <DIYIllustration size="sm" animated={false} />}
            {mode === 'concierge' && <ReelIllustration size="sm" animated={false} />}
            {mode === 'spotlight' && <SpotlightIllustration size="sm" animated={false} />}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-text-primary">{config.title}</h4>
            <div className="flex items-center gap-1 text-sm text-text-muted">
              <FontAwesomeIcon icon={faBolt} className={cn('w-3 h-3', config.accentColor)} />
              <span>{config.credits} Credits</span>
            </div>
          </div>
          <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-text-muted" />
        </div>
      </motion.div>
    </Link>
  )
}
