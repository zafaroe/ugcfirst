'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Clean characters only - no special symbols for readability
const DECODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export interface GlitchTextProps {
  text: string
  className?: string
  enableGlitch?: boolean
  decodeSpeed?: number
}

export function GlitchText({
  text,
  className,
  enableGlitch = true,
  decodeSpeed = 25
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text)
  const prevTextRef = useRef(text)

  // Clean decode effect on text change
  useEffect(() => {
    if (!enableGlitch) {
      setDisplayText(text)
      return
    }

    // Only decode if text actually changed
    if (prevTextRef.current !== text) {
      prevTextRef.current = text

      let iterations = 0
      const targetLength = text.length

      const interval = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((char, index) => {
              // Keep spaces as spaces
              if (char === ' ') return ' '
              // Reveal characters progressively (faster reveal)
              if (index < iterations) return text[index]
              // Random letter for unrevealed positions
              return DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)]
            })
            .join('')
        )

        if (iterations >= targetLength) {
          clearInterval(interval)
          setDisplayText(text)
        }
        iterations += 1 // Faster decode (was 0.5)
      }, decodeSpeed)

      return () => clearInterval(interval)
    }
  }, [text, enableGlitch, decodeSpeed])

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={text}
        className={cn(
          'inline-block font-semibold tracking-wide',
          className
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {displayText}
      </motion.span>
    </AnimatePresence>
  )
}
