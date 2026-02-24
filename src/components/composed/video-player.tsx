'use client'

import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause, faVolumeHigh, faVolumeXmark, faExpand } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'

export interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  /** Set to true for portrait/vertical videos (9:16) */
  vertical?: boolean
}

export function VideoPlayer({ src, poster, className, vertical = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(false)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(progress)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * videoRef.current.duration
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={cn('relative bg-deep-space rounded-xl overflow-hidden group', className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={cn(
          'w-full h-full object-contain',
          vertical ? 'aspect-[9/16]' : 'aspect-video'
        )}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress bar */}
        <div
          className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <FontAwesomeIcon icon={faPause} className="w-5 h-5 text-white" />
              ) : (
                <FontAwesomeIcon icon={faPlay} className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isMuted ? (
                <FontAwesomeIcon icon={faVolumeXmark} className="w-5 h-5" />
              ) : (
                <FontAwesomeIcon icon={faVolumeHigh} className="w-5 h-5" />
              )}
            </button>

            {/* Time */}
            <span className="text-white text-sm">
              {videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'}
              {' / '}
              {videoRef.current ? formatTime(videoRef.current.duration || 0) : '0:00'}
            </span>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white/80 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faExpand} className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center play button when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia flex items-center justify-center hover:scale-110 transition-transform">
            <FontAwesomeIcon icon={faPlay} className="w-7 h-7 text-white ml-1" />
          </div>
        </button>
      )}
    </div>
  )
}
