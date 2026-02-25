'use client'

import { forwardRef, useState, useRef } from 'react'
import { motion, type HTMLMotionProps, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DURATIONS, EASINGS, SPRING } from './motion'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  hoverable?: boolean
  selected?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'glow' | 'featured'
  tilt?: boolean
  children?: React.ReactNode
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const variantClasses = {
  default: 'bg-surface border border-border-default',
  glow: 'bg-surface border border-mint/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
  featured: 'bg-surface',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    hoverable = false,
    selected = false,
    padding = 'md',
    variant = 'default',
    tilt = false,
    children,
    ...props
  }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    // Tilt effect motion values
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseXSpring = useSpring(x, SPRING.gentle)
    const mouseYSpring = useSpring(y, SPRING.gentle)

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg'])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg'])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tilt || !cardRef.current) return

      const rect = cardRef.current.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const xPct = mouseX / width - 0.5
      const yPct = mouseY / height - 0.5

      x.set(xPct)
      y.set(yPct)
    }

    const handleMouseLeave = () => {
      setIsHovered(false)
      x.set(0)
      y.set(0)
    }

    const isFeatured = variant === 'featured'

    return (
      <motion.div
        ref={(node) => {
          // Handle both refs
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
          ;(cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        initial={hoverable ? { y: 0, boxShadow: '0 0 0 rgba(16, 185, 129, 0)' } : undefined}
        whileHover={hoverable && !tilt ? {
          y: -4,
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.15)',
        } : undefined}
        animate={hoverable ? { y: 0, boxShadow: '0 0 0 rgba(16, 185, 129, 0)' } : undefined}
        transition={{
          duration: DURATIONS.fast,
          ease: EASINGS.easeOut,
        }}
        style={tilt ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'rounded-xl relative',
          paddingClasses[padding],
          variantClasses[variant],
          hoverable && 'cursor-pointer',
          hoverable && variant === 'default' && 'hover:border-mint/50 hover:shadow-[0_4px_20px_rgba(16,185,129,0.1)]',
          hoverable && variant === 'glow' && 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:border-mint/50',
          selected && 'ring-2 ring-mint shadow-glow',
          tilt && 'transform-gpu perspective-1000',
          className
        )}
        {...props}
      >
        {/* Featured gradient border */}
        {isFeatured && (
          <>
            <div
              className={cn(
                'absolute inset-0 rounded-xl bg-gradient-to-br from-mint via-mint-dark to-mint p-[2px] -z-10',
                isHovered && 'opacity-100',
                !isHovered && 'opacity-70'
              )}
              style={{ transition: 'opacity 0.3s ease' }}
            >
              <div className="absolute inset-[2px] rounded-[10px] bg-surface" />
            </div>
            {/* Glow behind */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-mint to-mint-dark blur-xl -z-20"
              animate={{ opacity: isHovered ? 0.2 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </>
        )}

        {/* Spotlight effect on hover for tilt cards */}
        {tilt && isHovered && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${(x.get() + 0.5) * 100}% ${(y.get() + 0.5) * 100}%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}

        {/* Content */}
        <div className="relative z-10" style={tilt ? { transform: 'translateZ(20px)' } : undefined}>
          {children}
        </div>
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
