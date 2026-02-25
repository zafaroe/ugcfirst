'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, showCount, maxLength, id, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = useState(0)
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      onChange?.(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            maxLength={maxLength}
            onChange={handleChange}
            className={cn(
              'w-full min-h-[120px] bg-cream border rounded-lg px-4 py-3',
              'text-text-primary placeholder:text-text-muted',
              'transition-colors duration-200 resize-y',
              'focus:outline-none focus:ring-2 focus:ring-mint/50',
              error
                ? 'border-status-error focus:border-status-error'
                : 'border-border-default focus:border-mint',
              className
            )}
            {...props}
          />
          {showCount && maxLength && (
            <span className="absolute bottom-3 right-3 text-xs text-text-muted">
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-status-error">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
