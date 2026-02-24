import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faSpinner, faXmark, faClock } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

export interface StatusBadgeProps {
  status: ProjectStatus
  showRefunded?: boolean
  className?: string
}

const statusConfig: Record<ProjectStatus, { icon: IconDefinition; label: string; classes: string }> = {
  ready: {
    icon: faCheck,
    label: 'Ready',
    classes: 'bg-status-success/20 text-status-success',
  },
  processing: {
    icon: faSpinner,
    label: 'Processing',
    classes: 'bg-status-warning/20 text-status-warning',
  },
  failed: {
    icon: faXmark,
    label: 'Failed',
    classes: 'bg-status-error/20 text-status-error',
  },
  queued: {
    icon: faClock,
    label: 'Queued',
    classes: 'bg-electric-indigo/20 text-electric-indigo',
  },
}

export function StatusBadge({ status, showRefunded = true, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          config.classes
        )}
      >
        <FontAwesomeIcon
          icon={config.icon}
          className={cn('w-3 h-3', status === 'processing' && 'animate-spin')}
        />
        {config.label}
      </span>
      {status === 'failed' && showRefunded && (
        <span className="text-xs text-text-muted">Refunded</span>
      )}
    </div>
  )
}
