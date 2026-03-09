'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Sparkles, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CreditBadge } from '@/components/composed/credit-badge'
import { getBrowserClient } from '@/lib/supabase'
import { CREDIT_COSTS } from '@/types/credits'

export interface RegenerateModalProps {
  isOpen: boolean
  onClose: () => void
  generationId: string
  captionsEnabled?: boolean
  onRegenerated: (newGenerationId: string) => void
}

export function RegenerateModal({
  isOpen,
  onClose,
  generationId,
  captionsEnabled = true,
  onRegenerated,
}: RegenerateModalProps) {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setError('Please provide feedback on what to change')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/generate/regenerate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generationId,
          feedback: feedback.trim(),
          captionsEnabled,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 402) {
          setError(`Insufficient credits. You need ${CREDIT_COSTS.EDIT_FIX} credits.`)
          return
        }
        if (response.status === 429) {
          setError(data.message || 'Monthly video limit reached.')
          return
        }
        throw new Error(data.error || data.message || 'Failed to regenerate')
      }

      // Success - pass new generation ID back to parent
      onRegenerated(data.data.generationId)
      onClose()
      setFeedback('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFeedback('')
      setError(null)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" showCloseButton={!isSubmitting}>
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-pink-500 flex items-center justify-center"
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Regenerate Video</h2>
            <p className="text-sm text-text-muted">Tell us what to change</p>
          </div>
        </div>

        {/* Feedback Input */}
        <div className="mb-4">
          <Textarea
            label="What should be different?"
            placeholder="e.g., Make the hook more energetic, change the tone to casual, focus more on the price point, make it shorter..."
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value)
              if (error) setError(null)
            }}
            maxLength={500}
            showCount
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        {/* Credit Cost Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-cream mb-4">
          <span className="text-sm text-text-muted">Regeneration cost</span>
          <CreditBadge amount={CREDIT_COSTS.EDIT_FIX} size="md" />
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 mb-4 rounded-lg bg-status-error/10 border border-status-error/20 text-sm text-status-error"
          >
            {error}
          </motion.div>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting || !feedback.trim()}
          leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        >
          {isSubmitting ? 'Regenerating...' : `Regenerate (${CREDIT_COSTS.EDIT_FIX} Credits)`}
        </Button>

        {/* Cancel Link */}
        {!isSubmitting && (
          <button
            onClick={handleClose}
            className="w-full text-sm text-text-muted hover:text-text-primary transition-colors mt-3 py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </Modal>
  )
}
