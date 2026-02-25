'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'mint' | 'gradient' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  animated?: boolean
  icon?: React.ReactNode
}

const variantClasses = {
  default: 'bg-surface-secondary text-text-muted border border-border-default',
  success: 'bg-status-success/15 text-status-success border border-status-success/20',
  warning: 'bg-status-warning/15 text-status-warning border border-status-warning/20',
  error: 'bg-status-error/15 text-status-error border border-status-error/20',
  mint: 'bg-mint/15 text-mint-dark border border-mint/20',
  gradient: 'bg-gradient-to-r from-mint/20 to-mint-dark/20 text-mint-dark border border-mint/20',
  outline: 'bg-transparent text-text-primary border border-border-default hover:border-mint/50 hover:text-mint transition-colors',
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-sm px-4 py-1.5 gap-2',
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
  animated = false,
  icon,
}: BadgeProps) {
  const Component = animated ? motion.span : 'span'
  const animationProps = animated ? {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    whileHover: { scale: 1.05 },
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  } : {}

  return (
    <Component
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        animated && 'cursor-default',
        className
      )}
      {...animationProps}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </Component>
  )
}
