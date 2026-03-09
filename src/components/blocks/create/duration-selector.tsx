'use client';

import { motion } from 'framer-motion';
import { Clock, Zap, TrendingUp, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UGC_DURATION_CONFIG, type UGCDuration } from '@/types/credits';

// ============================================
// DURATION SELECTOR COMPONENT
// ============================================

interface DurationSelectorProps {
  selected: UGCDuration;
  onSelect: (duration: UGCDuration) => void;
  className?: string;
}

const DURATION_ICONS: Record<UGCDuration, typeof Clock> = {
  '8s': Zap,
  '15s': Clock,
  '22s': TrendingUp,
  '30s': Film,
};

export function DurationSelector({ selected, onSelect, className }: DurationSelectorProps) {
  const durations = Object.entries(UGC_DURATION_CONFIG) as [UGCDuration, typeof UGC_DURATION_CONFIG['8s']][];

  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-border-default p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-surface-raised">
          <Clock className="w-5 h-5 text-coral" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Video Duration</p>
          <p className="text-xs text-text-muted">Choose based on your platform</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {durations.map(([duration, config]) => {
          const Icon = DURATION_ICONS[duration];
          const isSelected = selected === duration;

          return (
            <motion.button
              key={duration}
              onClick={() => onSelect(duration)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative flex flex-col items-start p-3 rounded-lg border transition-all text-left',
                isSelected
                  ? 'border-coral bg-coral/10'
                  : 'border-border-default bg-surface-raised hover:border-border-hover'
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="duration-indicator"
                  className="absolute inset-0 rounded-lg border-2 border-coral"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={cn(
                    'w-4 h-4',
                    isSelected ? 'text-coral' : 'text-text-muted'
                  )} />
                  <span className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-text-primary' : 'text-text-secondary'
                  )}>
                    {config.label}
                  </span>
                </div>
                <span className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded',
                  isSelected
                    ? 'bg-coral/20 text-coral'
                    : 'bg-surface text-text-muted'
                )}>
                  {config.seconds}s
                </span>
              </div>

              <p className="text-xs text-text-muted mb-2 line-clamp-1">
                {config.description}
              </p>

              <div className="flex items-center justify-between w-full">
                <span className={cn(
                  'text-xs font-medium',
                  isSelected ? 'text-coral' : 'text-text-muted'
                )}>
                  {config.credits} credits
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Platform recommendations */}
      <div className="mt-3 pt-3 border-t border-border-default">
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-secondary">Best for: </span>
          {UGC_DURATION_CONFIG[selected].bestFor.join(', ')}
        </p>
      </div>
    </div>
  );
}

// ============================================
// COMPACT SELECTOR FOR INLINE USE
// ============================================

interface DurationSelectorCompactProps {
  selected: UGCDuration;
  onSelect: (duration: UGCDuration) => void;
  className?: string;
}

export function DurationSelectorCompact({
  selected,
  onSelect,
  className,
}: DurationSelectorCompactProps) {
  const durations = Object.keys(UGC_DURATION_CONFIG) as UGCDuration[];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Clock className="w-4 h-4 text-text-muted" />
      <span className="text-sm text-text-primary mr-1">Duration:</span>
      <div className="flex gap-1">
        {durations.map((duration) => {
          const config = UGC_DURATION_CONFIG[duration];
          const isSelected = selected === duration;

          return (
            <button
              key={duration}
              onClick={() => onSelect(duration)}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                isSelected
                  ? 'bg-coral text-white font-medium'
                  : 'bg-surface-raised text-text-muted hover:text-text-primary'
              )}
            >
              {config.seconds}s
            </button>
          );
        })}
      </div>
      <span className="text-xs text-coral font-medium ml-1">
        {UGC_DURATION_CONFIG[selected].credits} credits
      </span>
    </div>
  );
}
