'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faVideo, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { getBrowserClient } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { ConfirmModal, Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import {
  StaggerContainer,
  StaggerItem,
  EASINGS,
} from '@/components/ui'
import {
  ModeSelectionCard,
  GenerationCard,
  GenerationCardSkeleton,
  EmptyState,
  emptyStatePresets,
  VideoPreviewModal,
  VisibilityToggle,
  ScheduleModal,
  ScheduledPostCardCompact,
} from '@/components/composed'
import { hasSchedulingAccess } from '@/config/pricing'
import type { ScheduledPost } from '@/types/schedule'
import type { Generation, GenerationVideoWithUrls, VideoVisibility } from '@/types/generation'

// Animation variants
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
}

type GenerationWithVideos = Generation & { videos?: GenerationVideoWithUrls[] | null }

export default function DashboardPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [generations, setGenerations] = useState<GenerationWithVideos[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Generation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [visibilityTarget, setVisibilityTarget] = useState<GenerationWithVideos | null>(null)
  const [previewGeneration, setPreviewGeneration] = useState<GenerationWithVideos | null>(null)
  const [scheduleGeneration, setScheduleGeneration] = useState<GenerationWithVideos | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [upcomingPosts, setUpcomingPosts] = useState<ScheduledPost[]>([])

  useEffect(() => {
    async function fetchGenerations() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.access_token) {
          router.push('/login')
          return
        }

        // Fetch generations, credits, and scheduled posts in parallel
        const [response, creditsRes, scheduleRes] = await Promise.all([
          fetch('/api/generations?limit=4', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
            cache: 'no-store',
          }),
          fetch('/api/credits/balance', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          }),
          fetch('/api/schedule?status=pending&status=scheduled&limit=3', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          }),
        ])

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch generations')
        }

        const data = await response.json()
        setGenerations(data.generations || [])

        // Get user plan from credits
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json()
          if (creditsData.success) {
            setUserPlan(creditsData.data?.tier || 'free')
          }
        }

        // Get upcoming scheduled posts
        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json()
          if (scheduleData.success) {
            // Filter to only upcoming posts (pending or scheduled)
            const upcoming = (scheduleData.scheduledPosts || []).filter(
              (p: ScheduledPost) => ['pending', 'scheduled'].includes(p.status)
            )
            setUpcomingPosts(upcoming.slice(0, 3))
          }
        }
      } catch (err) {
        console.error('Error fetching generations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load videos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGenerations()
  }, [router])

  const handleView = (generation: Generation) => {
    setPreviewGeneration(generation as GenerationWithVideos)
  }

  const handleDownload = (generation: Generation) => {
    const gen = generation as GenerationWithVideos
    const videoUrl = gen.videos?.[0]?.videoSubtitledUrl || gen.videos?.[0]?.videoUrl
    if (videoUrl) {
      window.open(videoUrl, '_blank')
    }
  }

  const handleDelete = (generation: Generation) => {
    setDeleteTarget(generation)
  }

  const handleVisibilityChange = (generation: Generation) => {
    setVisibilityTarget(generation as GenerationWithVideos)
  }

  const updateVisibility = async (newVisibility: VideoVisibility) => {
    if (!visibilityTarget) return

    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/generations/${visibilityTarget.id}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility: newVisibility }),
      })

      if (response.ok) {
        const data = await response.json()
        setGenerations(prev =>
          prev.map(g => g.id === visibilityTarget.id
            ? { ...g, visibility: newVisibility, share_token: data.data?.share_token || g.share_token }
            : g
          )
        )
        addToast({ variant: 'success', title: `Video set to ${newVisibility}` })
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update visibility')
      }
    } catch (err) {
      addToast({
        variant: 'error',
        title: err instanceof Error ? err.message : 'Failed to update visibility',
      })
    } finally {
      setVisibilityTarget(null)
    }
  }

  const updateVisibilityFromModal = async (generationId: string, newVisibility: VideoVisibility) => {
    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/generations/${generationId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility: newVisibility }),
      })

      if (response.ok) {
        const data = await response.json()
        setGenerations(prev =>
          prev.map(g => g.id === generationId
            ? { ...g, visibility: newVisibility, share_token: data.data?.share_token || g.share_token }
            : g
          )
        )
        setPreviewGeneration(prev =>
          prev && prev.id === generationId
            ? { ...prev, visibility: newVisibility, share_token: data.data?.share_token || prev.share_token }
            : prev
        )
        addToast({ variant: 'success', title: `Video set to ${newVisibility}` })
      }
    } catch (err) {
      addToast({ variant: 'error', title: 'Failed to update visibility' })
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/generations/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete video')
      }

      setGenerations((prev) => prev.filter((g) => g.id !== deleteTarget.id))
      addToast({
        variant: 'success',
        title: 'Video deleted successfully',
      })
    } catch (err) {
      console.error('Error deleting generation:', err)
      addToast({
        variant: 'error',
        title: err instanceof Error ? err.message : 'Failed to delete video',
      })
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const hasGenerations = generations.length > 0

  return (
    <DashboardLayout>
      <div className="relative z-10 space-y-10">
        {/* Header Section - Clean and focused */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
            Create Your Next{' '}
            <span className="gradient-text">Video</span>
          </h1>
          <p className="text-text-muted text-base md:text-lg max-w-lg">
            Choose your generation mode to get started.
          </p>
        </motion.div>

        {/* Mode Selection Cards - 3-column grid */}
        <StaggerContainer className="grid md:grid-cols-3 gap-6" staggerDelay={0.1} initialDelay={0.2}>
          <StaggerItem>
            <ModeSelectionCard mode="diy" />
          </StaggerItem>
          <StaggerItem>
            <ModeSelectionCard mode="concierge" />
          </StaggerItem>
          <StaggerItem>
            <ModeSelectionCard mode="spotlight" />
          </StaggerItem>
        </StaggerContainer>

        {/* Subtle divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />

        {/* Upcoming Scheduled Posts (Pro+ only) */}
        {hasSchedulingAccess(userPlan) && upcomingPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4, ease: EASINGS.easeOut }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Upcoming Posts</h2>
              <Link href="/schedule">
                <Button variant="ghost" size="sm">
                  View All
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingPosts.map((post) => (
                <ScheduledPostCardCompact
                  key={post.id}
                  post={post}
                  onClick={() => router.push('/schedule')}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Subtle divider */}
        {hasSchedulingAccess(userPlan) && upcomingPosts.length > 0 && (
          <div className="h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />
        )}

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: EASINGS.easeOut }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-text-primary">Recent Activity</h2>
            {hasGenerations && (
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  View All
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <GenerationCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-status-error mb-4">{error}</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : hasGenerations ? (
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={0.1} initialDelay={0.1}>
              {generations.map((generation) => (
                <StaggerItem key={generation.id}>
                  <GenerationCard
                    generation={generation}
                    onView={handleView}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onVisibilityChange={handleVisibilityChange}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <EnhancedEmptyState />
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Video"
        description={`Are you sure you want to delete "${deleteTarget?.product_name || 'this video'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />

      {/* Visibility Change Modal */}
      <Modal
        isOpen={!!visibilityTarget}
        onClose={() => setVisibilityTarget(null)}
        title="Video Visibility"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Choose who can see &ldquo;{visibilityTarget?.product_name}&rdquo;
          </p>
          <VisibilityToggle
            visibility={visibilityTarget?.visibility || 'private'}
            onChange={updateVisibility}
            showUnlisted
            shareToken={visibilityTarget?.share_token}
          />
        </div>
      </Modal>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        generation={previewGeneration}
        isOpen={!!previewGeneration}
        onClose={() => setPreviewGeneration(null)}
        onVisibilityChange={updateVisibilityFromModal}
        onDownload={handleDownload}
        onSchedule={(gen) => {
          setPreviewGeneration(null)
          setScheduleGeneration(gen as GenerationWithVideos)
        }}
        userPlan={userPlan}
      />

      {/* Schedule Modal */}
      {scheduleGeneration && (
        <ScheduleModal
          isOpen={!!scheduleGeneration}
          onClose={() => setScheduleGeneration(null)}
          videoUrl={scheduleGeneration.videos?.[0]?.videoSubtitledUrl || scheduleGeneration.videos?.[0]?.videoUrl || ''}
          generationId={scheduleGeneration.id}
          onScheduled={() => {
            setScheduleGeneration(null)
            addToast({ variant: 'success', title: 'Post scheduled!' })
          }}
        />
      )}
    </DashboardLayout>
  )
}

// Simple Empty State
function EnhancedEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="py-12"
    >
      <EmptyState
        {...emptyStatePresets.noProjects}
        size="md"
        action={{
          label: 'Create Your First Video',
          href: '/create/diy',
          icon: <FontAwesomeIcon icon={faVideo} className="w-4 h-4" />,
        }}
      />
    </motion.div>
  )
}
