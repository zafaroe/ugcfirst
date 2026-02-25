'use client';

import { motion } from 'framer-motion';
import { Type, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// CAPTION TOGGLE COMPONENT
// ============================================

interface CaptionToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function CaptionToggle({ enabled, onToggle, className }: CaptionToggleProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-border-default p-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-raised">
            <Type className="w-5 h-5 text-mint" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Auto Subtitles</p>
            <p className="text-xs text-text-muted">TikTok-style word highlighting</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-xs font-medium transition-colors',
              enabled ? 'text-mint' : 'text-text-muted'
            )}
          >
            {enabled ? '+1 credit' : 'Off'}
          </span>

          <button
            onClick={() => onToggle(!enabled)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors',
              enabled
                ? 'bg-gradient-to-r from-mint to-mint-dark'
                : 'bg-surface-raised'
            )}
          >
            <motion.div
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              animate={{ left: enabled ? 28 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Caption Preview */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-border-default"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-text-primary">
              Hormozi-Style Subtitles
            </span>
          </div>
          <div className="bg-surface-raised rounded-lg p-3">
            <p className="text-center text-sm">
              <span className="text-white">I was </span>
              <span className="text-amber-400 font-bold">SO</span>
              <span className="text-white"> tired of this...</span>
            </p>
          </div>
          <p className="text-xs text-text-muted mt-2 text-center">
            Word-by-word highlighting that keeps viewers engaged
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// COMPACT TOGGLE FOR INLINE USE
// ============================================

interface CaptionToggleCompactProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function CaptionToggleCompact({
  enabled,
  onToggle,
  className,
}: CaptionToggleCompactProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 cursor-pointer select-none',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={cn(
          'relative w-10 h-5 rounded-full transition-colors',
          enabled
            ? 'bg-gradient-to-r from-mint to-mint-dark'
            : 'bg-surface-raised'
        )}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
          animate={{ left: enabled ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-text-muted" />
        <span className="text-sm text-text-primary">Subtitles</span>
        {enabled && (
          <span className="text-xs text-mint font-medium">+1</span>
        )}
      </div>
    </label>
  );
}
