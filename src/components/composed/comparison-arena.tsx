'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Zap, Crown, TrendingUp, Clock, Sparkles, Shield, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

// Feature battle data
const featureBattles = [
  {
    id: 'credits',
    feature: 'Credit Policy',
    icon: DollarSign,
    ugcfirst: { value: 'Roll over 12 months', description: 'Keep what you paid for' },
    competitors: { value: 'Lost monthly', description: 'Use it or lose it' },
    ugcfirstWins: true,
  },
  {
    id: 'speed',
    feature: 'Creation Speed',
    icon: Clock,
    ugcfirst: { value: '< 5 min', description: 'Paste link → done' },
    competitors: { value: '10-15 min', description: 'Plus editing time' },
    ugcfirstWins: true,
  },
  {
    id: 'lipsync',
    feature: 'Lip-Sync Quality',
    icon: Sparkles,
    ugcfirst: { value: 'Natural', description: 'Trained on real UGC' },
    competitors: { value: 'Inconsistent', description: 'Often needs fixes' },
    ugcfirstWins: true,
  },
  {
    id: 'postprod',
    feature: 'Post-Production',
    icon: Zap,
    ugcfirst: { value: 'None needed', description: 'Ready to post' },
    competitors: { value: 'Often required', description: 'Manual editing' },
    ugcfirstWins: true,
  },
  {
    id: 'trial',
    feature: 'Free Trial',
    icon: Shield,
    ugcfirst: { value: '1 free video', description: 'No card required' },
    competitors: { value: 'Watermarked', description: 'Or none at all' },
    ugcfirstWins: true,
  },
  {
    id: 'focus',
    feature: 'Built For',
    icon: TrendingUp,
    ugcfirst: { value: 'Dropshippers', description: 'E-commerce focused' },
    competitors: { value: 'Generic', description: 'One size fits all' },
    ugcfirstWins: true,
  },
]

// Animated VS divider
function VSDivider() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute w-px h-full bg-gradient-to-b from-transparent via-stone-600 to-transparent"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      />
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-stone-800 to-stone-900 border-2 border-stone-600 flex items-center justify-center shadow-lg"
      >
        <span className="text-xs font-black text-stone-400 tracking-widest">VS</span>
      </motion.div>
    </div>
  )
}

// Feature battle card
function FeatureBattle({
  battle,
  index,
  isActive,
  onHover
}: {
  battle: typeof featureBattles[0]
  index: number
  isActive: boolean
  onHover: (id: string | null) => void
}) {
  const Icon = battle.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => onHover(battle.id)}
      onMouseLeave={() => onHover(null)}
      className="relative"
    >
      {/* Feature label - centered top */}
      <motion.div
        className="flex items-center justify-center gap-2 mb-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 + 0.2 }}
      >
        <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center">
          <Icon className="w-4 h-4 text-stone-400" />
        </div>
        <span className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {battle.feature}
        </span>
      </motion.div>

      {/* Battle cards container */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
        {/* UGCFirst card - Winner */}
        <motion.div
          className={cn(
            'relative rounded-xl p-5 transition-all duration-300',
            'bg-gradient-to-br from-mint/10 to-mint/5',
            'border-2',
            isActive ? 'border-mint shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-mint/30'
          )}
          whileHover={{ scale: 1.02 }}
        >
          {/* Winner badge */}
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            whileInView={{ scale: 1, rotate: -12 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.4, type: 'spring' }}
            className="absolute -top-3 -right-3 bg-mint text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg"
          >
            <Crown className="w-3 h-3" />
            WINS
          </motion.div>

          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
              className="w-8 h-8 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0"
            >
              <Check className="w-4 h-4 text-mint" />
            </motion.div>
            <div>
              <p className="text-lg font-bold text-text-primary">{battle.ugcfirst.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{battle.ugcfirst.description}</p>
            </div>
          </div>

          {/* Animated glow on hover */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-xl bg-mint/5 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* VS connector */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-stone-700 border border-stone-600" />
          <div className="w-px h-6 bg-stone-700" />
          <div className="w-3 h-3 rounded-full bg-stone-700 border border-stone-600" />
        </div>

        {/* Competitors card - Loser */}
        <motion.div
          className={cn(
            'relative rounded-xl p-5 transition-all duration-300',
            'bg-stone-900/50',
            'border border-stone-800',
            isActive && 'opacity-60'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-stone-400">{battle.competitors.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{battle.competitors.description}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Score display
function ScoreBoard() {
  const totalBattles = featureBattles.length
  const ugcfirstWins = featureBattles.filter(b => b.ugcfirstWins).length

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex items-center justify-center gap-8 mb-12"
    >
      {/* UGCFirst score */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-mint to-mint-dark flex items-center justify-center shadow-lg shadow-mint/20">
            <span className="text-3xl font-black text-white">{ugcfirstWins}</span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber flex items-center justify-center"
          >
            <Crown className="w-3.5 h-3.5 text-white" />
          </motion.div>
        </motion.div>
        <p className="mt-3 text-sm font-bold text-mint">UGCFirst</p>
      </div>

      {/* VS */}
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black text-stone-600">:</span>
      </div>

      {/* Competitors score */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="w-20 h-20 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center"
        >
          <span className="text-3xl font-black text-stone-500">{totalBattles - ugcfirstWins}</span>
        </motion.div>
        <p className="mt-3 text-sm font-medium text-stone-500">Others</p>
      </div>
    </motion.div>
  )
}

// Winner banner
function WinnerBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.6 }}
      className="relative mt-12 p-6 rounded-2xl bg-gradient-to-r from-mint/10 via-mint/5 to-transparent border border-mint/20 overflow-hidden"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-mint/40"
            style={{
              left: `${15 + i * 15}%`,
              top: '50%',
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-14 h-14 rounded-xl bg-mint/20 flex items-center justify-center"
          >
            <Crown className="w-7 h-7 text-mint" />
          </motion.div>
          <div>
            <p className="text-xl font-bold text-text-primary">Clear Winner</p>
            <p className="text-sm text-text-muted">UGCFirst beats competitors in every category</p>
          </div>
        </div>

        <motion.a
          href="/signup"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 rounded-xl bg-mint hover:bg-mint-dark text-white font-semibold transition-colors shadow-lg shadow-mint/20"
        >
          Try Free — No Card Required
        </motion.a>
      </div>
    </motion.div>
  )
}

// Alternative comparison: Traditional methods
const traditionalComparison = [
  { method: 'DIY', cost: '$0 (your time)', time: '4-8 hours', scale: 'Low', icon: '🎬' },
  { method: 'Freelancer', cost: '$150-300', time: '3-7 days', scale: 'Limited', icon: '👤' },
  { method: 'Agency', cost: '$500-2000', time: '1-2 weeks', scale: 'Expensive', icon: '🏢' },
  { method: 'UGCFirst', cost: '$1.90', time: '5 min', scale: 'Unlimited', icon: '⚡', highlight: true },
]

function TraditionalComparison() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {traditionalComparison.map((item, i) => (
        <motion.div
          key={item.method}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className={cn(
            'relative rounded-xl p-5 transition-all duration-300',
            item.highlight
              ? 'bg-gradient-to-br from-mint/15 to-mint/5 border-2 border-mint shadow-lg shadow-mint/10'
              : 'bg-stone-900/50 border border-stone-800'
          )}
        >
          {item.highlight && (
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-mint text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg"
            >
              BEST VALUE
            </motion.div>
          )}

          <div className="text-3xl mb-3">{item.icon}</div>
          <h4 className={cn(
            'text-lg font-bold mb-4',
            item.highlight ? 'text-text-primary' : 'text-stone-400'
          )}>
            {item.method}
          </h4>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">Cost/Video</p>
              <p className={cn(
                'text-sm font-semibold',
                item.highlight ? 'text-mint' : 'text-stone-300'
              )}>
                {item.cost}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">Time</p>
              <p className={cn(
                'text-sm font-semibold',
                item.highlight ? 'text-mint' : 'text-stone-300'
              )}>
                {item.time}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">Scale</p>
              <p className={cn(
                'text-sm font-semibold',
                item.highlight ? 'text-mint' : 'text-stone-300'
              )}>
                {item.scale}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Main component
export function ComparisonArena() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'competitors' | 'traditional'>('competitors')

  return (
    <div className="w-full">
      {/* Custom tab switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex p-1 rounded-xl bg-stone-900 border border-stone-800">
          <button
            onClick={() => setActiveTab('competitors')}
            className={cn(
              'px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === 'competitors'
                ? 'bg-mint text-white shadow-lg'
                : 'text-stone-400 hover:text-white'
            )}
          >
            vs AI Competitors
          </button>
          <button
            onClick={() => setActiveTab('traditional')}
            className={cn(
              'px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === 'traditional'
                ? 'bg-mint text-white shadow-lg'
                : 'text-stone-400 hover:text-white'
            )}
          >
            vs Traditional
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'competitors' ? (
          <motion.div
            key="competitors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header with competitors */}
            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-8">
              <div className="text-right">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-3"
                >
                  <div>
                    <p className="text-xl font-bold text-mint">UGCFirst</p>
                    <p className="text-xs text-mint/60">The Champion</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint to-mint-dark flex items-center justify-center shadow-lg shadow-mint/20">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
              </div>

              <VSDivider />

              <div className="text-left">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center">
                    <span className="text-lg">🥊</span>
                  </div>
                  <div>
                    <p className="text-xl font-medium text-stone-400">MakeUGC & Creatify</p>
                    <p className="text-xs text-stone-500">The Challengers</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Score board */}
            <ScoreBoard />

            {/* Feature battles */}
            <div className="space-y-6">
              {featureBattles.map((battle, index) => (
                <FeatureBattle
                  key={battle.id}
                  battle={battle}
                  index={index}
                  isActive={activeFeature === battle.id}
                  onHover={setActiveFeature}
                />
              ))}
            </div>

            {/* Winner banner */}
            <WinnerBanner />
          </motion.div>
        ) : (
          <motion.div
            key="traditional"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Section header */}
            <div className="text-center mb-10">
              <p className="text-lg text-text-muted">
                See how UGCFirst stacks up against traditional content creation methods
              </p>
            </div>

            <TraditionalComparison />

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-center mt-10"
            >
              <p className="text-text-muted mb-4">
                Save <span className="text-mint font-bold">$148+</span> per video compared to freelancers
              </p>
              <motion.a
                href="/signup"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mint hover:bg-mint-dark text-white font-semibold transition-colors shadow-lg shadow-mint/20"
              >
                <Zap className="w-4 h-4" />
                Start Creating for $1.90/video
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
