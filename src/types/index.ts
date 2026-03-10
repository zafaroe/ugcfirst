// ============================================
// USER TYPES
// ============================================
export type PlanType = 'free' | 'starter' | 'pro' | 'plus' | 'agency'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  plan: PlanType
  createdAt: string
}

// ============================================
// CREDITS TYPES
// ============================================
export interface CreditBalance {
  total: number
  monthly: number
  purchased: number
  used: number
}

export type TransactionType = 'subscription' | 'purchase' | 'usage' | 'refund'

export interface CreditTransaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  createdAt: string
}

// ============================================
// PROJECT TYPES
// ============================================
export type ProjectStatus = 'queued' | 'processing' | 'ready' | 'failed'
export type ProjectMode = 'diy' | 'auto-pilot'

export interface Project {
  id: string
  title: string
  thumbnail?: string
  status: ProjectStatus
  duration: number
  creditCost: number
  mode: ProjectMode
  createdAt: string
  updatedAt: string
  videoUrl?: string
  script?: string
  avatarId?: string
  productId?: string
}

// ============================================
// PRODUCT TYPES
// ============================================
export type ProductSource = 'url' | 'manual'

export interface Product {
  id: string
  name: string
  image: string
  source: ProductSource
  url?: string
  description?: string
  features?: string[]
  price?: number
}

// ============================================
// AVATAR TYPES
// ============================================
export type AvatarStyle = 'casual' | 'professional' | 'energetic'
export type AvatarGender = 'female' | 'male' | 'neutral'

export interface Avatar {
  id: string
  name: string
  image: string
  videoPreview?: string
  style: AvatarStyle
  gender: AvatarGender
  isPremium: boolean
  voiceSample?: string
}

// ============================================
// PRICING TYPES
// ============================================
export interface PricingPlan {
  id: PlanType
  name: string
  price: number                 // Monthly price
  annualPrice: number           // Price per month when billed annually
  annualTotal: number           // Total annual cost
  credits: number               // Monthly credit allocation
  videoCount: number            // Advertised video count (credits / 10)
  costPerVideo: number          // Monthly price / video count
  features: string[]
  limitations?: string[]
  isPopular?: boolean
  badge?: string                // e.g. "Most Popular"
  valueDescription: string      // Positioning language for the plan
}

export interface CreditPack {
  id: string
  name: string
  price: number
  credits: number
  videoCount: number
  costPerVideo: number
}

// Feature gates by plan
export interface PlanFeatures {
  maxResolution: '720p' | '1080p'
  watermark: boolean
  concierge: boolean
  scheduling: boolean
  priorityRendering: boolean
  apiAccess: boolean
  teamSeats: number
  platformStrategy: boolean
  customAvatars: boolean
  dedicatedSupport: boolean
  hdUpgrade: boolean
  premiumBroll: boolean
}
