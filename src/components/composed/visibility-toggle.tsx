'use client';

import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faGlobe, faLink } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { VideoVisibility } from '@/types/generation';

export interface VisibilityToggleProps {
  visibility: VideoVisibility;
  onChange: (visibility: VideoVisibility) => void;
  disabled?: boolean;
  className?: string;
  showUnlisted?: boolean; // Whether to show unlisted option
}

const visibilityOptions: Array<{
  value: VideoVisibility;
  label: string;
  icon: typeof faLock;
  description: string;
}> = [
  {
    value: 'private',
    label: 'Private',
    icon: faLock,
    description: 'Only you can see',
  },
  {
    value: 'public',
    label: 'Public',
    icon: faGlobe,
    description: 'Visible in Explore',
  },
  {
    value: 'unlisted',
    label: 'Unlisted',
    icon: faLink,
    description: 'Share via link',
  },
];

export function VisibilityToggle({
  visibility,
  onChange,
  disabled = false,
  className,
  showUnlisted = false,
}: VisibilityToggleProps) {
  const options = showUnlisted
    ? visibilityOptions
    : visibilityOptions.filter((o) => o.value !== 'unlisted');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1 p-1 bg-surface rounded-lg">
        {options.map((option) => {
          const isActive = visibility === option.value;

          return (
            <button
              key={option.value}
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1',
                isActive
                  ? 'text-text-primary'
                  : 'text-text-muted hover:text-text-primary',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="visibility-indicator"
                  className="absolute inset-0 bg-elevated rounded-md"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <FontAwesomeIcon icon={option.icon} className="w-4 h-4" />
                <span>{option.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Description text */}
      <p className="text-sm text-text-muted">
        {options.find((o) => o.value === visibility)?.description}
      </p>
    </div>
  );
}

// Enhanced visibility badge with clear Icon + Text label
interface VisibilityBadgeProps {
  visibility: VideoVisibility;
  onClick?: () => void;
  className?: string;
}

const badgeConfigs = {
  private: {
    icon: faLock,
    label: 'Private Video',
    bgColor: 'bg-slate-800/80',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-600/50',
    iconColor: 'text-slate-400',
  },
  public: {
    icon: faGlobe,
    label: 'Public',
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  unlisted: {
    icon: faLink,
    label: 'Unlisted',
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
};

export function VisibilityBadge({ visibility, onClick, className }: VisibilityBadgeProps) {
  const config = badgeConfigs[visibility];
  if (!config) return null;

  return (
    <motion.button
      onClick={onClick}
      disabled={!onClick}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'border backdrop-blur-sm',
        'text-sm font-medium',
        'transition-all duration-200',
        config.bgColor,
        config.textColor,
        config.borderColor,
        onClick && 'cursor-pointer hover:brightness-110',
        !onClick && 'cursor-default',
        className
      )}
    >
      <FontAwesomeIcon
        icon={config.icon}
        className={cn('w-3.5 h-3.5', config.iconColor)}
      />
      <span>{config.label}</span>
    </motion.button>
  );
}
