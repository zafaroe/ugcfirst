'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Link2, Wand2, User, Video, Sparkles, Play, RotateCcw } from 'lucide-react'

// Animation steps for the process
const STEPS = [
  {
    id: 'idle',
    icon: Play,
    title: 'AI-Generated UGC',
    subtitle: 'Click to see the magic',
    color: 'mint',
    duration: 0,
  },
  {
    id: 'analyzing',
    icon: Link2,
    title: 'Analyzing Product',
    subtitle: 'Extracting details & images...',
    color: 'mint',
    duration: 2000,
  },
  {
    id: 'script',
    icon: Wand2,
    title: 'Writing Script',
    subtitle: 'Crafting viral hooks...',
    color: 'amber',
    duration: 2200,
  },
  {
    id: 'avatar',
    icon: User,
    title: 'Creating Avatar',
    subtitle: 'Selecting perfect presenter...',
    color: 'coral',
    duration: 1800,
  },
  {
    id: 'rendering',
    icon: Video,
    title: 'Rendering Video',
    subtitle: 'Assembling final output...',
    color: 'mint',
    duration: 2500,
  },
  {
    id: 'complete',
    icon: Sparkles,
    title: 'Video Ready!',
    subtitle: 'Ready to download & post',
    color: 'mint',
    duration: 3000,
  },
]

// Floating particles inside the phone during animation
function PhoneParticles({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-mint/60"
          style={{
            left: `${20 + (i % 4) * 20}%`,
            top: `${20 + Math.floor(i / 4) * 25}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 0.8, 0],
            y: [-10, -30 - Math.random() * 20],
            x: (Math.random() - 0.5) * 30,
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.15,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        />
      ))}
    </div>
  )
}

// Progress ring around the icon
function ProgressRing({ progress, color }: { progress: number; color: string }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const colorClass = {
    mint: 'stroke-mint',
    amber: 'stroke-amber',
    coral: 'stroke-coral',
  }[color] || 'stroke-mint'

  return (
    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
      {/* Background ring */}
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-white/10"
      />
      {/* Progress ring */}
      <motion.circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        className={colorClass}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset,
        }}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </svg>
  )
}

// Scanning line animation for analyzing step
function ScanLine({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <motion.div
      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-mint to-transparent"
      initial={{ top: '20%', opacity: 0 }}
      animate={{
        top: ['20%', '80%', '20%'],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Typewriter effect for script step
function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    if (!active) {
      setDisplayedText('')
      return
    }

    let index = 0
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 60)

    return () => clearInterval(interval)
  }, [active, text])

  if (!active) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-x-4 top-24 text-left"
    >
      <div className="bg-stone-800/80 rounded-lg p-3 border border-border-default/50">
        <p className="text-[10px] text-mint font-mono mb-1">script.txt</p>
        <p className="text-[11px] text-text-muted font-mono leading-relaxed">
          {displayedText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            |
          </motion.span>
        </p>
      </div>
    </motion.div>
  )
}

// Avatar preview for avatar step
function AvatarPreview({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute inset-x-4 top-20 flex gap-2 justify-center"
    >
      {[
        { name: 'Sofia', gradient: 'from-pink-400 to-rose-500' },
        { name: 'Alex', gradient: 'from-blue-400 to-indigo-500', selected: true },
        { name: 'Jordan', gradient: 'from-amber-400 to-orange-500' },
      ].map((avatar, i) => (
        <motion.div
          key={avatar.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className={`relative flex flex-col items-center ${avatar.selected ? 'scale-110' : 'opacity-60'}`}
        >
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-white text-xs font-bold ${avatar.selected ? 'ring-2 ring-mint ring-offset-2 ring-offset-surface' : ''}`}>
            {avatar.name[0]}
          </div>
          <span className="text-[9px] text-text-muted mt-1">{avatar.name}</span>
          {avatar.selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-mint flex items-center justify-center"
            >
              <Check className="w-2.5 h-2.5 text-white" />
            </motion.div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Video render progress for rendering step
function RenderProgress({ active, progress }: { active: boolean; progress: number }) {
  if (!active) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute inset-x-4 top-24"
    >
      <div className="bg-stone-800/80 rounded-lg p-3 border border-border-default/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-text-muted">Rendering frames...</span>
          <span className="text-[10px] text-mint font-mono">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-mint to-mint-light rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-8 bg-stone-700 rounded animate-pulse" />
          <div className="flex-1 h-8 bg-stone-700 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="flex-1 h-8 bg-stone-700 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </motion.div>
  )
}

// Final success state
function SuccessState({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      {/* Confetti burst */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${['bg-mint', 'bg-coral', 'bg-amber', 'bg-pink-400', 'bg-blue-400'][i % 5]}`}
            style={{
              left: '50%',
              top: '40%',
            }}
            initial={{ scale: 0 }}
            animate={{
              scale: [0, 1, 0.5],
              x: (Math.random() - 0.5) * 200,
              y: Math.random() * 150 - 50,
              opacity: [0, 1, 0],
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: 1,
              delay: i * 0.03,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Video preview card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl p-1 shadow-lg"
      >
        <div className="w-32 h-44 rounded-lg bg-gradient-to-br from-mint/20 to-coral/20 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="w-10 h-10 rounded-full bg-mint flex items-center justify-center mx-auto mb-2"
            >
              <Check className="w-5 h-5 text-white" />
            </motion.div>
            <p className="text-[10px] font-semibold text-text-primary">product_ad.mp4</p>
            <p className="text-[9px] text-text-muted">00:32 • 1080p</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function HeroPhoneAnimation() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [stepProgress, setStepProgress] = useState(0)

  const currentStep = STEPS[currentStepIndex]
  const Icon = currentStep.icon

  // Handle step progression
  useEffect(() => {
    if (!isAnimating || currentStepIndex === 0) return

    const step = STEPS[currentStepIndex]
    const startTime = Date.now()

    // Progress animation
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / step.duration, 1)
      setStepProgress(progress)

      if (progress >= 1) {
        clearInterval(progressInterval)

        // Move to next step or reset
        if (currentStepIndex < STEPS.length - 1) {
          setTimeout(() => {
            setCurrentStepIndex(prev => prev + 1)
            setStepProgress(0)
          }, 200)
        } else {
          // Animation complete - stay on success for a bit then allow replay
          setTimeout(() => {
            setIsAnimating(false)
          }, 2000)
        }
      }
    }, 50)

    return () => clearInterval(progressInterval)
  }, [currentStepIndex, isAnimating])

  const handleClick = () => {
    if (isAnimating && currentStepIndex !== STEPS.length - 1) return

    if (currentStepIndex === STEPS.length - 1 || !isAnimating) {
      // Reset and start
      setCurrentStepIndex(1)
      setStepProgress(0)
      setIsAnimating(true)
    }
  }

  const handleReset = () => {
    setCurrentStepIndex(0)
    setStepProgress(0)
    setIsAnimating(false)
  }

  const colorClasses = {
    mint: {
      bg: 'bg-mint/15',
      ring: 'ring-mint/20',
      text: 'text-mint',
    },
    amber: {
      bg: 'bg-amber/15',
      ring: 'ring-amber/20',
      text: 'text-amber',
    },
    coral: {
      bg: 'bg-coral/15',
      ring: 'ring-coral/20',
      text: 'text-coral',
    },
  }[currentStep.color] || { bg: 'bg-mint/15', ring: 'ring-mint/20', text: 'text-mint' }

  return (
    <div className="relative w-[280px] h-[560px]">
      {/* Phone frame */}
      <div className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-b from-stone-900 to-stone-800 p-[10px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)]">
        {/* Screen */}
        <div
          className="w-full h-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-surface-secondary to-surface relative cursor-pointer"
          onClick={handleClick}
        >
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center z-20">
            <div className="w-24 h-6 bg-stone-900 rounded-b-2xl" />
          </div>

          {/* Animated background effects */}
          <PhoneParticles active={isAnimating} />
          <ScanLine active={currentStep.id === 'analyzing'} />

          {/* Step-specific content */}
          <TypewriterText
            text='"Stop scrolling! This changed everything for my skin..."'
            active={currentStep.id === 'script'}
          />
          <AvatarPreview active={currentStep.id === 'avatar'} />
          <RenderProgress active={currentStep.id === 'rendering'} progress={stepProgress} />
          <SuccessState active={currentStep.id === 'complete'} />

          {/* Main icon and status (hidden during special states) */}
          {!['complete'].includes(currentStep.id) && (
            <div className="absolute inset-0 flex items-center justify-center pt-8">
              <div className="text-center">
                <motion.div
                  key={currentStep.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`relative w-20 h-20 rounded-full ${colorClasses.bg} flex items-center justify-center mx-auto mb-4 ring-4 ${colorClasses.ring}`}
                >
                  {/* Progress ring */}
                  {isAnimating && currentStepIndex > 0 && currentStep.id !== 'complete' && (
                    <ProgressRing progress={stepProgress} color={currentStep.color} />
                  )}

                  {/* Icon with pulse */}
                  <motion.div
                    animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Icon className={`w-8 h-8 ${colorClasses.text}`} />
                  </motion.div>
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-text-primary text-sm font-semibold">{currentStep.title}</p>
                    <p className="text-text-muted text-xs mt-1">{currentStep.subtitle}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Bottom badge */}
          <AnimatePresence>
            {!isAnimating && currentStepIndex === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-stone-800/90 backdrop-blur-sm rounded-xl p-3 border border-border-default/50"
              >
                <div>
                  <p className="text-[10px] font-semibold text-text-primary">Made with UGCFirst</p>
                  <p className="text-[9px] text-text-muted">Click to see demo</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mint to-mint-dark flex items-center justify-center">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step indicator dots */}
          {isAnimating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5"
            >
              {STEPS.slice(1).map((step, i) => (
                <motion.div
                  key={step.id}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    i + 1 < currentStepIndex
                      ? 'bg-mint'
                      : i + 1 === currentStepIndex
                        ? 'bg-mint/60'
                        : 'bg-white/20'
                  }`}
                />
              ))}
            </motion.div>
          )}

          {/* Reset button after completion */}
          {!isAnimating && currentStepIndex === STEPS.length - 1 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-stone-800/90 backdrop-blur-sm rounded-full px-4 py-2 border border-border-default/50 hover:bg-stone-700/90 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-mint" />
              <span className="text-[11px] font-medium text-text-primary">Watch again</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Glow effect when animating */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-4 bg-mint/10 rounded-[3rem] blur-2xl -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
