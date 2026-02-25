'use client'

import { forwardRef, useState } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Spinner } from './spinner'
import { SPRING } from './motion'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
  shimmer?: boolean
}

const variantClasses = {
  primary: 'bg-gradient-to-br from-mint to-mint-dark text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]',
  secondary: 'bg-transparent border border-mint text-ink hover:bg-mint/10',
  accent: 'bg-gradient-to-br from-coral-light to-coral text-white shadow-[0_4px_14px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.4)]',
  destructive: 'bg-status-error text-white hover:bg-red-600',
  ghost: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-surface-raised',
}

const sizeClasses = {
  sm: 'text-sm px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2.5 rounded-lg',
  lg: 'text-base px-6 py-3 rounded-lg',
}

// Shimmer overlay component
function ShimmerOverlay({ isHovered }: { isHovered: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden rounded-[inherit]"
      initial={false}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
        }}
        animate={{
          x: isHovered ? '200%' : '-100%',
        }}
        transition={{
          duration: 0.6,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      shimmer = true,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading
    const [isHovered, setIsHovered] = useState(false)
    const showShimmer = shimmer && (variant === 'primary' || variant === 'accent')

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.96 }}
        transition={SPRING.bouncy}
        className={cn(
          'relative inline-flex items-center justify-center font-medium transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'whitespace-nowrap flex-shrink-0',
          'focus-ring overflow-hidden',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* Shimmer effect for primary/accent buttons */}
        {showShimmer && !isDisabled && <ShimmerOverlay isHovered={isHovered} />}

        {/* Content */}
        <span className="relative z-10 inline-flex items-center justify-center">
          {isLoading ? (
            <Spinner size="sm" className="mr-2" />
          ) : leftIcon ? (
            <span className="mr-2">{leftIcon}</span>
          ) : null}
          {children}
          {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
        </span>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
