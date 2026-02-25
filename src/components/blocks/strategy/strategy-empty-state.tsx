'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FilmReelIllustration,
  ClapperboardIllustration,
  ScriptIllustration,
  SpotlightIllustration,
  CameraIllustration,
  DirectorChairIllustration,
} from '@/components/composed/empty-state-illustrations';

// ============================================
// VARIANT CONFIGURATION
// ============================================

type EmptyStateVariant = 'roadmap' | 'metrics' | 'hooks' | 'audiences' | 'platforms' | 'tips';

interface VariantConfig {
  illustration: React.FC<{ size?: number; className?: string }>;
  title: string;
  messages: string[];
  gradient: string;
  glowColor: string;
}

const variantConfig: Record<EmptyStateVariant, VariantConfig> = {
  roadmap: {
    illustration: ClapperboardIllustration,
    title: 'Roadmap in Pre-Production',
    messages: [
      'Your testing strategy is being drafted...',
      'The director is reviewing the shooting schedule...',
      'Phase planning in the editing bay...',
      'Mapping out your path to viral success...',
    ],
    gradient: 'from-mint-light to-mint-dark',
    glowColor: 'bg-mint/20',
  },
  metrics: {
    illustration: FilmReelIllustration,
    title: 'Metrics Not Yet Cast',
    messages: [
      'Performance targets are being determined...',
      'Crunching the numbers in post-production...',
      'Calibrating your success metrics...',
      'The analytics team is on set...',
    ],
    gradient: 'from-amber-400 to-orange-500',
    glowColor: 'bg-amber-500/20',
  },
  hooks: {
    illustration: ScriptIllustration,
    title: 'Hooks Still on the Reel',
    messages: [
      'The AI is crafting the perfect hook angles...',
      'Scriptwriters are brainstorming openers...',
      'Finding the line that stops the scroll...',
      'Hook research in progress...',
    ],
    gradient: 'from-emerald-400 to-teal-500',
    glowColor: 'bg-emerald-500/20',
  },
  audiences: {
    illustration: SpotlightIllustration,
    title: 'Audience Not Seated Yet',
    messages: [
      'Target audience research is in progress...',
      'Searching for your ideal viewers...',
      'The spotlight is warming up...',
      'Casting the perfect audience...',
    ],
    gradient: 'from-coral to-pink-500',
    glowColor: 'bg-coral/20',
  },
  platforms: {
    illustration: CameraIllustration,
    title: 'Platforms Under Consideration',
    messages: [
      "We're scouting the best stages for your content...",
      'Evaluating platform potential...',
      'Finding where your audience hangs out...',
      'Camera crew is setting up...',
    ],
    gradient: 'from-cyan-400 to-blue-500',
    glowColor: 'bg-cyan-500/20',
  },
  tips: {
    illustration: DirectorChairIllustration,
    title: 'Tips Loading...',
    messages: [
      'Optimization wisdom is brewing...',
      'The director is preparing notes...',
      'Gathering pro tips from the editing bay...',
      'Expert advice incoming...',
    ],
    gradient: 'from-purple-400 to-indigo-500',
    glowColor: 'bg-purple-500/20',
  },
};

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ============================================
// FLOATING EMOJI COMPONENT
// ============================================

function FloatingEmoji({ emoji, delay, duration, x, y }: {
  emoji: string;
  delay: number;
  duration: number;
  x: string;
  y: string;
}) {
  return (
    <motion.span
      className="absolute text-2xl pointer-events-none select-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 0.3, 0.3, 0],
        scale: [0.5, 1, 1, 0.5],
        y: [0, -20, -40, -60],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {emoji}
    </motion.span>
  );
}

// ============================================
// STRATEGY EMPTY STATE COMPONENT
// ============================================

interface StrategyEmptyStateProps {
  variant: EmptyStateVariant;
  compact?: boolean;
  className?: string;
}

export function StrategyEmptyState({
  variant,
  compact = false,
  className,
}: StrategyEmptyStateProps) {
  const config = variantConfig[variant];
  const Illustration = config.illustration;
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % config.messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [config.messages.length]);

  // Compact variant for sidebars
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl',
          'bg-surface/50 border border-border-default/30',
          className
        )}
      >
        <div className="relative">
          <div className={cn('absolute inset-0 blur-xl rounded-full', config.glowColor)} />
          <Illustration size={40} className="relative" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{config.title}</p>
          <p className="text-xs text-text-muted truncate">{config.messages[messageIndex]}</p>
        </div>
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'relative flex flex-col items-center justify-center text-center',
        'py-12 px-6 rounded-2xl overflow-hidden',
        'bg-gradient-to-b from-surface/50 to-transparent',
        'border border-border-default/30',
        className
      )}
    >
      {/* Background glow */}
      <div className={cn(
        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'w-48 h-48 rounded-full blur-3xl opacity-30',
        config.glowColor
      )} />

      {/* Floating emojis */}
      <FloatingEmoji emoji="🎬" delay={0} duration={6} x="10%" y="20%" />
      <FloatingEmoji emoji="💡" delay={2} duration={5} x="85%" y="30%" />
      <FloatingEmoji emoji="🎥" delay={4} duration={7} x="15%" y="70%" />
      <FloatingEmoji emoji="✨" delay={1} duration={4} x="80%" y="65%" />

      {/* Illustration with glow */}
      <motion.div variants={itemVariants} className="relative mb-6">
        <div className={cn(
          'absolute inset-0 blur-2xl rounded-full scale-150',
          config.glowColor
        )} />
        <Illustration size={80} className="relative" />
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className={cn(
          'text-xl font-bold mb-2',
          'bg-gradient-to-r bg-clip-text text-transparent',
          config.gradient
        )}
      >
        {config.title}
      </motion.h3>

      {/* Rotating message */}
      <motion.div
        variants={itemVariants}
        className="h-6 overflow-hidden"
      >
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-text-muted"
        >
          {config.messages[messageIndex]}
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        variants={itemVariants}
        className="flex gap-1.5 mt-4"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className={cn('w-2 h-2 rounded-full bg-gradient-to-r', config.gradient)}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Decorative line */}
      <motion.div
        variants={itemVariants}
        className="mt-6 flex items-center gap-2 text-xs text-text-muted"
      >
        <span className="w-8 h-px bg-border-default" />
        <span>Check back in a moment</span>
        <span className="w-8 h-px bg-border-default" />
      </motion.div>
    </motion.div>
  );
}
