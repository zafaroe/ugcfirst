'use client'

import { motion } from 'framer-motion'
import { Star, TrendingUp, Video, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

// Avatar data for the stack
const avatars = [
  { initials: 'JD', color: 'from-pink-500 to-rose-500' },
  { initials: 'MK', color: 'from-violet-500 to-purple-500' },
  { initials: 'AS', color: 'from-blue-500 to-cyan-500' },
  { initials: 'RL', color: 'from-emerald-500 to-green-500' },
  { initials: 'TC', color: 'from-amber-500 to-orange-500' },
]

// Stats for the trust bar
const trustStats = [
  { icon: Video, value: '10,000+', label: 'Videos Created' },
  { icon: TrendingUp, value: '3.2x', label: 'Avg. ROAS' },
  { icon: Users, value: '500+', label: 'Happy Creators' },
]

export function TrustBar({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className={cn(
        'w-full max-w-4xl mx-auto px-6',
        className
      )}
    >
      <div className="relative">
        {/* Glassmorphic Container */}
        <div className="relative bg-surface/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-electric-indigo/5 via-transparent to-vibrant-fuchsia/5 rounded-2xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            {/* Left: Avatar Stack + Rating */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Avatar Stack */}
              <div className="flex items-center">
                <div className="flex -space-x-3">
                  {avatars.map((avatar, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.5, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1, type: 'spring', stiffness: 200 }}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        'text-white text-xs font-semibold',
                        'border-2 border-deep-space',
                        'bg-gradient-to-br',
                        avatar.color
                      )}
                      style={{ zIndex: avatars.length - index }}
                    >
                      {avatar.initials}
                    </motion.div>
                  ))}
                </div>

                {/* +More indicator */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4 }}
                  className="w-10 h-10 rounded-full bg-surface border-2 border-deep-space flex items-center justify-center text-text-muted text-xs font-medium -ml-3"
                >
                  +495
                </motion.div>
              </div>

              {/* Rating */}
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.0 + i * 0.1, type: 'spring' }}
                    >
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  ))}
                  <span className="ml-1 text-text-primary font-semibold">4.9</span>
                </div>
                <span className="text-text-muted text-sm">Loved by creators</span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-border-default/50" />

            {/* Right: Stats */}
            <div className="flex items-center gap-6 md:gap-8">
              {trustStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <stat.icon className="w-4 h-4 text-electric-indigo" />
                    <span className="text-lg md:text-xl font-bold gradient-text">{stat.value}</span>
                  </div>
                  <span className="text-text-muted text-xs md:text-sm whitespace-nowrap">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Glow effect behind */}
        <div className="absolute -inset-1 bg-gradient-to-r from-electric-indigo/20 to-vibrant-fuchsia/20 rounded-2xl blur-xl opacity-50 -z-10" />
      </div>
    </motion.div>
  )
}

// Compact version for hero section
export function TrustBarCompact({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className={cn('flex items-center justify-center gap-4 flex-wrap', className)}
    >
      {/* Avatar Stack - Smaller */}
      <div className="flex -space-x-2">
        {avatars.slice(0, 4).map((avatar, index) => (
          <div
            key={index}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              'text-white text-[10px] font-semibold',
              'border-2 border-deep-space',
              'bg-gradient-to-br',
              avatar.color
            )}
            style={{ zIndex: avatars.length - index }}
          >
            {avatar.initials}
          </div>
        ))}
      </div>

      {/* Rating inline */}
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <span className="text-text-primary text-sm font-medium">4.9/5</span>
        <span className="text-text-muted text-sm hidden sm:inline">from 500+ creators</span>
      </div>
    </motion.div>
  )
}
