'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Sparkles, Wand2, Sliders, PartyPopper } from 'lucide-react'
import { Button, GradientCard, SPRING } from '@/components/ui'
import { getBrowserClient } from '@/lib/supabase'

export function CompleteStep() {
  // Mark onboarding as complete when this step renders
  useEffect(() => {
    const markOnboarded = async () => {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return

      // Update user_metadata (readable from JWT in middleware, no DB call needed)
      await supabase.auth.updateUser({
        data: { onboarded: true }
      })

      // Also update database flag
      await supabase
        .from('user_credits')
        .update({ onboarding_completed: true })
        .eq('user_id', session.user.id)
    }

    markOnboarded()
  }, [])

  return (
    <div className="text-center">
      {/* Animated celebration icon */}
      <motion.div
        className="flex justify-center mb-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...SPRING.bouncy, delay: 0.2 }}
      >
        <motion.div
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-mint via-coral to-pink-500 flex items-center justify-center shadow-lg shadow-mint/30"
          animate={{
            boxShadow: [
              '0 10px 40px rgba(16, 185, 129, 0.3)',
              '0 10px 40px rgba(244, 63, 94, 0.3)',
              '0 10px 40px rgba(16, 185, 129, 0.3)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PartyPopper className="w-10 h-10 text-white" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-text-primary mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        You're All Set!
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-lg text-text-muted mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Let's create your first viral video
      </motion.p>

      {/* Sparkle decoration */}
      <motion.div
        className="flex items-center justify-center gap-2 mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Sparkles className="w-4 h-4 text-mint" />
        <span className="text-sm text-text-muted">Choose your creation mode below</span>
        <Sparkles className="w-4 h-4 text-coral" />
      </motion.div>

      {/* Mode selection with GradientCard */}
      <motion.div
        className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Studio Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/create/diy" className="block h-full">
            <GradientCard
              glowOnHover
              padding="lg"
              className="cursor-pointer text-left h-full transition-all duration-300 hover:ring-2 hover:ring-mint/50"
            >
              {/* Icon with gradient background */}
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint to-blue-500 flex items-center justify-center mb-4 shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={SPRING.bouncy}
              >
                <Sliders className="w-6 h-6 text-white" strokeWidth={2} />
              </motion.div>

              {/* Badge */}
              <div className="flex items-center gap-1 mb-3">
                <span className="text-xs px-2.5 py-1 rounded-full bg-mint/20 text-mint font-semibold">
                  Full Control
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-text-primary mb-2">Studio</h3>

              {/* Credits with icon */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-mint/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-mint" />
                </div>
                <span className="text-sm font-medium text-text-primary">10 Credits</span>
              </div>

              {/* Description */}
              <p className="text-sm text-text-muted leading-relaxed">
                Full creative control over AI avatars, voices, and script.
              </p>

              {/* Hover indicator */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-mint to-blue-500 rounded-b-2xl opacity-0 group-hover:opacity-100"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={SPRING.bouncy}
              />
            </GradientCard>
          </Link>
        </motion.div>

        {/* Drop & Go Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link href="/create/concierge" className="block h-full">
            <GradientCard
              glowOnHover
              padding="lg"
              className="cursor-pointer text-left h-full transition-all duration-300 hover:ring-2 hover:ring-coral/50"
            >
              {/* Icon with gradient background */}
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-pink-500 flex items-center justify-center mb-4 shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={SPRING.bouncy}
              >
                <Wand2 className="w-6 h-6 text-white" strokeWidth={2} />
              </motion.div>

              {/* Badge */}
              <div className="flex items-center gap-1 mb-3">
                <span className="text-xs px-2.5 py-1 rounded-full bg-coral/20 text-coral font-semibold">
                  AI Powered
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-text-primary mb-2">Drop & Go</h3>

              {/* Credits with icon */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-coral/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-coral" />
                </div>
                <span className="text-sm font-medium text-text-primary">15 Credits</span>
              </div>

              {/* Description */}
              <p className="text-sm text-text-muted leading-relaxed">
                Cast your topic and we'll reel in a viral video. AI does the heavy lifting.
              </p>

              {/* Hover indicator */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-coral to-pink-500 rounded-b-2xl opacity-0 group-hover:opacity-100"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={SPRING.bouncy}
              />
            </GradientCard>
          </Link>
        </motion.div>
      </motion.div>

      {/* Primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Link href="/dashboard">
          <Button size="lg" className="min-w-[250px] shadow-lg shadow-mint/25">
            <Sparkles className="w-4 h-4 mr-2" />
            Create Your First Video
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>

      {/* Skip to dashboard */}
      <motion.div
        className="mt-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Link
          href="/dashboard"
          className="text-sm text-text-muted hover:text-mint transition-colors duration-200"
        >
          or skip to dashboard
        </Link>
      </motion.div>
    </div>
  )
}
