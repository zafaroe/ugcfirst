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

export interface ModeSelectionCardProps {
  mode: 'diy' | 'concierge'
  className?: string
}

const modeConfig = {
  diy: {
    title: 'DIY Mode',
    description: 'Full creative control over AI avatars, voices, and script.',
    credits: 10,
    buttonText: 'Create Video',
    href: '/create/diy',
    gradient: 'from-electric-indigo to-indigo-400',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    borderGradient: 'linear-gradient(135deg, #6366F1, #818CF8, #6366F1)',
  },
  concierge: {
    title: 'Reel It In',
    description: "Cast your topic and we'll reel in a viral video. AI does the heavy lifting.",
    credits: 15,
    buttonText: 'Cast Your Reel',
    href: '/create/concierge',
    gradient: 'from-vibrant-fuchsia to-pink-400',
    glowColor: 'rgba(217, 70, 239, 0.3)',
    borderGradient: 'linear-gradient(135deg, #D946EF, #E879F9, #D946EF)',
  },
}

export function ModeSelectionCard({ mode, className }: ModeSelectionCardProps) {
  const config = modeConfig[mode]

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl overflow-hidden h-full',
        'group cursor-pointer',
        className
      )}
      style={{
        background: `linear-gradient(#1E293B, #1E293B) padding-box, ${config.borderGradient} border-box`,
        border: '2px solid transparent',
      }}
      initial={{ y: 0 }}
      whileHover={{ y: -8 }}
      transition={SPRING.bouncy}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: config.borderGradient,
          filter: 'blur(25px)',
          opacity: 0,
          zIndex: -1,
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.35 }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative p-6 h-full flex flex-col">
        {/* Credit badge */}
        <motion.div
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/80 backdrop-blur-sm border border-border-default"
          whileHover={{ scale: 1.05 }}
          transition={SPRING.gentle}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <FontAwesomeIcon
              icon={faBolt}
              className={cn(
                'w-3.5 h-3.5',
                mode === 'diy' ? 'text-electric-indigo' : 'text-vibrant-fuchsia'
              )}
            />
          </motion.div>
          <span className="text-sm font-semibold text-text-primary">
            {config.credits} Credits
          </span>
        </motion.div>

        {/* Illustration */}
        <div className="flex items-center justify-center py-2" style={{ height: '210px' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            {mode === 'diy' ? (
              <DIYIllustration size="lg" animated />
            ) : (
              <ReelIllustration size="lg" animated />
            )}
          </motion.div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              {config.title}
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Action button */}
          <Link href={config.href} className="block">
            <Button
              className={cn(
                'w-full group/btn',
                mode === 'diy'
                  ? 'bg-gradient-to-r from-electric-indigo to-indigo-500'
                  : 'bg-gradient-to-r from-vibrant-fuchsia to-pink-500'
              )}
            >
              {config.buttonText}
              <motion.span
                className="ml-2 inline-block"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={SPRING.bouncy}
              >
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </motion.span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
        initial={{ backgroundPosition: '200% 0' }}
        whileHover={{ backgroundPosition: '-200% 0' }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

// Smaller variant for other contexts
export function ModeSelectionCardCompact({ mode, className }: ModeSelectionCardProps) {
  const config = modeConfig[mode]

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
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            mode === 'diy' ? 'bg-electric-indigo/20' : 'bg-vibrant-fuchsia/20'
          )}>
            {mode === 'diy' ? (
              <DIYIllustration size="sm" animated={false} />
            ) : (
              <ReelIllustration size="sm" animated={false} />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-text-primary">{config.title}</h4>
            <div className="flex items-center gap-1 text-sm text-text-muted">
              <FontAwesomeIcon
                icon={faBolt}
                className={cn(
                  'w-3 h-3',
                  mode === 'diy' ? 'text-electric-indigo' : 'text-vibrant-fuchsia'
                )}
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
