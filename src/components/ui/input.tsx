'use client'

import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  success?: boolean
  variant?: 'default' | 'floating'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    success = false,
    variant = 'default',
    id,
    ...props
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue)

    const isFloating = variant === 'floating'
    const showFloatingLabel = isFloating && (isFocused || hasValue)

    return (
      <div className="w-full">
        {/* Standard label */}
        {label && !isFloating && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {label}
          </label>
        )}

        {/* Input container with animations */}
        <motion.div
          className="relative"
          animate={error ? { x: [0, -4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {/* Focus glow ring */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                className="absolute -inset-[3px] rounded-xl pointer-events-none"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
                  filter: 'blur(8px)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Floating label */}
          {isFloating && label && (
            <motion.label
              htmlFor={inputId}
              className={cn(
                'absolute left-4 pointer-events-none transition-colors z-10',
                showFloatingLabel
                  ? 'text-xs font-medium text-mint'
                  : 'text-base text-text-muted',
                error && 'text-status-error'
              )}
              animate={{
                top: showFloatingLabel ? 6 : '50%',
                y: showFloatingLabel ? 0 : '-50%',
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {label}
            </motion.label>
          )}

          {/* Left icon */}
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10">
              {leftIcon}
            </span>
          )}

          {/* Input element */}
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            onChange={(e) => {
              setHasValue(!!e.target.value)
              props.onChange?.(e)
            }}
            className={cn(
              'relative w-full bg-cream border rounded-lg px-4 py-2.5',
              'text-text-primary placeholder:text-text-muted',
              'transition-all duration-200',
              'focus:outline-none focus:ring-0',
              error
                ? 'border-status-error focus:border-status-error bg-status-error/5'
                : success
                  ? 'border-mint focus:border-mint bg-mint/5'
                  : 'border-border-default focus:border-mint',
              leftIcon && 'pl-10',
              (rightIcon || success) && 'pr-10',
              isFloating && 'pt-6 pb-2',
              className
            )}
            placeholder={isFloating ? '' : props.placeholder}
            {...props}
          />

          {/* Right icon or success checkmark */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
            <AnimatePresence mode="wait">
              {success && !error && (
                <motion.span
                  key="success"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="text-mint"
                >
                  <Check className="w-5 h-5" />
                </motion.span>
              )}
              {rightIcon && !success && (
                <span key="icon" className="text-text-muted">
                  {rightIcon}
                </span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Error message with animation */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 text-sm text-status-error"
            >
              {error}
            </motion.p>
          )}
          {helperText && !error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1.5 text-sm text-text-muted"
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'
