'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarPlus,
  faList,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { getBrowserClient } from '@/lib/supabase';
import { hasSchedulingAccess } from '@/config/pricing';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmModal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { StaggerContainer, StaggerItem, EASINGS, GlassCard } from '@/components/ui';
import {
  ScheduledPostCard,
  ScheduledPostCardSkeleton,
  ContentCalendar,
  ScheduleUpgradeCard,
  EmptyState,
  emptyStatePresets,
} from '@/components/composed';
import type { ScheduledPost } from '@/types/schedule';

// ============================================
// ANIMATION VARIANTS
// ============================================

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASINGS.easeOut,
    },
  },
};

const controlsVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2,
      duration: 0.4,
      ease: EASINGS.easeOut,
    },
  },
};

// ============================================
// TAB DEFINITIONS
// ============================================

const tabs = [
  { value: 'upcoming', label: 'Upcoming', statuses: ['pending', 'scheduled'] },
  { value: 'published', label: 'Published', statuses: ['published'] },
  { value: 'failed', label: 'Failed', statuses: ['failed'] },
  { value: 'all', label: 'All', statuses: undefined },
];

// ============================================
// SCHEDULE PAGE COMPONENT
// ============================================

export default function SchedulePage() {
  const router = useRouter();
  const { addToast } = useToast();

  // State
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>('free');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [cancelTarget, setCancelTarget] = useState<ScheduledPost | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Fetch posts and user tier
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      // Fetch in parallel: scheduled posts and credits (for tier)
      const [postsRes, creditsRes] = await Promise.all([
        fetch('/api/schedule', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        }),
        fetch('/api/credits/balance', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (!postsRes.ok) {
        if (postsRes.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch scheduled posts');
      }

      const postsData = await postsRes.json();
      setPosts(postsData.scheduledPosts || []);

      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        if (creditsData.success) {
          setUserTier(creditsData.data?.tier || 'free');
        }
      }
    } catch (err) {
      console.error('Error fetching schedule data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scheduled posts');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cancel a scheduled post
  const handleCancel = async () => {
    if (!cancelTarget) return;

    setIsCancelling(true);
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/schedule/${cancelTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel post');
      }

      // Update local state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === cancelTarget.id ? { ...p, status: 'cancelled' as const } : p
        )
      );

      addToast({
        variant: 'success',
        title: 'Post cancelled',
        description: 'The scheduled post has been cancelled.',
      });
    } catch (err) {
      console.error('Error cancelling post:', err);
      addToast({
        variant: 'error',
        title: err instanceof Error ? err.message : 'Failed to cancel post',
      });
    } finally {
      setIsCancelling(false);
      setCancelTarget(null);
    }
  };

  // Retry a failed post
  const handleRetry = async (post: ScheduledPost) => {
    setIsRetrying(true);
    try {
      const supabase = getBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      // Re-create the schedule by calling POST with the same data
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          generationId: post.generationId,
          videoUrl: post.videoUrl,
          caption: post.caption,
          platforms: post.platforms,
          scheduledFor: post.scheduledFor,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to retry post');
      }

      // Add the new post to the list
      setPosts((prev) => [data.scheduledPost, ...prev]);

      addToast({
        variant: 'success',
        title: 'Post rescheduled',
        description: 'A new scheduled post has been created.',
      });
    } catch (err) {
      console.error('Error retrying post:', err);
      addToast({
        variant: 'error',
        title: err instanceof Error ? err.message : 'Failed to retry post',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Filter posts by status
  const filterPosts = (statuses?: string[]): ScheduledPost[] => {
    if (!statuses) return posts;
    return posts.filter((p) => statuses.includes(p.status));
  };

  // Check if user has scheduling access
  const hasAccess = hasSchedulingAccess(userTier);

  // Render post list or empty state
  const renderPostList = (filteredPosts: ScheduledPost[], tabValue: string) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <ScheduledPostCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-status-error mb-4">{error}</p>
          <Button variant="secondary" onClick={fetchData}>
            Try Again
          </Button>
        </div>
      );
    }

    if (filteredPosts.length === 0) {
      const emptyMessages: Record<string, { title: string; description: string }> = {
        upcoming: {
          title: 'No upcoming posts',
          description: 'Schedule a video to see it here.',
        },
        published: {
          title: 'No published posts yet',
          description: 'Posts will appear here after they\'ve been published.',
        },
        failed: {
          title: 'No failed posts',
          description: 'That\'s good news! All your posts are on track.',
        },
        all: {
          title: 'No scheduled posts',
          description: 'Create your first scheduled post to get started.',
        },
      };

      const message = emptyMessages[tabValue] || emptyMessages.all;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <EmptyState
            title={message.title}
            description={message.description}
            illustration="spotlight"
            size="md"
            action={
              tabValue === 'all' || tabValue === 'upcoming'
                ? {
                    label: 'Go to Projects',
                    href: '/projects',
                    icon: <FontAwesomeIcon icon={faCalendarPlus} className="w-4 h-4" />,
                  }
                : undefined
            }
          />
        </motion.div>
      );
    }

    return (
      <StaggerContainer className="space-y-4" staggerDelay={0.08} initialDelay={0.1}>
        {filteredPosts.map((post) => (
          <StaggerItem key={post.id}>
            <ScheduledPostCard
              post={post}
              onCancel={(p) => setCancelTarget(p)}
              onRetry={handleRetry}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Scheduled Posts</h1>
            <p className="text-text-muted mt-1">
              Manage your social media content calendar
            </p>
          </div>
          <Link href="/projects">
            <Button>
              <FontAwesomeIcon icon={faCalendarPlus} className="w-4 h-4 mr-2" />
              Schedule a Video
            </Button>
          </Link>
        </motion.div>

        {/* Show upgrade card if user doesn't have access */}
        {!hasAccess && !isLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <ScheduleUpgradeCard variant="full" />
          </motion.div>
        ) : (
          <>
            {/* View Toggle & Controls */}
            <motion.div
              variants={controlsVariants}
              initial="hidden"
              animate="visible"
            >
              <GlassCard padding="sm" className="flex items-center justify-between">
                <div className="text-sm text-text-muted">
                  {posts.length} total post{posts.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <FontAwesomeIcon icon={faList} className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: EASINGS.easeOut }}
            >
              {viewMode === 'calendar' ? (
                <ContentCalendar
                  posts={posts}
                  onCancel={(p) => setCancelTarget(p)}
                  onRetry={handleRetry}
                />
              ) : (
                <Tabs defaultValue="upcoming">
                  <TabsList>
                    {tabs.map((tab) => {
                      const count = filterPosts(tab.statuses).length;
                      return (
                        <TabsTrigger key={tab.value} value={tab.value}>
                          {tab.label} ({isLoading ? '...' : count})
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {tabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                      {renderPostList(filterPosts(tab.statuses), tab.value)}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Scheduled Post"
        description="Are you sure you want to cancel this scheduled post? This action cannot be undone."
        confirmText="Cancel Post"
        cancelText="Keep It"
        variant="destructive"
        isLoading={isCancelling}
      />
    </DashboardLayout>
  );
}
