'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface WaitlistFormProps {
  variant?: 'default' | 'hero' | 'cta' | 'inline'
  className?: string
  onSuccess?: () => void
}

export function WaitlistForm({ variant = 'default', className, onSuccess }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setEmail('')
        onSuccess?.()
      } else {
        setErrorMessage(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMessage('Network error. Please try again.')
      setStatus('error')
    }
  }

  const isHero = variant === 'hero'
  const isCta = variant === 'cta'
  const isInline = variant === 'inline'

  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'flex items-center justify-center gap-3 py-4 px-6 rounded-xl',
              isHero || isCta ? 'bg-mint/10 border border-mint/20' : 'bg-mint/10'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-mint font-semibold">You're on the list!</p>
              <p className="text-stone-400 text-sm">We'll notify you when we launch.</p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className={cn(
              'flex gap-3',
              isInline ? 'flex-row items-center' : 'flex-col sm:flex-row items-stretch sm:items-center'
            )}
          >
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status === 'error') setStatus('idle')
                }}
                placeholder="Enter your email"
                disabled={status === 'loading'}
                className={cn(
                  'w-full px-4 py-3.5 rounded-xl bg-stone-800/80 border text-white placeholder:text-stone-500',
                  'focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint/50 transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  status === 'error' ? 'border-red-500/50' : 'border-stone-700',
                  isHero && 'py-4 text-base',
                  isCta && 'bg-stone-900/80 py-4'
                )}
              />
              {status === 'error' && errorMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 left-0 text-xs text-red-400"
                >
                  {errorMessage}
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size={isHero || isCta ? 'lg' : 'md'}
              disabled={status === 'loading' || !email}
              className={cn(
                'whitespace-nowrap group/btn',
                isHero && 'px-8 py-4 text-base font-semibold shadow-[0_8px_30px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.5)]',
                isCta && 'px-10 py-4 text-base font-semibold shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.55)] animate-pulse-glow'
              )}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Join Waitlist
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </>
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact button version for navigation
export function WaitlistButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setStatus('error')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setTimeout(() => setIsOpen(false), 2000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="primary"
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        className="group/btn"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Join Waitlist
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 top-full mt-2 w-80 p-4 bg-stone-900/95 backdrop-blur-lg rounded-xl shadow-xl border border-stone-700 z-50"
            >
              {status === 'success' ? (
                <div className="flex items-center gap-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-mint font-medium">You're on the list!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <p className="text-sm text-stone-300 font-medium">
                    Get early access when we launch
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg bg-stone-800 border text-white text-sm placeholder:text-stone-500',
                      'focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint/50',
                      status === 'error' ? 'border-red-500/50' : 'border-stone-700'
                    )}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Join Waitlist'
                    )}
                  </Button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
