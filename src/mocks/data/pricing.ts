import type { PricingPlan, CreditPack } from '@/types'

export const mockPricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    annualPrice: 0,
    credits: 30,
    videoCount: 3,
    costPerVideo: 0,
    features: [
      '3 videos per month',
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
    credits: 100,
    videoCount: 10,
    costPerVideo: 1.90,
    features: [
      '10 videos per month',
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
    credits: 200,
    videoCount: 20,
    costPerVideo: 2.95,
    isPopular: true,
    features: [
      '20 videos per month',
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
    credits: 450,
    videoCount: 45,
    costPerVideo: 2.20,
    features: [
      '45 videos per month',
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
    credits: 750,
    videoCount: 75,
    costPerVideo: 2.39,
    features: [
      '75 videos per month',
      'Everything in Plus',
      '50 connected social accounts',
      '5 team seats',
      'Dedicated support',
      'API access',
    ],
    limitations: [],
  },
]

export const mockCreditPacks: CreditPack[] = [
  {
    id: 'pack-starter',
    name: 'Starter Pack',
    price: 9.99,
    credits: 30,
    videoCount: 3,
    costPerVideo: 3.33,
  },
  {
    id: 'pack-growth',
    name: 'Growth Pack',
    price: 24.99,
    credits: 100,
    videoCount: 10,
    costPerVideo: 2.50,
  },
  {
    id: 'pack-scale',
    name: 'Scale Pack',
    price: 49.99,
    credits: 250,
    videoCount: 25,
    costPerVideo: 2.00,
  },
  {
    id: 'pack-bulk',
    name: 'Bulk Pack',
    price: 99.99,
    credits: 600,
    videoCount: 60,
    costPerVideo: 1.67,
  },
]

export function getPlanById(id: string): PricingPlan | undefined {
  return mockPricingPlans.find((p) => p.id === id)
}

export function getCreditPackById(id: string): CreditPack | undefined {
  return mockCreditPacks.find((p) => p.id === id)
}

export function getPopularPlan(): PricingPlan | undefined {
  return mockPricingPlans.find((p) => p.isPopular)
}
