'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo, GradientOrb, FloatingStars, EASINGS } from '@/components/ui'
import { Confetti } from '@/components/ui/confetti'
import {
  WelcomeStep,
  ConnectStoreStep,
  ChoosePlanStep,
  CompleteStep,
} from '@/components/blocks/onboarding'

type OnboardingStep = 'welcome' | 'connect-store' | 'choose-plan' | 'complete'

const steps: OnboardingStep[] = ['welcome', 'connect-store', 'choose-plan', 'complete']

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [showConfetti, setShowConfetti] = useState(false)

  const currentStepIndex = steps.indexOf(currentStep)

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])

      // Trigger confetti on complete step
      if (steps[nextIndex] === 'complete') {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    }
  }

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }

  return (
    <div className="min-h-screen bg-deep-space bg-grid bg-grid-animated flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <GradientOrb
          color="indigo"
          size="xl"
          position={{ top: '-20%', right: '-15%' }}
          animated
        />
        <GradientOrb
          color="fuchsia"
          size="lg"
          position={{ bottom: '-10%', left: '-10%' }}
          animated
        />
        <FloatingStars count={8} />
      </div>

      {/* Confetti */}
      <Confetti isActive={showConfetti} />

      {/* Header with logo and progress */}
      <header className="p-6 relative z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo variant="light" size="sm" />

          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <motion.div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStepIndex
                    ? 'bg-electric-indigo'
                    : 'bg-border-default'
                }`}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: index === currentStepIndex ? 1.2 : 1,
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
            <span className="text-sm text-text-muted ml-2">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: EASINGS.easeOut }}
            className="w-full max-w-2xl"
          >
            {currentStep === 'welcome' && (
              <WelcomeStep onNext={goToNextStep} />
            )}
            {currentStep === 'connect-store' && (
              <ConnectStoreStep
                onNext={goToNextStep}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'choose-plan' && (
              <ChoosePlanStep
                onNext={goToNextStep}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'complete' && (
              <CompleteStep />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {currentStep !== 'complete' && (
        <motion.footer
          className="p-6 text-center relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {currentStep !== 'welcome' && (
            <button
              onClick={goToPreviousStep}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              ← Go back
            </button>
          )}
        </motion.footer>
      )}
    </div>
  )
}
