'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, FileText, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoTemplate, ScriptSection } from '@/types/templates';

// ============================================
// SECTION TIMELINE ITEM
// ============================================

interface TimelineItemProps {
  section: VideoTemplate['sections'][0];
  scriptSection?: ScriptSection;
  isActive: boolean;
  onClick: () => void;
}

function TimelineItem({
  section,
  scriptSection,
  isActive,
  onClick,
}: TimelineItemProps) {
  const wordCount = scriptSection?.wordCount || 0;
  const isComplete = scriptSection?.isValid && wordCount > 0;
  const progress = Math.min((wordCount / section.wordCount.recommended) * 100, 100);

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-full text-left p-3 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-surface border border-mint/50'
          : 'hover:bg-surface-raised/50'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3">
        {/* Color indicator */}
        <div
          className={cn(
            'w-3 h-3 rounded-full flex-shrink-0',
            section.color,
            !isComplete && 'opacity-50'
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-sm font-medium',
                isActive ? 'text-text-primary' : 'text-text-muted'
              )}
            >
              {section.name}
            </span>
            <span className="text-xs text-text-muted">
              {section.startTime}s - {section.endTime}s
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-1.5 h-1 bg-surface-raised rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', section.color)}
              initial={{ width: 0 }}
              animate={{
                width: isComplete
                  ? '100%'
                  : wordCount > 0
                  ? `${progress}%`
                  : '0%',
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Word count */}
          <div className="mt-1 text-xs text-text-muted">
            {wordCount} / {section.wordCount.recommended} words
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ============================================
// TIPS PANEL
// ============================================

interface TipsPanelProps {
  tips: string[];
  isOpen: boolean;
  onToggle: () => void;
}

function TipsPanel({ tips, isOpen, onToggle }: TipsPanelProps) {
  return (
    <div className="border-t border-border-default pt-3 mt-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors w-full"
      >
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span>Writing Tips</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-auto" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-1.5 overflow-hidden"
          >
            {tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-text-muted"
              >
                <span className="text-amber-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN PREVIEW COMPONENT
// ============================================

interface TemplatePreviewProps {
  template: VideoTemplate;
  scriptSections?: ScriptSection[];
  activeSectionId: string | null;
  onSectionClick: (sectionId: string) => void;
  className?: string;
}

export function TemplatePreview({
  template,
  scriptSections,
  activeSectionId,
  onSectionClick,
  className,
}: TemplatePreviewProps) {
  const [tipsOpen, setTipsOpen] = useState(true);

  const totalDuration = template.sections[template.sections.length - 1].endTime;
  const totalWords =
    scriptSections?.reduce((sum, s) => sum + s.wordCount, 0) || 0;

  const activeTemplateSection = template.sections.find(
    (s) => s.id === activeSectionId
  );

  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-border-default p-4',
        className
      )}
    >
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">Script Timeline</h3>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />~{totalDuration}s
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {totalWords} words
          </span>
        </div>
      </div>

      {/* Section Timeline */}
      <div className="space-y-2">
        {template.sections.map((section) => {
          const scriptSection = scriptSections?.find(
            (s) => s.sectionId === section.id
          );
          return (
            <TimelineItem
              key={section.id}
              section={section}
              scriptSection={scriptSection}
              isActive={activeSectionId === section.id}
              onClick={() => onSectionClick(section.id)}
            />
          );
        })}
      </div>

      {/* Tips for Active Section */}
      {activeTemplateSection && (
        <TipsPanel
          tips={activeTemplateSection.tips}
          isOpen={tipsOpen}
          onToggle={() => setTipsOpen(!tipsOpen)}
        />
      )}
    </div>
  );
}
