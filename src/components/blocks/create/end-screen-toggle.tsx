'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clapperboard, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// END SCREEN DATA INTERFACE
// ============================================

export interface EndScreenData {
  ctaText: string;
  brandText?: string;
}

// ============================================
// END SCREEN TOGGLE COMPONENT
// ============================================

interface EndScreenToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  data: EndScreenData;
  onDataChange: (data: EndScreenData) => void;
  className?: string;
}

// Quick CTA suggestions
const CTA_SUGGESTIONS = [
  'Shop Now',
  'Link in Bio',
  'Get Yours Today',
  'Limited Time Offer',
  'Comment LINK',
];

export function EndScreenToggle({
  enabled,
  onToggle,
  data,
  onDataChange,
  className,
}: EndScreenToggleProps) {
  const handleCtaChange = (value: string) => {
    if (value.length <= 30) {
      onDataChange({ ...data, ctaText: value });
    }
  };

  const handleBrandChange = (value: string) => {
    if (value.length <= 40) {
      onDataChange({ ...data, brandText: value });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onDataChange({ ...data, ctaText: suggestion });
  };

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
            <Clapperboard className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">End Screen</p>
            <p className="text-xs text-text-muted">Branded outro with CTA</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-xs font-medium transition-colors',
              enabled ? 'text-purple-400' : 'text-text-muted'
            )}
          >
            {enabled ? '+2 credits' : 'Off'}
          </span>

          <button
            onClick={() => onToggle(!enabled)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors',
              enabled
                ? 'bg-gradient-to-r from-purple-500 to-purple-600'
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

      {/* End Screen Configuration */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-border-default space-y-4"
        >
          {/* CTA Text Input */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Call to Action <span className="text-coral">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.ctaText}
                onChange={(e) => handleCtaChange(e.target.value)}
                placeholder="Shop Now"
                maxLength={30}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-border-default text-text-primary placeholder:text-text-muted transition-colors focus:border-coral/50 focus:ring-1 focus:ring-coral/20 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                {data.ctaText.length}/30
              </span>
            </div>
          </div>

          {/* Quick CTA Suggestions */}
          <div className="flex flex-wrap gap-2">
            {CTA_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full border transition-colors',
                  data.ctaText === suggestion
                    ? 'bg-coral/10 border-coral/50 text-coral'
                    : 'bg-surface border-border-default text-text-muted hover:text-text-primary hover:border-coral/30'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Brand/URL Input */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Brand or URL (optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.brandText || ''}
                onChange={(e) => handleBrandChange(e.target.value)}
                placeholder="yourstore.com"
                maxLength={40}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-border-default text-text-primary placeholder:text-text-muted transition-colors focus:border-coral/50 focus:ring-1 focus:ring-coral/20 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                {(data.brandText || '').length}/40
              </span>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-medium text-text-primary">
                Preview
              </span>
            </div>
            <div className="bg-surface-raised rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-white">
                  {data.ctaText || 'Your CTA Here'}
                </p>
                {data.brandText && (
                  <p className="text-xs text-text-muted mt-1">{data.brandText}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              Adds 5-second branded end card with call-to-action
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// COMPACT TOGGLE FOR INLINE USE
// ============================================

interface EndScreenToggleCompactProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  ctaText?: string;
  className?: string;
}

export function EndScreenToggleCompact({
  enabled,
  onToggle,
  ctaText,
  className,
}: EndScreenToggleCompactProps) {
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
            ? 'bg-gradient-to-r from-purple-500 to-purple-600'
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
        <Clapperboard className="w-4 h-4 text-text-muted" />
        <span className="text-sm text-text-primary">End Screen</span>
        {enabled && (
          <>
            <span className="text-xs text-purple-400 font-medium">+2</span>
            {ctaText && (
              <span className="text-xs text-text-muted truncate max-w-[100px]">
                "{ctaText}"
              </span>
            )}
          </>
        )}
      </div>
    </label>
  );
}
