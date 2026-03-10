// ============================================
// CREDIT SYSTEM TYPES
// ============================================

export type CreditTransactionType =
  | 'purchase'
  | 'subscription'
  | 'usage'
  | 'refund'
  | 'hold'
  | 'release'
  | 'bonus'
  | 'adjustment';

export type CreditTransactionStatus = 'pending' | 'completed' | 'cancelled';

// ============================================
// DATABASE TYPES
// ============================================

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'plus' | 'agency';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';

export interface UserCredits {
  user_id: string;
  balance: number;
  held: number;
  lifetime_purchased: number;
  lifetime_used: number;
  lifetime_refunded: number;
  updated_at: string;
  // Subscription tracking
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_end?: string;
  credits_reset_date?: string;
  // Payment tracking (permanent flag - true once user has ever paid)
  has_paid: boolean;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: CreditTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  held_before: number;
  held_after: number;
  generation_id: string | null;
  stripe_payment_id: string | null;
  stripe_subscription_id: string | null;
  description: string | null;
  status: CreditTransactionStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// API TYPES
// ============================================

export interface CreditBalance {
  balance: number;
  held: number;
  available: number; // balance - held
  lifetime: {
    purchased: number;
    used: number;
    refunded: number;
  };
}

export interface CreditCheckResult {
  hasEnough: boolean;
  balance: number;
  required: number;
  deficit: number;
}

export interface HoldCreditsResult {
  success: boolean;
  transactionId: string;
  newBalance: number;
  newHeld: number;
}

export interface TransactionHistoryItem {
  id: string;
  type: CreditTransactionType;
  amount: number;
  description: string;
  status: CreditTransactionStatus;
  createdAt: string;
  generationId?: string;
}

// ============================================
// CREDIT COSTS
// Final pricing March 2026
// 10 credits = 1 standard DIY video
// ============================================

export const CREDIT_COSTS = {
  // Core Video Generation
  DIY_VIDEO: 10,              // Standard DIY video (Sora 2 Standard via Kie.ai)
  DIY_BASE: 10,               // Alias for backwards compatibility
  CONCIERGE_VIDEO: 15,        // Concierge/Drop & Go (AI handles everything)
  CONCIERGE_BASE: 15,         // Alias for backwards compatibility

  // Add-ons (stackable on top of base cost)
  AUTO_CAPTIONS: 1,           // TikTok-style word highlighting (ElevenLabs STT + FFmpeg ASS)
  CAPTION_ADDON: 1,           // Alias for backwards compatibility
  HD_VIDEO_UPGRADE: 3,        // 1080p via Sora 2 Pro HD instead of standard
  PREMIUM_BROLL: 2,           // Veo 3 Quality via Kie.ai for higher-quality b-roll
  END_SCREEN_ADDON: 2,        // CTA end screen (Kling 2.6 animation)

  // Other Actions
  EDIT_REVISION: 5,           // Re-render with changes (half of base cost)
  EDIT_FIX: 5,                // Alias for backwards compatibility
  SCHEDULE_POST: 2,           // Social media scheduling
  SINGLE_SCRIPT: 4,           // Script generation only

  // Legacy aliases
  DIY_WITH_CAPTIONS: 11,      // DIY_VIDEO + AUTO_CAPTIONS
  CONCIERGE_WITH_CAPTIONS: 16, // CONCIERGE_VIDEO + AUTO_CAPTIONS

  // UGC Video Generation by Duration (future implementation)
  // Pipeline: Nano Banana (images) + Veo 3.1 (person animation) + Kling 2.6 (product reveal)
  UGC_8S: 20,    // Quick (8s) - FB Feed, hooks, teasers
  UGC_15S: 25,   // Short (15s) - TikTok/Reels quick ads
  UGC_22S: 30,   // Standard (22s) - TikTok/Reels optimal
  UGC_30S: 40,   // Full (30s) - Complete UGC story

  // Spotlight Product Animation (Nano Banana + Kling 2.6)
  // Flat 10 credits regardless of duration
  SPOTLIGHT_5S: 10,   // 5-second cinematic product animation
  SPOTLIGHT_10S: 10,  // 10-second cinematic product animation
} as const;

// UGC Video Duration Configuration
export type UGCDuration = '8s' | '15s' | '22s' | '30s';

// Spotlight Animation Duration
export type SpotlightDuration = '5' | '10';

export const UGC_DURATION_CONFIG: Record<UGCDuration, {
  label: string;
  seconds: number;
  credits: number;
  description: string;
  bestFor: string[];
}> = {
  '8s': {
    label: 'Quick',
    seconds: 8,
    credits: CREDIT_COSTS.UGC_8S,
    description: 'Perfect for hooks and teasers',
    bestFor: ['Facebook Feed', 'Story Ads', 'Hook Testing'],
  },
  '15s': {
    label: 'Short',
    seconds: 15,
    credits: CREDIT_COSTS.UGC_15S,
    description: 'Ideal for quick social ads',
    bestFor: ['TikTok Ads', 'Instagram Reels', 'Quick Demos'],
  },
  '22s': {
    label: 'Standard',
    seconds: 22,
    credits: CREDIT_COSTS.UGC_22S,
    description: 'Optimal engagement length',
    bestFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
  },
  '30s': {
    label: 'Full',
    seconds: 30,
    credits: CREDIT_COSTS.UGC_30S,
    description: 'Complete story with CTA',
    bestFor: ['Full UGC Story', 'Product Reviews', 'Testimonials'],
  },
};

export type CreditCostType = keyof typeof CREDIT_COSTS;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function calculateCreditCost(options: {
  mode: 'diy' | 'concierge';
  captionsEnabled: boolean;
  endScreenEnabled?: boolean;
}): number {
  const { mode, captionsEnabled, endScreenEnabled = false } = options;

  let baseCost: number;

  if (mode === 'concierge') {
    baseCost = CREDIT_COSTS.CONCIERGE_BASE;
  } else {
    baseCost = CREDIT_COSTS.DIY_BASE;
  }

  // Add caption addon (+1 credit)
  if (captionsEnabled) {
    baseCost += CREDIT_COSTS.CAPTION_ADDON;
  }

  // Add end screen addon (+2 credits)
  if (endScreenEnabled) {
    baseCost += CREDIT_COSTS.END_SCREEN_ADDON;
  }

  return baseCost;
}

/**
 * Calculate credit cost for UGC video generation
 */
export function calculateUGCCreditCost(options: {
  duration: UGCDuration;
  captionsEnabled?: boolean;
}): number {
  const { duration, captionsEnabled = false } = options;
  const config = UGC_DURATION_CONFIG[duration];

  // Base cost for duration + optional caption add-on
  return config.credits + (captionsEnabled ? CREDIT_COSTS.CAPTION_ADDON : 0);
}

/**
 * Calculate credit cost for Spotlight product animation
 */
export function calculateSpotlightCreditCost(duration: SpotlightDuration): number {
  // Flat 10 credits regardless of duration — Kling 2.6 animation cost is the same
  return CREDIT_COSTS.SPOTLIGHT_5S; // Both 5s and 10s are 10 credits
}

/**
 * Get estimated cost breakdown for display
 */
export function getUGCCostBreakdown(duration: UGCDuration): {
  apiCost: number;       // Actual Kie.ai cost in USD
  credits: number;       // UGCFirst credits charged
  margin: number;        // Gross margin percentage
} {
  const config = UGC_DURATION_CONFIG[duration];

  // Kie.ai costs (approximate)
  const imageCost = 0.18;  // 5x Nano Banana
  const klingCost = 0.28;  // 1x Kling 2.6
  const veoBaseCost = 0.30;
  const extensionCost = 0.30;

  const extensions = {
    '8s': 0,
    '15s': 1,
    '22s': 2,
    '30s': 3,
  }[duration];

  const apiCost = imageCost + klingCost + veoBaseCost + (extensions * extensionCost);
  const revenue = config.credits * 0.10;  // Assuming $0.10 per credit
  const margin = ((revenue - apiCost) / revenue) * 100;

  return {
    apiCost: Math.round(apiCost * 100) / 100,
    credits: config.credits,
    margin: Math.round(margin),
  };
}

export function formatCreditAmount(amount: number): string {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}${amount} credit${Math.abs(amount) !== 1 ? 's' : ''}`;
}

export function getTransactionTypeLabel(type: CreditTransactionType): string {
  const labels: Record<CreditTransactionType, string> = {
    purchase: 'Credit Purchase',
    subscription: 'Monthly Credits',
    usage: 'Video Generation',
    refund: 'Refund',
    hold: 'Reserved',
    release: 'Released',
    bonus: 'Bonus Credits',
    adjustment: 'Admin Adjustment',
  };
  return labels[type];
}

export function getTransactionTypeColor(
  type: CreditTransactionType
): 'success' | 'warning' | 'error' | 'default' {
  const colors: Record<CreditTransactionType, 'success' | 'warning' | 'error' | 'default'> = {
    purchase: 'success',
    subscription: 'success',
    usage: 'default',
    refund: 'warning',
    hold: 'warning',
    release: 'success',
    bonus: 'success',
    adjustment: 'default',
  };
  return colors[type];
}
