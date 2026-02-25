'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RotatingHeadlineProps {
  words: string[]
  interval?: number
  className?: string
}

export function RotatingHeadline({ words, interval = 3000, className }: RotatingHeadlineProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, interval)
    return () => clearInterval(timer)
  }, [words.length, interval])

  return (
    <span className={cn('inline-flex relative align-baseline', className)}>
      {/* Hidden words to reserve width of the longest word */}
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {words.reduce((a, b) => (a.length >= b.length ? a : b), '')}
      </span>
      {/* Animated visible word, absolutely positioned over the reserved space */}
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
          className="absolute left-0 top-0 whitespace-nowrap gradient-text"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
