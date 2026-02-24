import { cn } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'purple'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

const variantClasses = {
  default: 'bg-surface text-text-muted',
  success: 'bg-status-success/20 text-status-success',
  warning: 'bg-status-warning/20 text-status-warning',
  error: 'bg-status-error/20 text-status-error',
  purple: 'bg-electric-indigo/20 text-electric-indigo',
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

export function Badge({ variant = 'default', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  )
}
