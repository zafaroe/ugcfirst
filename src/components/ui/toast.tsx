'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faCheck, faTriangleExclamation, faCircleInfo, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { generateId } from '@/lib/utils'
import { DURATIONS, EASINGS, SPRING } from './motion'

// Types
export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

// Context
const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Provider
interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId('toast')
    const newToast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Animation variants
const toastVariants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.95,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.easeIn,
    },
  },
}

// Toast Container
function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast Item
const variantConfig = {
  success: {
    icon: faCheck,
    color: 'text-status-success',
    bg: 'bg-status-success/10',
  },
  error: {
    icon: faCircleExclamation,
    color: 'text-status-error',
    bg: 'bg-status-error/10',
  },
  warning: {
    icon: faTriangleExclamation,
    color: 'text-status-warning',
    bg: 'bg-status-warning/10',
  },
  info: {
    icon: faCircleInfo,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
}

interface ToastItemProps {
  toast: Toast
  onDismiss: () => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = variantConfig[toast.variant] || variantConfig.info

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={SPRING.bouncy}
      className={cn(
        'flex items-start gap-3 bg-surface border border-border-default rounded-lg p-4 shadow-xl min-w-[300px] max-w-md',
        config.bg
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...SPRING.bouncy, delay: 0.1 }}
      >
        <FontAwesomeIcon icon={config.icon} className={cn('w-5 h-5 mt-0.5 shrink-0', config.color)} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-text-muted mt-1">{toast.description}</p>
        )}
      </div>
      <motion.button
        onClick={onDismiss}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="text-text-muted hover:text-text-primary shrink-0"
      >
        <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )
}

// Convenience hook for common toast patterns
export function useToastActions() {
  const { addToast } = useToast()

  return {
    success: (title: string, description?: string) =>
      addToast({ variant: 'success', title, description }),
    error: (title: string, description?: string) =>
      addToast({ variant: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ variant: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addToast({ variant: 'info', title, description }),
  }
}
