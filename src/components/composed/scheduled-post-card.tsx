'use client';

import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faXmark,
  faRotateRight,
  faCheck,
  faSpinner,
  faExclamationTriangle,
  faBan,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  FaTiktok,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaLinkedin,
  FaFacebook,
  FaPinterest,
  FaReddit,
  FaTelegram,
  FaSnapchatGhost,
  FaGoogle,
} from 'react-icons/fa';
import { SiBluesky, SiThreads } from 'react-icons/si';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SPRING } from '@/components/ui/motion';
import type { ScheduledPost, ScheduleStatus } from '@/types/schedule';
import type { LatePlatform } from '@/lib/social/late';

// ============================================
// TYPES
// ============================================

export interface ScheduledPostCardProps {
  post: ScheduledPost;
  onCancel?: (post: ScheduledPost) => void;
  onRetry?: (post: ScheduledPost) => void;
  onClick?: (post: ScheduledPost) => void;
  className?: string;
}

export interface ScheduledPostCardCompactProps {
  post: ScheduledPost;
  onClick?: (post: ScheduledPost) => void;
  className?: string;
}

// ============================================
// PLATFORM ICONS
// ============================================

const platformIcons: Record<LatePlatform, React.ComponentType<{ className?: string }>> = {
  tiktok: FaTiktok,
  instagram: FaInstagram,
  youtube: FaYoutube,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
  facebook: FaFacebook,
  threads: SiThreads,
  pinterest: FaPinterest,
  reddit: FaReddit,
  bluesky: SiBluesky,
  telegram: FaTelegram,
  snapchat: FaSnapchatGhost,
  google_business: FaGoogle,
};

const platformColors: Record<LatePlatform, string> = {
  tiktok: 'text-white bg-black',
  instagram: 'text-white bg-gradient-to-br from-purple-500 to-pink-500',
  youtube: 'text-white bg-red-600',
  twitter: 'text-white bg-sky-500',
  linkedin: 'text-white bg-blue-700',
  facebook: 'text-white bg-blue-600',
  threads: 'text-white bg-black',
  pinterest: 'text-white bg-red-500',
  reddit: 'text-white bg-orange-500',
  bluesky: 'text-white bg-blue-500',
  telegram: 'text-white bg-sky-500',
  snapchat: 'text-black bg-yellow-400',
  google_business: 'text-white bg-blue-500',
};

// ============================================
// STATUS CONFIG
// ============================================

type StatusConfig = {
  icon: IconDefinition;
  label: string;
  dotColor: string;
  badgeClasses: string;
};

const statusConfig: Record<ScheduleStatus, StatusConfig> = {
  pending: {
    icon: faClock,
    label: 'Pending',
    dotColor: 'bg-mint',
    badgeClasses: 'bg-mint/20 text-mint',
  },
  scheduled: {
    icon: faCalendarAlt,
    label: 'Scheduled',
    dotColor: 'bg-blue-500',
    badgeClasses: 'bg-blue-500/20 text-blue-500',
  },
  processing: {
    icon: faSpinner,
    label: 'Publishing',
    dotColor: 'bg-amber-500',
    badgeClasses: 'bg-amber-500/20 text-amber-500',
  },
  published: {
    icon: faCheck,
    label: 'Published',
    dotColor: 'bg-status-success',
    badgeClasses: 'bg-status-success/20 text-status-success',
  },
  failed: {
    icon: faExclamationTriangle,
    label: 'Failed',
    dotColor: 'bg-status-error',
    badgeClasses: 'bg-status-error/20 text-status-error',
  },
  cancelled: {
    icon: faBan,
    label: 'Cancelled',
    dotColor: 'bg-gray-500',
    badgeClasses: 'bg-gray-500/20 text-gray-500',
  },
};

// ============================================
// SCHEDULED POST CARD COMPONENT
// ============================================

export function ScheduledPostCard({
  post,
  onCancel,
  onRetry,
  onClick,
  className,
}: ScheduledPostCardProps) {
  const config = statusConfig[post.status];
  const canCancel = ['pending', 'scheduled'].includes(post.status);
  const canRetry = post.status === 'failed';

  const formatScheduledTime = (isoString?: string) => {
    if (!isoString) return 'Immediate';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={SPRING.gentle}
      className={className}
    >
      <Card
        padding="none"
        hoverable
        className="overflow-hidden cursor-pointer"
        onClick={() => onClick?.(post)}
      >
        <div className="p-4 flex gap-4">
          {/* Thumbnail or Calendar Icon */}
          <div className="flex-shrink-0">
            {post.generationId ? (
              <div className="w-20 h-20 rounded-lg bg-cream overflow-hidden flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-surface to-surface-raised flex items-center justify-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-6 h-6 text-text-muted" />
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-mint/20 to-coral/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="w-8 h-8 text-mint" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Caption preview */}
            <p className="text-sm text-text-primary font-medium line-clamp-2 mb-2">
              {post.caption || 'No caption'}
            </p>

            {/* Platform icons */}
            <div className="flex items-center gap-1.5 mb-2">
              {post.platforms.map((platform) => {
                const Icon = platformIcons[platform];
                return (
                  <div
                    key={platform}
                    className={cn(
                      'w-6 h-6 rounded flex items-center justify-center',
                      platformColors[platform]
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                );
              })}
            </div>

            {/* Schedule time */}
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
              <span>{formatScheduledTime(post.scheduledFor)}</span>
            </div>
          </div>

          {/* Right side - Status & Actions */}
          <div className="flex flex-col items-end justify-between">
            {/* Status badge */}
            <motion.div
              animate={
                post.status === 'processing'
                  ? { scale: [1, 1.05, 1] }
                  : {}
              }
              transition={
                post.status === 'processing'
                  ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  : {}
              }
            >
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  config.badgeClasses
                )}
              >
                <FontAwesomeIcon
                  icon={config.icon}
                  className={cn('w-3 h-3', post.status === 'processing' && 'animate-spin')}
                />
                {config.label}
              </span>
            </motion.div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              {canRetry && onRetry && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry(post);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg bg-mint/10 hover:bg-mint/20 flex items-center justify-center transition-colors"
                  title="Retry"
                >
                  <FontAwesomeIcon icon={faRotateRight} className="w-4 h-4 text-mint" />
                </motion.button>
              )}
              {canCancel && onCancel && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(post);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg bg-status-error/10 hover:bg-status-error/20 flex items-center justify-center transition-colors"
                  title="Cancel"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4 text-status-error" />
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Error message if failed */}
        {post.status === 'failed' && post.errorMessage && (
          <div className="px-4 pb-4 pt-0">
            <div className="p-2 rounded bg-status-error/10 border border-status-error/20">
              <p className="text-xs text-status-error">{post.errorMessage}</p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ============================================
// COMPACT CARD FOR DASHBOARD WIDGET
// ============================================

export function ScheduledPostCardCompact({
  post,
  onClick,
  className,
}: ScheduledPostCardCompactProps) {
  const config = statusConfig[post.status];

  const formatScheduledTime = (isoString?: string) => {
    if (!isoString) return 'Immediate';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === date.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      transition={SPRING.gentle}
      onClick={() => onClick?.(post)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface-raised cursor-pointer transition-colors border border-border-default',
        className
      )}
    >
      {/* Status dot */}
      <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', config.dotColor)} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary font-medium truncate">
          {post.caption?.slice(0, 50) || 'No caption'}
          {(post.caption?.length || 0) > 50 && '...'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-muted">
            {formatScheduledTime(post.scheduledFor)}
          </span>
          <span className="text-xs text-text-muted">•</span>
          <div className="flex items-center gap-1">
            {post.platforms.slice(0, 3).map((platform) => {
              const Icon = platformIcons[platform];
              return (
                <Icon key={platform} className="w-3 h-3 text-text-muted" />
              );
            })}
            {post.platforms.length > 3 && (
              <span className="text-xs text-text-muted">+{post.platforms.length - 3}</span>
            )}
          </div>
        </div>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          config.badgeClasses
        )}
      >
        {config.label}
      </span>
    </motion.div>
  );
}

// ============================================
// SKELETON FOR LOADING STATE
// ============================================

export function ScheduledPostCardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 flex gap-4">
        <div className="w-20 h-20 skeleton rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton rounded w-3/4" />
          <div className="h-4 skeleton rounded w-1/2" />
          <div className="flex gap-1.5">
            <div className="w-6 h-6 skeleton rounded" />
            <div className="w-6 h-6 skeleton rounded" />
          </div>
        </div>
        <div className="w-20 h-6 skeleton rounded-full" />
      </div>
    </Card>
  );
}
