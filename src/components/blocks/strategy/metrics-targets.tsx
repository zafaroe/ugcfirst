'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TrendingUp, Eye, Clock, MousePointerClick, Lightbulb, ChevronDown } from 'lucide-react';
import { MetricTarget } from '@/types/generation';
import { StrategyEmptyState } from './strategy-empty-state';

// ============================================
// METRIC CONFIGURATION
// ============================================

const metricConfig: Record<string, {
  icon: React.FC<{ className?: string }>;
  gradient: string;
  glowColor: string;
  bgGlow: string;
  ringColor: string;
  description: string;
}> = {
  'Hook Rate': {
    icon: Eye,
    gradient: 'from-amber-400 via-orange-500 to-amber-600',
    glowColor: 'shadow-amber-500/30',
    bgGlow: 'bg-amber-500/5',
    ringColor: 'ring-amber-500/20',
    description: '% who watched 3+ seconds',
  },
  'Hold Rate': {
    icon: Clock,
    gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    glowColor: 'shadow-emerald-500/30',
    bgGlow: 'bg-emerald-500/5',
    ringColor: 'ring-emerald-500/20',
    description: '% who watched to the end',
  },
  CTR: {
    icon: MousePointerClick,
    gradient: 'from-electric-indigo via-purple-500 to-vibrant-fuchsia',
    glowColor: 'shadow-electric-indigo/30',
    bgGlow: 'bg-electric-indigo/5',
    ringColor: 'ring-electric-indigo/20',
    description: 'Click-through rate to your site',
  },
  default: {
    icon: TrendingUp,
    gradient: 'from-vibrant-fuchsia via-pink-500 to-rose-500',
    glowColor: 'shadow-vibrant-fuchsia/30',
    bgGlow: 'bg-vibrant-fuchsia/5',
    ringColor: 'ring-vibrant-fuchsia/20',
    description: 'Key performance metric',
  },
};

// ============================================
// METRIC CARD COMPONENT
// ============================================

interface MetricCardProps {
  metric: MetricTarget;
  index: number;
  className?: string;
}

function MetricCard({ metric, index, className }: MetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = metricConfig[metric.name] || metricConfig.default;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={className}
    >
      <motion.div
        whileHover={{ x: 4, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card
          className={cn(
            'relative h-full overflow-hidden transition-all duration-300',
            'border-border-default/50',
            'hover:shadow-lg',
            config.glowColor,
            'group'
          )}
        >
          {/* Left gradient accent bar */}
          <div className={cn(
            'absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b',
            config.gradient
          )} />

          {/* Background glow on hover */}
          <div className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            config.bgGlow
          )} />

          <div className="relative p-4 pl-5">
            {/* Horizontal layout for sidebar */}
            <div className="flex items-center gap-4">
              {/* Icon */}
              <motion.div
                className="relative flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <div className={cn(
                  'absolute inset-0 rounded-xl blur-md',
                  'bg-gradient-to-br',
                  config.gradient,
                  'opacity-30 group-hover:opacity-50 transition-opacity'
                )} />
                <div className={cn(
                  'relative w-12 h-12 rounded-xl',
                  'bg-gradient-to-br',
                  config.gradient,
                  'flex items-center justify-center',
                  'shadow-lg',
                  config.glowColor
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <motion.span
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      'bg-gradient-to-r bg-clip-text text-transparent',
                      config.gradient
                    )}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {metric.target}
                  </motion.span>
                  <span className="text-xs text-text-muted uppercase tracking-wide">target</span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary">
                  {metric.name}
                </h4>
                <p className="text-xs text-text-muted truncate">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Expandable tip section */}
            <div className="mt-3 pt-3 border-t border-border-default/30">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'w-full flex items-center justify-between',
                  'text-xs font-medium',
                  'text-text-muted hover:text-text-primary',
                  'transition-colors duration-200'
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  How to improve
                </span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-text-muted mt-2 leading-relaxed">
                      {metric.howToImprove}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// METRICS TARGETS COMPONENT
// ============================================

interface MetricsTargetsProps {
  metrics: MetricTarget[];
  className?: string;
}

export function MetricsTargets({ metrics, className }: MetricsTargetsProps) {
  // Show compact empty state if no metrics (compact for sidebar)
  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
    return <StrategyEmptyState variant="metrics" compact className={className} />;
  }

  return (
    <div className={className}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h3 className="text-xl font-bold text-text-primary mb-1">
          Key Metrics to Track
        </h3>
        <p className="text-sm text-text-muted">
          Monitor these KPIs to optimize your ad performance
        </p>
      </motion.div>

      {/* Metrics Grid - Single column for sidebar placement */}
      <div className="grid grid-cols-1 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.name} metric={metric} index={index} />
        ))}
      </div>

      {/* Quick reference footer - compact for sidebar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 p-4 rounded-xl bg-surface/50 border border-border-default/30"
      >
        <p className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wide">Quick Reference</p>
        <div className="space-y-2">
          {metrics.map((metric) => {
            const config = metricConfig[metric.name] || metricConfig.default;
            const Icon = config.icon;
            return (
              <div
                key={metric.name}
                className="flex items-center gap-2 text-xs text-text-muted"
              >
                <div className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0',
                  'bg-gradient-to-br',
                  config.gradient
                )}>
                  <Icon className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="truncate">
                  <strong className="text-text-primary">{metric.name}</strong>
                  <span className="hidden sm:inline"> — {config.description}</span>
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
