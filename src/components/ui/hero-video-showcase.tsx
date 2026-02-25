'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Play, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// Video card data - Add your videos in public/videos/hero/
const videoCards = [
  {
    id: 1,
    title: 'Skincare Ad',
    videoSrc: '/videos/hero/skincare-ad.mp4', // Add your video here
    fallbackGradient: 'from-pink-500 via-rose-400 to-pink-600',
    position: { x: -180, y: -80 },
    rotation: -12,
    scale: 0.85,
    delay: 0,
    zIndex: 1,
  },
  {
    id: 2,
    title: 'Tech Review',
    videoSrc: '/videos/hero/tech-review.mp4',
    fallbackGradient: 'from-violet-500 via-purple-500 to-indigo-500',
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: 1,
    delay: 0.1,
    zIndex: 3,
  },
  {
    id: 3,
    title: 'Bottle Review',
    videoSrc: '/videos/hero/bottle-review.mp4',
    fallbackGradient: 'from-cyan-400 via-blue-500 to-indigo-500',
    position: { x: 180, y: -60 },
    rotation: 8,
    scale: 0.9,
    delay: 0.2,
    zIndex: 2,
  },
]

export function HeroVideoShowcase({ className }: { className?: string }) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Mouse parallax effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 150 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window

      // Normalize to -0.5 to 0.5 range
      const x = (clientX / innerWidth - 0.5) * 2
      const y = (clientY / innerHeight - 0.5) * 2

      mouseX.set(x * 15)
      mouseY.set(y * 15)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div className={cn('relative w-full h-[400px] md:h-[500px]', className)}>
      {/* Glow background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-mint/15 rounded-full blur-[100px]" />
      </div>

      {/* Floating sparkles */}
      <FloatingSparkles />

      {/* Video cards */}
      <div className="absolute inset-0 flex items-center justify-center">
        {videoCards.map((card) => (
          <VideoCard
            key={card.id}
            card={card}
            isHovered={hoveredCard === card.id}
            onHover={() => setHoveredCard(card.id)}
            onLeave={() => setHoveredCard(null)}
            mouseX={smoothMouseX}
            mouseY={smoothMouseY}
          />
        ))}
      </div>

      {/* "AI Generated" badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-surface/80 backdrop-blur-sm rounded-full border border-border-default"
      >
        <Sparkles className="w-4 h-4 text-mint" />
        <span className="text-sm text-text-muted">100% AI Generated</span>
      </motion.div>
    </div>
  )
}

// Individual video card component with video support
function VideoCard({
  card,
  isHovered,
  onHover,
  onLeave,
  mouseX,
  mouseY,
}: {
  card: typeof videoCards[0]
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  mouseX: ReturnType<typeof useSpring>
  mouseY: ReturnType<typeof useSpring>
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasVideo, setHasVideo] = useState(true)

  // Play/pause video on hover
  useEffect(() => {
    if (!videoRef.current) return

    if (isHovered) {
      videoRef.current.play().catch(() => {
        setHasVideo(false)
      })
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [isHovered])

  // Parallax transforms based on card position
  const parallaxFactor = card.zIndex === 3 ? 1 : card.zIndex === 2 ? 0.7 : 0.4

  const x = useTransform(mouseX, (value) => card.position.x + value * parallaxFactor)
  const y = useTransform(mouseY, (value) => card.position.y + value * parallaxFactor)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{
        opacity: 1,
        scale: card.scale,
        y: 0,
      }}
      transition={{
        delay: 0.5 + card.delay,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
      style={{
        x,
        y,
        rotate: card.rotation,
        zIndex: isHovered ? 10 : card.zIndex,
      }}
      whileHover={{
        scale: card.scale * 1.08,
        rotate: card.rotation * 0.5,
        zIndex: 10,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="absolute cursor-pointer"
    >
      {/* Card container */}
      <div
        className={cn(
          'relative w-[140px] h-[200px] md:w-[180px] md:h-[260px] rounded-2xl overflow-hidden',
          'transition-shadow duration-500',
          isHovered ? 'shadow-glow-lg' : 'shadow-xl'
        )}
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-mint via-coral to-mint p-[2px] rounded-2xl">
          <div className="w-full h-full bg-surface rounded-[14px] overflow-hidden">
            {/* Video element (when available) */}
            {hasVideo && card.videoSrc && (
              <video
                ref={videoRef}
                src={card.videoSrc}
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-10"
                onError={() => setHasVideo(false)}
              />
            )}

            {/* Fallback gradient (shown when no video) */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity duration-300',
              card.fallbackGradient,
              hasVideo && isHovered ? 'opacity-0' : 'opacity-90'
            )} />

            {/* Fallback play button (only shown when video fails to load) */}
            {!hasVideo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center z-20"
              >
                <motion.div
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20"
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.6)' }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Play className="w-6 h-6 md:w-7 md:h-7 text-white fill-white ml-1" />
                </motion.div>
              </motion.div>
            )}

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent z-30">
              <p className="text-white text-xs md:text-sm font-medium truncate">{card.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                <span className="text-white/70 text-[10px] md:text-xs">AI Avatar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Floating sparkles decoration
function FloatingSparkles() {
  const sparkles = [
    { x: '-30%', y: '-20%', size: 3, delay: 0 },
    { x: '35%', y: '-15%', size: 4, delay: 0.5 },
    { x: '-25%', y: '25%', size: 2, delay: 1 },
    { x: '30%', y: '30%', size: 3, delay: 1.5 },
    { x: '0%', y: '-35%', size: 2, delay: 2 },
  ]

  return (
    <>
      {sparkles.map((sparkle, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: sparkle.delay,
            ease: 'easeInOut',
          }}
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${sparkle.x})`,
            top: `calc(50% + ${sparkle.y})`,
          }}
        >
          <div
            className="bg-white rounded-full"
            style={{
              width: sparkle.size,
              height: sparkle.size,
              boxShadow: `0 0 ${sparkle.size * 2}px ${sparkle.size}px rgba(255,255,255,0.4)`,
            }}
          />
        </motion.div>
      ))}
    </>
  )
}
