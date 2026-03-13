'use client';

import { motion } from 'framer-motion';
import { Type, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAPTION_PRESETS, assBgrToHex } from '@/config/caption-styles';
import { CaptionStyleConfig } from '@/types/captions';

// ============================================
// CAPTION STYLE PICKER COMPONENT
// ============================================

interface CaptionStylePickerProps {
  selectedStyleId: string | null; // null = no captions
  onStyleSelect: (styleId: string | null) => void;
  className?: string;
}

/**
 * Caption style picker for selecting caption presets
 * Displays a grid of style preview cards with "No Captions" option
 */
export function CaptionStylePicker({
  selectedStyleId,
  onStyleSelect,
  className,
}: CaptionStylePickerProps) {
  const hasCaption = selectedStyleId !== null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-surface-raised">
          <Type className="w-5 h-5 text-mint" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary font-outfit">
            Caption Style
          </p>
          <p className="text-xs text-text-muted">
            Choose how your captions look
          </p>
        </div>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* No Captions Option */}
        <StyleCard
          isSelected={!hasCaption}
          onClick={() => onStyleSelect(null)}
          preview={
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-text-muted">
                <X className="w-5 h-5" />
                <span className="text-sm">No Captions</span>
              </div>
            </div>
          }
          name="None"
          description="No auto captions"
          dimmed
        />

        {/* Style Presets */}
        {CAPTION_PRESETS.map((style) => (
          <StyleCard
            key={style.id}
            isSelected={selectedStyleId === style.id}
            onClick={() => onStyleSelect(style.id)}
            preview={<StylePreview style={style} />}
            name={style.name}
            description={style.description}
          />
        ))}
      </div>

      {/* Credit Cost */}
      <div className="flex items-center justify-between pt-2 border-t border-border-default">
        <span className="text-xs text-text-muted">Caption cost</span>
        <span
          className={cn(
            'text-xs font-medium transition-colors',
            hasCaption ? 'text-mint' : 'text-text-muted'
          )}
        >
          {hasCaption ? '+1 credit' : 'Free'}
        </span>
      </div>
    </div>
  );
}

// ============================================
// STYLE CARD COMPONENT
// ============================================

interface StyleCardProps {
  isSelected: boolean;
  onClick: () => void;
  preview: React.ReactNode;
  name: string;
  description: string;
  dimmed?: boolean;
}

function StyleCard({
  isSelected,
  onClick,
  preview,
  name,
  description,
  dimmed,
}: StyleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 overflow-hidden transition-all',
        'focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-surface',
        isSelected
          ? 'border-mint shadow-lg shadow-mint/10'
          : 'border-border-default hover:border-mint/50',
        dimmed && 'opacity-70'
      )}
    >
      {/* Preview Area */}
      <div className="h-20 bg-zinc-900 flex items-center justify-center p-3">
        {preview}
      </div>

      {/* Info Area */}
      <div className="p-2.5 bg-surface text-left">
        <p className="text-sm font-medium text-text-primary font-outfit truncate">
          {name}
        </p>
        <p className="text-xs text-text-muted truncate">{description}</p>
      </div>

      {/* Selected Checkmark */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-mint flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}
    </button>
  );
}

// ============================================
// STYLE PREVIEW COMPONENT
// ============================================

interface StylePreviewProps {
  style: CaptionStyleConfig;
}

/**
 * Renders a preview of the caption style
 * Shows sample text with the style's colors and formatting
 */
function StylePreview({ style }: StylePreviewProps) {
  // Convert ASS BGR colors to hex for CSS
  const primaryHex = assBgrToHex(style.primaryColor);
  const highlightHex = assBgrToHex(style.highlightColor);

  // Sample text parts
  const words = ['This', 'product', 'changed', 'my', 'life'];
  const highlightIndex = 2; // "changed" is highlighted

  return (
    <div
      className={cn(
        'text-center leading-relaxed',
        style.uppercase && 'uppercase'
      )}
      style={{
        fontFamily: style.fontFamily,
        fontSize: style.fontSize > 50 ? '14px' : '12px',
        textShadow: style.outlineWidth > 0
          ? `0 0 ${style.outlineWidth}px #000`
          : undefined,
      }}
    >
      {words.map((word, idx) => (
        <span
          key={idx}
          style={{
            color: idx === highlightIndex ? highlightHex : primaryHex,
            fontWeight: idx === highlightIndex || style.bold ? 700 : 400,
          }}
        >
          {word}
          {idx < words.length - 1 && ' '}
        </span>
      ))}
    </div>
  );
}

// ============================================
// COMPACT PICKER FOR INLINE USE
// ============================================

interface CaptionStylePickerCompactProps {
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string | null) => void;
  className?: string;
}

/**
 * Compact version showing just the selected style with a change button
 */
export function CaptionStylePickerCompact({
  selectedStyleId,
  onStyleSelect,
  className,
}: CaptionStylePickerCompactProps) {
  const selectedStyle = selectedStyleId
    ? CAPTION_PRESETS.find((p) => p.id === selectedStyleId)
    : null;

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-3">
        <Type className="w-4 h-4 text-text-muted" />
        <div>
          <span className="text-sm text-text-primary">
            {selectedStyle ? selectedStyle.name : 'No Captions'}
          </span>
          {selectedStyle && (
            <span className="text-xs text-mint font-medium ml-2">+1</span>
          )}
        </div>
      </div>

      {/* Quick toggle to disable/enable */}
      <button
        type="button"
        onClick={() => onStyleSelect(selectedStyleId ? null : 'hormozi-bold')}
        className={cn(
          'relative w-10 h-5 rounded-full transition-colors',
          selectedStyleId
            ? 'bg-gradient-to-r from-mint to-mint-dark'
            : 'bg-surface-raised'
        )}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
          animate={{ left: selectedStyleId ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export { CAPTION_PRESETS };
