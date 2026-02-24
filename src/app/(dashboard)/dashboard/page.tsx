'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faVideo, faArrowRight, faBookOpen, faTrophy, faStore } from '@fortawesome/free-solid-svg-icons'
import { createClient } from '@supabase/supabase-js'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { CornerStar, StaggerContainer, StaggerItem, EASINGS } from '@/components/ui'
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

const quickActionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
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
      {/* Corner decoration */}
      <CornerStar position="bottom-right" />

      <div className="relative z-10 space-y-10">
        {/* Header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="text-center md:text-left"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
            Create Your Next{' '}
            <span className="gradient-text">Winner</span>
          </h1>
          <p className="text-text-muted text-lg">
            Choose your generation mode to get started.
          </p>
        </motion.div>

        {/* Mode Selection Cards */}
        <StaggerContainer className="grid md:grid-cols-2 gap-6" staggerDelay={0.15} initialDelay={0.3}>
          <StaggerItem>
            <ModeSelectionCard mode="diy" />
          </StaggerItem>
          <StaggerItem>
            <ModeSelectionCard mode="concierge" />
          </StaggerItem>
        </StaggerContainer>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASINGS.easeOut }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Recent Activity</h2>
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

// Enhanced Empty State with film-themed illustration and quick actions
function EnhancedEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="py-8"
    >
      {/* Film-themed Empty State */}
      <EmptyState
        {...emptyStatePresets.noProjects}
        size="lg"
        action={{
          label: 'Create Video',
          href: '/create/diy',
          icon: <FontAwesomeIcon icon={faVideo} className="w-4 h-4" />,
        }}
        secondaryAction={{
          label: 'Watch Tutorial',
          href: '/templates',
          variant: 'secondary',
        }}
      />

      {/* Quick Action Cards */}
      <motion.div
        className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8"
        variants={quickActionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.6 }}
      >
        <QuickActionCard
          icon={faStore}
          label="Create from URL"
          href="/create/concierge"
          color="indigo"
        />
        <QuickActionCard
          icon={faBookOpen}
          label="Browse Templates"
          href="/templates"
          color="fuchsia"
        />
        <QuickActionCard
          icon={faTrophy}
          label="Read Success Stories"
          href="/success-stories"
          color="gradient"
        />
      </motion.div>
    </motion.div>
  )
}

interface QuickActionCardProps {
  icon: typeof faVideo
  label: string
  href: string
  color: 'indigo' | 'fuchsia' | 'gradient'
}

function QuickActionCard({ icon, label, href, color }: QuickActionCardProps) {
  const iconColorClass = {
    indigo: 'text-electric-indigo',
    fuchsia: 'text-vibrant-fuchsia',
    gradient: 'gradient-text',
  }[color]

  const bgColorClass = {
    indigo: 'bg-electric-indigo/10 group-hover:bg-electric-indigo/20',
    fuchsia: 'bg-vibrant-fuchsia/10 group-hover:bg-vibrant-fuchsia/20',
    gradient: 'bg-gradient-to-br from-electric-indigo/10 to-vibrant-fuchsia/10 group-hover:from-electric-indigo/20 group-hover:to-vibrant-fuchsia/20',
  }[color]

  return (
    <Link href={href}>
      <motion.div
        className="group flex items-center gap-3 p-4 rounded-xl bg-surface/50 backdrop-blur-sm border border-white/10 hover:border-electric-indigo/50 transition-all cursor-pointer"
        whileHover={{ y: -4, scale: 1.02, boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)' }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={`w-10 h-10 rounded-lg ${bgColorClass} flex items-center justify-center transition-colors`}>
          <FontAwesomeIcon icon={icon} className={`w-5 h-5 ${iconColorClass}`} />
        </div>
        <span className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">
          {label}
        </span>
        <FontAwesomeIcon
          icon={faArrowRight}
          className="w-4 h-4 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all"
        />
      </motion.div>
    </Link>
  )
}
