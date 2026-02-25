'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ANIMATION_TOKENS } from '@/lib/animation-tokens'

export interface ElectricalConnectorProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
  className?: string
}

export function ElectricalConnector({
  currentStep,
  totalSteps,
  labels = [],
  className
}: ElectricalConnectorProps) {
  // Calculate fill percentage
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentStep / (totalSteps - 1)) * 100)
  )

  return (
    <div className={cn('w-full relative mx-auto max-w-2xl', className)}>
      {/* Track Background - centered on 16px dots (dot center = 8px, track height = 4px, so top = 8px - 2px = 6px) */}
      <div className="absolute top-[6px] left-0 w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
        {/* Fill Line (Energy Beam) */}
        <motion.div
          className="h-full relative"
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            background: `linear-gradient(90deg, ${ANIMATION_TOKENS.colors.mint}, ${ANIMATION_TOKENS.colors.coral})`,
          }}
        >
          {/* THE SPARK: Leading edge voltage effect */}
          {progressPercent > 0 && progressPercent < 100 && (
            <motion.div
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20"
              style={{ right: '-8px' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {/* Core White Hot Center */}
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 bg-white rounded-full blur-[2px] shadow-[0_0_15px_4px_rgba(255,255,255,0.9)]" />
                {/* Vertical Lens Flare */}
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-8 bg-white/80 blur-[0.5px]"
                  animate={{ scaleY: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Horizontal Flare */}
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-[1px] bg-white/60 blur-[0.5px]"
                  animate={{ scaleX: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}

          {/* Data Shimmer Effect inside the wire */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>

      {/* Nodes (Steps) */}
      <div className="relative z-10 flex justify-between w-full">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep

          return (
            <div key={index} className="relative flex flex-col items-center">
              {/* Active State: Dual Plasma Ripples - centered on dot */}
              {isActive && (
                <>
                  <motion.div
                    className="absolute rounded-full border border-mint"
                    initial={{ width: 16, height: 16, opacity: 1 }}
                    animate={{ width: 48, height: 48, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    style={{
                      left: '50%',
                      top: '8px', // Center of 16px dot
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                  <motion.div
                    className="absolute rounded-full border border-coral"
                    initial={{ width: 16, height: 16, opacity: 1 }}
                    animate={{ width: 40, height: 40, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: 'easeOut' }}
                    style={{
                      left: '50%',
                      top: '8px', // Center of 16px dot
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </>
              )}

              {/* The Dot */}
              <motion.div
                className={cn(
                  'w-4 h-4 rounded-full border-2 transition-colors duration-300 z-10 flex items-center justify-center',
                  isActive || isCompleted
                    ? 'bg-mint border-mint/80 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                    : 'bg-slate-800 border-slate-600'
                )}
                animate={{ scale: isActive ? 1.25 : 1 }}
                transition={ANIMATION_TOKENS.springBouncy}
              >
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={ANIMATION_TOKENS.springBouncy}
                  >
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.div>

              {/* Label */}
              {labels[index] && (
                <motion.span
                  className={cn(
                    'text-[10px] mt-2 font-medium whitespace-nowrap',
                    isCompleted && 'text-status-success',
                    isActive && 'text-mint',
                    !isActive && !isCompleted && 'text-text-muted/50'
                  )}
                  animate={{
                    opacity: isActive ? [0.7, 1, 0.7] : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: isActive ? Infinity : 0,
                  }}
                >
                  {labels[index]}
                </motion.span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
