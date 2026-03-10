'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark, faLightbulb } from '@fortawesome/free-solid-svg-icons'
import {
  Logo,
  Button,
  GradientOrb,
  FloatingStars,
  FloatingOrbs,
  AmbientParticles,
  WaveLines,
  GlowingGrid,
  StaggerContainer,
  StaggerItem,
  Accordion,
} from '@/components/ui'
import { ComparisonArena } from '@/components/composed'
import { SUBSCRIPTION_PLANS, CREDIT_PACKS, PRICING_FAQ } from '@/config/pricing'
import { redirectToCheckout, fetchPriceIds } from '@/lib/stripe-client'
import { getBrowserClient } from '@/lib/supabase'

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [stripePrices, setStripePrices] = useState<{
    subscriptions: Record<string, { monthly: string; annual: string }>
    credit_packs: Record<string, { price: string; credits: number }>
  } | null>(null)

  // Check auth status and fetch Stripe prices on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      setAuthChecked(true)
    }

    const loadPrices = async () => {
      try {
        const prices = await fetchPriceIds()
        setStripePrices(prices)
      } catch (error) {
        console.error('Failed to load Stripe prices:', error)
      }
    }

    checkAuth()
    loadPrices()
  }, [])

  const handleSubscribe = async (planId: string) => {
    // Always redirect to signup if not logged in (double-check)
    if (!authChecked || !isLoggedIn) {
      window.location.href = `/signup?plan=${planId}&interval=${billingInterval}`
      return
    }

    if (!stripePrices?.subscriptions[planId]) {
      console.error('Price not found for plan:', planId)
      return
    }

    setLoadingPlan(planId)
    try {
      // Use monthly or annual price based on toggle
      const priceId = billingInterval === 'annual'
        ? stripePrices.subscriptions[planId].annual
        : stripePrices.subscriptions[planId].monthly
      await redirectToCheckout(priceId, planId)
    } catch (error) {
      console.error('Checkout error:', error)
      setLoadingPlan(null)
    }
  }

  // Calculate displayed price based on billing interval
  const getDisplayPrice = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    return billingInterval === 'annual' ? plan.annualPrice : plan.price
  }

  // Calculate savings for annual billing
  const getAnnualSavings = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (plan.price === 0) return 0
    const monthlyCost = plan.price * 12
    const annualCost = plan.annualTotal
    return monthlyCost - annualCost
  }

  const handleBuyCreditPack = async (packId: string) => {
    // Always redirect to signup if not logged in (double-check)
    if (!authChecked || !isLoggedIn) {
      window.location.href = `/signup?pack=${packId}`
      return
    }

    if (!stripePrices?.credit_packs[packId]) {
      console.error('Price not found for pack:', packId)
      return
    }

    setLoadingPlan(packId)
    try {
      // Pass packId for fallback redirect if session expired
      await redirectToCheckout(stripePrices.credit_packs[packId].price, packId)
    } catch (error) {
      console.error('Checkout error:', error)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream bg-grid bg-grid-animated relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <GradientOrb color="indigo" size="xl" position={{ top: '-15%', right: '-10%' }} animated />
        <GradientOrb color="fuchsia" size="lg" position={{ bottom: '5%', left: '-5%' }} animated />
        <FloatingStars count={6} />
        <FloatingOrbs count={3} className="opacity-30" />
        <AmbientParticles count={10} className="opacity-25" />
      </div>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Gradient mesh background */}
      <div className="gradient-mesh" />

      {/* Header - High Contrast Design */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo variant="colored" size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            {authChecked ? (
              isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-stone-300 hover:text-white text-sm font-semibold transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link href="/settings/billing">
                    <Button variant="secondary" size="sm" className="border-stone-600 text-stone-200 hover:bg-stone-800">
                      Billing
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className="text-stone-300 hover:text-white text-sm font-semibold transition-colors"
                  >
                    Back to Home
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary" size="sm" className="border-stone-600 text-stone-200 hover:bg-stone-800">
                      Sign In
                    </Button>
                  </Link>
                </>
              )
            ) : (
              // Show skeleton while checking auth to prevent flash
              <div className="flex items-center gap-4">
                <div className="w-20 h-4 bg-stone-700 rounded animate-pulse" />
                <div className="w-16 h-8 bg-stone-700 rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include access to our AI video generation platform.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          className="flex justify-center mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-3 p-1.5 bg-surface-raised rounded-full border border-border-default">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-gradient-to-r from-mint to-mint-dark text-white shadow-md'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingInterval === 'annual'
                  ? 'bg-gradient-to-r from-mint to-mint-dark text-white shadow-md'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Annual
              <span className="px-2 py-0.5 bg-coral/20 text-coral text-xs font-bold rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-16 items-stretch" staggerDelay={0.1}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <StaggerItem key={plan.id} className="flex">
              <motion.div
                className={`relative w-full rounded-2xl transition-all flex flex-col ${
                  plan.isPopular
                    ? 'gradient-border-glow shadow-glow'
                    : 'border border-border-default bg-surface-raised hover:border-mint/40 hover:shadow-glow-sm'
                }`}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
              >
                {/* Popular badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-block whitespace-nowrap px-4 py-1 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-mint to-mint-dark text-white rounded-full shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* === Fixed-height header zone === */}
                <div className="p-5 pb-0">
                  <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-text-muted/80 mb-3 min-h-[2.5rem]">
                    {plan.valueDescription}
                  </p>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-extrabold text-text-primary tracking-tight">
                      ${getDisplayPrice(plan)}
                    </span>
                    <span className="text-text-muted text-sm">/mo</span>
                  </div>

                  {billingInterval === 'annual' && plan.price > 0 && (
                    <div className="text-xs text-coral font-medium mb-1">
                      Save ${getAnnualSavings(plan)}/year
                    </div>
                  )}

                  <div className="text-sm text-text-muted mb-4">
                    {plan.credits} credits &middot; {plan.videoCount} videos
                    {plan.costPerVideo > 0 && (
                      <span className="text-mint font-medium ml-1">
                        · ${plan.costPerVideo.toFixed(2)}/vid
                      </span>
                    )}
                  </div>
                </div>

                {/* === Divider === */}
                <div className="mx-5 border-t border-border-default" />

                {/* === Features zone (flex-grow) === */}
                <ul className="p-5 space-y-2.5 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm">
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="w-3.5 h-3.5 text-mint mt-0.5 flex-shrink-0"
                      />
                      <span className="text-text-primary">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations && plan.limitations.map((limitation, index) => (
                    <li key={`lim-${index}`} className="flex items-start gap-2.5 text-sm">
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="w-3.5 h-3.5 text-text-disabled mt-0.5 flex-shrink-0"
                      />
                      <span className="text-text-disabled">{limitation}</span>
                    </li>
                  ))}
                </ul>

                {/* === CTA zone (always at bottom) === */}
                <div className="p-5 pt-0">
                  <Button
                    className="w-full"
                    variant={plan.isPopular ? 'primary' : 'secondary'}
                    size="md"
                    isLoading={loadingPlan === plan.id}
                    disabled={loadingPlan !== null && loadingPlan !== plan.id}
                    onClick={() => {
                      if (plan.price === 0) {
                        window.location.href = '/signup'
                      } else {
                        handleSubscribe(plan.id)
                      }
                    }}
                  >
                    {plan.price === 0 ? 'Get Started Free' : isLoggedIn ? 'Subscribe' : 'Get Started'}
                  </Button>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* "Why fewer videos?" Callout */}
        <motion.div
          className="mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-mint/5 to-coral/5 border border-mint/20">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faLightbulb} className="w-5 h-5 text-mint" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  &ldquo;Why fewer videos than competitors?&rdquo;
                </h3>
                <p className="text-text-muted leading-relaxed">
                  Most AI video tools give you 60+ low-quality outputs you&apos;ll never use.
                  UGCFirst gives you <span className="text-mint font-medium">fewer, better, ad-ready UGC videos</span> that
                  actually look like a real creator made them. No avatar setup. No stitching assets together.
                  Just paste your product and get content that converts.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Wave decoration */}
        <div className="relative h-16 -mb-8">
          <WaveLines position="bottom" className="opacity-40" />
        </div>

        {/* Comparison Arena Section */}
        <motion.div
          className="mb-16 relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ComparisonArena />
        </motion.div>

        {/* Credit Packs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 relative"
        >
          {/* Subtle grid background */}
          <GlowingGrid className="opacity-20" dotCount={16} />

          <div className="relative">
            <h2 className="text-2xl font-bold text-text-primary text-center mb-2">
              Pay-As-You-Go <span className="gradient-text">Credit Packs</span>
            </h2>
            <p className="text-text-muted text-center mb-8">
              Need more credits? Top up anytime with our credit packs.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {CREDIT_PACKS.map((pack, index) => (
              <motion.div
                key={pack.id}
                className={`p-5 rounded-xl border border-border-default bg-surface/50 hover:border-mint/50 transition-all cursor-pointer ${
                  loadingPlan === pack.id ? 'opacity-70' : ''
                }`}
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleBuyCreditPack(pack.id)}
              >
                <h3 className="font-semibold text-text-primary mb-1">{pack.name}</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-text-primary">${pack.price}</span>
                  <span className="text-sm text-text-muted">/ {pack.credits} Credits</span>
                </div>
                <p className="text-xs text-text-muted mb-1">
                  {pack.videoCount} videos
                </p>
                <p className="text-xs text-status-success font-medium">
                  ${pack.costPerVideo.toFixed(2)}/video
                </p>
                {loadingPlan === pack.id && (
                  <p className="text-xs text-mint mt-2">Loading checkout...</p>
                )}
              </motion.div>
            ))}
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-4">
            Pricing <span className="gradient-text">FAQ</span>
          </h2>
          <p className="text-text-muted text-center mb-8">
            Common questions about our pricing and credits
          </p>
          <div className="max-w-3xl mx-auto">
            <Accordion items={PRICING_FAQ} />
          </div>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-status-success" />
              Purchased credits never expire
            </span>
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-status-success" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-status-success" />
              No hidden fees
            </span>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center py-12 px-6 rounded-2xl gradient-border-glow relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Spotlight effect */}
          <div className="absolute inset-0 spotlight opacity-50" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Ready to <span className="gradient-text">transform</span> your content strategy?
            </h2>
            <p className="text-text-muted mb-6 max-w-xl mx-auto">
              Start with 1 free video — no credit card required.
            </p>
            <Link href="/signup">
              <Button variant="primary" size="lg" className="animate-pulse-glow">
                Start Free — 1 Video, No Card
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-border-default mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <p>&copy; 2026 UGCFirst. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
