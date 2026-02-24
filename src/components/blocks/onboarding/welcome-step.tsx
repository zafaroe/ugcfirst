'use client'

import { motion } from 'framer-motion'
import { Video, Zap, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import { Button, GlassCard, SPRING } from '@/components/ui'
import { RobotMascot } from '@/components/composed'

interface WelcomeStepProps {
  onNext: () => void
}

const features = [
  {
    icon: Video,
    title: 'AI Avatars',
    desc: 'Realistic presenters for your products',
    gradient: 'from-electric-indigo to-blue-500',
  },
  {
    icon: Zap,
    title: 'Instant Videos',
    desc: 'Generate in under 2 minutes',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: TrendingUp,
    title: 'Viral Ready',
    desc: 'Optimized for TikTok & Reels',
    gradient: 'from-vibrant-fuchsia to-pink-500',
  },
]

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center">
      {/* Illustration */}
      <motion.div
        className="flex justify-center mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <RobotMascot size="xl" animated />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-4xl md:text-5xl font-bold text-text-primary mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Welcome to{' '}
        <span className="gradient-text">Vidnary</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-lg text-text-muted mb-6 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Create viral UGC videos with AI avatars in minutes, not hours.
      </motion.p>

      {/* Personalized greeting with sparkle */}
      <motion.div
        className="flex items-center justify-center gap-2 text-text-muted mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Sparkles className="w-4 h-4 text-electric-indigo" />
        <span>Hey there, ready to create your first winner?</span>
        <Sparkles className="w-4 h-4 text-vibrant-fuchsia" />
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Button
          size="lg"
          onClick={onNext}
          className="shadow-lg shadow-electric-indigo/25"
        >
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button variant="ghost" size="lg" onClick={onNext}>
          Skip Tour
        </Button>
      </motion.div>

      {/* Feature highlights with GlassCard */}
      <motion.div
        className="mt-12 grid sm:grid-cols-3 gap-5 text-left max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <GlassCard
                padding="md"
                className="h-full"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={SPRING.bouncy}
              >
                {/* Icon with gradient background */}
                <motion.div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
                  whileHover={{ rotate: 5 }}
                  transition={SPRING.bouncy}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </motion.div>

                <h3 className="font-semibold text-text-primary mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {feature.desc}
                </p>
              </GlassCard>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
