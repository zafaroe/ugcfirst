'use client'

import { Star, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/gradient-card'
import { motion } from 'framer-motion'

export interface Testimonial {
  id: string
  name: string
  role: string
  avatar: string
  quote: string
  rating: number
}

export interface TestimonialCardProps {
  testimonial: Testimonial
  className?: string
}

export function TestimonialCard({ testimonial, className }: TestimonialCardProps) {
  return (
    <GlassCard padding="lg" className={cn('relative h-full transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.25)]', className)}>
      {/* Quote icon */}
      <Quote className="absolute top-4 right-4 w-8 h-8 text-mint/10" />

      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i < testimonial.rating
                ? 'text-status-warning fill-status-warning'
                : 'text-border-default'
            )}
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-text-primary mb-6 leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-mint to-mint-dark">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-medium">
              {testimonial.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-text-primary text-sm">{testimonial.name}</p>
          <p className="text-text-muted text-xs">{testimonial.role}</p>
        </div>
      </div>
    </GlassCard>
  )
}

// Animated version for landing page
export function TestimonialCardAnimated({
  testimonial,
  className,
  delay = 0
}: TestimonialCardProps & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <TestimonialCard testimonial={testimonial} className={className} />
    </motion.div>
  )
}
