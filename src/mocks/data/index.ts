// Mock Data Exports

// User & Credits
export {
  mockUser,
  mockCreditBalance,
  mockTransactions,
  getUserById,
} from './user'

// Projects
export {
  mockProjects,
  getProjectById,
  getProjectsByStatus,
  getProjectsByMode,
  getRecentProjects,
} from './projects'

// Products
export {
  mockProducts,
  getProductById,
  getProductsBySource,
  searchProducts,
} from './products'

// Avatars
export {
  mockAvatars,
  getAvatarById,
  getAvatarsByGender,
  getAvatarsByStyle,
  getFreeAvatars,
  getPremiumAvatars,
} from './avatars'

// Pricing
export {
  mockPricingPlans,
  mockCreditPacks,
  getPlanById,
  getCreditPackById,
  getPopularPlan,
} from './pricing'

// Landing Page (Testimonials, FAQ, Comparison)
export {
  mockTestimonials,
  mockLandingFAQ,
  mockPricingFAQ,
  mockComparisonData,
  mockCompetitorComparison,
  type ComparisonRow,
  type CompetitorComparisonRow,
} from './landing'

// Strategy & Auto Pilot Flow
export {
  mockFetchedProducts,
  mockGeneratedScripts,
  mockSocialCopies,
  mockVideoCaptions, // backward compat alias
  mockStrategyBrief,
  mockPostingTimes,
  getMockFetchedProduct,
  getMockScript,
  getMockSocialCopy,
  getMockCaption, // backward compat alias
  getMockStrategyBrief,
} from './strategy'
