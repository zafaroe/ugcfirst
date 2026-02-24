'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SPRING } from './motion'

// ============================================
// GRADIENT BORDER CARD
// ============================================

export interface GradientCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode
  variant?: 'default' | 'indigo' | 'fuchsia' | 'animated'
  glowOnHover?: boolean
  selected?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const GradientCard = forwardRef<HTMLDivElement, GradientCardProps>(
  (
    {
      children,
      variant = 'default',
      glowOnHover = true,
      selected = false,
      padding = 'md',
      className,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'relative rounded-2xl overflow-hidden',
      paddingClasses[padding],
      'bg-surface',
      className
    )

    // Different gradient styles based on variant
    const getGradientStyle = () => {
      switch (variant) {
        case 'indigo':
          return 'linear-gradient(135deg, #6366F1, #818CF8, #6366F1)'
        case 'fuchsia':
          return 'linear-gradient(135deg, #D946EF, #E879F9, #D946EF)'
        case 'animated':
          return 'linear-gradient(var(--gradient-angle, 135deg), #6366F1, #D946EF, #6366F1)'
        default:
          return 'linear-gradient(135deg, #6366F1, #D946EF, #6366F1)'
      }
    }

    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        style={{
          background: `linear-gradient(#1E293B, #1E293B) padding-box, ${getGradientStyle()} border-box`,
          border: '2px solid transparent',
        }}
        initial={{ y: 0 }}
        whileHover={glowOnHover ? { y: -4 } : undefined}
        transition={SPRING.bouncy}
        {...props}
      >
        {/* Glow effect on hover */}
        {glowOnHover && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: getGradientStyle(),
              filter: 'blur(20px)',
              opacity: 0,
              zIndex: -1,
            }}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.3 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Selected state glow */}
        {selected && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse-glow"
            style={{ zIndex: -1 }}
          />
        )}

        {children}
      </motion.div>
    )
  }
)

GradientCard.displayName = 'GradientCard'

// ============================================
// GLASS CARD (Glassmorphism effect)
// ============================================

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode
  blur?: 'sm' | 'md' | 'lg'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, blur = 'md', padding = 'md', className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-2xl',
          'bg-surface/60',
          blurClasses[blur],
          'border border-white/10',
          paddingClasses[padding],
          className
        )}
        whileHover={{ y: -2 }}
        transition={SPRING.gentle}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

// ============================================
// FEATURE CARD (For showcasing features/modes)
// ============================================

export interface FeatureCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode
  icon?: React.ReactNode
  iconBg?: 'indigo' | 'fuchsia' | 'gradient'
  badge?: React.ReactNode
  hoverable?: boolean
  className?: string
}

const iconBgClasses = {
  indigo: 'bg-electric-indigo/20',
  fuchsia: 'bg-vibrant-fuchsia/20',
  gradient: 'bg-gradient-to-br from-electric-indigo/20 to-vibrant-fuchsia/20',
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ children, icon, iconBg = 'gradient', badge, hoverable = true, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-2xl p-6',
          'gradient-border-glow',
          hoverable && 'cursor-pointer',
          className
        )}
        whileHover={hoverable ? { y: -6, scale: 1.02 } : undefined}
        whileTap={hoverable ? { scale: 0.98 } : undefined}
        transition={SPRING.bouncy}
        {...props}
      >
        {/* Badge (e.g., "10 Credits") */}
        {badge && (
          <div className="absolute top-4 left-4">
            {badge}
          </div>
        )}

        {/* Icon container */}
        {icon && (
          <motion.div
            className={cn(
              'w-16 h-16 rounded-xl flex items-center justify-center mb-4',
              iconBgClasses[iconBg]
            )}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        )}

        {children}
      </motion.div>
    )
  }
)

FeatureCard.displayName = 'FeatureCard'

// ============================================
// STAT CARD (For displaying statistics)
// ============================================

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-xl p-5 bg-surface border border-border-default',
        className
      )}
      whileHover={{ y: -2 }}
      transition={SPRING.gentle}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-sm mt-1',
                trend.isPositive ? 'text-status-success' : 'text-status-error'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-electric-indigo/10 flex items-center justify-center text-electric-indigo">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}
