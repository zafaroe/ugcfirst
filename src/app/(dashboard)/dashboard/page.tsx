'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faVideo, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { createClient } from '@supabase/supabase-js'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/modal'
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
} from '@/components/composed'
import type { Generation, GenerationVideoWithUrls } from '@/types/generation'

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

  useEffect(() => {
    async function fetchGenerations() {
      try {
        setIsLoading(true)
        setError(null)

        // Get auth token from Supabase
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.access_token) {
          router.push('/login')
          return
        }

        const response = await fetch('/api/generations?limit=4', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          cache: 'no-store', // Ensure fresh data on every request
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch generations')
        }

        const data = await response.json()
        setGenerations(data.generations || [])
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
    router.push(`/projects/${generation.id}/strategy`)
  }

  const handleDownload = (generation: Generation) => {
    const gen = generation as GenerationWithVideos
    const videoUrl = gen.videos?.[0]?.videoCaptionedUrl || gen.videos?.[0]?.videoUrl
    if (videoUrl) {
      window.open(videoUrl, '_blank')
    }
  }

  const handleDelete = (generation: Generation) => {
    setDeleteTarget(generation)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
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

      // Remove from local state
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

        {/* Mode Selection Cards - Clean grid */}
        <StaggerContainer className="grid md:grid-cols-2 gap-6" staggerDelay={0.1} initialDelay={0.2}>
          <StaggerItem>
            <ModeSelectionCard mode="diy" />
          </StaggerItem>
          <StaggerItem>
            <ModeSelectionCard mode="concierge" />
          </StaggerItem>
        </StaggerContainer>

        {/* Subtle divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />

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
