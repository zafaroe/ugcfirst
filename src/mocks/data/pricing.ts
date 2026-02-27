import type { PricingPlan, CreditPack } from '@/types'

export const mockPricingPlans: PricingPlan[] = [
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

export const mockCreditPacks: CreditPack[] = [
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

export function getPlanById(id: string): PricingPlan | undefined {
  return mockPricingPlans.find((p) => p.id === id)
}

export function getCreditPackById(id: string): CreditPack | undefined {
  return mockCreditPacks.find((p) => p.id === id)
}

export function getPopularPlan(): PricingPlan | undefined {
  return mockPricingPlans.find((p) => p.isPopular)
}
