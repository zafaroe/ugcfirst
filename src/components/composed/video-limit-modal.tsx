'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, CreditCard, Sparkles, ArrowRight, Video } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export interface VideoLimitModalProps {
  isOpen: boolean
  onClose: () => void
  limit: number
  used: number
}

export function VideoLimitModal({
  isOpen,
  onClose,
  limit,
  used,
}: VideoLimitModalProps) {
  const router = useRouter()

  const handleBuyCredits = () => {
    onClose()
    router.push('/settings/billing')
  }

  const handleUpgradePlan = () => {
    onClose()
    router.push('/pricing')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={true}>
      <div className="text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-mint/20 flex items-center justify-center"
        >
          <Video className="w-8 h-8 text-mint" />
        </motion.div>

        {/* Title */}
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Monthly Limit Reached
        </h3>

        {/* Description */}
        <p className="text-text-muted mb-6">
          You&apos;ve used your <span className="font-semibold text-text-primary">{limit} free video</span> for this month. Unlock unlimited videos by purchasing credits or subscribing.
        </p>

        {/* Usage Display */}
        <div className="bg-cream rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-text-muted">Videos This Month</span>
            <span className="font-semibold text-text-primary">{used} / {limit}</span>
          </div>
          <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-mint to-mint-dark rounded-full"
            />
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>Resets next month</span>
          </div>
        </div>

        {/* Benefits Preview */}
        <div className="text-left bg-surface-raised rounded-lg p-4 mb-6 space-y-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">With a paid plan you get:</p>
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <div className="w-1.5 h-1.5 rounded-full bg-mint" />
            <span>Unlimited video generations</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <div className="w-1.5 h-1.5 rounded-full bg-mint" />
            <span>No watermarks on videos</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <div className="w-1.5 h-1.5 rounded-full bg-mint" />
            <span>Priority support</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleUpgradePlan}
            className="w-full"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            View Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleBuyCredits}
            className="w-full"
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            Buy Credit Pack
          </Button>

          <button
            onClick={onClose}
            className="text-sm text-text-muted hover:text-text-primary transition-colors mt-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  )
}
