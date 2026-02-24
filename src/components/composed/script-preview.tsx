'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, RefreshCw, Pencil, Check, X, Clock, Hash, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeneratedScript } from '@/types/generation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface ScriptPreviewProps {
  script: GeneratedScript;
  onRegenerate?: () => void;
  onScriptChange?: (content: string) => void;
  isRegenerating?: boolean;
  className?: string;
}

export function ScriptPreview({
  script,
  onRegenerate,
  onScriptChange,
  isRegenerating = false,
  className,
}: ScriptPreviewProps) {
  // Support both new (fullScript) and legacy (content) formats
  const scriptContent = script.fullScript || script.content || '';
  const hookLine = script.dialogue?.[0]?.text || script.hookLine || '';

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(scriptContent);

  const handleSaveEdit = () => {
    if (editedContent) {
      onScriptChange?.(editedContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(scriptContent);
    setIsEditing(false);
  };

  // Calculate metrics for edited content
  const currentWordCount = (editedContent || '').split(/\s+/).filter(Boolean).length;
  const currentDuration = Math.ceil(currentWordCount / 3.5); // ~3.5 words per second

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={className}
    >
      <Card className="bg-surface border border-border-default p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-indigo to-vibrant-fuchsia flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Generated Script</h3>
              <p className="text-xs text-text-muted">AI-crafted viral hook</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={isRegenerating}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {onRegenerate && (
                  <Button
                    variant="secondary"
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
              </>
            )}
            {isEditing && (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Hook Line Highlight */}
        <div className="mb-4 p-3 rounded-lg bg-electric-indigo/10 border border-electric-indigo/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-electric-indigo" />
            <span className="text-xs font-medium text-electric-indigo uppercase tracking-wider">
              Hook Line
            </span>
          </div>
          <p className="text-text-primary font-medium italic">"{hookLine}"</p>
        </div>

        {/* Script Content */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[200px] bg-deep-space text-text-primary"
                placeholder="Edit your script..."
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {isRegenerating && (
                <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                  <div className="flex items-center gap-2 text-electric-indigo">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Regenerating script...</span>
                  </div>
                </div>
              )}
              <div className="p-4 rounded-lg bg-deep-space border border-border-default">
                <pre className="whitespace-pre-wrap font-sans text-sm text-text-primary leading-relaxed">
                  {scriptContent}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Script Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-default">
          <div className="flex items-center gap-1.5 text-text-muted text-sm">
            <Hash className="w-4 h-4" />
            <span>{isEditing ? currentWordCount : script.wordCount} words</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted text-sm">
            <Clock className="w-4 h-4" />
            <span>~{isEditing ? currentDuration : script.estimatedDuration} seconds</span>
          </div>
          <Badge variant="success" size="sm" className="ml-auto">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Generated
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
}

// Skeleton loader for ScriptPreview
export function ScriptPreviewSkeleton() {
  return (
    <Card className="bg-surface border border-border-default p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-elevated animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-32 bg-elevated rounded animate-pulse" />
            <div className="h-3 w-24 bg-elevated rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-elevated/50 mb-4">
        <div className="h-3 w-16 bg-elevated rounded animate-pulse mb-2" />
        <div className="h-5 w-3/4 bg-elevated rounded animate-pulse" />
      </div>
      <div className="p-4 rounded-lg bg-deep-space space-y-2">
        <div className="h-4 w-full bg-elevated rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-elevated rounded animate-pulse" />
        <div className="h-4 w-full bg-elevated rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-elevated rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-elevated rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-default">
        <div className="h-4 w-20 bg-elevated rounded animate-pulse" />
        <div className="h-4 w-24 bg-elevated rounded animate-pulse" />
      </div>
    </Card>
  );
}
