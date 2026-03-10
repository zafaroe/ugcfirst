/**
 * Shared Pricing Configuration
 *
 * Single source of truth for all pricing data.
 * Used by: frontend pages, Stripe setup script, webhook handlers
 *
 * UGCFirst Final Pricing (March 2026)
 * Competitive positioning: authentic AI UGC quality, zero avatar setup, ad-ready output
 * $/video improves at every tier: Starter $6.33 > Pro $4.90 > Plus $4.50 > Agency $4.42
 */

import type { PricingPlan, CreditPack, PlanFeatures, PlanType } from '@/types'

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const SUBSCRIPTION_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    annualPrice: 0,
    annualTotal: 0,
    credits: 10,
    videoCount: 1,
    costPerVideo: 0,
    valueDescription: 'Try authentic AI UGC — free',
    features: [
      '1 authentic AI UGC video/month',
      'All templates included',
      'Auto captions',
      'Watermarked output',
      '720p export',
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
    annualPrice: 15,
    annualTotal: 180,
    credits: 30,
    videoCount: 3,
    costPerVideo: 6.33,
    valueDescription: 'Your first real UGC ad creatives',
    features: [
      '3 videos/month',
      'No watermark',
      '1080p export',
      'All templates',
      'Drop & Go mode',
      'HD & Premium B-Roll add-ons',
    ],
    limitations: [
      'No social scheduling',
      '1 team seat',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    annualPrice: 39,
    annualTotal: 468,
    credits: 100,
    videoCount: 10,
    costPerVideo: 4.90,
    isPopular: true,
    badge: 'Most Popular',
    valueDescription: 'The smart plan for merchants posting consistently',
    features: [
      '10 videos/month',
      'Everything in Starter',
      'Social scheduling (TikTok, IG, YouTube)',
      'Priority rendering',
      'Platform strategy AI',
      'Best value per video',
    ],
    limitations: [
      '1 team seat',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 99,
    annualPrice: 79,
    annualTotal: 948,
    credits: 220,
    videoCount: 22,
    costPerVideo: 4.50,
    valueDescription: 'Stronger value for teams running repeat content',
    features: [
      '22 videos/month',
      'Everything in Pro',
      '3 team seats',
      'Higher volume for scaling',
    ],
    limitations: [],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 199,
    annualPrice: 159,
    annualTotal: 1908,
    credits: 450,
    videoCount: 45,
    costPerVideo: 4.42,
    valueDescription: 'Premium scale with API, seats, and priority support',
    features: [
      '45 videos/month',
      'Everything in Plus',
      '5 team seats',
      'API access',
      'Custom avatars',
      'Dedicated support',
    ],
    limitations: [],
  },
]

// ============================================
// CREDIT PACKS (One-time purchases)
// Credit packs are priced HIGHER per-video than subscriptions
// Minimum floor: $2.75/video
// ============================================

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack-starter',
    name: 'Starter Pack',
    price: 14.99,
    credits: 30,
    videoCount: 3,
    costPerVideo: 5.00,
  },
  {
    id: 'pack-growth',
    name: 'Growth Pack',
    price: 34.99,
    credits: 80,
    videoCount: 8,
    costPerVideo: 4.37,
  },
  {
    id: 'pack-scale',
    name: 'Scale Pack',
    price: 64.99,
    credits: 200,
    videoCount: 20,
    costPerVideo: 3.25,
  },
  {
    id: 'pack-bulk',
    name: 'Bulk Pack',
    price: 109.99,
    credits: 400,
    videoCount: 40,
    costPerVideo: 2.75,
  },
]

// ============================================
// CREDITS PER PLAN (for webhook handlers)
// ============================================

export const PLAN_CREDITS: Record<string, number> = {
  free: 10,
  starter: 30,
  pro: 100,
  plus: 220,
  agency: 450,
}

export const PACK_CREDITS: Record<string, number> = {
  'pack-starter': 30,
  'pack-growth': 80,
  'pack-scale': 200,
  'pack-bulk': 400,
}

// ============================================
// FEATURE GATES BY PLAN
// ============================================

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    maxResolution: '720p',
    watermark: true,
    concierge: false,
    scheduling: false,
    priorityRendering: false,
    apiAccess: false,
    teamSeats: 1,
    platformStrategy: false,
    customAvatars: false,
    dedicatedSupport: false,
    hdUpgrade: false,
    premiumBroll: false,
  },
  starter: {
    maxResolution: '1080p',
    watermark: false,
    concierge: true,
    scheduling: false,
    priorityRendering: false,
    apiAccess: false,
    teamSeats: 1,
    platformStrategy: false,
    customAvatars: false,
    dedicatedSupport: false,
    hdUpgrade: true,
    premiumBroll: true,
  },
  pro: {
    maxResolution: '1080p',
    watermark: false,
    concierge: true,
    scheduling: true,
    priorityRendering: true,
    apiAccess: false,
    teamSeats: 1,
    platformStrategy: true,
    customAvatars: false,
    dedicatedSupport: false,
    hdUpgrade: true,
    premiumBroll: true,
  },
  plus: {
    maxResolution: '1080p',
    watermark: false,
    concierge: true,
    scheduling: true,
    priorityRendering: true,
    apiAccess: false,
    teamSeats: 3,
    platformStrategy: true,
    customAvatars: false,
    dedicatedSupport: false,
    hdUpgrade: true,
    premiumBroll: true,
  },
  agency: {
    maxResolution: '1080p',
    watermark: false,
    concierge: true,
    scheduling: true,
    priorityRendering: true,
    apiAccess: true,
    teamSeats: 5,
    platformStrategy: true,
    customAvatars: true,
    dedicatedSupport: true,
    hdUpgrade: true,
    premiumBroll: true,
  },
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

export function getPlanFeatures(planId: PlanType): PlanFeatures {
  return PLAN_FEATURES[planId]
}

export function hasFeature(planId: PlanType, feature: keyof PlanFeatures): boolean {
  const features = PLAN_FEATURES[planId]
  const value = features[feature]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  return false // string type (maxResolution) - treat as "has feature"
}

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

import type { AccordionItem } from '@/components/ui/accordion'

export const PRICING_FAQ: AccordionItem[] = [
  {
    id: 'pricing_faq_1',
    question: 'How do credits work?',
    answer: '10 credits = 1 standard video. You can use credits for add-ons like HD upgrade (+3 credits) or premium b-roll (+2 credits). Monthly credits refresh each billing period, while purchased credits never expire.',
  },
  {
    id: 'pricing_faq_2',
    question: 'Why fewer videos than competitors?',
    answer: 'Most AI video tools give you 60+ low-quality outputs you\'ll never use. UGCFirst gives you fewer, better, ad-ready UGC videos that actually look like a real creator made them. No avatar setup. No stitching assets together. Just paste your product and get content that converts.',
  },
  {
    id: 'pricing_faq_3',
    question: 'Can I cancel anytime?',
    answer: 'Yes, no contracts or hidden fees. Cancel in one click. Your remaining credits stay active until the billing period ends, and you keep all your videos forever.',
  },
  {
    id: 'pricing_faq_4',
    question: 'Is there a free trial?',
    answer: 'Better — 1 free video on signup. No credit card required. Test our authentic AI UGC quality before committing.',
  },
  {
    id: 'pricing_faq_5',
    question: 'What makes UGCFirst different?',
    answer: 'Built specifically for e-commerce. Paste any product URL, and our AI creates videos in one click. Trained on what converts on TikTok Shop. Competitors are generic video tools — we\'re laser-focused on helping you sell.',
  },
  {
    id: 'pricing_faq_6',
    question: 'Do I need to set up avatars?',
    answer: 'No. UGCFirst uses AI video generation that creates authentic-looking UGC without needing to train or set up avatars. Just upload your product and go.',
  },
]
