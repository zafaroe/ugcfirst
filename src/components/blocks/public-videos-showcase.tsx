'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faArrowRight, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GlassCard, EASINGS } from '@/components/ui'
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

interface PublicVideosShowcaseProps {
  limit?: number
  className?: string
}

export function PublicVideosShowcase({ limit = 6, className }: PublicVideosShowcaseProps) {
  const [videos, setVideos] = useState<PublicVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    async function fetchVideos() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/public/videos?limit=${limit}`)

        if (!response.ok) {
          throw new Error('Failed to fetch videos')
        }

        const data = await response.json()
        setVideos(data.videos || [])
      } catch (err) {
        console.error('Error fetching public videos:', err)
        setError(err instanceof Error ? err.message : 'Failed to load videos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [limit])

  // Check scroll position for arrow visibility
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
      }
    }

    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      return () => el.removeEventListener('scroll', checkScroll)
    }
  }, [videos])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320 // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Don't render if no videos or error
  if (error || (!isLoading && videos.length === 0)) {
    return null
  }

  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASINGS.easeOut }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              Created with <span className="gradient-text">UGCFirst</span>
            </h2>
            <p className="text-text-muted mt-2">
              See what our community is creating
            </p>
          </div>
          <Link href="/explore" className="hidden sm:block">
            <Button variant="ghost">
              View All
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Video Carousel */}
        <div className="relative">
          {/* Scroll Arrows */}
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-surface/90 backdrop-blur border border-border-default flex items-center justify-center text-text-primary hover:bg-surface transition-colors shadow-lg"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
            </motion.button>
          )}
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-surface/90 backdrop-blur border border-border-default flex items-center justify-center text-text-primary hover:bg-surface transition-colors shadow-lg"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
            </motion.button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoading
              ? // Skeleton loaders
                Array.from({ length: limit }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[300px] snap-start">
                    <ShowcaseCardSkeleton />
                  </div>
                ))
              : videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    className="flex-shrink-0 w-[300px] snap-start"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4, ease: EASINGS.easeOut }}
                  >
                    <ShowcaseCard video={video} />
                  </motion.div>
                ))}
          </div>
        </div>

        {/* Mobile View All Link */}
        <div className="mt-6 text-center sm:hidden">
          <Link href="/explore">
            <Button variant="secondary">
              Explore All Videos
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

interface ShowcaseCardProps {
  video: PublicVideo
}

function ShowcaseCard({ video }: ShowcaseCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <GlassCard
      className="overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {video.thumbnail ? (
          <motion.img
            src={video.thumbnail}
            alt={video.product_name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-cream">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              <FontAwesomeIcon icon={faPlay} className="w-5 h-5 text-text-muted" />
            </div>
          </div>
        )}

        {/* Play overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-r from-mint to-mint-dark flex items-center justify-center"
            animate={{ scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <FontAwesomeIcon icon={faPlay} className="w-5 h-5 text-white ml-0.5" />
          </motion.div>
        </motion.div>

        {/* Duration badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
            {Math.round(video.duration)}s
          </div>
        )}

        {/* Mode badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              video.mode === 'concierge'
                ? 'bg-coral/90 text-white'
                : 'bg-mint/90 text-white'
            }`}
          >
            {video.mode === 'concierge' ? 'Drop & Go' : 'Studio'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-medium text-text-primary text-sm truncate">{video.product_name}</h4>
        <p className="text-xs text-text-muted mt-1" suppressHydrationWarning>
          {formatRelativeTime(video.created_at)}
        </p>
      </div>
    </GlassCard>
  )
}

function ShowcaseCardSkeleton() {
  return (
    <GlassCard className="overflow-hidden">
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
      <div className="p-3 space-y-2">
        <motion.div
          className="h-4 bg-cream rounded w-3/4"
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
          className="h-3 bg-cream rounded w-1/2"
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
    </GlassCard>
  )
}

export default PublicVideosShowcase
