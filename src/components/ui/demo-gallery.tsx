'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Play, TrendingUp, Users, DollarSign, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Demo video data - showcasing different use cases
// To add your own videos: place MP4 files in public/videos/ and update videoSrc paths
const demoVideos = [
  {
    id: 1,
    title: 'Beauty Product Review',
    category: 'Skincare',
    videoSrc: '/videos/demo-1-beauty.mp4', // Add your video here
    fallbackGradient: 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
    duration: '0:32',
    views: '2.4M',
    engagement: '+312%',
  },
  {
    id: 2,
    title: 'Tech Gadget Unboxing',
    category: 'Electronics',
    videoSrc: '/videos/demo-2-tech.mp4',
    fallbackGradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    duration: '0:45',
    views: '1.8M',
    engagement: '+287%',
  },
  {
    id: 3,
    title: 'Fashion Try-On',
    category: 'Apparel',
    videoSrc: '/videos/demo-3-fashion.mp4',
    fallbackGradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
    duration: '0:28',
    views: '3.1M',
    engagement: '+445%',
  },
  {
    id: 4,
    title: 'Fitness Equipment Demo',
    category: 'Health',
    videoSrc: '/videos/demo-4-fitness.mp4',
    fallbackGradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    duration: '0:38',
    views: '1.2M',
    engagement: '+198%',
  },
  {
    id: 5,
    title: 'Kitchen Gadget Review',
    category: 'Home',
    videoSrc: '/videos/demo-5-kitchen.mp4',
    fallbackGradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
    duration: '0:41',
    views: '2.7M',
    engagement: '+356%',
  },
]

// Stats data
const stats = [
  { icon: TrendingUp, value: '3.1x', label: 'Average ROAS', color: 'text-status-success' },
  { icon: Users, value: '47%', label: 'More Engagement', color: 'text-electric-indigo' },
  { icon: DollarSign, value: '$2M+', label: 'In Ad Spend Saved', color: 'text-vibrant-fuchsia' },
  { icon: Zap, value: '5min', label: 'Average Creation Time', color: 'text-status-warning' },
]

export function DemoGallery({ className }: { className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const controls = useAnimationControls()

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused) return

    const scroll = scrollRef.current
    if (!scroll) return

    let animationId: number
    let startTime: number | null = null
    const scrollSpeed = 0.5 // pixels per frame

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp

      if (scroll) {
        scroll.scrollLeft += scrollSpeed

        // Reset to start when reaching the end (infinite loop)
        if (scroll.scrollLeft >= scroll.scrollWidth - scroll.clientWidth) {
          scroll.scrollLeft = 0
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [isPaused])

  return (
    <div className={cn('w-full', className)}>
      {/* Section Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric-indigo/10 border border-electric-indigo/20 mb-6"
        >
          <Play className="w-4 h-4 text-electric-indigo" />
          <span className="text-sm font-medium text-electric-indigo">Real Results</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          Videos that <span className="gradient-text">actually convert</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-text-muted text-lg max-w-2xl mx-auto"
        >
          See real examples of AI-generated UGC videos driving millions of views
        </motion.p>
      </div>

      {/* Horizontal Scroll Gallery */}
      <div className="relative">
        {/* Gradient Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-deep-space to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-deep-space to-transparent z-10 pointer-events-none" />

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Double the videos for seamless loop effect */}
          {[...demoVideos, ...demoVideos].map((video, index) => (
            <VideoCard
              key={`${video.id}-${index}`}
              video={video}
              isHovered={hoveredCard === index}
              onHover={() => setHoveredCard(index)}
              onLeave={() => setHoveredCard(null)}
            />
          ))}
        </div>

      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto px-4"
      >
        {stats.map((stat, index) => (
          <StatItem key={stat.label} stat={stat} index={index} />
        ))}
      </motion.div>
    </div>
  )
}

// Video Card Component with real video support
function VideoCard({
  video,
  isHovered,
  onHover,
  onLeave,
}: {
  video: typeof demoVideos[0]
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasVideo, setHasVideo] = useState(true)

  // Play/pause video on hover
  useEffect(() => {
    if (!videoRef.current) return

    if (isHovered) {
      videoRef.current.play().catch(() => {
        // Video file might not exist, use fallback
        setHasVideo(false)
      })
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [isHovered])

  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="flex-shrink-0 group cursor-pointer"
      whileHover={{ scale: 1.05, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Glassmorphic Card */}
      <div
        className={cn(
          'relative w-[280px] md:w-[320px] rounded-2xl overflow-hidden',
          'bg-surface/50 backdrop-blur-xl',
          'border border-white/10',
          'transition-all duration-500',
          isHovered && 'shadow-glow-lg border-electric-indigo/30'
        )}
      >
        {/* Video Thumbnail */}
        <div className="relative aspect-[9/16] overflow-hidden">
          {/* Video Element (hidden if no video file) */}
          {hasVideo && video.videoSrc && (
            <video
              ref={videoRef}
              src={video.videoSrc}
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-10"
              onError={() => setHasVideo(false)}
            />
          )}

          {/* Fallback Gradient Background (shown when no video) */}
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              hasVideo && isHovered ? 'opacity-0' : 'opacity-100'
            )}
            style={{ background: video.fallbackGradient }}
          />

          {/* Animated Overlay Pattern */}
          <div className="absolute inset-0 bg-gradient-to-t from-deep-space/80 via-transparent to-transparent z-20" />

          {/* Play Button Overlay (only shown when no video) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isHovered && !hasVideo ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </motion.div>

          {/* Duration Badge */}
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-deep-space/80 backdrop-blur-sm rounded-md text-xs font-medium z-30">
            {video.duration}
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/20 z-30">
            {video.category}
          </div>
        </div>

        {/* Card Footer */}
        <div className="p-4">
          <h3 className="font-semibold text-text-primary mb-2 truncate">{video.title}</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{video.views} views</span>
            <span className="text-status-success font-medium">{video.engagement} engagement</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Stat Item Component with Counter Animation
function StatItem({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Extract numeric value for animation
  const numericValue = parseFloat(stat.value.replace(/[^0-9.]/g, ''))
  // Extract prefix (before number) and suffix (after number)
  const match = stat.value.match(/^([^0-9]*)([0-9.]+)(.*)$/)
  const prefix = match?.[1] || ''
  const suffix = match?.[3] || ''

  useEffect(() => {
    if (hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true)
          // Animate count
          const duration = 2000
          const steps = 60
          const increment = numericValue / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= numericValue) {
              setCount(numericValue)
              clearInterval(timer)
            } else {
              setCount(current)
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )

    const element = document.getElementById(`stat-${index}`)
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [hasAnimated, numericValue, index])

  return (
    <motion.div
      id={`stat-${index}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="text-center p-6 rounded-2xl bg-surface/50 border border-border-default hover:border-electric-indigo/30 transition-colors"
    >
      <stat.icon className={cn('w-8 h-8 mx-auto mb-3', stat.color)} />
      <div className="text-3xl md:text-4xl font-bold mb-1">
        {prefix}
        {stat.value.includes('.') ? count.toFixed(1) : Math.round(count)}
        {suffix}
      </div>
      <div className="text-text-muted text-sm">{stat.label}</div>
    </motion.div>
  )
}
