'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlatformRecommendation } from '@/types/generation';
import { StrategyEmptyState } from './strategy-empty-state';

// ============================================
// PLATFORM ICONS
// ============================================

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const platformIcons: Record<string, React.FC<{ className?: string }>> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
};

const platformColors: Record<string, string> = {
  tiktok: 'from-[#00f2ea] to-[#ff0050]',
  instagram: 'from-[#f09433] via-[#e6683c] to-[#bc1888]',
  youtube: 'from-[#ff0000] to-[#cc0000]',
};

// ============================================
// PLATFORM CARD COMPONENT
// ============================================

interface PlatformCardProps {
  platform: PlatformRecommendation;
  priority: 'primary' | 'secondary' | 'alsoTest';
  className?: string;
}

const priorityLabels = {
  primary: 'Primary Platform',
  secondary: 'Secondary Platform',
  alsoTest: 'Also Test',
};

const priorityBadgeVariants: Record<string, 'purple' | 'default' | 'success'> = {
  primary: 'purple',
  secondary: 'default',
  alsoTest: 'success',
};

export function PlatformCard({ platform, priority, className }: PlatformCardProps) {
  const Icon = platformIcons[platform.name] || TikTokIcon;
  const gradientColor = platformColors[platform.name] || platformColors.tiktok;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('p-5 h-full', className)}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'p-3 rounded-xl bg-gradient-to-br',
              gradientColor
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <Badge variant={priorityBadgeVariants[priority]} size="sm">
            {priorityLabels[priority]}
          </Badge>
        </div>

        {/* Platform Name */}
        <h3 className="text-lg font-semibold text-text-primary capitalize mb-2">
          {platform.name}
        </h3>

        {/* Reason */}
        <p className="text-sm text-text-muted mb-4">{platform.reason}</p>

        {/* Details */}
        <div className="space-y-3 border-t border-border-default pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Ad Format</span>
            <span className="text-text-primary font-medium">
              {platform.adFormat}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Starting Budget</span>
            <span className="text-status-success font-medium">
              {platform.startingBudget}
            </span>
          </div>
        </div>

        {/* Tips */}
        {platform.tips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-default">
            <p className="text-xs font-medium text-text-primary mb-2">
              Platform Tips
            </p>
            <ul className="space-y-1.5">
              {platform.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-text-muted"
                >
                  <span className="text-mint mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ============================================
// PLATFORMS GRID
// ============================================

interface PlatformsGridProps {
  platforms: {
    primary: PlatformRecommendation;
    secondary: PlatformRecommendation;
    alsoTest: PlatformRecommendation;
  };
  className?: string;
}

export function PlatformsGrid({ platforms, className }: PlatformsGridProps) {
  // Show empty state if no platforms
  if (!platforms || !platforms.primary || !platforms.secondary || !platforms.alsoTest) {
    return <StrategyEmptyState variant="platforms" className={className} />;
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      <PlatformCard platform={platforms.primary} priority="primary" />
      <PlatformCard platform={platforms.secondary} priority="secondary" />
      <PlatformCard platform={platforms.alsoTest} priority="alsoTest" />
    </div>
  );
}
