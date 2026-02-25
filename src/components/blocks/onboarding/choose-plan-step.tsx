'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, Zap } from 'lucide-react'
import { Button, GradientCard, SPRING } from '@/components/ui'
import { mockPricingPlans } from '@/mocks/data'

interface ChoosePlanStepProps {
  onNext: () => void
  onBack: () => void
}

export function ChoosePlanStep({ onNext, onBack }: ChoosePlanStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')

  return (
    <div className="text-center">
      {/* Title */}
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-text-primary mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Choose Your Plan
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-text-muted mb-10 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Select the plan that best fits your needs. All plans include rollover credits.
      </motion.p>

      {/* Pricing cards */}
      <motion.div
        className="grid sm:grid-cols-2 2xl:grid-cols-4 gap-4 mb-10 max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {mockPricingPlans.map((plan, index) => {
          const isSelected = selectedPlan === plan.id
          const isPopular = plan.isPopular

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="relative"
            >
              {/* Popular badge */}
              {isPopular && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-mint to-mint-dark text-white rounded-full shadow-lg shadow-mint/25 whitespace-nowrap">
                    <Crown className="w-3 h-3" />
                    Most Popular
                  </span>
                </motion.div>
              )}

              <GradientCard
                onClick={() => setSelectedPlan(plan.id)}
                selected={isSelected}
                glowOnHover
                padding="sm"
                className={`cursor-pointer text-left h-full flex flex-col transition-all duration-300 p-4 ${
                  isSelected ? 'ring-2 ring-mint/50' : ''
                } ${isPopular ? 'pt-6' : ''}`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r from-mint to-mint-dark flex items-center justify-center shadow-lg"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={SPRING.bouncy}
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                {/* Plan name & Price */}
                <h3 className="font-semibold text-base text-text-primary mb-1">
                  {plan.name}
                </h3>
                <div className="mb-3">
                  <span className="text-xl font-bold text-text-primary">${plan.price}</span>
                  <span className="text-text-muted text-xs">/mo</span>
                </div>

                {/* Credits */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border-default">
                  <Zap className="w-4 h-4 text-mint flex-shrink-0" />
                  <span className="text-sm font-semibold text-text-primary">{plan.credits}</span>
                  <span className="text-xs text-text-muted">credits · ~{plan.videoCount} videos</span>
                </div>

                {/* Key features */}
                <ul className="space-y-1.5 text-left flex-1">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Check className="w-3 h-3 text-status-success flex-shrink-0" strokeWidth={2.5} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

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

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          size="lg"
          onClick={onNext}
          className="min-w-[220px] shadow-lg shadow-mint/25"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Start with {mockPricingPlans.find(p => p.id === selectedPlan)?.name}
        </Button>
      </motion.div>

      {/* Credits note */}
      <motion.p
        className="mt-5 text-xs text-text-muted flex items-center justify-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Check className="w-3 h-3 text-status-success" />
        Credits rollover for 12 months, unlike competitors who expire monthly.
      </motion.p>
    </div>
  )
}
