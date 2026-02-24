'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  illustrations,
  type IllustrationType,
} from './empty-state-illustrations'

export interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  icon?: React.ReactNode
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  illustration?: IllustrationType
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: {
    container: 'py-8 px-4',
    illustration: 48,
    iconWrapper: 'w-14 h-14 mb-4',
    title: 'text-base',
    description: 'text-sm mb-4',
    gap: 'gap-2',
  },
  md: {
    container: 'py-12 px-6',
    illustration: 64,
    iconWrapper: 'w-18 h-18 mb-5',
    title: 'text-lg',
    description: 'text-sm mb-5',
    gap: 'gap-3',
  },
  lg: {
    container: 'py-16 px-8',
    illustration: 80,
    iconWrapper: 'w-24 h-24 mb-6',
    title: 'text-xl',
    description: 'text-base mb-6',
    gap: 'gap-4',
  },
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
}

function ActionButton({ action }: { action: EmptyStateAction }) {
  const buttonContent = (
    <Button
      variant={action.variant || 'primary'}
      onClick={action.onClick}
      leftIcon={action.icon}
    >
      {action.label}
    </Button>
  )

  if (action.href) {
    return <Link href={action.href}>{buttonContent}</Link>
  }

  return buttonContent
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const config = sizeConfig[size]
  const IllustrationComponent = illustration ? illustrations[illustration] : null

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center text-center max-w-md mx-auto',
        config.container,
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Illustration or Icon */}
      <motion.div variants={itemVariants}>
        {IllustrationComponent ? (
          <div className="mb-6 relative">
            {/* Ambient glow behind illustration */}
            <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-electric-indigo/20 to-vibrant-fuchsia/10 rounded-full scale-150" />
            <div className="relative">
              <IllustrationComponent size={config.illustration} />
            </div>
          </div>
        ) : icon ? (
          <div
            className={cn(
              'rounded-2xl bg-gradient-to-br from-electric-indigo/10 to-vibrant-fuchsia/10 flex items-center justify-center',
              config.iconWrapper
            )}
          >
            {icon}
          </div>
        ) : null}
      </motion.div>

      {/* Title */}
      <motion.h3
        className={cn('font-semibold text-text-primary mb-2', config.title)}
        variants={itemVariants}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        className={cn('text-text-muted leading-relaxed', config.description)}
        variants={itemVariants}
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          className={cn('flex items-center flex-wrap justify-center', config.gap)}
          variants={itemVariants}
        >
          {action && <ActionButton action={action} />}
          {secondaryAction && <ActionButton action={secondaryAction} />}
        </motion.div>
      )}
    </motion.div>
  )
}

// Pre-configured empty states for common scenarios
export const emptyStatePresets = {
  // Dashboard - No projects
  noProjects: {
    illustration: 'clapperboard' as IllustrationType,
    title: "Your studio is empty",
    description: "Time to roll camera! Create your first AI video and watch the magic happen.",
  },

  // Dashboard - No activity
  noActivity: {
    illustration: 'spotlight' as IllustrationType,
    title: "It's quiet on set",
    description: "No recent activity to show. Start creating videos to see your production timeline here.",
  },

  // Projects - No projects
  noProjectsInList: {
    illustration: 'film-reel' as IllustrationType,
    title: "No scenes in the can",
    description: "Your project library is waiting for its first blockbuster. Let's create something amazing!",
  },

  // Projects - No search results
  noSearchResults: {
    illustration: 'script' as IllustrationType,
    title: "No matching scenes",
    description: "We couldn't find any projects matching your search. Try different keywords or clear your filters.",
  },

  // Projects - Empty filter
  noFilterResults: {
    illustration: 'camera' as IllustrationType,
    title: "Nothing here",
    description: "No projects match your current filters. Try adjusting your selection.",
  },

  // DIY - No product selected
  noProduct: {
    illustration: 'camera' as IllustrationType,
    title: "What are we filming?",
    description: "Enter a product URL or describe what you'd like to promote. We'll take it from there!",
  },

  // DIY - Avatars error
  avatarsError: {
    illustration: 'director-chair' as IllustrationType,
    title: "The talent hasn't arrived",
    description: "We're having trouble loading the avatars. Please try refreshing or check back shortly.",
  },

  // DIY - No script
  noScript: {
    illustration: 'script' as IllustrationType,
    title: "The script is blank",
    description: "Let our AI write a viral script for you, or paste your own masterpiece.",
  },

  // Billing - No payment method
  noPaymentMethod: {
    illustration: 'spotlight' as IllustrationType,
    title: "No payment method on file",
    description: "Add a payment method to unlock premium features and purchase additional credits.",
  },

  // Billing - No history
  noBillingHistory: {
    illustration: 'film-reel' as IllustrationType,
    title: "No billing history yet",
    description: "Your transaction history will appear here once you make your first purchase.",
  },

  // Credits - No transactions
  noTransactions: {
    illustration: 'clapperboard' as IllustrationType,
    title: "No transactions yet",
    description: "Your credit usage and purchases will be tracked here as you create videos.",
  },

  // Generic - Data load error
  loadError: {
    illustration: 'spotlight' as IllustrationType,
    title: "Something went wrong",
    description: "We couldn't load this content. Please try refreshing the page or check your connection.",
  },
} as const
