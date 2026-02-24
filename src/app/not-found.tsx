'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Film, MousePointer2 } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'

// Director quotes that rotate
const quotes = [
  {
    text: "I asked for a landing page, not a crash landing.",
    author: "The Algorithm"
  },
  {
    text: "In my defense, the URL looked suspicious from the start.",
    author: "The Server"
  },
  {
    text: "404 takes and counting. This page is a method actor.",
    author: "The Database"
  },
  {
    text: "We'll fix it in post... any decade now.",
    author: "The Dev Team"
  },
  {
    text: "The page you seek has been recast. Permanently.",
    author: "HR"
  }
]

// Falling film objects
const fallingObjects = ['🎬', '💡', '🎥', '🎞️', '🎭', '📽️']

export default function NotFound() {
  const [currentQuote, setCurrentQuote] = useState(0)
  const [isSnapping, setIsSnapping] = useState(false)

  // Auto-rotate quotes every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  // Auto-snap clapper every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSnapping(true)
      setTimeout(() => setIsSnapping(false), 500)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Handle clapperboard click
  const handleReshoot = () => {
    setCurrentQuote((prev) => (prev + 1) % quotes.length)
    setIsSnapping(true)
    setTimeout(() => setIsSnapping(false), 500)
  }

  return (
    <div className="min-h-screen bg-deep-space text-text-primary overflow-hidden relative">
      {/* Film Grain Overlay */}
      <div
        className="fixed inset-0 z-[1000] pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          animation: 'grain 0.5s steps(10) infinite',
        }}
      />

      {/* Stage Spotlights */}
      <motion.div
        className="absolute -top-[200px] -left-[200px] w-[600px] h-[600px] rounded-full blur-[100px] bg-amber-500/20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full blur-[100px] bg-vibrant-fuchsia/20"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.15, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-[200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[100px] bg-electric-indigo/20"
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.2, 0.15] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Falling Objects */}
      {fallingObjects.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl md:text-3xl opacity-60 pointer-events-none select-none"
          style={{ left: `${10 + i * 15}%` }}
          initial={{ y: -100, rotate: 0 }}
          animate={{
            y: ['calc(-100px)', 'calc(100vh + 100px)'],
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'linear',
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/">
          <Logo variant="light" size="sm" />
        </Link>

        {/* REC Indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-3 h-3 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs text-text-muted font-mono hidden md:inline">
            NOT RECORDING
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-24">
        {/* Clapperboard */}
        <motion.div
          className="relative cursor-pointer mb-8"
          onClick={handleReshoot}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          role="img"
          aria-label="Film clapperboard showing 404 error"
        >
          {/* Clapperboard Container */}
          <div className="relative w-[240px] md:w-[280px]">
            {/* Clapper Top (Hinged part with stripes) */}
            <motion.div
              className="relative h-8 md:h-10 rounded-t-lg overflow-hidden origin-bottom"
              animate={isSnapping ? { rotateX: [-30, 0] } : {}}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: 'repeating-linear-gradient(135deg, #000 0px, #000 12px, #fff 12px, #fff 24px)',
                }}
              />
            </motion.div>

            {/* Clapperboard Body */}
            <div className="bg-[#1c1917] border-2 border-neutral-700 rounded-b-lg p-4 md:p-5">
              {/* Info Rows */}
              <div className="space-y-1.5 text-xs font-mono border-b border-neutral-700 pb-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-neutral-500">PRODUCTION</span>
                  <span className="text-text-primary">VIDNARY.COM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">DIRECTOR</span>
                  <span className="text-text-primary">AI GONE ROGUE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">SCENE</span>
                  <span className="text-text-primary">PAGE NOT FOUND</span>
                </div>
              </div>

              {/* 404 Number */}
              <div className="text-center">
                <span
                  className="text-[3rem] md:text-[4rem] font-black leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  404
                </span>
                <div className="text-neutral-500 text-sm font-mono mt-1">
                  TAKE ∞
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Click Hint */}
        <motion.div
          className="flex items-center gap-2 text-text-muted text-sm mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <MousePointer2 className="w-4 h-4" />
          </motion.div>
          <span>Click to reshoot</span>
        </motion.div>

        {/* Message */}
        <div className="text-center max-w-md mb-8">
          <h1
            className="text-2xl md:text-3xl font-extrabold mb-3"
            style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}
          >
            The director yelled{' '}
            <span className="text-amber-500">&ldquo;CUT!&rdquo;</span>
            <br />on this page
          </h1>
          <p className="text-text-muted">
            Looks like this scene didn&apos;t survive the editing room.
            <br />
            Our AI must have gone{' '}
            <em className="text-vibrant-fuchsia">completely off-script</em> again.
          </p>
        </div>

        {/* Rotating Quote */}
        <div
          className="max-w-md w-full mb-10 px-4"
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={currentQuote}
              className="border-l-4 border-amber-500 bg-surface/50 rounded-r-lg p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-text-primary italic mb-2">
                &ldquo;{quotes[currentQuote].text}&rdquo;
              </p>
              <footer className="text-text-muted text-sm">
                — {quotes[currentQuote].author}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link href="/">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              leftIcon={<Play className="w-4 h-4 fill-current" />}
            >
              Back to Main Set
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              leftIcon={<Film className="w-4 h-4" />}
            >
              My Projects
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-4 left-0 right-0 text-center opacity-50">
        <code className="bg-electric-indigo/20 text-electric-indigo px-2 py-1 rounded text-xs font-mono">
          ERR_SCENE_NOT_FOUND
        </code>
        <p className="text-text-muted text-xs mt-2">
          The show must go on
        </p>
      </footer>

      {/* Grain Animation Keyframes */}
      <style jsx global>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(1%, 1%); }
          30% { transform: translate(-1%, 1%); }
          40% { transform: translate(1%, -1%); }
          50% { transform: translate(-1%, 0); }
          60% { transform: translate(1%, 0); }
          70% { transform: translate(0, 1%); }
          80% { transform: translate(0, -1%); }
          90% { transform: translate(1%, 1%); }
        }
      `}</style>
    </div>
  )
}
