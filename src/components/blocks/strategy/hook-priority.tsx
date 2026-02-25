'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Sparkles, Clock, Award } from 'lucide-react';
import { HookRecommendation } from '@/types/generation';
import { StrategyEmptyState } from './strategy-empty-state';

// ============================================
// HOOK CARD COMPONENT
// ============================================

interface HookCardProps {
  hook: HookRecommendation;
  rank: number;
  className?: string;
}

const rankColors: Record<number, string> = {
  1: 'from-amber-500 to-yellow-500',
  2: 'from-slate-400 to-slate-300',
  3: 'from-amber-700 to-amber-600',
};

const rankLabels: Record<number, string> = {
  1: '1st Priority',
  2: '2nd Priority',
  3: '3rd Priority',
};

function HookCard({ hook, rank, className }: HookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.1 }}
      className={className}
    >
      <Card className={cn('p-5 relative overflow-hidden', rank === 1 && 'ring-2 ring-amber-500')}>
        {/* Rank indicator */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r',
              rankColors[rank] || 'from-gray-500 to-gray-400'
            )}
          >
            <Award className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">
              {rankLabels[rank] || `#${rank}`}
            </span>
          </div>
          <Badge variant={rank === 1 ? 'warning' : 'default'} size="sm">
            {hook.hookType}
          </Badge>
        </div>

        {/* Hook Preview */}
        <div className="mb-4 p-3 rounded-lg bg-cream border border-border-default">
          <p className="text-sm text-text-primary italic">
            &ldquo;{hook.openingLine}&rdquo;
          </p>
        </div>

        {/* Reasoning */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-mint" />
              Why This Works
            </p>
            <p className="text-sm text-text-primary">{hook.reasoning}</p>
          </div>

          {/* Expected Performance */}
          <div className="flex items-center gap-4 pt-3 border-t border-border-default">
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-text-muted" />
              <span className="text-text-muted">Estimated:</span>
              <span className="text-status-success font-medium">
                {hook.expectedHookRate}
              </span>
            </div>
          </div>
        </div>

        {/* Play preview button */}
        {hook.scriptIndex !== undefined && (
          <div className="mt-4 pt-4 border-t border-border-default">
            <button className="flex items-center gap-2 text-sm text-mint hover:text-coral transition-colors">
              <Play className="w-4 h-4" />
              Preview Script #{hook.scriptIndex + 1}
            </button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ============================================
// HOOK PRIORITY COMPONENT
// ============================================

interface HookPriorityProps {
  hooks: HookRecommendation[];
  className?: string;
}

export function HookPriority({ hooks, className }: HookPriorityProps) {
  // Show empty state if no hooks
  if (!hooks || !Array.isArray(hooks) || hooks.length === 0) {
    return <StrategyEmptyState variant="hooks" className={className} />;
  }

  // Sort by priority (lower is better)
  const sortedHooks = [...hooks].sort((a, b) => a.priority - b.priority);

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Hook Testing Priority
        </h3>
        <p className="text-sm text-text-muted mt-1">
          Test these scripts in order to find your winning creative
        </p>
      </div>

      {/* Hooks List */}
      <div className="space-y-4">
        {sortedHooks.map((hook, index) => (
          <HookCard
            key={`hook-${hook.scriptIndex}-${hook.priority}-${index}`}
            hook={hook}
            rank={index + 1}
          />
        ))}
      </div>

      {/* Testing guide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20"
      >
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              Testing Protocol
            </p>
            <p className="text-sm text-text-muted mt-1">
              Run all 3 hooks simultaneously with equal budget. After 1000
              impressions each, identify the winner by Hook Rate (% who watched
              3+ seconds).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
