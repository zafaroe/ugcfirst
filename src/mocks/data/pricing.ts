/**
 * @deprecated Import from '@/config/pricing' instead.
 * This file re-exports from the config for backwards compatibility.
 */

import {
  SUBSCRIPTION_PLANS,
  CREDIT_PACKS,
  getPlanById,
  getCreditPackById,
  getPopularPlan,
} from '@/config/pricing'

// Re-export with mock* prefix for backwards compatibility
export const mockPricingPlans = SUBSCRIPTION_PLANS
export const mockCreditPacks = CREDIT_PACKS

export { getPlanById, getCreditPackById, getPopularPlan }
