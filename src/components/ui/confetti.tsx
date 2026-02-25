'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiProps {
  isActive: boolean
  duration?: number
  particleCount?: number
}

interface Particle {
  id: number
  x: number
  color: string
  delay: number
  rotation: number
  scale: number
}

const colors = ['#10B981', '#F43F5E', '#34D399', '#FB7185', '#F59E0B', '#10B981']

export function Confetti({ isActive, duration = 3000, particleCount = 50 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (isActive) {
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // percentage across screen
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }))
      setParticles(newParticles)

      const timer = setTimeout(() => {
        setParticles([])
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isActive, particleCount, duration])

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-3 h-3"
              style={{
                left: `${particle.x}%`,
                top: -20,
              }}
              initial={{
                y: -20,
                rotate: 0,
                opacity: 1,
                scale: particle.scale,
              }}
              animate={{
                y: window.innerHeight + 50,
                rotate: particle.rotation + 720,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: particle.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {/* Confetti shape - alternating between rectangle, circle, and strip */}
              {particle.id % 3 === 0 ? (
                <div
                  className="w-full h-full rounded-sm"
                  style={{ backgroundColor: particle.color }}
                />
              ) : particle.id % 3 === 1 ? (
                <div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: particle.color }}
                />
              ) : (
                <div
                  className="w-1 h-full rounded-full"
                  style={{ backgroundColor: particle.color }}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// Simpler burst effect for smaller celebrations
interface ConfettiBurstProps {
  trigger: boolean
  colors?: string[]
  className?: string
}

export function ConfettiBurst({ trigger, colors: customColors, className }: ConfettiBurstProps) {
  const burstColors = customColors || ['#10B981', '#F43F5E', '#34D399', '#FB7185']

  if (!trigger) return null

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360
        const distance = 60 + Math.random() * 40
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
            style={{
              backgroundColor: burstColors[i % burstColors.length],
              marginLeft: -4,
              marginTop: -4,
            }}
            initial={{
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.03,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </div>
  )
}

// Emoji confetti for celebrations
interface EmojiConfettiProps {
  isActive: boolean
  emojis?: string[]
  count?: number
}

export function EmojiConfetti({ isActive, emojis = ['🎉', '🎊', '✨', '🌟', '💫'], count = 20 }: EmojiConfettiProps) {
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([])

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
      }))
      setParticles(newParticles)

      const timer = setTimeout(() => setParticles([]), 4000)
      return () => clearTimeout(timer)
    }
  }, [isActive, count, emojis])

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute text-2xl"
              style={{ left: `${particle.x}%`, top: -30 }}
              initial={{ y: -30, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 50,
                opacity: [1, 1, 0],
                rotate: Math.random() * 360,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3 + Math.random(),
                delay: particle.delay,
                ease: 'easeIn',
              }}
            >
              {particle.emoji}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
