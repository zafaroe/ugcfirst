'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Crown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { SUBSCRIPTION_PLANS } from '@/config/pricing'
import { getBrowserClient } from '@/lib/supabase'
import { redirectToCheckout, fetchPriceIds } from '@/lib/stripe-client'

interface ChoosePlanStepProps {
  onNext: () => void
  onBack: () => void
  preselectedPlan?: string | null
}

// Show only the 3 most relevant plans for onboarding (Starter, Pro, Plus)
// Free is available via "Start Free" link, Agency via "See all plans"
const FEATURED_PLANS = ['starter', 'pro', 'plus']

// Compelling value props for each plan
const planValueProps: Record<string, { tagline: string; highlights: string[] }> = {
  starter: {
    tagline: 'Perfect for getting started',
    highlights: ['7 videos per month', 'No watermark', 'All templates', 'Email support'],
  },
  pro: {
    tagline: 'Best value for growing brands',
    highlights: ['23 videos per month', 'Social scheduling', '10 social accounts', 'Priority support'],
  },
  plus: {
    tagline: 'For power users & teams',
    highlights: ['39 videos per month', 'All caption styles', '2 team seats', 'Everything in Pro'],
  },
}

export function ChoosePlanStep({ onNext, onBack, preselectedPlan }: ChoosePlanStepProps) {
  const initialPlan = preselectedPlan && FEATURED_PLANS.includes(preselectedPlan)
    ? preselectedPlan
    : 'pro'
  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlan)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [stripePrices, setStripePrices] = useState<{
    subscriptions: Record<string, { monthly: string; annual: string }>
  } | null>(null)

  const featuredPlans = SUBSCRIPTION_PLANS.filter(p => FEATURED_PLANS.includes(p.id))

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const prices = await fetchPriceIds()
        setStripePrices(prices)
      } catch (error) {
        console.error('Failed to load Stripe prices:', error)
      }
    }
    loadPrices()
  }, [])

  const handleSelectPlan = async (planId: string) => {
    if (!stripePrices?.subscriptions[planId]) {
      console.error('Price not found for plan:', planId)
      return
    }

    setLoadingPlan(planId)
    try {
      const priceId = stripePrices.subscriptions[planId].monthly
      // Redirect back to onboarding with checkout=success after payment
      const successUrl = `${window.location.origin}/onboarding?checkout=success`
      await redirectToCheckout(priceId, planId, successUrl)
    } catch (error) {
      console.error('Failed to start checkout:', error)
      setLoadingPlan(null)
    }
  }

  const handleStartFree = async () => {
    const supabase = getBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      await supabase.auth.updateUser({ data: { onboarded: true } })
      await supabase
        .from('user_credits')
        .update({ onboarding_completed: true })
        .eq('user_id', session.user.id)
    }
    onNext()
  }

  return (
    <div className="text-center max-w-4xl mx-auto px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
          Choose Your Plan
        </h1>
        <p className="text-lg text-text-muted">
          Credits roll over for 12 months. Cancel anytime.
        </p>
      </motion.div>

      {/* Plan Cards - 3 column layout */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {featuredPlans.map((plan, index) => {
          const isSelected = selectedPlan === plan.id
          const isPopular = plan.isPopular
          const isLoading = loadingPlan === plan.id
          const props = planValueProps[plan.id]

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              onClick={() => !loadingPlan && setSelectedPlan(plan.id)}
              className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                isPopular
                  ? 'bg-gradient-to-b from-mint/15 via-mint/8 to-transparent border-2 border-mint shadow-xl shadow-mint/20 scale-[1.02]'
                  : isSelected
                  ? 'bg-surface-raised border-2 border-mint/60 shadow-lg'
                  : 'bg-surface-raised border border-border-default hover:border-mint/40 hover:shadow-md'
              }`}
            >
              {/* Popular badge */}
              {isPopular && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-mint to-mint-dark text-white rounded-full shadow-lg">
                    <Crown className="w-3 h-3" />
                    Most Popular
                  </span>
                </motion.div>
              )}

              {/* Selected indicator */}
              {isSelected && !isPopular && (
                <motion.div
                  className="absolute top-4 right-4 w-6 h-6 rounded-full bg-mint flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Plan name */}
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 mt-2">
                {plan.name}
              </h3>

              {/* Price - prominent */}
              <div className="mb-2">
                <span className="text-5xl font-extrabold text-text-primary tracking-tight">${plan.price}</span>
                <span className="text-text-muted text-base ml-1">/mo</span>
              </div>

              {/* Tagline */}
              <p className="text-sm text-mint font-medium mb-5">
                {props?.tagline}
              </p>

              {/* Credits & Videos - highlighted */}
              <div className="flex items-center justify-center gap-3 text-sm rounded-lg py-2.5 px-4 mb-5" style={{ backgroundColor: 'rgba(12, 10, 9, 0.6)' }}>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber" />
                  <span className="font-semibold text-text-primary">{plan.credits}</span>
                  <span className="text-text-muted">credits</span>
                </div>
                <div className="w-px h-4 bg-border-default" />
                <div>
                  <span className="font-semibold text-text-primary">{plan.videoCount}</span>
                  <span className="text-text-muted ml-1">videos</span>
                </div>
              </div>

              {/* Feature highlights */}
              <ul className="space-y-2.5 text-left mb-6">
                {props?.highlights.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <div className="w-4 h-4 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-mint" strokeWidth={3} />
                    </div>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className="w-full"
                variant={isPopular || isSelected ? 'primary' : 'secondary'}
                size="lg"
                isLoading={isLoading}
                disabled={loadingPlan !== null && loadingPlan !== plan.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectPlan(plan.id)
                }}
              >
                {isPopular ? 'Get Started' : 'Subscribe'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {/* Cost per video */}
              {plan.costPerVideo > 0 && (
                <p className="text-xs text-text-muted mt-3">
                  ${plan.costPerVideo.toFixed(2)} per video
                </p>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Alternative options */}
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <button
          onClick={handleStartFree}
          className="text-text-muted hover:text-mint transition-colors flex items-center gap-1.5 group"
        >
          <span>Start with</span>
          <span className="font-semibold text-text-primary group-hover:text-mint">Free plan</span>
          <span className="text-text-disabled">(1 video with watermark)</span>
        </button>

        <span className="hidden sm:block text-text-disabled">•</span>

        <a
          href="/pricing"
          className="text-text-muted hover:text-mint transition-colors"
        >
          See all plans including Agency
        </a>
      </motion.div>

      {/* Trust badges */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-border-default"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Check className="w-3.5 h-3.5 text-status-success" />
          <span>Cancel anytime</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Check className="w-3.5 h-3.5 text-status-success" />
          <span>Credits roll over 12 months</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Check className="w-3.5 h-3.5 text-status-success" />
          <span>No hidden fees</span>
        </div>
      </motion.div>
    </div>
  )
}
