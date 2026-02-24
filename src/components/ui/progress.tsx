import { cn } from '@/lib/utils'

export interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function Progress({ value, max = 100, size = 'md', showLabel = false, className }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-border-default rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className="h-full bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right">
          <span className="text-xs text-text-muted">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  )
}
