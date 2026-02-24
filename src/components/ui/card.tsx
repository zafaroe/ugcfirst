'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DURATIONS, EASINGS } from './motion'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  hoverable?: boolean
  selected?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children?: React.ReactNode
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, selected = false, padding = 'md', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={hoverable ? { y: 0, boxShadow: '0 0 0 rgba(99, 102, 241, 0)' } : undefined}
        whileHover={hoverable ? {
          y: -4,
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.15)',
        } : undefined}
        animate={hoverable ? { y: 0, boxShadow: '0 0 0 rgba(99, 102, 241, 0)' } : undefined}
        transition={{
          duration: DURATIONS.fast,
          ease: EASINGS.easeOut,
        }}
        className={cn(
          'bg-surface rounded-xl',
          paddingClasses[padding],
          hoverable && 'cursor-pointer hover:ring-2 hover:ring-electric-indigo/50',
          selected && 'ring-2 ring-electric-indigo shadow-glow',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

// Card subcomponents (non-animated)
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-xl font-semibold text-text-primary', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-text-muted text-sm mt-1', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-6 flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  )
}
