'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Instagram,
  Youtube,
  Music,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface ScheduleUpgradeCardProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const platforms = [
  { icon: Music, color: 'text-white', label: 'TikTok' }, // Using Music as TikTok-like icon
  { icon: Instagram, color: 'text-pink-400', label: 'Instagram' },
  { icon: Youtube, color: 'text-red-500', label: 'YouTube' },
];

export function ScheduleUpgradeCard({
  variant = 'full',
  className,
}: ScheduleUpgradeCardProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  // Compact variant - inline teaser
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-xl',
          'bg-gradient-to-r from-electric-indigo/10 via-vibrant-fuchsia/10 to-electric-indigo/10',
          'border border-electric-indigo/20',
          'p-4',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-indigo to-vibrant-fuchsia flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Schedule to Social</p>
              <p className="text-xs text-text-muted">Pro feature</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpgrade}
          >
            Unlock
          </Button>
        </div>
      </motion.div>
    );
  }

  // Full variant - rich teaser card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('relative', className)}
    >
      <Card className="relative overflow-hidden border-2 border-electric-indigo/30 bg-gradient-to-br from-surface via-surface to-electric-indigo/5">
        {/* Decorative gradient orb */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-electric-indigo/20 to-vibrant-fuchsia/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-indigo to-vibrant-fuchsia flex items-center justify-center shadow-lg shadow-electric-indigo/25"
                animate={{
                  boxShadow: [
                    '0 10px 15px -3px rgba(99, 102, 241, 0.25)',
                    '0 10px 20px -3px rgba(217, 70, 239, 0.3)',
                    '0 10px 15px -3px rgba(99, 102, 241, 0.25)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Calendar className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  Schedule to Social Media
                </h3>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-electric-indigo">
                  <Sparkles className="w-3 h-3" />
                  Pro Feature
                </span>
              </div>
            </div>
          </div>

          {/* Value Props */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="flex -space-x-1">
                {platforms.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-surface border border-border-default flex items-center justify-center"
                    >
                      <Icon className={cn('w-3 h-3', p.color)} />
                    </div>
                  );
                })}
              </div>
              <span>Post to TikTok, Instagram, YouTube & more</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-6 h-6 rounded-full bg-surface border border-border-default flex items-center justify-center">
                <Clock className="w-3 h-3 text-electric-indigo" />
              </div>
              <span>Schedule weeks in advance</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            className="w-full"
            onClick={handleUpgrade}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Upgrade to Pro — $59/mo
          </Button>

          <p className="text-center text-xs text-text-muted mt-3">
            Includes 200 credits + scheduling + all caption styles
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
