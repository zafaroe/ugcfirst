'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo, GradientOrb, EASINGS } from '@/components/ui'
import { TrustBarCompact } from '@/components/ui/trust-bar'
import { Link2, Wand2, Sparkles, Play, Check, User, Video } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  badge?: React.ReactNode
}

// Floating shapes for the left panel (background effects only)
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gradient circle */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          top: '-10%',
          right: '-15%',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glowing dots */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute w-2 h-2 rounded-full bg-mint"
          style={{
            left: `${10 + i * 12}%`,
            top: `${30 + (i % 3) * 20}%`,
            filter: 'blur(1px)',
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}

// Mini animated process cards
function MiniProcessCard({
  stage,
  position,
  rotation,
  delay
}: {
  stage: 'analyzing' | 'scripting' | 'avatar' | 'rendering' | 'complete'
  position: string
  rotation: number
  delay: number
}) {
  const [progress, setProgress] = useState(0)
  const [scriptLines, setScriptLines] = useState(0)
  const [renderProgress, setRenderProgress] = useState(0)

  // Looping animations
  useEffect(() => {
    if (stage === 'analyzing') {
      const interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 2))
      }, 50)
      return () => clearInterval(interval)
    }
    if (stage === 'scripting') {
      const interval = setInterval(() => {
        setScriptLines(l => (l >= 4 ? 0 : l + 1))
      }, 600)
      return () => clearInterval(interval)
    }
    if (stage === 'rendering') {
      const interval = setInterval(() => {
        setRenderProgress(p => (p >= 100 ? 0 : p + 1))
      }, 40)
      return () => clearInterval(interval)
    }
  }, [stage])

  const stageConfig = {
    analyzing: {
      icon: Link2,
      label: 'Analyzing',
      color: 'text-mint',
      bgColor: 'bg-mint/10',
    },
    scripting: {
      icon: Wand2,
      label: 'Writing Script',
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
    avatar: {
      icon: User,
      label: 'Creating Avatar',
      color: 'text-fuchsia-400',
      bgColor: 'bg-fuchsia-400/10',
    },
    rendering: {
      icon: Video,
      label: 'Rendering',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
    complete: {
      icon: Sparkles,
      label: 'Ready!',
      color: 'text-mint',
      bgColor: 'bg-mint/10',
    },
  }

  const config = stageConfig[stage]
  const Icon = config.icon

  const positionClasses = position === 'relative' ? 'relative' : `absolute ${position}`

  return (
    <motion.div
      className={`${positionClasses} w-28 rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700/80 shadow-2xl overflow-hidden`}
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{
        opacity: 1,
        y: [0, -6, 0],
        rotate: [rotation, rotation + 2, rotation],
      }}
      transition={{
        opacity: { duration: 0.6, delay: 0.3 + delay },
        y: { duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay },
        rotate: { duration: 5 + delay, repeat: Infinity, ease: 'easeInOut', delay },
      }}
    >
      {/* Header */}
      <div className="px-2.5 py-2 border-b border-stone-700/50">
        <div className="flex items-center gap-1.5">
          <div className={`w-4 h-4 rounded ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`w-2.5 h-2.5 ${config.color}`} />
          </div>
          <span className="text-[9px] font-medium text-stone-300 truncate">{config.label}</span>
        </div>
      </div>

      {/* Content area */}
      <div className="p-2.5 h-24">
        {stage === 'analyzing' && (
          <div className="h-full flex flex-col justify-center gap-2">
            {/* Scan line effect */}
            <div className="relative h-12 rounded bg-stone-800 overflow-hidden">
              <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-mint to-transparent"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded bg-stone-700/50" />
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 rounded-full bg-stone-700 overflow-hidden">
              <motion.div
                className="h-full bg-mint rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {stage === 'scripting' && (
          <div className="h-full flex flex-col gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded bg-stone-700"
                initial={{ width: 0 }}
                animate={{
                  width: scriptLines > i ? ['0%', '100%'] : '0%',
                  backgroundColor: scriptLines > i ? ['#44403C', '#F59E0B', '#44403C'] : '#44403C'
                }}
                transition={{
                  width: { duration: 0.4, delay: i * 0.1 },
                  backgroundColor: { duration: 0.8 }
                }}
                style={{ width: i === 0 ? '90%' : i === 1 ? '75%' : i === 2 ? '85%' : '60%' }}
              />
            ))}
            <motion.div
              className="mt-auto flex items-center gap-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="w-1 h-2.5 bg-amber-400 rounded-sm" />
            </motion.div>
          </div>
        )}

        {stage === 'avatar' && (
          <div className="h-full flex items-center justify-center">
            <motion.div
              className="relative"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Avatar circle */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 border border-fuchsia-500/30 flex items-center justify-center">
                <User className="w-6 h-6 text-fuchsia-400" />
              </div>
              {/* Orbiting dot */}
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-fuchsia-400"
                animate={{
                  rotate: 360,
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{
                  top: '50%',
                  left: '50%',
                  marginTop: -4,
                  marginLeft: -4,
                  transformOrigin: '4px 28px',
                }}
              />
            </motion.div>
          </div>
        )}

        {stage === 'rendering' && (
          <div className="h-full flex flex-col justify-center gap-2">
            {/* Video frame with progress */}
            <div className="relative h-12 rounded bg-stone-800 overflow-hidden border border-stone-700/50">
              {/* Frame lines */}
              <div className="absolute inset-1 border border-dashed border-cyan-400/30 rounded-sm" />
              {/* Progress overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-transparent"
                style={{ width: `${renderProgress}%` }}
              />
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Video className="w-4 h-4 text-cyan-400" />
                </motion.div>
              </div>
            </div>
            {/* Progress text */}
            <div className="flex items-center justify-between text-[8px]">
              <span className="text-stone-400">Rendering...</span>
              <span className="text-cyan-400 font-medium">{renderProgress}%</span>
            </div>
          </div>
        )}

        {stage === 'complete' && (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            {/* Success checkmark */}
            <motion.div
              className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Check className="w-5 h-5 text-mint" strokeWidth={3} />
              </motion.div>
            </motion.div>
            {/* Play button hint */}
            <div className="flex items-center gap-1 text-[8px] text-mint">
              <Play className="w-2.5 h-2.5" fill="currentColor" />
              <span>Ready</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Floating animated video mockups - as DECORATIVE BACKGROUND elements
// Large, semi-transparent, atmospheric - not competing with text
function FloatingVideoMockups() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large decorative card - top right, very transparent */}
      <motion.div
        className="absolute -top-4 -right-8 opacity-20 scale-150"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <MiniProcessCard
          stage="analyzing"
          position="relative"
          rotation={15}
          delay={0.5}
        />
      </motion.div>

      {/* Medium decorative card - bottom right */}
      <motion.div
        className="absolute bottom-[10%] -right-4 opacity-25 scale-125"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <MiniProcessCard
          stage="scripting"
          position="relative"
          rotation={-10}
          delay={0.8}
        />
      </motion.div>

      {/* Smaller accent card - mid-right edge */}
      <motion.div
        className="absolute top-[45%] -right-2 opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1, delay: 1.1 }}
      >
        <MiniProcessCard
          stage="complete"
          position="relative"
          rotation={8}
          delay={1.1}
        />
      </motion.div>
    </div>
  )
}

export function AuthLayout({ children, title, subtitle, badge }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand / social proof (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-surface-dark overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,rgba(16,185,129,0.12),transparent)]" />
        <FloatingShapes />
        <FloatingVideoMockups />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex flex-col justify-between w-full p-12 z-10">
          {/* Logo */}
          <Link href="/">
            <Logo variant="light" size="md" />
          </Link>

          {/* Center content - clean text without heavy card */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <motion.h2
              className="text-3xl font-extrabold text-white mb-4 leading-tight tracking-tight"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Create scroll-stopping UGC videos with{' '}
              <span className="gradient-text">AI</span>
            </motion.h2>
            <motion.p
              className="text-stone-400 text-lg leading-relaxed mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              AI scripts. Realistic avatars. Ready for TikTok & Reels in under 5 minutes.
            </motion.p>

            {/* Trust signals */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {[
                'From $1.90/video — 98% cheaper than UGC creators',
                'From product to post in under 5 minutes',
                '1 free video, no credit card required',
              ].map((item, index) => (
                <motion.div
                  key={item}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                >
                  <div className="w-5 h-5 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0">
                    <motion.svg
                      className="w-3 h-3 text-mint"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  </div>
                  <span className="text-stone-300 text-sm">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom — trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <TrustBarCompact className="justify-start [&_span]:text-stone-400 [&_div]:border-stone-700" />
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-surface flex flex-col relative overflow-hidden">
        {/* Background gradient orb */}
        <GradientOrb
          color="mint"
          size="lg"
          position={{ top: '-20%', right: '-15%' }}
          animated
        />

        {/* Subtle grid on light side */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Mobile header */}
        <motion.header
          className="p-6 relative z-10 lg:hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASINGS.easeOut }}
        >
          <Link href="/">
            <Logo variant="colored" size="sm" />
          </Link>
        </motion.header>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASINGS.easeOut }}
          >
            {/* Badge */}
            {badge && (
              <motion.div
                className="flex justify-center mb-5"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2, type: 'spring' }}
              >
                {badge}
              </motion.div>
            )}

            {/* Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h1 className="text-3xl font-extrabold text-text-primary mb-2 tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-text-muted">{subtitle}</p>
              )}
            </motion.div>

            {/* Content card */}
            <motion.div
              className="bg-surface-raised rounded-2xl border border-border-default p-6 sm:p-8 shadow-soft"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 100 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </main>

        {/* Footer */}
        <motion.footer
          className="p-6 text-center text-sm text-text-muted relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <p>&copy; {new Date().getFullYear()} UGCFirst. All rights reserved.</p>
        </motion.footer>
      </div>
    </div>
  )
}
