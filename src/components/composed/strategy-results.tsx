'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Calendar,
  Play,
  RotateCcw,
  Share2,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StrategyBrief, SocialPostCopy } from '@/types/generation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlatformsGrid } from '@/components/blocks/strategy/platform-card';
import { TestingRoadmap } from '@/components/blocks/strategy/testing-roadmap';
import { OptimizationTips, QuickStats } from '@/components/blocks/strategy/optimization-tips';
import { SocialCopyCard } from './social-copy-card';
import { ScheduleModal } from './schedule-modal';
import { ScheduleUpgradeCard } from './schedule-upgrade-card';

// Plans that include scheduling feature
const SCHEDULING_PLANS = ['pro', 'plus', 'agency'];

export interface StrategyResultsProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  strategy?: StrategyBrief;
  socialCopy?: SocialPostCopy;
  generationId?: string;
  userPlan?: 'free' | 'starter' | 'pro' | 'plus' | 'agency';
  onDownload?: () => void;
  onSchedule?: () => void;
  onCreateAnother?: () => void;
  onRegenerateSocialCopy?: () => void;
  className?: string;
}

export function StrategyResults({
  videoUrl,
  thumbnailUrl,
  strategy,
  socialCopy,
  generationId,
  userPlan = 'free',
  onDownload,
  onSchedule,
  onCreateAnother,
  onRegenerateSocialCopy,
  className,
}: StrategyResultsProps) {
  const canSchedule = SCHEDULING_PLANS.includes(userPlan);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleScheduleClick = () => {
    setShowScheduleModal(true);
    onSchedule?.();
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-status-success/20 to-status-success/5 mb-4">
          <CheckCircle2 className="w-8 h-8 text-status-success" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Your Video is Ready!
        </h1>
        <p className="text-text-muted">
          Download your video and follow the strategy guide below to maximize results
        </p>
      </motion.div>

      {/* Video Player Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-surface border border-border-default">
          <div className="aspect-[9/16] max-w-sm mx-auto bg-cream rounded-xl overflow-hidden relative">
            {videoUrl ? (
              <>
                <video
                  src={videoUrl}
                  poster={thumbnailUrl}
                  controls={isPlaying}
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {!isPlaying && (
                  <button
                    onClick={() => {
                      const video = document.querySelector('video');
                      video?.play();
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-cream ml-1" />
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                <Play className="w-12 h-12 mb-3" />
                <p className="text-sm">Video preview</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 max-w-sm mx-auto">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={onDownload}
            >
              <Download className="w-5 h-5 mr-2" />
              Download Video
            </Button>
            {canSchedule ? (
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={handleScheduleClick}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule
              </Button>
            ) : null}
          </div>

          {/* Schedule Upgrade Card for non-Pro users */}
          {!canSchedule && (
            <div className="mt-4 max-w-sm mx-auto">
              <ScheduleUpgradeCard variant="compact" />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Quick Stats - only show if strategy exists */}
      {strategy?.quickStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <QuickStats stats={strategy.quickStats} />
        </motion.div>
      )}

      {/* Strategy Tabs - only show if strategy exists */}
      {strategy && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-surface border border-border-default">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mint to-mint-dark flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  AI Strategy Guide
                </h2>
                <p className="text-sm text-text-muted">
                  Personalized recommendations for your video
                </p>
              </div>
              <Badge variant="purple" size="sm" className="ml-auto">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Generated
              </Badge>
            </div>

            <Tabs defaultValue="platforms">
              <TabsList className="mb-6">
                <TabsTrigger value="platforms">Where to Post</TabsTrigger>
                <TabsTrigger value="testing">Testing Plan</TabsTrigger>
                <TabsTrigger value="timing">When to Post</TabsTrigger>
                <TabsTrigger value="tips">Optimization</TabsTrigger>
              </TabsList>

              <TabsContent value="platforms">
                <PlatformsGrid platforms={strategy.platforms} />
              </TabsContent>

              <TabsContent value="testing">
                <TestingRoadmap phases={strategy.testingRoadmap} />
              </TabsContent>

              <TabsContent value="timing">
                <BestPostingTimes times={strategy.bestPostingTimes} />
              </TabsContent>

              <TabsContent value="tips">
                <OptimizationTips tips={strategy.optimizationTips} />
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      )}

      {/* Social Post Copy - only show if socialCopy exists */}
      {socialCopy && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SocialCopyCard
            socialCopy={socialCopy}
            onRegenerate={onRegenerateSocialCopy}
          />
        </motion.div>
      )}

      {/* Create Another CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-4"
      >
        <Button
          variant="ghost"
          size="lg"
          onClick={onCreateAnother}
          className="group"
        >
          <RotateCcw className="w-5 h-5 mr-2 group-hover:rotate-[-360deg] transition-transform duration-500" />
          Create Another Video
          <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        videoUrl={videoUrl || ''}
        defaultCaption={socialCopy?.text || ''}
        generationId={generationId}
        onScheduled={(id) => {
          console.log('Scheduled post created:', id);
        }}
      />
    </div>
  );
}

// ============================================
// BEST POSTING TIMES COMPONENT
// ============================================

interface BestPostingTimesProps {
  times: string[];
  className?: string;
}

function BestPostingTimes({ times, className }: BestPostingTimesProps) {
  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Best Times to Post
        </h3>
        <p className="text-sm text-text-muted mt-1">
          Maximize engagement by posting when your audience is most active
        </p>
      </div>

      <div className="space-y-3">
        {times.map((time, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 hover:border-mint/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-mint/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-mint" />
                </div>
                <p className="text-text-primary">{time}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 rounded-lg bg-coral/10 border border-coral/20"
      >
        <p className="text-sm text-text-primary">
          <span className="font-semibold text-coral">Tip:</span>{' '}
          Consistency matters more than perfect timing. Pick a schedule you can
          stick to and post at least 3-5 times per week.
        </p>
      </motion.div>
    </div>
  );
}

// Skeleton loader
export function StrategyResultsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-surface-raised animate-pulse mx-auto mb-4" />
        <div className="h-8 w-64 bg-surface-raised rounded animate-pulse mx-auto mb-2" />
        <div className="h-4 w-96 bg-surface-raised rounded animate-pulse mx-auto" />
      </div>

      {/* Video skeleton */}
      <Card className="p-6">
        <div className="aspect-[9/16] max-w-sm mx-auto bg-surface-raised rounded-xl animate-pulse" />
        <div className="flex gap-3 mt-6 max-w-sm mx-auto">
          <div className="h-12 flex-1 bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-12 flex-1 bg-surface-raised rounded-lg animate-pulse" />
        </div>
      </Card>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-5 w-5 bg-surface-raised rounded mx-auto mb-2 animate-pulse" />
            <div className="h-6 w-16 bg-surface-raised rounded mx-auto mb-1 animate-pulse" />
            <div className="h-3 w-12 bg-surface-raised rounded mx-auto animate-pulse" />
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <Card className="p-6">
        <div className="flex gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-surface-raised animate-pulse" />
          <div className="space-y-1">
            <div className="h-5 w-32 bg-surface-raised rounded animate-pulse" />
            <div className="h-3 w-48 bg-surface-raised rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-28 bg-surface-raised rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-surface-raised rounded-lg animate-pulse" />
      </Card>
    </div>
  );
}
