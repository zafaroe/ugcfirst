'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Wand2, User, Sliders, Check, DollarSign, Clock, AlertTriangle, ArrowRight, Link2, Download, Loader2 } from 'lucide-react'
import {
  Logo,
  Button,
  Input,
  Badge,
  GridBackground,
  FloatingStars,
  GradientOrb,
  CornerStar,
  GlassCard,
  GradientCard,
  FeatureCard,
  StaggerContainer,
  StaggerItem,
  motion,
  FadeIn,
  Confetti,
  Accordion,
  useToastActions,
  DemoGallery,
  HeroVideoShowcase,
} from '@/components/ui'
import { mockLandingFAQ } from '@/mocks/data'
import { joinWaitlist } from '@/services/waitlist'

// Waitlist Form Component
function WaitlistForm({ className, showPrivacyNote = false }: { className?: string; showPrivacyNote?: boolean }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const toast = useToastActions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isLoading) return

    setIsLoading(true)

    try {
      const result = await joinWaitlist(email)

      if (result.success) {
        setSubmitted(true)
        setShowConfetti(true)
        toast.success('Welcome to the waitlist!', result.message)
        setTimeout(() => setShowConfetti(false), 4000)
      } else {
        toast.error('Oops!', result.message)
      }
    } catch {
      toast.error('Oops!', 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <>
        <Confetti isActive={showConfetti} particleCount={60} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-status-success"
        >
          <Check className="w-5 h-5" />
          <span>You&apos;re on the list! We&apos;ll email you when we launch.</span>
        </motion.div>
      </>
    )
  }

  return (
    <div className={`w-full max-w-lg ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full items-stretch">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-w-0 focus:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-shadow"
          required
          disabled={isLoading}
        />
        <Button
          variant="primary"
          size="lg"
          type="submit"
          className="sm:px-8 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-shadow"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            'Get Early Access'
          )}
        </Button>
      </form>
      {showPrivacyNote && (
        <p className="text-xs text-text-muted mt-3 text-center sm:text-left">
          No credit card required. No spam, ever.
        </p>
      )}
    </div>
  )
}

// Section wrapper with scroll animation
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      className={`py-20 md:py-28 ${className}`}
    >
      {children}
    </motion.section>
  )
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <GridBackground animated>
      {/* Premium Background Textures */}
      <div className="noise-overlay" aria-hidden="true" />
      <div className="gradient-mesh" aria-hidden="true" />
      <div className="spotlight" aria-hidden="true" />

      {/* Background Effects */}
      <GradientOrb color="indigo" size="xl" position={{ top: '-10%', right: '-10%' }} />
      <GradientOrb color="fuchsia" size="lg" position={{ bottom: '-5%', left: '-5%' }} />
      <FloatingStars count={6} />

      {/* Navigation */}
      <FadeIn delay={0.1}>
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-deep-space/80 border-b border-border-default/30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Logo variant="light" size="md" />
            <div className="flex items-center gap-6">
              <Link
                href="/pricing"
                className="relative text-text-muted hover:text-text-primary transition-colors text-sm font-medium group"
              >
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia transition-all duration-300 group-hover:w-full" />
              </Link>
              <Button variant="primary" size="md" onClick={scrollToHero}>
                Get Early Access
              </Button>
            </div>
          </div>
        </nav>
      </FadeIn>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen pt-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 min-h-[calc(100vh-80px)]">
          {/* Left: Video Showcase (hidden on mobile, shown on lg+) */}
          <div className="hidden lg:block lg:w-1/2">
            <HeroVideoShowcase />
          </div>

          {/* Right: Content */}
          <StaggerContainer className="text-center lg:text-left lg:w-1/2" staggerDelay={0.15} initialDelay={0.3}>
            <StaggerItem className="flex justify-center lg:justify-start mb-10">
              <Logo variant="light" size="2xl" />
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-6">
                Turn Product Images Into Viral UGC Videos — In Minutes
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg md:text-xl text-text-muted max-w-xl mx-auto lg:mx-0 mb-10">
                AI-powered scripts. Realistic avatars. Ready for TikTok & Reels.
                <br />
                No actors, no editing, no hassle.
              </p>
            </StaggerItem>

            <StaggerItem className="flex justify-center lg:justify-start mb-6">
              <WaitlistForm showPrivacyNote />
            </StaggerItem>

            <StaggerItem>
              <p className="text-sm text-text-muted">
                Join 500+ dropshippers on the waitlist
              </p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Problem Section */}
      <Section>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Creating content is the #1 bottleneck for sellers
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              You found a winning product. You set up your store. But when it comes to content — you&apos;re stuck.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group"
            >
              <GlassCard padding="lg" className="text-center h-full transition-shadow duration-300 group-hover:shadow-[0_10px_40px_-15px_rgba(239,68,68,0.3)]">
                <div className="w-14 h-14 rounded-xl bg-status-error/20 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                  <DollarSign className="w-7 h-7 text-status-error" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Expensive</h3>
                <p className="text-text-muted">UGC creators charge <span className="text-status-error font-semibold">$150-300</span> per video. With Vidnary? <span className="text-status-success font-semibold">Under $5</span>.</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group"
            >
              <GlassCard padding="lg" className="text-center h-full transition-shadow duration-300 group-hover:shadow-[0_10px_40px_-15px_rgba(245,158,11,0.3)]">
                <div className="w-14 h-14 rounded-xl bg-status-warning/20 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Clock className="w-7 h-7 text-status-warning" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Time-Consuming</h3>
                <p className="text-text-muted">Filming and editing takes <span className="text-status-warning font-semibold">4+ hours</span>. With Vidnary? <span className="text-status-success font-semibold">Under 5 minutes</span>.</p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="group"
            >
              <GlassCard padding="lg" className="text-center h-full transition-shadow duration-300 group-hover:shadow-[0_10px_40px_-15px_rgba(217,70,239,0.3)]">
                <div className="w-14 h-14 rounded-xl bg-vibrant-fuchsia/20 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                  <AlertTriangle className="w-7 h-7 text-vibrant-fuchsia" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Overwhelming</h3>
                <p className="text-text-muted">Competitors post <span className="text-vibrant-fuchsia font-semibold">10x more content</span>. With Vidnary? <span className="text-status-success font-semibold">Match their output</span>.</p>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Solution Section */}
      <Section>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Vidnary creates scroll-stopping videos for you
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group"
            >
              <FeatureCard
                icon={<Wand2 className="w-8 h-8 text-electric-indigo transition-transform duration-300 group-hover:scale-110" />}
                iconBg="gradient"
                hoverable
                className="h-full"
              >
                <h3 className="text-xl font-semibold text-text-primary mb-2">AI-Written Scripts</h3>
                <p className="text-text-muted">
                  Trained on viral hooks. Optimized for TikTok & Reels algorithms.
                </p>
              </FeatureCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group"
            >
              <FeatureCard
                icon={<User className="w-8 h-8 text-electric-indigo transition-transform duration-300 group-hover:scale-110" />}
                iconBg="gradient"
                hoverable
                className="h-full"
              >
                <h3 className="text-xl font-semibold text-text-primary mb-2">Realistic AI Avatars</h3>
                <p className="text-text-muted">
                  Professional presenters that look and sound natural. No uncanny valley.
                </p>
              </FeatureCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="group"
            >
              <FeatureCard
                icon={<Sliders className="w-8 h-8 text-electric-indigo transition-transform duration-300 group-hover:scale-110" />}
                iconBg="gradient"
                hoverable
                className="h-full"
              >
                <h3 className="text-xl font-semibold text-text-primary mb-2">Two Ways to Create</h3>
                <p className="text-text-muted">
                  DIY Mode for full control. Reel It In for hands-off creation.
                </p>
              </FeatureCard>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* How It Works Section */}
      <Section>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              From product to post in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting lines (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia" />

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center relative group"
            >
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center relative z-10 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                style={{
                  background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #6366F1, #D946EF) border-box',
                  border: '3px solid transparent',
                }}
              >
                <Link2 className="w-10 h-10 text-electric-indigo transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Paste Your Product</h3>
              <p className="text-text-muted">Drop a URL or upload images</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center relative group"
            >
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center relative z-10 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(217,70,239,0.4)]"
                style={{
                  background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #6366F1, #D946EF) border-box',
                  border: '3px solid transparent',
                }}
              >
                <Wand2 className="w-10 h-10 text-vibrant-fuchsia transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Choose Your Style</h3>
              <p className="text-text-muted">Pick an avatar, review the script</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center relative group"
            >
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center relative z-10 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                style={{
                  background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #6366F1, #D946EF) border-box',
                  border: '3px solid transparent',
                }}
              >
                <Download className="w-10 h-10 text-status-success transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Download & Post</h3>
              <p className="text-text-muted">Get your video in minutes. Ready to go.</p>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Demo Gallery Section */}
      <Section>
        <div className="max-w-7xl mx-auto">
          <DemoGallery />
        </div>
      </Section>

      {/* Pricing Teaser Section */}
      <Section>
        <div className="max-w-xl mx-auto px-6">
          <GradientCard variant="default" glowOnHover padding="lg">
            <div className="text-center">
              <Badge variant="purple" className="mb-4">Early Access</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Join the Waitlist
              </h2>
              <p className="text-text-muted mb-6">
                Get exclusive founding member benefits:
              </p>
              <ul className="space-y-3 mb-8 text-left max-w-xs mx-auto">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-status-success flex-shrink-0" />
                  <span className="text-text-primary">50% off your first 3 months</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-status-success flex-shrink-0" />
                  <span className="text-text-primary">Priority access before public launch</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-status-success flex-shrink-0" />
                  <span className="text-text-primary">Free credits to test</span>
                </li>
              </ul>
              <Button variant="primary" size="lg" className="w-full" onClick={scrollToHero}>
                Get Early Access
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link
                href="/pricing"
                className="inline-block mt-4 text-sm text-text-muted hover:text-electric-indigo transition-colors"
              >
                See full pricing plans →
              </Link>
            </div>
          </GradientCard>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-text-muted">
              Everything you need to know about Vidnary
            </p>
          </div>
          <Accordion items={mockLandingFAQ} />
        </div>
      </Section>

      {/* Final CTA Section */}
      <Section className="relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
            Ready to stop struggling with content?
          </h2>
          <p className="text-lg text-text-muted mb-10">
            Join the waitlist. Be first in line when we launch.
          </p>
          <div className="flex justify-center">
            <WaitlistForm />
          </div>
        </div>
        <CornerStar position="bottom-right" />
      </Section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border-default/50">
        <div className="max-w-6xl mx-auto">
          {/* Co-Founders Attribution */}
          <div className="text-center py-4 mb-6">
            <span className="text-sm text-text-muted">Built by </span>
            <span className="text-sm text-text-primary">Ussama (Austin)</span>
            <span className="text-sm text-text-muted"> & </span>
            <span className="text-sm text-text-primary">Ammar Khan</span>
            <span className="text-sm text-text-muted">, </span>
            <span className="text-sm bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia bg-clip-text text-transparent">Co-Founders</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-text-muted text-sm">
              &copy; 2026 Vidnary
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="relative text-text-muted hover:text-text-primary text-sm transition-colors group">
                Privacy Policy
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-text-primary transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#" className="relative text-text-muted hover:text-text-primary text-sm transition-colors group">
                Terms of Service
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-text-primary transition-all duration-300 group-hover:w-full" />
              </a>
            </div>
            <div className="flex items-center gap-4">
              {/* Twitter/X */}
              <a href="#" className="text-text-muted hover:text-electric-indigo transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* TikTok */}
              <a href="#" className="text-text-muted hover:text-vibrant-fuchsia transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="text-text-muted hover:text-status-warning transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </GridBackground>
  )
}
