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

export interface UserCredits {
  user_id: string;
  balance: number;
  held: number;
  lifetime_purchased: number;
  lifetime_used: number;
  lifetime_refunded: number;
  updated_at: string;
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
// ============================================

export const CREDIT_COSTS = {
  DIY_BASE: 10,
  DIY_WITH_CAPTIONS: 11,
  CONCIERGE_BASE: 15,
  CONCIERGE_WITH_CAPTIONS: 16,
  EDIT_FIX: 5,
  SINGLE_SCRIPT: 4,
  CAPTION_ADDON: 1,
} as const;

export type CreditCostType = keyof typeof CREDIT_COSTS;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function calculateCreditCost(options: {
  mode: 'diy' | 'concierge';
  captionsEnabled: boolean;
}): number {
  const { mode, captionsEnabled } = options;

  if (mode === 'concierge') {
    return captionsEnabled
      ? CREDIT_COSTS.CONCIERGE_WITH_CAPTIONS
      : CREDIT_COSTS.CONCIERGE_BASE;
  }

  return captionsEnabled
    ? CREDIT_COSTS.DIY_WITH_CAPTIONS
    : CREDIT_COSTS.DIY_BASE;
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
