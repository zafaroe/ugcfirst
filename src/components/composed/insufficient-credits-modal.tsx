'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, CreditCard, Sparkles, ArrowRight } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface InsufficientCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  required: number
  available: number
  mode?: 'diy' | 'concierge'
  captionsEnabled?: boolean
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  required,
  available,
  mode = 'concierge',
  captionsEnabled = false,
}: InsufficientCreditsModalProps) {
  const router = useRouter()
  const deficit = required - available

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
        {/* Warning Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-warning/20 flex items-center justify-center"
        >
          <AlertTriangle className="w-8 h-8 text-status-warning" />
        </motion.div>

        {/* Title */}
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Insufficient Credits
        </h3>

        {/* Description */}
        <p className="text-text-muted mb-6">
          You need <span className="font-semibold text-text-primary">{required} credits</span> to generate this {mode === 'concierge' ? 'Drop & Go' : 'Studio'} video{captionsEnabled ? ' with captions' : ''}.
        </p>

        {/* Credit Breakdown */}
        <div className="bg-cream rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-muted">Current Balance</span>
            <span className={cn(
              'font-semibold',
              available === 0 ? 'text-status-error' : 'text-text-primary'
            )}>
              {available} credits
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-muted">Required</span>
            <span className="font-semibold text-text-primary">{required} credits</span>
          </div>
          <div className="border-t border-border-default pt-3 flex justify-between items-center">
            <span className="text-sm font-medium text-status-error">You need</span>
            <span className="font-bold text-status-error">{deficit} more credits</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleBuyCredits}
            className="w-full"
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            Buy Credit Pack
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleUpgradePlan}
            className="w-full"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Upgrade Your Plan
          </Button>

          <button
            onClick={onClose}
            className="text-sm text-text-muted hover:text-text-primary transition-colors mt-2"
          >
            I&apos;ll do this later
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Low credits warning banner (inline component)
export interface LowCreditsBannerProps {
  balance: number
  className?: string
  onBuyCredits?: () => void
}

export function LowCreditsBanner({
  balance,
  className,
  onBuyCredits,
}: LowCreditsBannerProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onBuyCredits) {
      onBuyCredits()
    } else {
      router.push('/settings/billing')
    }
  }

  if (balance >= 20) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-status-warning/10 border border-status-warning/30 rounded-lg p-3 flex items-center justify-between',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0" />
        <p className="text-sm text-text-primary">
          <span className="font-medium">Low credits!</span>{' '}
          You have <span className="font-semibold">{balance}</span> credits remaining.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="text-status-warning hover:text-status-warning/80"
      >
        Buy More
      </Button>
    </motion.div>
  )
}
