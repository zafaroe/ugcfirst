'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Spinner } from './spinner'
import { SPRING } from './motion'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia text-white hover:opacity-90',
  secondary: 'bg-transparent border border-electric-indigo text-white hover:bg-electric-indigo/10',
  destructive: 'bg-status-error text-white hover:bg-red-600',
  ghost: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-surface',
}

const sizeClasses = {
  sm: 'text-sm px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2.5 rounded-lg',
  lg: 'text-base px-6 py-3 rounded-lg',
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
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={SPRING.bouncy}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'whitespace-nowrap flex-shrink-0',
          'focus-ring',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" className="mr-2" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
