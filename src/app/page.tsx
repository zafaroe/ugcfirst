'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Package, Store, Building2, Camera, Link2, Wand2, Download, ArrowRight, ArrowDown, Check, Shield, CreditCard, Zap, X, Clock, DollarSign, Users, Sparkles } from 'lucide-react'
import {
  Logo,
  Button,
  Badge,
  GradientOrb,
  GlassCard,
  StaggerContainer,
  StaggerItem,
  motion,
  FadeIn,
  Accordion,
  DemoGallery,
  TrustBar,
  TrustBarCompact,
  RotatingHeadline,
  PlatformBadges,
  FloatingOrbs,
  GlowingGrid,
  AmbientParticles,
  FloatingStars,
  WaveLines,
  HeroPhoneAnimation,
} from '@/components/ui'
import { useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { TestimonialCardAnimated } from '@/components/composed/testimonial-card'
import { PricingCard } from '@/components/composed/pricing-card'
import { ComparisonArena } from '@/components/composed/comparison-arena'
import { StudioAnimation, DropAndGoAnimation } from '@/components/composed'
import {
  mockTestimonials,
  mockLandingFAQ,
  mockPersonas,
  mockPricingPlans,
} from '@/mocks/data'

const personaIcons: Record<string, React.ReactNode> = {
  Package: <Package className="w-6 h-6" />,
  Store: <Store className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  Camera: <Camera className="w-6 h-6" />,
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`py-24 md:py-32 ${className}`}
    >
      {children}
    </motion.section>
  )
}

// Animated counter component
function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (hasAnimated || !ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true)
          const duration = 1500
          const steps = 40
          const increment = value / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= value) {
              setCount(value)
              clearInterval(timer)
            } else {
              setCount(Math.round(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [hasAnimated, value])

  return <span ref={ref}>{prefix}{count}{suffix}</span>
}

// Deterministic pseudo-random for SSR-safe particle positions
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: Math.round(seededRandom(i * 3 + 1) * 10000) / 100,
  top: Math.round(seededRandom(i * 3 + 2) * 10000) / 100,
  yOffset: -30 - seededRandom(i * 3 + 3) * 50,
  xOffset: (seededRandom(i * 3 + 4) - 0.5) * 40,
  duration: 4 + seededRandom(i * 3 + 5) * 4,
  delay: seededRandom(i * 3 + 6) * 5,
}))

// Floating particles for dark sections
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-mint/30"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
          }}
          animate={{
            y: [0, p.yOffset, 0],
            x: [0, p.xOffset, 0],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroParallaxY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const previewPlans = mockPricingPlans.filter(p => ['free', 'starter', 'pro'].includes(p.id))

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* ═══════════════════════════════════════════
          SECTION 1: NAVIGATION - High Contrast Design
          ═══════════════════════════════════════════ */}
      <FadeIn delay={0.1}>
        <nav className={`fixed top-0 left-0 right-0 z-50 px-6 transition-all duration-500 ${
          scrolled
            ? 'py-3 backdrop-blur-xl bg-stone-900/95 border-b border-white/10 shadow-lg shadow-black/20'
            : 'py-5 bg-transparent'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Logo variant="colored" size="md" />

            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Examples', href: '#examples' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'FAQ', href: '#faq' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="relative text-stone-300 hover:text-white transition-colors text-sm font-semibold group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-mint to-mint-dark transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-stone-300 hover:text-white transition-colors text-sm font-semibold hidden sm:inline px-3 py-2"
              >
                Log In
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="md">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </FadeIn>

      {/* ═══════════════════════════════════════════
          SECTION 2: HERO — Full-width, high impact
          ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen bg-surface overflow-hidden">
        <div className="gradient-mesh" aria-hidden="true" />
        <GradientOrb color="mint" size="xl" position={{ top: '-15%', right: '-10%' }} />
        <GradientOrb color="mint" size="lg" position={{ bottom: '5%', left: '-8%' }} />

        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col lg:flex-row items-center justify-center min-h-screen gap-16">
          {/* Left: Copy */}
          <StaggerContainer className="text-center lg:text-left lg:w-[55%]" staggerDelay={0.12} initialDelay={0.2}>
            <StaggerItem>
              <div className="inline-flex items-center gap-2 rounded-full bg-mint/10 border border-mint/20 px-4 py-1.5 mb-6">
                <Zap className="w-3.5 h-3.5 text-mint" />
                <span className="text-xs font-medium text-mint-dark">AI-Powered Video Creation</span>
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-display text-[2rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] text-text-primary mb-6 leading-[1.08]">
                <span className="block">Create Viral UGC</span>
                <span className="block sm:whitespace-nowrap">
                  Videos for Your{' '}
                  <RotatingHeadline
                    words={['Store', 'Agency', 'Brand', 'TikTok Shop']}
                  />
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg md:text-xl text-text-muted max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
                AI scripts. Realistic avatars. Ready for TikTok & Reels in under 5 minutes — at a fraction of the cost.
              </p>
            </StaggerItem>

            <StaggerItem className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-5">
              <Link href="/signup">
                <Button variant="primary" size="lg" className="group/btn px-8 py-4 text-base font-semibold shadow-[0_8px_30px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.5)] transition-all duration-300 animate-pulse-glow">
                  Start Free — 1 Video, No Card
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost" size="lg" className="text-base">
                  See How It Works
                  <ArrowDown className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </StaggerItem>

            <StaggerItem>
              <p className="text-sm text-text-muted mb-8">
                Then from <span className="font-semibold text-text-primary">$1.90/video</span> <span className="text-text-disabled">· No credit card required</span>
              </p>
            </StaggerItem>

            <StaggerItem className="flex justify-center lg:justify-start">
              <TrustBarCompact />
            </StaggerItem>
          </StaggerContainer>

          {/* Right: Interactive Phone Animation */}
          <motion.div
            className="lg:w-[45%] w-full max-w-sm lg:max-w-none flex justify-center"
            style={{ y: heroParallaxY, scale: heroScale, opacity: heroOpacity }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, rotateY: -8 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <HeroPhoneAnimation />

              {/* Floating accent cards */}
              <motion.div
                className="absolute -left-12 top-20 bg-stone-800 rounded-xl shadow-elevated p-3 border border-border-default"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-mint/15 flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-mint" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-text-primary">Script Ready</p>
                    <p className="text-[9px] text-mint">AI-generated</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -right-8 bottom-32 bg-stone-800 rounded-xl shadow-elevated p-3 border border-border-default"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-coral/15 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-coral" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-text-primary">3.1x ROAS</p>
                    <p className="text-[9px] text-text-muted">avg. return</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: SOCIAL PROOF BAR — Dark contrast strip
          ═══════════════════════════════════════════ */}
      <section className="relative bg-surface-dark py-14 overflow-hidden">
        <FloatingParticles />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark via-surface-dark-raised to-surface-dark opacity-80" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-6xl mx-auto px-6 space-y-6"
        >
          <TrustBar variant="dark" />
          <PlatformBadges className="[&_span]:text-stone-400 [&_div]:text-stone-400 [&_div:hover]:text-white" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4: PAIN POINTS — Before/After
          ═══════════════════════════════════════════ */}
      <Section className="bg-surface relative overflow-hidden">
        <FloatingOrbs count={3} />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="default" className="mb-4">The Problem</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
              Creating content is the #1 bottleneck
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              You found a winning product. You set up your store. But when it comes to content — you&apos;re stuck.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center">
                  <X className="w-4 h-4 text-coral" />
                </div>
                <span className="font-semibold text-text-primary">Without UGCFirst</span>
              </div>
              {[
                { icon: DollarSign, stat: '$150-300', label: 'per video from UGC creators' },
                { icon: Clock, stat: '4+ hours', label: 'filming and editing each one' },
                { icon: Users, stat: '10x less', label: 'content than your competitors' },
              ].map((item) => (
                <div key={item.stat} className="flex items-center gap-4 p-4 rounded-xl bg-coral/[0.04] border border-coral/10">
                  <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-coral" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-text-primary">{item.stat}</span>
                    <span className="text-text-muted ml-2">{item.label}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-mint/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-mint" />
                </div>
                <span className="font-semibold text-text-primary">With UGCFirst</span>
              </div>
              {[
                { icon: DollarSign, stat: 'From $1.90', label: 'per video with AI' },
                { icon: Clock, stat: 'Under 5 min', label: 'from product to post' },
                { icon: Users, stat: 'Match output', label: 'of top competitors' },
              ].map((item) => (
                <div key={item.stat} className="flex items-center gap-4 p-4 rounded-xl bg-mint/[0.04] border border-mint/10">
                  <div className="w-10 h-10 rounded-lg bg-mint/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-mint" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-text-primary">{item.stat}</span>
                    <span className="text-text-muted ml-2">{item.label}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center py-8 rounded-2xl bg-gradient-to-r from-mint/5 via-transparent to-mint/5 border border-mint/10"
          >
            <p className="text-4xl md:text-5xl font-extrabold gradient-text tracking-tight">
              <AnimatedCounter value={98} suffix="%" /> cheaper. <AnimatedCounter value={50} suffix="x" /> faster.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SECTION 5: HOW IT WORKS — Dark section for contrast
          ═══════════════════════════════════════════ */}
      <Section id="how-it-works" className="bg-surface-dark relative overflow-hidden">
        <FloatingParticles />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <Badge variant="default" className="mb-4 bg-white/10 text-white border-white/10">3 Simple Steps</Badge>
            <h2 className="text-display text-3xl md:text-4xl lg:text-5xl text-white mb-4 text-glow-white">
              From product to post in minutes
            </h2>
            <p className="text-lg text-stone-400 max-w-xl mx-auto">
              No filming. No editing. No freelancers. Just results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <motion.div
              className="hidden md:block absolute top-16 left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-px bg-gradient-to-r from-mint/40 via-mint to-mint/40 origin-left"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />

            {[
              { icon: Link2, step: '01', title: 'Paste Your Product', desc: 'Drop a product URL or upload images. AI extracts details, images, and selling points automatically.', color: 'text-mint-light' },
              { icon: Wand2, step: '02', title: 'AI Does the Work', desc: 'Viral script generation, avatar selection, voice synthesis. Choose Studio for control or Drop & Go for hands-off.', color: 'text-mint' },
              { icon: Download, step: '03', title: 'Download & Post', desc: 'Ready in under 5 minutes. Optimized for TikTok, Reels, and Shorts. Just download and post.', color: 'text-mint-dark' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, type: 'spring', stiffness: 100 }}
                className="text-center relative group"
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center relative z-10 bg-stone-800/80 border-2 border-stone-700 group-hover:border-mint/50 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                >
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-mint flex items-center justify-center text-[11px] font-bold text-white">
                    {item.step}
                  </div>
                  <item.icon className={`w-12 h-12 ${item.color} transition-transform duration-500 group-hover:scale-110`} />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SECTION 6: VIDEO DEMO GALLERY
          ═══════════════════════════════════════════ */}
      <Section id="examples" className="bg-surface relative overflow-hidden">
        <GlowingGrid className="opacity-40" />
        <div className="relative max-w-7xl mx-auto">
          <DemoGallery />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SECTION 7: USE CASE PERSONAS
          ═══════════════════════════════════════════ */}
      <Section className="bg-surface-secondary/50 relative overflow-hidden">
        <FloatingOrbs count={2} color="mixed" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="default" className="mb-4">For Every Seller</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
              Built for every seller
            </h2>
            <p className="text-lg text-text-muted max-w-xl mx-auto">
              Whether you sell 5 products or 5,000 — UGCFirst scales with you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {mockPersonas.map((persona, i) => (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard padding="lg" className="h-full bg-surface-raised border-border-default hover:border-mint/30 transition-all duration-300 hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.15)]">
                  <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center mb-5 text-mint">
                    {personaIcons[persona.icon]}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">{persona.title}</h3>
                  <p className="text-text-muted text-sm mb-5 leading-relaxed">{persona.description}</p>
                  <div className="mb-5">
                    <span className="text-xl font-extrabold gradient-text">{persona.stat}</span>
                  </div>
                  <ul className="space-y-2.5">
                    {persona.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-text-muted">
                        <Check className="w-3.5 h-3.5 text-mint flex-shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SECTION 8: CREATION MODES — Dark section with animations
          ═══════════════════════════════════════════ */}
      <Section className="bg-surface-dark relative overflow-hidden">
        <FloatingParticles />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge variant="default" className="mb-4 bg-white/10 text-white border-white/10">Two Ways to Create</Badge>
            <h2 className="text-display text-3xl md:text-4xl lg:text-5xl text-white mb-4 text-glow-white">
              Your video, your way
            </h2>
            <p className="text-lg text-stone-400 max-w-xl mx-auto">
              Pick a template and customize, or let AI handle everything with Drop & Go.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Studio Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="group relative rounded-2xl bg-stone-900/80 border border-stone-700 overflow-hidden hover:border-mint/40 transition-[border-color,box-shadow] duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]"
            >
              {/* Animation showcase */}
              <div className="relative bg-stone-950/50 p-6 flex items-center justify-center border-b border-stone-800 overflow-hidden">
                <div className="relative flex items-center justify-center" style={{ width: 380, height: 380 }}>
                  <StudioAnimation size="lg" animated={true} className="scale-[1.9]" />
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-mint" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-mint uppercase tracking-wider block">Full creative control</span>
                    <h3 className="text-xl font-bold text-white">Studio</h3>
                  </div>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed mb-5">
                  Choose from curated video templates, customize your script, pick your avatar style, and fine-tune every detail before generating.
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {['Curated templates', 'Script editing', 'Avatar selection', 'Full preview'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-stone-300">
                      <Check className="w-3.5 h-3.5 text-mint flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Drop & Go Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="group relative rounded-2xl bg-stone-900/80 border border-stone-700 overflow-hidden hover:border-coral/40 transition-[border-color,box-shadow] duration-500 hover:shadow-[0_0_40px_rgba(244,63,94,0.1)]"
            >
              {/* Animation showcase */}
              <div className="relative bg-stone-950/50 p-6 flex items-center justify-center border-b border-stone-800 overflow-hidden">
                <div className="relative flex items-center justify-center" style={{ width: 380, height: 380 }}>
                  <DropAndGoAnimation size="lg" animated={true} className="scale-[1.9]" />
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-coral" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-coral uppercase tracking-wider block">AI does everything</span>
                    <h3 className="text-xl font-bold text-white">Drop & Go</h3>
                  </div>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed mb-5">
                  Just paste your product link. AI analyzes it, writes the script, picks the style, and delivers a ready-to-post video in minutes.
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {['One-click generation', 'AI script writing', 'Smart style matching', 'Under 5 minutes'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-stone-300">
                      <Check className="w-3.5 h-3.5 text-coral flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SECTION 9: COMPARISON ARENA — Head-to-Head Battle
          ═══════════════════════════════════════════ */}
      <Section className="bg-surface relative overflow-hidden">
        <WaveLines position="top" className="opacity-30" />
        <WaveLines position="bottom" className="opacity-30" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge variant="default" className="mb-4">The Showdown</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
              Why sellers choose UGCFirst
            </h2>
            <p className="text-lg text-text-muted max-w-xl mx-auto">
              Head-to-head comparison. See why we win every round.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <ComparisonArena />
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SECTION 10: TESTIMONIALS
          ═══════════════════════════════════════════ */}
      <Section className="bg-surface-secondary/50 relative overflow-hidden">
        <FloatingStars count={10} className="opacity-60" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge variant="default" className="mb-4">Social Proof</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
              Loved by sellers everywhere
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTestimonials.map((t, i) => (
              <TestimonialCardAnimated key={t.id} testimonial={t} delay={i * 0.12} />
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SECTION 11: PRICING PREVIEW
          ═══════════════════════════════════════════ */}
      <Section id="pricing" className="bg-surface relative overflow-hidden">
        <FloatingOrbs count={2} />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge variant="default" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-text-muted">
              Start free. Scale when you&apos;re ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {previewPlans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <PricingCard
                  plan={plan}
                  onSelect={() => window.location.href = '/signup'}
                />
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted">
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-mint" />
              Credits roll over 12 months
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-mint" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-mint" />
              No hidden fees
            </span>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/pricing"
              className="text-sm text-mint hover:text-mint-dark transition-colors font-medium inline-flex items-center gap-1"
            >
              See all plans & credit packs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SECTION 12: FAQ
          ═══════════════════════════════════════════ */}
      <Section id="faq" className="bg-surface-secondary/50 relative overflow-hidden">
        <AmbientParticles count={8} className="opacity-50" />
        <div className="relative max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-text-muted">
              Everything you need to know about UGCFirst
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Accordion items={mockLandingFAQ} />
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SECTION 13: FINAL CTA — Dark, high-impact
          ═══════════════════════════════════════════ */}
      <section className="relative py-32 bg-surface-dark overflow-hidden">
        <FloatingParticles />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(16,185,129,0.1),transparent)]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto px-6 text-center"
        >
          <h2 className="text-display text-4xl md:text-5xl text-white mb-5 text-glow-white">
            Ready to create your{' '}
            <span className="gradient-text-animated">first video</span>?
          </h2>
          <p className="text-lg text-stone-400 mb-10 max-w-xl mx-auto">
            Join thousands of sellers using AI to create scroll-stopping UGC content.
          </p>
          <Link href="/signup">
            <Button variant="primary" size="lg" className="group/cta px-10 py-4 text-base font-semibold shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.55)] transition-all duration-300 animate-pulse-glow">
              Create Your First Video Free
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover/cta:translate-x-1" />
            </Button>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-stone-400">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-mint" />
              3 Free Videos
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-mint" />
              No Credit Card
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-mint" />
              Cancel Anytime
            </span>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 14: FOOTER
          ═══════════════════════════════════════════ */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-14 px-6 border-t border-stone-800 bg-surface-dark"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <Logo variant="light" size="md" />
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="#how-it-works" className="text-stone-400 hover:text-white text-sm transition-colors">How It Works</a>
              <a href="#examples" className="text-stone-400 hover:text-white text-sm transition-colors">Examples</a>
              <a href="#pricing" className="text-stone-400 hover:text-white text-sm transition-colors">Pricing</a>
              <a href="#faq" className="text-stone-400 hover:text-white text-sm transition-colors">FAQ</a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-stone-500 text-sm">
              &copy; 2026 UGCFirst
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-stone-500 hover:text-stone-300 text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-stone-500 hover:text-stone-300 text-sm transition-colors">Terms of Service</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-stone-500 hover:text-mint transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="text-stone-500 hover:text-coral transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </a>
              <a href="#" className="text-stone-500 hover:text-amber transition-all duration-300 hover:scale-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
