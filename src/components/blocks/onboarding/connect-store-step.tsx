'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, PenLine, Check, Sparkles } from 'lucide-react'
import { Button, GradientCard, SPRING } from '@/components/ui'

interface ConnectStoreStepProps {
  onNext: () => void
  onBack: () => void
}

type StoreOption = 'url' | 'manual' | null

const storeOptions = [
  {
    id: 'url' as const,
    name: 'URL Import',
    icon: Link2,
    description: 'Paste any product URL and our AI will extract the details automatically.',
    gradient: 'from-mint to-blue-500',
    recommended: true,
  },
  {
    id: 'manual' as const,
    name: 'Manual Entry',
    icon: PenLine,
    description: 'Manually add products one by one to generate videos.',
    gradient: 'from-coral to-pink-500',
    recommended: false,
  },
]

export function ConnectStoreStep({ onNext, onBack }: ConnectStoreStepProps) {
  const [selectedStore, setSelectedStore] = useState<StoreOption>(null)

  return (
    <div className="text-center">
      {/* Title */}
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-text-primary mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        How Will You Add Products?
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-text-muted mb-10 max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Choose how you want to add products to generate viral video ads in minutes.
      </motion.p>

      {/* Store options - 2 column centered grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 max-w-xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {storeOptions.map((option, index) => {
          const Icon = option.icon
          const isSelected = selectedStore === option.id

          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              className="relative"
            >
              {/* Recommended badge - positioned above card */}
              {option.recommended && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-mint to-mint-dark text-white rounded-full shadow-lg shadow-mint/25">
                    <Sparkles className="w-3 h-3" />
                    Recommended
                  </span>
                </motion.div>
              )}

              <GradientCard
                onClick={() => setSelectedStore(option.id)}
                selected={isSelected}
                glowOnHover
                padding="lg"
                className={`cursor-pointer text-left h-full transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-mint/50' : ''
                }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gradient-to-r from-mint to-mint-dark flex items-center justify-center shadow-lg"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={SPRING.bouncy}
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                {/* Icon with gradient background */}
                <motion.div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-5 shadow-lg`}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={SPRING.bouncy}
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                </motion.div>

                {/* Name */}
                <h3 className="font-semibold text-lg text-text-primary mb-2">
                  {option.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-text-muted leading-relaxed">
                  {option.description}
                </p>

                {/* Selection indicator line */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-mint to-mint-dark rounded-b-2xl"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isSelected ? 1 : 0 }}
                  transition={SPRING.bouncy}
                />
              </GradientCard>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          size="lg"
          onClick={onNext}
          disabled={!selectedStore}
          className="min-w-[200px] shadow-lg shadow-mint/25"
        >
          Continue
        </Button>
      </motion.div>

      {/* Skip option */}
      <motion.button
        className="mt-5 text-sm text-text-muted hover:text-mint transition-colors duration-200"
        onClick={onNext}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        I'll do this later
      </motion.button>
    </div>
  )
}
