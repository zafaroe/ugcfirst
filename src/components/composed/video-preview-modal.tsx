'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faCalendar, faClock, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { VisibilityToggle } from './visibility-toggle'
import { cn, formatRelativeTime } from '@/lib/utils'
import { hasSchedulingAccess } from '@/config/pricing'
import type { Generation, GenerationVideoWithUrls, VideoVisibility } from '@/types/generation'

type GenerationWithVideos = Generation & { videos?: GenerationVideoWithUrls[] | null }

interface VideoPreviewModalProps {
  generation: GenerationWithVideos | null
  isOpen: boolean
  onClose: () => void
  onVisibilityChange?: (generationId: string, visibility: VideoVisibility) => Promise<void>
  onDownload?: (generation: Generation) => void
  onSchedule?: (generation: Generation) => void
  userPlan?: string
}

export function VideoPreviewModal({
  generation,
  isOpen,
  onClose,
  onVisibilityChange,
  onSchedule,
  userPlan = 'free',
}: VideoPreviewModalProps) {
  const [showSubtitled, setShowSubtitled] = useState(true)
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)

  if (!generation) return null

  const video = generation.videos?.[0]
  const videoUrl = video?.videoSubtitledUrl || video?.videoUrl || null
  const rawVideoUrl = video?.videoUrl || null
  const subtitledUrl = video?.videoSubtitledUrl || null
  const hasSubtitled = !!subtitledUrl && !!rawVideoUrl && subtitledUrl !== rawVideoUrl
  const displayUrl = hasSubtitled ? (showSubtitled ? subtitledUrl : rawVideoUrl) : videoUrl

  const handleVisibilityChange = async (newVisibility: VideoVisibility) => {
    if (!onVisibilityChange || isUpdatingVisibility) return
    setIsUpdatingVisibility(true)
    try {
      await onVisibilityChange(generation.id, newVisibility)
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  const handleDownload = () => {
    if (displayUrl) {
      const link = document.createElement('a')
      link.href = displayUrl
      link.download = `ugcfirst-${generation.product_name.replace(/\s+/g, '-').toLowerCase()}${showSubtitled ? '-subtitled' : ''}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={generation.product_name}
      size="lg"
    >
      <div className="space-y-4">
        {/* Video Player - constrained height for 9:16 videos */}
        {displayUrl ? (
          <div className="rounded-xl overflow-hidden bg-charcoal/90 flex items-center justify-center mx-auto" style={{ maxWidth: '280px' }}>
            <video
              src={displayUrl}
              poster={video?.frameUrl}
              controls
              playsInline
              className="w-full object-contain"
              style={{ aspectRatio: '9/16', maxHeight: '50vh' }}
            />
          </div>
        ) : (
          <div className="h-48 bg-cream rounded-xl flex items-center justify-center">
            <p className="text-text-muted text-sm">Video not available</p>
          </div>
        )}

        {/* Subtitle Toggle */}
        {hasSubtitled && (
          <div className="flex items-center justify-center gap-1 p-1 bg-surface-raised rounded-lg w-fit mx-auto">
            <button
              onClick={() => setShowSubtitled(true)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                showSubtitled
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              With Subtitles
            </button>
            <button
              onClick={() => setShowSubtitled(false)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                !showSubtitled
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Without Subtitles
            </button>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5" />
            <span suppressHydrationWarning>{formatRelativeTime(generation.created_at)}</span>
          </span>
          {video?.duration && (
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
              {Math.round(video.duration)}s
            </span>
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: generation.mode === 'concierge'
                ? 'rgba(244, 63, 94, 0.2)'
                : generation.mode === 'spotlight'
                ? 'rgba(245, 158, 11, 0.2)'
                : 'rgba(16, 185, 129, 0.2)',
              color: generation.mode === 'concierge'
                ? '#F43F5E'
                : generation.mode === 'spotlight'
                ? '#F59E0B'
                : '#10B981',
            }}
          >
            {generation.mode === 'concierge' ? 'Drop & Go' :
             generation.mode === 'spotlight' ? 'Spotlight' : 'Studio'}
          </span>
        </div>

        {/* Visibility */}
        {generation.status === 'completed' && onVisibilityChange && (
          <div className="pt-3 border-t border-border-default">
            <p className="text-xs font-medium text-text-muted mb-2">Visibility</p>
            <VisibilityToggle
              visibility={generation.visibility}
              onChange={handleVisibilityChange}
              disabled={isUpdatingVisibility}
              showUnlisted
              shareToken={generation.share_token}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-3 border-t border-border-default">
          {displayUrl && (
            <Button onClick={handleDownload} variant="secondary" className="flex-1">
              <FontAwesomeIcon icon={faDownload} className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          {generation.status === 'completed' && (
            hasSchedulingAccess(userPlan) ? (
              onSchedule && (
                <Button
                  onClick={() => onSchedule(generation)}
                  variant="secondary"
                  className="flex-1"
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              )
            ) : (
              <Button
                onClick={() => window.location.href = '/pricing'}
                variant="ghost"
                className="flex-1"
              >
                <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
                Schedule (Pro)
              </Button>
            )
          )}
          <Button onClick={onClose} variant="ghost" className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
