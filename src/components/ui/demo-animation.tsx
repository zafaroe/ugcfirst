'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Link2, Sparkles, Download, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type DemoState = 'input' | 'processing' | 'output'

const TIMING = {
  input: 2500,
  processing: 2500,
  output: 4000,
}

export function DemoAnimation({ className }: { className?: string }) {
  const [state, setState] = useState<DemoState>('input')

  useEffect(() => {
    const cycle = () => {
      setState('input')
      setTimeout(() => setState('processing'), TIMING.input)
      setTimeout(() => setState('output'), TIMING.input + TIMING.processing)
    }

    cycle()
    const interval = setInterval(cycle, TIMING.input + TIMING.processing + TIMING.output)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn('relative', className)}>
      {/* Phone Frame */}
      <div className="relative mx-auto w-[280px] sm:w-[320px] md:w-[360px]">
        {/* Phone Bezel */}
        <div className="relative bg-surface rounded-[2.5rem] p-3 shadow-2xl border border-border-default">
          {/* Screen */}
          <div className="relative bg-deep-space rounded-[2rem] overflow-hidden aspect-[9/16]">
            <AnimatePresence mode="wait">
              {state === 'input' && <InputState key="input" />}
              {state === 'processing' && <ProcessingState key="processing" />}
              {state === 'output' && <OutputState key="output" />}
            </AnimatePresence>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-text-muted/30 rounded-full" />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex gap-2 justify-center mt-6">
        <StepDot label="Input" active={state === 'input'} />
        <StepDot label="Processing" active={state === 'processing'} />
        <StepDot label="Output" active={state === 'output'} />
      </div>
    </div>
  )
}

function StepDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        className={cn(
          'w-2.5 h-2.5 rounded-full transition-colors duration-300',
          active ? 'bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia' : 'bg-border-default'
        )}
        animate={active ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, repeat: active ? Infinity : 0, repeatDelay: 0.5 }}
      />
      <span className={cn(
        'text-xs transition-colors duration-300',
        active ? 'text-text-primary' : 'text-text-muted'
      )}>
        {label}
      </span>
    </div>
  )
}

// Input State - Product URL paste
function InputState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border-default/50">
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Link2 className="w-4 h-4" />
          <span>Paste product URL</span>
        </div>
      </div>

      {/* URL Input Animation */}
      <div className="p-4">
        <div className="bg-elevated rounded-lg p-3 border border-border-default">
          <TypewriterText text="amazon.com/dp/B08N5..." />
        </div>
      </div>

      {/* Product Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="flex-1 p-4"
      >
        <div className="bg-elevated rounded-xl p-3 border border-border-default h-full">
          {/* Product Image Placeholder */}
          <div className="bg-gradient-to-br from-electric-indigo/20 to-vibrant-fuchsia/20 rounded-lg aspect-square mb-3 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-electric-indigo/40 to-vibrant-fuchsia/40 rounded-lg" />
          </div>
          {/* Product Info */}
          <div className="space-y-2">
            <div className="h-3 bg-text-muted/20 rounded w-3/4" />
            <div className="h-3 bg-text-muted/20 rounded w-1/2" />
            <div className="h-4 bg-status-success/30 rounded w-16 mt-3" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Processing State - AI Magic
function ProcessingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      {/* Shimmer Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-electric-indigo/10 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia"
          style={{
            left: `${20 + (i % 4) * 20}%`,
            top: `${20 + Math.floor(i / 4) * 40}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Center Content */}
      <div className="relative z-10 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="mb-4"
        >
          <Sparkles className="w-12 h-12 text-electric-indigo mx-auto" />
        </motion.div>
        <p className="text-text-primary font-medium mb-2">AI is creating your video</p>
        <p className="text-text-muted text-sm">Analyzing product...</p>

        {/* Progress Bar */}
        <div className="mt-4 w-48 h-1.5 bg-border-default rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.2, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// Output State - Video Ready
function OutputState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Video Player Mockup */}
      <div className="flex-1 relative">
        {/* Video Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space via-surface to-deep-space" />

        {/* Avatar in Video */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="absolute inset-4 flex items-center justify-center"
        >
          {/* Avatar Circle */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-electric-indigo to-vibrant-fuchsia flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            {/* Speaking Animation */}
            <motion.div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-white/80 rounded-full"
              animate={{ scaleX: [1, 1.3, 0.8, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Product Overlay (small) */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="absolute bottom-20 right-4 w-16 h-16 bg-elevated rounded-lg border border-border-default overflow-hidden"
        >
          <div className="w-full h-full bg-gradient-to-br from-electric-indigo/30 to-vibrant-fuchsia/30" />
        </motion.div>

        {/* Play Button Overlay */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </motion.div>
      </div>

      {/* Video Controls */}
      <div className="p-4 bg-surface/80 backdrop-blur">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-text-muted">0:00</span>
          <div className="flex-1 h-1 bg-border-default rounded-full overflow-hidden">
            <div className="w-0 h-full bg-electric-indigo rounded-full" />
          </div>
          <span className="text-xs text-text-muted">0:32</span>
        </div>

        {/* Ready Badge + Download */}
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-status-success/20 rounded-full"
          >
            <div className="w-2 h-2 bg-status-success rounded-full" />
            <span className="text-xs text-status-success font-medium">Ready to post</span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia rounded-lg text-white text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// Typewriter effect component
function TypewriterText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index))
        index++
      }
    }, 80)
    return () => clearInterval(interval)
  }, [text])

  return (
    <span className="text-text-primary text-sm font-mono">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="text-electric-indigo"
      >
        |
      </motion.span>
    </span>
  )
}
