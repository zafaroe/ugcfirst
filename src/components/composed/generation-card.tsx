'use client';

import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faTrash,
  faDownload,
  faCheck,
  faSpinner,
  faXmark,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { VisibilityBadge } from './visibility-toggle';
import { SPRING } from '@/components/ui/motion';
import type { Generation, GenerationStatus, GenerationVideoWithUrls } from '@/types/generation';

// Map generation status to display config
type DisplayStatus = 'ready' | 'processing' | 'failed' | 'queued';

const statusMapping: Record<GenerationStatus, DisplayStatus> = {
  completed: 'ready',
  failed: 'failed',
  queued: 'queued',
  analyzing: 'processing',
  scripting: 'processing',
  framing: 'processing',
  generating: 'processing',
  trimming: 'processing',
  captioning: 'processing', // DB value is 'captioning' for subtitle burning step
  uploading: 'processing',
};

const statusConfig: Record<DisplayStatus, { icon: IconDefinition; label: string; classes: string }> = {
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
    classes: 'bg-mint/20 text-mint',
  },
};

export interface GenerationCardProps {
  generation: Generation & { videos?: GenerationVideoWithUrls[] | null };
  onView?: (generation: Generation) => void;
  onDownload?: (generation: Generation) => void;
  onDelete?: (generation: Generation) => void;
  onVisibilityChange?: (generation: Generation) => void;
  className?: string;
}

export function GenerationCard({
  generation,
  onView,
  onDownload,
  onDelete,
  onVisibilityChange,
  className,
}: GenerationCardProps) {
  const displayStatus = statusMapping[generation.status];
  const config = statusConfig[displayStatus];

  // Get thumbnail from first video frame
  const thumbnail = generation.videos?.[0]?.frameUrl || null;
  const duration = generation.videos?.[0]?.duration || 0;

  return (
    <Card
      padding="none"
      hoverable
      className={cn('overflow-hidden group', className)}
      onClick={() => onView?.(generation)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-cream overflow-hidden">
        {thumbnail ? (
          <motion.img
            src={thumbnail}
            alt={generation.product_name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              <FontAwesomeIcon icon={faPlay} className="w-5 h-5 text-text-muted" />
            </div>
          </div>
        )}

        {/* Play overlay on hover */}
        {displayStatus === 'ready' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full bg-gradient-to-r from-mint to-mint-dark flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING.bouncy}
            >
              <FontAwesomeIcon icon={faPlay} className="w-6 h-6 text-white ml-1" />
            </motion.div>
          </motion.div>
        )}

        {/* Status badge with pulse animation for processing */}
        <motion.div
          className="absolute top-3 right-3"
          animate={
            displayStatus === 'processing'
              ? {
                  scale: [1, 1.05, 1],
                }
              : {}
          }
          transition={
            displayStatus === 'processing'
              ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
        >
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              config.classes
            )}
          >
            <FontAwesomeIcon
              icon={config.icon}
              className={cn('w-3 h-3', displayStatus === 'processing' && 'animate-spin')}
            />
            {config.label}
          </span>
        </motion.div>

        {/* Visibility badge */}
        {generation.visibility && displayStatus === 'ready' && (
          <div
            className="absolute top-3 left-3"
            onClick={(e) => {
              if (onVisibilityChange) {
                e.stopPropagation();
                onVisibilityChange(generation);
              }
            }}
          >
            <VisibilityBadge
              visibility={generation.visibility}
              onClick={onVisibilityChange ? () => {} : undefined}
            />
          </div>
        )}

        {/* Quick actions on hover */}
        <motion.div
          className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {onDownload && displayStatus === 'ready' && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(generation);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-lg bg-surface/90 backdrop-blur flex items-center justify-center hover:bg-surface transition-colors"
              title="Download"
            >
              <FontAwesomeIcon icon={faDownload} className="w-4 h-4 text-text-primary" />
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(generation);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-lg bg-surface/90 backdrop-blur flex items-center justify-center hover:bg-status-error/20 transition-colors"
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-status-error" />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-text-primary truncate">{generation.product_name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-text-muted" suppressHydrationWarning>
            {formatRelativeTime(generation.created_at)}
          </span>
          {duration > 0 && <span className="text-sm text-text-muted">{Math.round(duration)}s</span>}
        </div>
        {/* Mode indicator */}
        <div className="mt-2">
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              generation.mode === 'concierge'
                ? 'bg-coral/20 text-coral'
                : 'bg-mint/20 text-mint'
            )}
          >
            {generation.mode === 'concierge' ? 'Drop & Go' : 'Studio'}
          </span>
        </div>
      </div>
    </Card>
  );
}

// Skeleton for loading state with shimmer animation
export function GenerationCardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      {/* Use CSS skeleton class which handles dark mode properly */}
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-1/2" />
      </div>
    </Card>
  );
}
