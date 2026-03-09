/**
 * Shared Pricing Configuration
 *
 * Single source of truth for all pricing data.
 * Used by: frontend pages, Stripe setup script, webhook handlers
 *
 * NOTE: This mirrors src/mocks/data/pricing.ts - keep in sync!
 */

import type { PricingPlan, CreditPack } from '@/types'

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const SUBSCRIPTION_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    annualPrice: 0,
    credits: 10,
    videoCount: 1,
    costPerVideo: 0,
    features: [
      '1 free video on signup',
      'All 10 UGC templates',
      'Product URL auto-import',
      'Basic captions',
    ],
    limitations: [
      'Watermark on all videos',
      'No social scheduling',
      '1 team seat',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    annualPrice: 190,
    credits: 70,
    videoCount: 7,
    costPerVideo: 2.71,
    features: [
      '7 videos per month',
      'All 10 UGC templates',
      'Product URL auto-import',
      'Basic captions (Hormozi style)',
      'No watermark',
      'Email support',
    ],
    limitations: [
      'No social scheduling',
      '1 team seat',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    annualPrice: 590,
    credits: 230,
    videoCount: 23,
    costPerVideo: 2.57,
    isPopular: true,
    features: [
      '23 videos per month',
      'Everything in Starter',
      'Social media scheduling',
      '10 connected social accounts',
      'Content calendar',
      'Priority support',
    ],
    limitations: [
      '1 team seat',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 99,
    annualPrice: 990,
    credits: 390,
    videoCount: 39,
    costPerVideo: 2.54,
    features: [
      '39 videos per month',
      'Everything in Pro',
      'All caption styles',
      '2 team seats',
    ],
    limitations: [
      '10 social accounts (same as Pro)',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 179,
    annualPrice: 1790,
    credits: 710,
    videoCount: 71,
    costPerVideo: 2.52,
    features: [
      '71 videos per month',
      'Everything in Plus',
      '50 connected social accounts',
      '5 team seats',
      'Dedicated support',
      'API access',
    ],
    limitations: [],
  },
]

// ============================================
// CREDIT PACKS (One-time purchases)
// ============================================

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack-starter',
    name: 'Starter Pack',
    price: 9,
    credits: 30,
    videoCount: 3,
    costPerVideo: 3.00,
  },
  {
    id: 'pack-growth',
    name: 'Growth Pack',
    price: 25,
    credits: 90,
    videoCount: 9,
    costPerVideo: 2.78,
  },
  {
    id: 'pack-scale',
    name: 'Scale Pack',
    price: 50,
    credits: 190,
    videoCount: 19,
    costPerVideo: 2.63,
  },
  {
    id: 'pack-bulk',
    name: 'Bulk Pack',
    price: 100,
    credits: 400,
    videoCount: 40,
    costPerVideo: 2.50,
  },
]

// ============================================
// CREDITS PER PLAN (for webhook handlers)
// ============================================

export const PLAN_CREDITS: Record<string, number> = {
  free: 10,
  starter: 70,
  pro: 230,
  plus: 390,
  agency: 710,
}

export const PACK_CREDITS: Record<string, number> = {
  'pack-starter': 30,
  'pack-growth': 90,
  'pack-scale': 190,
  'pack-bulk': 400,
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPlanById(id: string): PricingPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id)
}

export function getCreditPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id)
}

export function getPopularPlan(): PricingPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.isPopular)
}

export function getPaidPlans(): PricingPlan[] {
  return SUBSCRIPTION_PLANS.filter((p) => p.price > 0)
}

export function getFreePlan(): PricingPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.price === 0)
}

// ============================================
// FAQ DATA
// ============================================

import type { AccordionItem } from '@/components/ui/accordion'

// ============================================
// SCHEDULING TIER RESTRICTIONS
// ============================================

/** Tiers that include social scheduling */
export const SCHEDULING_TIERS = ['pro', 'plus', 'agency'] as const;

/** Maximum connected social accounts per tier */
export const ACCOUNT_LIMITS: Record<string, number> = {
  free: 0,
  starter: 0,
  pro: 10,
  plus: 10,
  agency: 50,
};

/** Check if a tier includes scheduling */
export function hasSchedulingAccess(tier: string): boolean {
  return SCHEDULING_TIERS.includes(tier as typeof SCHEDULING_TIERS[number]);
}

/** Get the account limit for a tier */
export function getAccountLimit(tier: string): number {
  return ACCOUNT_LIMITS[tier] || 0;
}

// ============================================
// FAQ DATA
// ============================================

export const PRICING_FAQ: AccordionItem[] = [
  {
    id: 'pricing_faq_1',
    question: 'How do credits work?',
    answer: '10 credits = 1 full video. Unlike Creatify where unused credits expire monthly, your UGCFirst credits roll over for 12 months. We believe you shouldn\'t lose what you paid for.',
  },
  {
    id: 'pricing_faq_2',
    question: 'How does UGCFirst compare to MakeUGC and Creatify?',
    answer: 'The biggest difference? Your credits don\'t disappear. MakeUGC and Creatify expire unused credits monthly—you lose what you paid for. UGCFirst credits roll over for 12 months. Plus, we\'re built specifically for dropshippers with natural lip-sync and zero post-production needed.',
  },
  {
    id: 'pricing_faq_3',
    question: 'Can I cancel anytime?',
    answer: 'Yes, no contracts or hidden fees. Cancel in one click. Your remaining credits stay active until the billing period ends, and you keep all your videos forever.',
  },
  {
    id: 'pricing_faq_4',
    question: 'Is there a free trial?',
    answer: 'Better—1 free video on signup. No credit card required. MakeUGC and Creatify both require payment upfront. We let you test first.',
  },
  {
    id: 'pricing_faq_5',
    question: 'Why is UGCFirst better for dropshippers?',
    answer: 'Built specifically for e-commerce. Paste any product URL, and our AI creates videos in one click. Trained on what converts on TikTok Shop. Competitors are generic video tools—we\'re laser-focused on helping you sell.',
  },
]
