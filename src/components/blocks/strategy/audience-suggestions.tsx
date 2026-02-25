'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Zap, TrendingUp } from 'lucide-react';
import { AudienceSuggestion } from '@/types/generation';
import { StrategyEmptyState } from './strategy-empty-state';

// ============================================
// AUDIENCE CARD COMPONENT
// ============================================

interface AudienceCardProps {
  audience: AudienceSuggestion;
  index: number;
  isPrimary?: boolean;
  className?: string;
}

function AudienceCard({ audience, index, isPrimary = false, className }: AudienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={className}
    >
      <Card
        className={cn(
          'p-5 h-full relative overflow-hidden',
          isPrimary && 'ring-2 ring-mint'
        )}
      >
        {/* Primary indicator */}
        {isPrimary && (
          <div className="absolute top-0 right-0">
            <Badge
              variant="purple"
              size="sm"
              className="rounded-tl-none rounded-br-none rounded-tr-xl rounded-bl-lg"
            >
              Primary
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={cn(
              'p-2.5 rounded-xl',
              isPrimary
                ? 'bg-mint/20 text-mint'
                : 'bg-surface text-text-muted'
            )}
          >
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-text-primary truncate">
              {audience.segment}
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              {audience.ageRange}
            </p>
          </div>
        </div>

        {/* Why It Works */}
        <p className="text-sm text-text-muted mb-4">{audience.whyItWorks}</p>

        {/* Targeting Details */}
        <div className="space-y-3 border-t border-border-default pt-4">
          {/* Interests */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              Interest Targeting
            </p>
            <div className="flex flex-wrap gap-1.5">
              {audience.interests.slice(0, 4).map((interest, i) => (
                <Badge key={i} variant="default" size="sm">
                  {interest}
                </Badge>
              ))}
              {audience.interests.length > 4 && (
                <Badge variant="default" size="sm">
                  +{audience.interests.length - 4}
                </Badge>
              )}
            </div>
          </div>

          {/* Behaviors */}
          {audience.behaviors && audience.behaviors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                Behaviors
              </p>
              <div className="flex flex-wrap gap-1.5">
                {audience.behaviors.slice(0, 3).map((behavior, i) => (
                  <Badge key={i} variant="success" size="sm">
                    {behavior}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================
// AUDIENCE SUGGESTIONS COMPONENT
// ============================================

interface AudienceSuggestionsProps {
  audiences: AudienceSuggestion[];
  className?: string;
}

export function AudienceSuggestions({ audiences, className }: AudienceSuggestionsProps) {
  // Show empty state if no audiences
  if (!audiences || !Array.isArray(audiences) || audiences.length === 0) {
    return <StrategyEmptyState variant="audiences" className={className} />;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Recommended Audiences
        </h3>
        <p className="text-sm text-text-muted mt-1">
          Start with these targeting suggestions for best results
        </p>
      </div>

      {/* Audiences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {audiences.map((audience, index) => (
          <AudienceCard
            key={audience.segment}
            audience={audience}
            index={index}
            isPrimary={index === 0}
          />
        ))}
      </div>

      {/* Pro tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 rounded-lg bg-status-success/10 border border-status-success/20"
      >
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-status-success flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              Testing Strategy
            </p>
            <p className="text-sm text-text-muted mt-1">
              Test each audience separately with $5-10/day budget. After 3 days,
              scale the winner and cut underperformers.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
