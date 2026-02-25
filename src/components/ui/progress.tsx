'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  variant?: 'default' | 'gradient' | 'success' | 'warning'
  animated?: boolean
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const variantClasses = {
  default: 'bg-gradient-to-r from-mint-light via-mint to-mint-dark',
  gradient: 'bg-gradient-to-r from-mint via-mint-dark to-coral',
  success: 'bg-gradient-to-r from-status-success to-mint',
  warning: 'bg-gradient-to-r from-status-warning to-amber-light',
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  className,
  variant = 'default',
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'w-full bg-surface-secondary rounded-full overflow-hidden relative',
        sizeClasses[size]
      )}>
        <motion.div
          className={cn(
            'h-full rounded-full relative overflow-hidden',
            variantClasses[variant]
          )}
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Shimmer effect */}
          {animated && percentage > 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'linear',
              }}
            />
          )}
        </motion.div>

        {/* Subtle glow on track */}
        {percentage > 50 && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 10px rgba(16, 185, 129, 0.1)',
            }}
          />
        )}
      </div>

      {showLabel && (
        <motion.div
          className="mt-1 text-right"
          initial={animated ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-xs font-medium text-text-muted">{Math.round(percentage)}%</span>
        </motion.div>
      )}
    </div>
  )
}
