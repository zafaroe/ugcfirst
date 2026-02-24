import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faStar } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Avatar } from '@/types'

export interface AvatarCardProps {
  avatar: Avatar
  isSelected?: boolean
  onSelect?: (avatar: Avatar) => void
  className?: string
}

const styleLabels = {
  casual: 'Casual',
  professional: 'Professional',
  energetic: 'Energetic',
}

export function AvatarCard({ avatar, isSelected = false, onSelect, className }: AvatarCardProps) {
  return (
    <Card
      hoverable
      selected={isSelected}
      className={cn('text-center cursor-pointer', className)}
      onClick={() => onSelect?.(avatar)}
    >
      {/* Avatar image */}
      <div className="relative mx-auto w-20 h-20 mb-4">
        <div
          className={cn(
            'w-full h-full rounded-full overflow-hidden',
            isSelected && 'ring-2 ring-electric-indigo ring-offset-2 ring-offset-surface'
          )}
        >
          <img
            src={avatar.image}
            alt={avatar.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Premium badge */}
        {avatar.isPremium && (
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-status-warning flex items-center justify-center">
            <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-electric-indigo flex items-center justify-center">
            <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="font-medium text-text-primary mb-2">{avatar.name}</h3>

      {/* Style tag */}
      <Badge variant="purple" size="sm">
        {styleLabels[avatar.style]}
      </Badge>
    </Card>
  )
}
