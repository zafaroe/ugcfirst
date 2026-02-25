'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faGlobe, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StaggerContainer, StaggerItem, EASINGS, GlassCard } from '@/components/ui'
import { EmptyState, emptyStatePresets, VideoPlayer } from '@/components/composed'
import { formatRelativeTime } from '@/lib/utils'

interface PublicVideo {
  id: string
  product_name: string
  mode: 'diy' | 'concierge'
  created_at: string
  thumbnail: string | null
  videoUrl: string | null
  duration: number
}

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

export default function ExplorePage() {
  const [videos, setVideos] = useState<PublicVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<PublicVideo | null>(null)

  const fetchVideos = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset === 0) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)

      const response = await fetch(`/api/public/videos?limit=12&offset=${offset}`)

      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }

      const data = await response.json()

      if (append) {
        setVideos(prev => [...prev, ...data.videos])
      } else {
        setVideos(data.videos || [])
      }
      setHasMore(data.pagination?.hasMore || false)
    } catch (err) {
      console.error('Error fetching public videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleLoadMore = () => {
    fetchVideos(videos.length, true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="text-center md:text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-mint to-mint-dark flex items-center justify-center">
              <FontAwesomeIcon icon={faGlobe} className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary">Explore</h1>
          </div>
          <p className="text-text-muted">
            Discover videos created by the UGCFirst community
          </p>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-status-error mb-4">{error}</p>
            <Button variant="secondary" onClick={() => fetchVideos()}>
              Try Again
            </Button>
          </div>
        ) : videos.length === 0 ? (
          <EmptyState
            illustration="film-reel"
            title="No public videos yet"
            description="Be the first to share your creation with the community!"
            size="lg"
            action={{
              label: 'Create a Video',
              href: '/create/diy',
            }}
          />
        ) : (
          <>
            <StaggerContainer
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              staggerDelay={0.08}
              initialDelay={0.1}
            >
              {videos.map((video) => (
                <StaggerItem key={video.id}>
                  <PublicVideoCard
                    video={video}
                    onClick={() => setSelectedVideo(video)}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Video Player Modal */}
        <AnimatePresence>
          {selectedVideo && (
            <VideoModal
              video={selectedVideo}
              onClose={() => setSelectedVideo(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}

interface PublicVideoCardProps {
  video: PublicVideo
  onClick: () => void
}

function PublicVideoCard({ video, onClick }: PublicVideoCardProps) {
  return (
    <Card
      padding="none"
      hoverable
      className="overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-cream overflow-hidden">
        {video.thumbnail ? (
          <motion.img
            src={video.thumbnail}
            alt={video.product_name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-cream">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              <FontAwesomeIcon icon={faPlay} className="w-5 h-5 text-text-muted" />
            </div>
          </div>
        )}

        {/* Play overlay on hover */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-14 h-14 rounded-full bg-gradient-to-r from-mint to-mint-dark flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FontAwesomeIcon icon={faPlay} className="w-6 h-6 text-white ml-1" />
          </motion.div>
        </motion.div>

        {/* Duration badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">
            {Math.round(video.duration)}s
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-text-primary truncate">{video.product_name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-text-muted" suppressHydrationWarning>
            {formatRelativeTime(video.created_at)}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              video.mode === 'concierge'
                ? 'bg-coral/20 text-coral'
                : 'bg-mint/20 text-mint'
            }`}
          >
            {video.mode === 'concierge' ? 'Drop & Go' : 'Studio'}
          </span>
        </div>
      </div>
    </Card>
  )
}

function VideoCardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <motion.div
        className="aspect-video bg-cream"
        animate={{
          background: [
            'linear-gradient(90deg, #0C0A09 0%, #FAFAF9 50%, #0C0A09 100%)',
            'linear-gradient(90deg, #FAFAF9 0%, #0C0A09 50%, #FAFAF9 100%)',
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="p-4 space-y-3">
        <motion.div
          className="h-5 bg-cream rounded w-3/4"
          animate={{
            background: [
              'linear-gradient(90deg, #0C0A09 0%, #FAFAF9 50%, #0C0A09 100%)',
              'linear-gradient(90deg, #FAFAF9 0%, #0C0A09 50%, #FAFAF9 100%)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 0.2,
          }}
        />
        <motion.div
          className="h-4 bg-cream rounded w-1/2"
          animate={{
            background: [
              'linear-gradient(90deg, #0C0A09 0%, #FAFAF9 50%, #0C0A09 100%)',
              'linear-gradient(90deg, #FAFAF9 0%, #0C0A09 50%, #FAFAF9 100%)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 0.4,
          }}
        />
      </div>
    </Card>
  )
}

interface VideoModalProps {
  video: PublicVideo
  onClose: () => void
}

function VideoModal({ video, onClose }: VideoModalProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <GlassCard className="w-full max-w-4xl max-h-full overflow-hidden">
          <div className="p-4 border-b border-border-default flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">{video.product_name}</h3>
              <p className="text-sm text-text-muted" suppressHydrationWarning>
                Created {formatRelativeTime(video.created_at)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="p-4">
            {video.videoUrl ? (
              <VideoPlayer
                src={video.videoUrl}
                className="w-full aspect-video rounded-lg overflow-hidden"
              />
            ) : (
              <div className="aspect-video bg-cream rounded-lg flex items-center justify-center">
                <p className="text-text-muted">Video not available</p>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </>
  )
}
