'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Share2, Sparkles, Clock, Play, Copy, Check, MessageSquare } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  PlatformsGrid,
  TestingRoadmap,
  MetricsTargets,
  AudienceSuggestions,
  HookPriority,
  OptimizationTips,
  QuickStats,
} from '@/components/blocks/strategy';
import { VisibilityToggle, VideoPlayer, ScheduleUpgradeCard } from '@/components/composed';
import { StrategyBrief, Generation, GenerationVideoWithUrls, VideoVisibility } from '@/types/generation';
import type { PlanType } from '@/types';

// ============================================
// STRATEGY PAGE COMPONENT
// ============================================

type GenerationWithVideos = Generation & { videos?: GenerationVideoWithUrls[] | null };

export default function StrategyPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<StrategyBrief | null>(null);
  const [generation, setGeneration] = useState<GenerationWithVideos | null>(null);
  const [visibility, setVisibility] = useState<VideoVisibility>('private');
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [userPlan, setUserPlan] = useState<PlanType>('free');
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);

  // Plans that include scheduling
  const canSchedule = ['pro', 'plus', 'agency'].includes(userPlan);

  const generationId = params.id as string;

  // Get video URLs
  const videoUrl = generation?.videos?.[0]?.videoUrl || null;
  const videoCaptionedUrl = generation?.videos?.[0]?.videoCaptionedUrl || null;
  // Show captioned version if toggle is on AND captioned URL exists
  const displayVideoUrl = showCaptions && videoCaptionedUrl ? videoCaptionedUrl : videoUrl;
  // Determine if we can toggle (both versions must exist)
  const canToggleCaptions = videoUrl && videoCaptionedUrl;

  useEffect(() => {
    const loadGeneration = async () => {
      setLoading(true);
      try {
        // Get auth token
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          router.push('/login');
          return;
        }

        // Fetch generation data
        const response = await fetch(`/api/generations/${generationId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          cache: 'no-store', // Ensure fresh data on every request
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch generation');
        }

        const data = await response.json();
        setGeneration(data.generation);
        setVisibility(data.generation.visibility || 'private');

        // Use strategy from generation if available
        if (data.generation.strategy_brief) {
          setStrategy(data.generation.strategy_brief);
        }
        // If no strategy_brief, strategy remains null and UI shows appropriate message

        // Fetch user plan
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .single();

        if (profile?.plan) {
          setUserPlan(profile.plan as PlanType);
        }
      } catch (error) {
        console.error('Failed to load generation:', error);
        // Strategy remains null, UI will show appropriate error state
      } finally {
        setLoading(false);
      }
    };

    loadGeneration();
  }, [generationId, router]);

  const handleVisibilityChange = async (newVisibility: VideoVisibility) => {
    if (!generation) return;

    setIsUpdatingVisibility(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(`/api/generations/${generationId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (response.ok) {
        setVisibility(newVisibility);
      }
    } catch (error) {
      console.error('Failed to update visibility:', error);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleDownload = () => {
    if (displayVideoUrl) {
      window.open(displayVideoUrl, '_blank');
    }
  };

  if (loading) {
    return <StrategyPageSkeleton />;
  }

  if (!strategy) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Strategy Not Available
          </h2>
          <p className="text-text-muted mb-4">
            This project doesn&apos;t have a strategy brief yet. Strategy briefs
            are only available for Concierge projects.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm border-b border-border-default">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <div className="h-6 w-px bg-border-default" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-text-primary">
                    Strategy Brief
                  </h1>
                  <Badge variant="purple" size="sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
                <p className="text-sm text-text-muted">
                  Your personalized ad strategy playbook
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                Share
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        {/* Video Preview & Info Section */}
        {generation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Video Preview */}
              <div className="lg:col-span-2 flex justify-center">
                <div className="w-full max-w-sm">
                  {/* Caption Toggle */}
                  {canToggleCaptions && (
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-sm text-text-muted">Show Captions</span>
                      <button
                        onClick={() => setShowCaptions(!showCaptions)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          showCaptions ? 'bg-mint' : 'bg-surface-raised'
                        }`}
                        aria-label={showCaptions ? 'Hide captions' : 'Show captions'}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            showCaptions ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                  <Card className="overflow-hidden bg-cream w-full">
                    <div className="aspect-[9/16] relative bg-black">
                      {displayVideoUrl ? (
                        <VideoPlayer
                          src={displayVideoUrl}
                          className="w-full h-full"
                          vertical
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface">
                          <div className="text-center">
                            <Play className="w-12 h-12 text-text-muted mx-auto mb-2" />
                            <p className="text-sm text-text-muted">Video not available</p>
                          </div>
                      </div>
                    )}
                  </div>
                  {/* Caption indicator */}
                  {canToggleCaptions && (
                    <div className="p-3 border-t border-border-default">
                      <Badge variant={showCaptions ? 'purple' : 'default'} size="sm">
                        {showCaptions ? 'With Captions' : 'Without Captions'}
                      </Badge>
                    </div>
                  )}
                </Card>
                </div>
              </div>

              {/* Info Panel */}
              <div className="lg:col-span-3 space-y-4">
                {/* Product Info */}
                <Card className="p-5">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {generation.product_name}
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge
                      variant={generation.mode === 'concierge' ? 'purple' : 'default'}
                      size="sm"
                    >
                      {generation.mode === 'concierge' ? 'Drop & Go' : 'Studio'}
                    </Badge>
                    <span className="text-sm text-text-muted">
                      {generation.videos?.[0]?.duration
                        ? `${Math.round(generation.videos[0].duration)}s`
                        : 'Video'}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleDownload}
                    disabled={!displayVideoUrl}
                  >
                    Download Video
                  </Button>
                </Card>

                {/* Visibility Toggle */}
                <Card className="p-5">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">
                    Video Visibility
                  </h4>
                  <VisibilityToggle
                    visibility={visibility}
                    onChange={handleVisibilityChange}
                    disabled={isUpdatingVisibility}
                  />
                  {visibility === 'public' && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-status-success mt-3"
                    >
                      Your video will appear in the Explore gallery for other users to discover.
                    </motion.p>
                  )}
                </Card>

                {/* Scheduling Teaser for non-Pro users */}
                {!canSchedule && (
                  <ScheduleUpgradeCard variant="full" />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        {strategy.quickStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <QuickStats stats={strategy.quickStats} />
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="platforms" className="space-y-8">
          <TabsList className="border-b border-border-default bg-transparent">
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="testing">Testing Plan</TabsTrigger>
            <TabsTrigger value="hooks">Hooks</TabsTrigger>
            <TabsTrigger value="audiences">Audiences</TabsTrigger>
            <TabsTrigger value="captions">Captions</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          {/* Platforms Tab */}
          <TabsContent value="platforms">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Platform Recommendations
                </h2>
                <p className="text-text-muted">
                  Based on your product and target audience, here&apos;s where
                  you should advertise
                </p>
              </div>
              <PlatformsGrid platforms={strategy.platforms} />
            </motion.div>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <TestingRoadmap phases={strategy.testingRoadmap} />
                </div>
                <div>
                  <MetricsTargets metrics={strategy.metrics} />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Hooks Tab */}
          <TabsContent value="hooks">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <HookPriority hooks={strategy.hookPriority} />
            </motion.div>
          </TabsContent>

          {/* Audiences Tab */}
          <TabsContent value="audiences">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AudienceSuggestions audiences={strategy.audiences} />
            </motion.div>
          </TabsContent>

          {/* Captions Tab */}
          <TabsContent value="captions">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Social Media Captions
                </h2>
                <p className="text-text-muted">
                  Ready-to-use captions optimized for each platform. Copy and paste when posting your video.
                </p>
              </div>

              {strategy.socialCaptions ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* TikTok Caption */}
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">TT</span>
                        </div>
                        <h4 className="font-semibold text-text-primary">TikTok</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const fullCaption = `${strategy.socialCaptions!.tiktok.text}\n\n${strategy.socialCaptions!.tiktok.hashtags.map(h => `#${h}`).join(' ')}`;
                          navigator.clipboard.writeText(fullCaption);
                          setCopiedCaption('tiktok');
                          setTimeout(() => setCopiedCaption(null), 2000);
                        }}
                      >
                        {copiedCaption === 'tiktok' ? (
                          <Check className="w-4 h-4 text-status-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-text-primary mb-3">
                      {strategy.socialCaptions.tiktok.text}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {strategy.socialCaptions.tiktok.hashtags.map((tag, i) => (
                        <Badge key={i} variant="default" size="sm">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </Card>

                  {/* Instagram Caption */}
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">IG</span>
                        </div>
                        <h4 className="font-semibold text-text-primary">Instagram</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const fullCaption = `${strategy.socialCaptions!.instagram.text}\n\n${strategy.socialCaptions!.instagram.hashtags.map(h => `#${h}`).join(' ')}`;
                          navigator.clipboard.writeText(fullCaption);
                          setCopiedCaption('instagram');
                          setTimeout(() => setCopiedCaption(null), 2000);
                        }}
                      >
                        {copiedCaption === 'instagram' ? (
                          <Check className="w-4 h-4 text-status-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-text-primary mb-3">
                      {strategy.socialCaptions.instagram.text}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {strategy.socialCaptions.instagram.hashtags.map((tag, i) => (
                        <Badge key={i} variant="default" size="sm">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </Card>

                  {/* YouTube Caption */}
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">YT</span>
                        </div>
                        <h4 className="font-semibold text-text-primary">YouTube</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const fullCaption = `${strategy.socialCaptions!.youtube.text}\n\n${strategy.socialCaptions!.youtube.hashtags.map(h => `#${h}`).join(' ')}`;
                          navigator.clipboard.writeText(fullCaption);
                          setCopiedCaption('youtube');
                          setTimeout(() => setCopiedCaption(null), 2000);
                        }}
                      >
                        {copiedCaption === 'youtube' ? (
                          <Check className="w-4 h-4 text-status-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-text-primary mb-3">
                      {strategy.socialCaptions.youtube.text}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {strategy.socialCaptions.youtube.hashtags.map((tag, i) => (
                        <Badge key={i} variant="default" size="sm">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    No Captions Available
                  </h3>
                  <p className="text-text-muted">
                    Social media captions will be generated with new videos.
                  </p>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <OptimizationTips tips={strategy.optimizationTips} />

              {/* Best Posting Times */}
              <Card className="mt-6 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-mint" />
                  <h4 className="text-base font-semibold text-text-primary">
                    Best Posting Times
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {strategy.bestPostingTimes.map((time, index) => (
                    <Badge key={index} variant="default" size="md">
                      {time}
                    </Badge>
                  ))}
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================
// SKELETON LOADER
// ============================================

function StrategyPageSkeleton() {
  return (
    <div className="min-h-screen pb-12">
      {/* Header Skeleton */}
      <div className="border-b border-border-default">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-8" />
              <div className="h-6 w-px bg-border-default" />
              <div>
                <Skeleton className="w-40 h-6 mb-1" />
                <Skeleton className="w-56 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-20 h-8" />
              <Skeleton className="w-28 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border-default mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-24 h-10" />
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}
