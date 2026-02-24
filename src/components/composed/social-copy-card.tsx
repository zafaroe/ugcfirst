'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Hash, MessageSquare, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SocialPostCopy, SocialPlatform } from '@/types/generation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Platform character limits
const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  tiktok: 2200,
  instagram: 2200,
  youtube: 5000,
};

// Platform icons and colors
const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string }> = {
  tiktok: { label: 'TikTok', color: 'text-pink-400' },
  instagram: { label: 'Instagram', color: 'text-purple-400' },
  youtube: { label: 'YouTube', color: 'text-red-400' },
};

export interface SocialCopyCardProps {
  socialCopy: SocialPostCopy;
  onRegenerate?: () => void;
  onPlatformChange?: (platform: SocialPlatform) => void;
  isRegenerating?: boolean;
  className?: string;
}

export function SocialCopyCard({
  socialCopy,
  onRegenerate,
  onPlatformChange,
  isRegenerating = false,
  className,
}: SocialCopyCardProps) {
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>(socialCopy.platform);

  const limit = PLATFORM_LIMITS[activePlatform];
  const fullCaption = `${socialCopy.text}\n\n${socialCopy.hashtags.map((h) => `#${h}`).join(' ')}`;
  const charCount = fullCaption.length;
  const isOverLimit = charCount > limit;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePlatformChange = (platform: SocialPlatform) => {
    setActivePlatform(platform);
    onPlatformChange?.(platform);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={className}
    >
      <Card className="bg-surface border border-border-default p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vibrant-fuchsia to-electric-indigo flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Post Copy for Your Video</h3>
              <p className="text-xs text-text-muted">Ready to copy and paste</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw
                  className={cn('w-4 h-4 mr-1', isRegenerating && 'animate-spin')}
                />
                Regenerate
              </Button>
            )}
            <Button
              variant={copied ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-2 mb-4">
          {(Object.keys(PLATFORM_CONFIG) as SocialPlatform[]).map((platform) => (
            <button
              key={platform}
              onClick={() => handlePlatformChange(platform)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                activePlatform === platform
                  ? 'bg-electric-indigo/20 text-electric-indigo border border-electric-indigo/30'
                  : 'bg-elevated text-text-muted hover:text-text-primary'
              )}
            >
              {PLATFORM_CONFIG[platform].label}
            </button>
          ))}
        </div>

        {/* Caption Content */}
        <div className="relative">
          {isRegenerating && (
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
              <div className="flex items-center gap-2 text-vibrant-fuchsia">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="font-medium">Regenerating post copy...</span>
              </div>
            </div>
          )}
          <div className="p-4 rounded-lg bg-deep-space border border-border-default">
            <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed mb-4">
              {socialCopy.text}
            </p>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border-default">
              {socialCopy.hashtags.map((hashtag, idx) => (
                <span
                  key={idx}
                  className="text-electric-indigo text-sm hover:text-vibrant-fuchsia cursor-pointer transition-colors"
                >
                  #{hashtag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Character Count */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-default">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-text-muted text-sm">
              <Hash className="w-4 h-4" />
              <span>{socialCopy.hashtags.length} hashtags</span>
            </div>
          </div>
          <div
            className={cn(
              'text-sm font-medium',
              isOverLimit ? 'text-status-error' : 'text-text-muted'
            )}
          >
            {charCount.toLocaleString()}/{limit.toLocaleString()} characters
            {isOverLimit && (
              <span className="ml-2 text-status-error">
                ({(charCount - limit).toLocaleString()} over)
              </span>
            )}
          </div>
        </div>

        {/* AI Badge */}
        <div className="mt-4">
          <Badge variant="purple" size="sm">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Generated for {PLATFORM_CONFIG[activePlatform].label}
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
}

// Skeleton loader
export function SocialCopyCardSkeleton() {
  return (
    <Card className="bg-surface border border-border-default p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-elevated animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-40 bg-elevated rounded animate-pulse" />
            <div className="h-3 w-28 bg-elevated rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-8 w-20 bg-elevated rounded-lg animate-pulse" />
        <div className="h-8 w-24 bg-elevated rounded-lg animate-pulse" />
        <div className="h-8 w-20 bg-elevated rounded-lg animate-pulse" />
      </div>
      <div className="p-4 rounded-lg bg-deep-space space-y-2">
        <div className="h-4 w-full bg-elevated rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-elevated rounded animate-pulse" />
        <div className="h-4 w-4/5 bg-elevated rounded animate-pulse" />
        <div className="flex gap-2 pt-3 mt-3 border-t border-border-default">
          <div className="h-5 w-16 bg-elevated rounded animate-pulse" />
          <div className="h-5 w-20 bg-elevated rounded animate-pulse" />
          <div className="h-5 w-14 bg-elevated rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
}

// Backward compatibility aliases
export { SocialCopyCard as VideoCaptionComponent };
export { SocialCopyCardSkeleton as VideoCaptionSkeleton };
export type { SocialCopyCardProps as VideoCaptionProps };
