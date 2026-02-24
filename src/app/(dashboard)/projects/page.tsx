'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faMagnifyingGlass, faTableCells, faList } from '@fortawesome/free-solid-svg-icons'
import { createClient } from '@supabase/supabase-js'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ConfirmModal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { StaggerContainer, StaggerItem, EASINGS, GlassCard } from '@/components/ui'
import { GenerationCard, GenerationCardSkeleton, EmptyState, emptyStatePresets } from '@/components/composed'
import type { Generation, GenerationVideoWithUrls } from '@/types/generation'

type GenerationWithVideos = Generation & { videos?: GenerationVideoWithUrls[] | null }

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

const filtersVariants = {
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
}

export default function ProjectsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.access_token) {
          router.push('/login')
          return
        }

        const response = await fetch('/api/generations', {
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

  const filteredGenerations = generations.filter(generation =>
    generation.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const readyGenerations = filteredGenerations.filter(g => g.status === 'completed')
  const processingGenerations = filteredGenerations.filter(g =>
    ['queued', 'analyzing', 'scripting', 'framing', 'generating', 'trimming', 'captioning', 'uploading'].includes(g.status)
  )
  const failedGenerations = filteredGenerations.filter(g => g.status === 'failed')

  const renderGenerationGrid = (generationsToRender: GenerationWithVideos[]) => {
    if (isLoading) {
      return (
        <div className={viewMode === 'grid'
          ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-4'
        }>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <GenerationCardSkeleton key={i} />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-status-error mb-4">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )
    }

    if (generationsToRender.length === 0) {
      const isSearching = searchQuery.length > 0
      const hasAnyGenerations = generations.length > 0

      let emptyStateConfig
      if (isSearching) {
        emptyStateConfig = {
          ...emptyStatePresets.noSearchResults,
          action: {
            label: 'Clear Search',
            onClick: () => setSearchQuery(''),
            variant: 'secondary' as const,
          },
        }
      } else if (!hasAnyGenerations) {
        emptyStateConfig = {
          ...emptyStatePresets.noProjectsInList,
          action: {
            label: 'Create Video',
            href: '/create/diy',
            icon: <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />,
          },
        }
      } else {
        emptyStateConfig = {
          ...emptyStatePresets.noFilterResults,
          action: undefined,
        }
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <EmptyState
            {...emptyStateConfig}
            size="md"
          />
        </motion.div>
      )
    }

    return (
      <StaggerContainer
        className={viewMode === 'grid'
          ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-4'
        }
        staggerDelay={0.08}
        initialDelay={0.1}
      >
        <AnimatePresence mode="popLayout">
          {generationsToRender.map((generation) => (
            <StaggerItem key={generation.id}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <GenerationCard
                  generation={generation}
                  onView={handleView}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
              </motion.div>
            </StaggerItem>
          ))}
        </AnimatePresence>
      </StaggerContainer>
    )
  }

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
            <h1 className="text-3xl font-bold text-text-primary">Projects</h1>
            <p className="text-text-muted mt-1">
              Manage and view all your generated videos
            </p>
          </div>
          <Link href="/create/diy">
            <Button>
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={filtersVariants}
          initial="hidden"
          animate="visible"
        >
          <GlassCard padding="sm" className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4" />}
                className="focus:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-shadow"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="md"
                onClick={() => setViewMode('grid')}
              >
                <FontAwesomeIcon icon={faTableCells} className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="md"
                onClick={() => setViewMode('list')}
              >
                <FontAwesomeIcon icon={faList} className="w-4 h-4" />
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: EASINGS.easeOut }}
        >
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">
                All ({isLoading ? '...' : filteredGenerations.length})
              </TabsTrigger>
              <TabsTrigger value="ready">
                Ready ({isLoading ? '...' : readyGenerations.length})
              </TabsTrigger>
              <TabsTrigger value="processing">
                In Progress ({isLoading ? '...' : processingGenerations.length})
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed ({isLoading ? '...' : failedGenerations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {renderGenerationGrid(filteredGenerations)}
            </TabsContent>

            <TabsContent value="ready">
              {renderGenerationGrid(readyGenerations)}
            </TabsContent>

            <TabsContent value="processing">
              {renderGenerationGrid(processingGenerations)}
            </TabsContent>

            <TabsContent value="failed">
              {renderGenerationGrid(failedGenerations)}
            </TabsContent>
          </Tabs>
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
