'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Calendar, Rocket, TrendingUp, Target, Sparkles, Lightbulb } from 'lucide-react';
import { TestingPhase } from '@/types/generation';
import { StrategyEmptyState } from './strategy-empty-state';

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================

function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  className
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayValue = useTransform(rounded, (latest) => `${prefix}${latest}${suffix}`);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [count, value]);

  return (
    <motion.span ref={ref} className={className}>
      {displayValue}
    </motion.span>
  );
}

// ============================================
// PHASE CONFIGURATION
// ============================================

const phaseConfig = [
  {
    icon: Rocket,
    emoji: '🚀',
    label: 'LAUNCH',
    gradient: 'from-electric-indigo via-purple-500 to-vibrant-fuchsia',
    glowColor: 'shadow-electric-indigo/40',
    bgGlow: 'bg-electric-indigo/5',
    borderGlow: 'hover:border-electric-indigo/50',
    nodeColor: 'bg-electric-indigo',
  },
  {
    icon: TrendingUp,
    emoji: '📈',
    label: 'SCALE',
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    glowColor: 'shadow-amber-500/40',
    bgGlow: 'bg-amber-500/5',
    borderGlow: 'hover:border-amber-500/50',
    nodeColor: 'bg-amber-500',
  },
  {
    icon: Target,
    emoji: '🎯',
    label: 'OPTIMIZE',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    glowColor: 'shadow-emerald-500/40',
    bgGlow: 'bg-emerald-500/5',
    borderGlow: 'hover:border-emerald-500/50',
    nodeColor: 'bg-emerald-500',
  },
];

// ============================================
// TIMELINE NODE COMPONENT
// ============================================

function TimelineNode({
  config,
  isFirst,
  isLast,
}: {
  config: typeof phaseConfig[0];
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-8 hidden md:flex flex-col items-center">
      {/* Top connector line */}
      {!isFirst && (
        <motion.div
          className={cn('w-0.5 flex-1 bg-gradient-to-b', config.gradient)}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ transformOrigin: 'top' }}
        />
      )}

      {/* Node circle */}
      <motion.div
        className={cn(
          'relative w-4 h-4 rounded-full',
          config.nodeColor,
          'ring-4 ring-deep-space'
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Pulse effect */}
        <motion.div
          className={cn('absolute inset-0 rounded-full', config.nodeColor)}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Bottom connector line */}
      {!isLast && (
        <motion.div
          className="w-0.5 flex-1 bg-gradient-to-b from-border-default/50 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          style={{ transformOrigin: 'top' }}
        />
      )}
    </div>
  );
}

// ============================================
// PHASE CARD COMPONENT
// ============================================

interface PhaseCardProps {
  phase: TestingPhase;
  index: number;
  isLast: boolean;
}

function PhaseCard({ phase, index, isLast }: PhaseCardProps) {
  const config = phaseConfig[index % phaseConfig.length];
  const Icon = config.icon;

  // Extract budget number
  const budgetMatch = phase.budget.match(/\$(\d+)/);
  const budgetValue = budgetMatch ? parseInt(budgetMatch[1], 10) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="relative md:pl-12"
    >
      {/* Timeline node */}
      <TimelineNode
        config={config}
        isFirst={index === 0}
        isLast={isLast}
      />

      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group"
      >
        <Card
          className={cn(
            'relative overflow-hidden transition-all duration-300',
            'border-border-default/50',
            config.borderGlow,
            'hover:shadow-xl',
            config.glowColor
          )}
        >
          {/* Gradient accent bar */}
          <div className={cn(
            'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
            config.gradient
          )} />

          {/* Background glow on hover */}
          <div className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            config.bgGlow
          )} />

          <div className="relative p-6">
            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
              {/* Phase badge and icon */}
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    'bg-gradient-to-br',
                    config.gradient,
                    'shadow-lg',
                    config.glowColor
                  )}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                    <span className={cn(
                      'text-xs font-bold tracking-wider bg-gradient-to-r bg-clip-text text-transparent',
                      config.gradient
                    )}>
                      PHASE {phase.phase}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium">{phase.days}</span>
                  </div>
                </div>
              </div>

              {/* Budget - Hero number */}
              <div className="text-right">
                <p className="text-xs text-text-muted mb-1">Budget</p>
                <div className="text-2xl font-bold text-status-success tabular-nums">
                  <AnimatedCounter value={budgetValue} prefix="$" />
                </div>
              </div>
            </div>

            {/* Action description */}
            <div className="mb-5">
              <h4 className="text-base font-semibold text-text-primary leading-relaxed">
                {phase.action}
              </h4>
            </div>

            {/* KPIs Grid */}
            <div className="pt-4 border-t border-border-default/50">
              <p className="text-xs font-medium text-text-muted mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3 h-3" />
                Key Performance Indicators
              </p>
              <div className="grid grid-cols-2 gap-2">
                {phase.kpis.map((kpi, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.15 + i * 0.1 }}
                    className={cn(
                      'px-3 py-2 rounded-lg',
                      'bg-surface/50 border border-border-default/30',
                      'text-sm text-text-primary',
                      'flex items-center gap-2'
                    )}
                  >
                    <div className={cn('w-1.5 h-1.5 rounded-full', config.nodeColor)} />
                    {kpi}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// TESTING ROADMAP COMPONENT
// ============================================

interface TestingRoadmapProps {
  phases: TestingPhase[];
  className?: string;
}

export function TestingRoadmap({ phases, className }: TestingRoadmapProps) {
  // Show empty state if no phases
  if (!phases || !Array.isArray(phases) || phases.length === 0) {
    return <StrategyEmptyState variant="roadmap" className={className} />;
  }

  // Calculate total budget
  const totalBudget = phases.reduce((sum, phase) => {
    const budgetMatch = phase.budget.match(/\$(\d+)/);
    return sum + (budgetMatch ? parseInt(budgetMatch[1], 10) : 0);
  }, 0);

  return (
    <div className={className}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-1">
            14-Day Testing Roadmap
          </h3>
          <p className="text-sm text-text-muted">
            Follow this framework to find your winning creative
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">Total Investment</p>
          <motion.div
            className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-status-success bg-clip-text text-transparent tabular-nums"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            ~<AnimatedCounter value={totalBudget} prefix="$" />
          </motion.div>
        </div>
      </motion.div>

      {/* Timeline with phases */}
      <div className="space-y-4">
        {phases.map((phase, index) => (
          <PhaseCard
            key={phase.phase}
            phase={phase}
            index={index}
            isLast={index === phases.length - 1}
          />
        ))}
      </div>

      {/* Pro tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={cn(
          'mt-8 p-5 rounded-xl',
          'bg-gradient-to-r from-electric-indigo/10 via-vibrant-fuchsia/5 to-electric-indigo/10',
          'border border-electric-indigo/20',
          'relative overflow-hidden'
        )}
      >
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-electric-indigo/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-indigo to-vibrant-fuchsia flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-electric-indigo mb-1">Pro tip</p>
            <p className="text-sm text-text-primary leading-relaxed">
              Don&apos;t skip Phase 1. Testing all 3 hooks first ensures you find
              your best performer before scaling spend.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
