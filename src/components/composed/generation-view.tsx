'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ANIMATION_TOKENS } from '@/lib/animation-tokens'
import {
  Button,
  SPRING,
  EASINGS,
  DURATIONS,
  ElectricalConnector,
  GlitchText,
  StageIcon,
  type StageType,
} from '@/components/ui'

export type GenerationStage =
  | 'analyzing'
  | 'writing'
  | 'casting'
  | 'voiceover'
  | 'assembling'
  | 'rendering'
  | 'complete'

interface StageConfig {
  label: string
  activeLabel: string
}

const stageConfigs: Record<GenerationStage, StageConfig> = {
  analyzing: {
    label: 'Analyze',
    activeLabel: 'ANALYZING PRODUCT URL',
  },
  writing: {
    label: 'Script',
    activeLabel: 'WRITING VIRAL SCRIPT',
  },
  casting: {
    label: 'Avatar',
    activeLabel: 'CASTING AI AVATAR',
  },
  voiceover: {
    label: 'Voice',
    activeLabel: 'SYNTHESIZING VOICEOVER',
  },
  assembling: {
    label: 'Assemble',
    activeLabel: 'ASSEMBLING SCENE CUTS',
  },
  rendering: {
    label: 'Render',
    activeLabel: 'FINAL POLISH & RENDER',
  },
  complete: {
    label: 'Done',
    activeLabel: 'VIDEO READY',
  },
}

const defaultTips = [
  'Videos under 30 seconds tend to perform best on TikTok',
  'Adding captions can increase engagement by up to 40%',
  'The first 3 seconds are crucial for viewer retention',
  'Posting between 6-10 PM often gets more views',
  'Authentic content outperforms overly polished videos',
  'Using trending sounds can boost discoverability',
  'Hook viewers with a question or bold statement',
]

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
    },
  },
}

const tipVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.easeIn,
    },
  },
}

const completeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      ...SPRING.bouncy,
      delay: 0.2,
    },
  },
}

export interface GenerationViewProps {
  stage: GenerationStage
  stages: GenerationStage[]
  estimatedTime?: string
  onCancel?: () => void
  tips?: string[]
  className?: string
}

export function GenerationView({
  stage,
  stages,
  estimatedTime = '~45 seconds',
  onCancel,
  tips = defaultTips,
  className,
}: GenerationViewProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [tips.length])

  const currentStageIndex = stages.indexOf(stage)
  const isComplete = stage === 'complete'
  const stageLabels = stages.map((s) => stageConfigs[s].label)

  return (
    <motion.div
      className={cn(
        'relative flex flex-col items-center justify-center py-12 px-8',
        'min-h-[550px] overflow-hidden',
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Deep Space Background with Rotating Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orb - ROTATING */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
            left: '-10%',
            top: '-10%',
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.25, 0.4, 0.25],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Secondary gradient orb - COUNTER ROTATING */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[60px]"
          style={{
            background: 'radial-gradient(circle, rgba(217,70,239,0.25) 0%, transparent 70%)',
            right: '-10%',
            bottom: '-10%',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -60, 0],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 2 === 0 ? ANIMATION_TOKENS.colors.indigo : ANIMATION_TOKENS.colors.fuchsia,
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, i % 2 === 0 ? 10 : -10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Stage Icon with Contextual Animation */}
      <motion.div className="relative mb-6 z-10" variants={itemVariants}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={ANIMATION_TOKENS.springBouncy}
          >
            <StageIcon stage={stage as StageType} size={52} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Stage Label with Glitch Text Decoder */}
      <motion.div className="mb-2 z-10" variants={itemVariants}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <GlitchText
              text={stageConfigs[stage].activeLabel}
              className={cn(
                'text-2xl md:text-3xl',
                isComplete ? 'text-status-success' : 'text-text-primary'
              )}
              enableGlitch={!isComplete}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Estimated Time with icon */}
      {!isComplete && (
        <motion.div
          className="flex items-center gap-2 text-text-muted mb-8 z-10"
          variants={itemVariants}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap className="w-4 h-4 text-electric-indigo" />
          </motion.div>
          <span>Usually takes {estimatedTime}</span>
        </motion.div>
      )}

      {/* Electrical Connector Progress Bar */}
      <motion.div className="w-full max-w-xl mb-8 z-10" variants={itemVariants}>
        <ElectricalConnector
          currentStep={currentStageIndex}
          totalSteps={stages.length}
          labels={stageLabels}
        />
      </motion.div>

      {/* Rotating Tips - Enhanced with glass card */}
      {!isComplete && tips.length > 0 && (
        <motion.div
          className="relative max-w-md text-center mb-8 z-10"
          variants={itemVariants}
        >
          <div className="relative px-6 py-4 rounded-xl bg-surface/50 backdrop-blur-sm border border-border-default/30">
            {/* Sparkle decoration */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-vibrant-fuchsia/60" />
            </motion.div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <motion.span
                className="text-vibrant-fuchsia font-semibold font-mono"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                [TIP]
              </motion.span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentTipIndex}
                  className="text-text-muted"
                  variants={tipVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {tips[currentTipIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cancel Button - Secondary style per design guidelines */}
      {onCancel && !isComplete && (
        <motion.div variants={itemVariants} className="z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </motion.div>
      )}

      {/* Complete State with Enhanced Celebration */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="text-center relative z-10 mt-4"
            variants={completeVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Success card - z-20 to stay above the ring */}
            <motion.div
              className="relative z-20 px-8 py-6 rounded-2xl bg-gradient-to-br from-status-success/10 to-emerald-500/5 border border-status-success/30 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: EASINGS.easeOut }}
            >
              {/* Confetti icon */}
              <motion.div
                className="absolute -top-4 -right-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <PartyPopper className="w-8 h-8 text-status-success" />
              </motion.div>

              <motion.p
                className="text-lg font-semibold text-status-success mb-2 font-mono"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                [ SUCCESS ] VIDEO READY
              </motion.p>

              <motion.p
                className="text-sm text-text-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Your viral video has been generated successfully
              </motion.p>
            </motion.div>

            {/* Multi-layer celebration particles */}
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              {/* Inner ring of particles */}
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={`inner-${i}`}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#6366F1' : '#D946EF',
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 10) * Math.PI * 2) * 60,
                    y: Math.sin((i / 10) * Math.PI * 2) * 60,
                    scale: [0, 1.5, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2 + i * 0.04,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Outer ring of particles */}
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={`outer-${i}`}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#6366F1' : '#D946EF',
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 16) * Math.PI * 2) * 100,
                    y: Math.sin((i / 16) * Math.PI * 2) * 100,
                    scale: [0, 1, 0],
                    opacity: [1, 0.8, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.3 + i * 0.03,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Star sparkles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute"
                  style={{
                    left: `${10 + (i % 4) * 25}%`,
                    top: `${(Math.floor(i / 4)) * 100 - 20}%`,
                  }}
                  initial={{ scale: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.4 + i * 0.08,
                    ease: 'easeOut',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 0L7 5L12 6L7 7L6 12L5 7L0 6L5 5L6 0Z"
                      fill={i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#6366F1' : '#D946EF'}
                    />
                  </svg>
                </motion.div>
              ))}
            </div>

            {/* Success ring expansion - behind the card */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10"
              initial={{ scale: 0.3, opacity: 0.6 }}
              animate={{
                scale: [0.3, 3],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.5,
                delay: 0.1,
                ease: 'easeOut',
              }}
            >
              <div className="w-32 h-32 rounded-full border-2 border-status-success/50" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
