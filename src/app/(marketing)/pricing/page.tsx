'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark, faBolt } from '@fortawesome/free-solid-svg-icons'
import {
  Logo,
  Button,
  GradientOrb,
  FloatingStars,
  StaggerContainer,
  StaggerItem,
  Accordion,
} from '@/components/ui'
import { ComparisonTable, CompetitorComparisonTable } from '@/components/composed'
import { mockPricingPlans, mockCreditPacks, mockPricingFAQ, mockComparisonData, mockCompetitorComparison } from '@/mocks/data'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-deep-space bg-grid bg-grid-animated relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <GradientOrb color="indigo" size="xl" position={{ top: '-15%', right: '-10%' }} animated />
        <GradientOrb color="fuchsia" size="lg" position={{ bottom: '5%', left: '-5%' }} animated />
        <FloatingStars count={6} />
      </div>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Gradient mesh background */}
      <div className="gradient-mesh" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo variant="light" size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-text-muted hover:text-text-primary text-sm transition-colors">
              Back to Home
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Title */}
        <motion.div
          className="text-center mb-12"
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

        {/* Pricing cards */}
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16" staggerDelay={0.1}>
          {mockPricingPlans.map((plan) => (
            <StaggerItem key={plan.id}>
              <motion.div
                className={`relative h-full p-6 rounded-2xl transition-all flex flex-col ${
                  plan.isPopular
                    ? 'gradient-border-glow shadow-glow scale-105'
                    : 'border-2 border-border-default bg-surface/50 hover:border-electric-indigo/50'
                }`}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
              >
                {/* Popular badge - enhanced */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <motion.span
                      className="inline-block whitespace-nowrap px-5 py-1.5 text-sm font-bold bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia text-white rounded-full shadow-lg"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      MOST POPULAR
                    </motion.span>
                  </div>
                )}

                {/* Plan name */}
                <h3 className="text-lg font-semibold text-text-primary mb-2 mt-2">{plan.name}</h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl font-bold text-text-primary">${plan.price}</span>
                  <span className="text-text-muted">/month</span>
                </div>

                {/* Credits info */}
                <div className="mb-6 p-3 rounded-lg bg-deep-space/50">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <FontAwesomeIcon icon={faBolt} className="w-4 h-4 text-electric-indigo" />
                    <span className="text-text-primary font-medium">{plan.credits} Monthly Credits</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {plan.videoCount} Video Equivalent
                  </p>
                  <p className="text-xs text-status-success font-medium">
                    ${plan.costPerVideo.toFixed(2)}/video
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-4 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0"
                      />
                      <span className="text-text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limitations */}
                {plan.limitations && plan.limitations.length > 0 && (
                  <ul className="space-y-2 mb-6 pt-3 border-t border-border-default/50">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <FontAwesomeIcon
                          icon={faXmark}
                          className="w-4 h-4 text-text-disabled mt-0.5 flex-shrink-0"
                        />
                        <span className="text-text-disabled">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA - pushed to bottom with mt-auto */}
                <Button
                  className="w-full mt-auto"
                  variant={plan.isPopular ? 'primary' : 'secondary'}
                  size={plan.isPopular ? 'lg' : 'md'}
                >
                  {plan.price === 0 ? 'Get Started Free' : 'Subscribe Now'}
                </Button>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Competitor Comparison Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-4">
            Vidnary vs. <span className="gradient-text">The Competition</span>
          </h2>
          <p className="text-text-muted text-center mb-8 max-w-2xl mx-auto">
            See why dropshippers are switching from MakeUGC and Creatify
          </p>
          <div className="bg-surface/50 rounded-2xl border border-border-default p-4 md:p-6">
            <CompetitorComparisonTable data={mockCompetitorComparison} />
          </div>
        </motion.div>

        {/* Alternative Comparison Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-4">
            AI vs. Traditional Options
          </h2>
          <p className="text-text-muted text-center mb-8 max-w-2xl mx-auto">
            Compare Vidnary to DIY, freelancers, and agencies
          </p>
          <div className="bg-surface/50 rounded-2xl border border-border-default p-4 md:p-6">
            <ComparisonTable data={mockComparisonData} />
          </div>
        </motion.div>

        {/* Credit Packs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-text-primary text-center mb-2">
            Pay-As-You-Go <span className="gradient-text">Credit Packs</span>
          </h2>
          <p className="text-text-muted text-center mb-8">
            Need more credits? Top up anytime with our credit packs.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {mockCreditPacks.map((pack, index) => (
              <motion.div
                key={pack.id}
                className="p-5 rounded-xl border border-border-default bg-surface/50 hover:border-electric-indigo/50 transition-all cursor-pointer"
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
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
              </motion.div>
            ))}
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
            <Accordion items={mockPricingFAQ} />
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
              Credits rollover for 12 months
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
              Join the waitlist for early access and get 50% off your first 3 months.
            </p>
            <Link href="/#hero">
              <Button variant="primary" size="lg" className="animate-pulse-glow">
                Get Early Access
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-border-default mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <p>&copy; 2026 Vidnary. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
