'use client'

import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPencil, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { StatusBadge } from './status-badge'
import { SPRING } from '@/components/ui/motion'
import type { Project } from '@/types'

export interface ProjectCardProps {
  project: Project
  onView?: (project: Project) => void
  onEdit?: (project: Project) => void
  onDuplicate?: (project: Project) => void
  onDelete?: (project: Project) => void
  className?: string
}

export function ProjectCard({
  project,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  className,
}: ProjectCardProps) {
  return (
    <Card
      padding="none"
      hoverable
      className={cn('overflow-hidden group', className)}
      onClick={() => onView?.(project)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-deep-space overflow-hidden">
        {project.thumbnail ? (
          <motion.img
            src={project.thumbnail}
            alt={project.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              <FontAwesomeIcon icon={faPlay} className="w-5 h-5 text-text-muted" />
            </div>
          </div>
        )}

        {/* Play overlay on hover */}
        {project.status === 'ready' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING.bouncy}
            >
              <FontAwesomeIcon icon={faPlay} className="w-6 h-6 text-white ml-1" />
            </motion.div>
          </motion.div>
        )}

        {/* Status badge with pulse animation for processing */}
        <motion.div
          className="absolute top-3 right-3"
          animate={project.status === 'processing' ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={project.status === 'processing' ? {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        >
          <StatusBadge status={project.status} showRefunded={false} />
        </motion.div>

        {/* Quick actions on hover */}
        <motion.div
          className="absolute bottom-3 right-3 flex gap-2"
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {onEdit && project.status === 'ready' && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(project)
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-lg bg-surface/90 backdrop-blur flex items-center justify-center hover:bg-surface transition-colors"
              title="Edit"
            >
              <FontAwesomeIcon icon={faPencil} className="w-4 h-4 text-text-primary" />
            </motion.button>
          )}
          {onDuplicate && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(project)
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-lg bg-surface/90 backdrop-blur flex items-center justify-center hover:bg-surface transition-colors"
              title="Duplicate"
            >
              <FontAwesomeIcon icon={faCopy} className="w-4 h-4 text-text-primary" />
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(project)
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-lg bg-surface/90 backdrop-blur flex items-center justify-center hover:bg-status-error/20 transition-colors"
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-status-error" />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-text-primary truncate">{project.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-text-muted" suppressHydrationWarning>
            {formatRelativeTime(project.createdAt)}
          </span>
          <span className="text-sm text-text-muted">{project.duration}s</span>
        </div>
      </div>
    </Card>
  )
}

// Skeleton for loading state with shimmer animation
export function ProjectCardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <motion.div
        className="aspect-video bg-deep-space"
        animate={{
          background: [
            'linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
            'linear-gradient(90deg, #1E293B 0%, #0F172A 50%, #1E293B 100%)',
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
          className="h-5 bg-deep-space rounded w-3/4"
          animate={{
            background: [
              'linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
              'linear-gradient(90deg, #1E293B 0%, #0F172A 50%, #1E293B 100%)',
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
          className="h-4 bg-deep-space rounded w-1/2"
          animate={{
            background: [
              'linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
              'linear-gradient(90deg, #1E293B 0%, #0F172A 50%, #1E293B 100%)',
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
