'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Rocket,
  Clock,
  DollarSign,
} from 'lucide-react';
import { StrategyEmptyState } from './strategy-empty-state';

// ============================================
// TIP ITEM COMPONENT
// ============================================

interface TipItemProps {
  tip: string;
  index: number;
  category?: 'do' | 'dont' | 'pro';
}

const categoryConfig = {
  do: {
    icon: CheckCircle2,
    color: 'text-status-success',
    bg: 'bg-status-success/10',
  },
  dont: {
    icon: AlertTriangle,
    color: 'text-status-warning',
    bg: 'bg-status-warning/10',
  },
  pro: {
    icon: Rocket,
    color: 'text-electric-indigo',
    bg: 'bg-electric-indigo/10',
  },
};

function TipItem({ tip, index, category = 'do' }: TipItemProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-start gap-3"
    >
      <div className={cn('p-1 rounded-md', config.bg)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <p className="text-sm text-text-primary flex-1">{tip}</p>
    </motion.li>
  );
}

// ============================================
// OPTIMIZATION TIPS COMPONENT
// ============================================

interface OptimizationTipsProps {
  tips: {
    do: string[];
    dont: string[];
    proTips?: string[];
  };
  className?: string;
}

export function OptimizationTips({ tips, className }: OptimizationTipsProps) {
  // Show empty state if no tips
  if (!tips || !tips.do || !tips.dont) {
    return <StrategyEmptyState variant="tips" className={className} />;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Optimization Playbook
        </h3>
        <p className="text-sm text-text-muted mt-1">
          Follow these guidelines to maximize your ad performance
        </p>
      </div>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Do's */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-status-success/20">
              <CheckCircle2 className="w-5 h-5 text-status-success" />
            </div>
            <h4 className="text-base font-semibold text-text-primary">
              Best Practices
            </h4>
          </div>
          <ul className="space-y-3">
            {tips.do.map((tip, index) => (
              <TipItem key={index} tip={tip} index={index} category="do" />
            ))}
          </ul>
        </Card>

        {/* Don'ts */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-status-warning/20">
              <AlertTriangle className="w-5 h-5 text-status-warning" />
            </div>
            <h4 className="text-base font-semibold text-text-primary">
              Common Mistakes
            </h4>
          </div>
          <ul className="space-y-3">
            {tips.dont.map((tip, index) => (
              <TipItem key={index} tip={tip} index={index} category="dont" />
            ))}
          </ul>
        </Card>
      </div>

      {/* Pro Tips */}
      {tips.proTips && tips.proTips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="p-5 bg-gradient-to-r from-electric-indigo/5 to-vibrant-fuchsia/5 border-electric-indigo/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-base font-semibold text-text-primary">
                Pro Tips
              </h4>
              <Badge variant="purple" size="sm">
                Advanced
              </Badge>
            </div>
            <ul className="space-y-3">
              {tips.proTips.map((tip, index) => (
                <TipItem key={index} tip={tip} index={index} category="pro" />
              ))}
            </ul>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// QUICK STATS COMPONENT
// ============================================

interface QuickStatsProps {
  stats: {
    estimatedCPM?: string;
    expectedROAS?: string;
    testingDuration?: string;
    totalBudget?: string;
  };
  className?: string;
}

export function QuickStats({ stats, className }: QuickStatsProps) {
  // Guard against undefined stats
  if (!stats) {
    return null;
  }

  const statItems = [
    { label: 'Est. CPM', value: stats.estimatedCPM, icon: DollarSign },
    { label: 'Expected ROAS', value: stats.expectedROAS, icon: Rocket },
    { label: 'Testing Period', value: stats.testingDuration, icon: Clock },
    { label: 'Total Budget', value: stats.totalBudget, icon: DollarSign },
  ].filter((item) => item.value);

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <Card className="p-4 text-center">
            <stat.icon className="w-5 h-5 text-text-muted mx-auto mb-2" />
            <p className="text-lg font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-muted">{stat.label}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
