'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  AnalyzingIcon,
  WritingIcon,
  CastingIcon,
  VoiceoverIcon,
  AssemblingIcon,
  RenderingIcon,
  CompleteIcon,
} from '@/components/ui/animated-icons'

export type StageType =
  | 'analyzing'
  | 'writing'
  | 'casting'
  | 'voiceover'
  | 'assembling'
  | 'rendering'
  | 'complete'

interface StageIconProps {
  stage: StageType
  size?: number
  className?: string
}

// Clean breathing animation config
const BREATHING_ANIMATION = {
  scale: [1, 1.03, 1]
}

const BREATHING_TRANSITION = {
  repeat: Infinity,
  duration: 2,
  ease: 'easeInOut' as const
}

// Complete celebration config
const COMPLETE_ANIMATION = {
  scale: [0.9, 1.05, 1]
}

const COMPLETE_TRANSITION = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as const
}

const ICON_MAP: Record<StageType, React.ComponentType<{ size?: number; className?: string }>> = {
  analyzing: AnalyzingIcon,
  writing: WritingIcon,
  casting: CastingIcon,
  voiceover: VoiceoverIcon,
  assembling: AssemblingIcon,
  rendering: RenderingIcon,
  complete: CompleteIcon,
}

export function StageIcon({ stage, size = 48, className }: StageIconProps) {
  const IconComponent = ICON_MAP[stage]
  const isComplete = stage === 'complete'

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        className
      )}
    >
      {/* Single clean ambient glow */}
      <motion.div
        className={cn(
          'absolute inset-[-12px] rounded-2xl blur-2xl',
          isComplete ? 'bg-status-success/25' : 'bg-mint/20'
        )}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Icon Container - clean entrance */}
      <motion.div
        className={cn(
          'relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center',
          isComplete
            ? 'bg-gradient-to-br from-status-success to-emerald-400'
            : 'bg-gradient-to-br from-mint-light to-mint-dark'
        )}
        style={{
          boxShadow: isComplete
            ? '0 8px 32px rgba(16, 185, 129, 0.3)'
            : '0 8px 32px rgba(16, 185, 129, 0.25)',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Inner highlight */}
        <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />

        {/* Icon with clean animation - breathing for active, pop for complete */}
        <motion.div
          animate={isComplete ? COMPLETE_ANIMATION : BREATHING_ANIMATION}
          transition={isComplete ? COMPLETE_TRANSITION : BREATHING_TRANSITION}
        >
          <IconComponent size={size} className="relative z-10" />
        </motion.div>
      </motion.div>
    </div>
  )
}
