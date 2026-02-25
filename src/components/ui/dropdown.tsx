'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { DURATIONS, EASINGS } from './motion'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
}

// Animation variants
const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.easeOut,
      staggerChildren: 0.03,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.easeIn,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  label,
  error,
  disabled,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={cn('w-full', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <motion.button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          whileTap={!disabled ? { scale: 0.99 } : undefined}
          className={cn(
            'w-full bg-cream border rounded-lg px-4 py-2.5',
            'flex items-center justify-between',
            'text-left transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-mint/50',
            error
              ? 'border-status-error'
              : 'border-border-default focus:border-mint',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={selectedOption ? 'text-text-primary' : 'text-text-muted'}>
            {selectedOption?.label || placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: DURATIONS.fast, ease: EASINGS.easeOut }}
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className="w-4 h-4 text-text-muted"
            />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute z-50 w-full mt-1 bg-surface border border-border-default rounded-lg shadow-xl py-1 max-h-60 overflow-auto"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {options.map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  variants={itemVariants}
                  whileHover={!option.disabled ? { backgroundColor: 'rgba(16, 185, 129, 0.1)' } : undefined}
                  transition={{ duration: DURATIONS.fast }}
                  className={cn(
                    'w-full px-4 py-2.5 text-left flex items-center gap-2',
                    option.value === value
                      ? 'bg-mint/15 text-text-primary'
                      : 'text-text-primary',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {option.icon && <span className="text-text-muted">{option.icon}</span>}
                  {option.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="mt-1.5 text-sm text-status-error">{error}</p>}
    </div>
  )
}
