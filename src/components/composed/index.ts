// Composed Components

export { TestimonialCard, TestimonialCardAnimated, type TestimonialCardProps, type Testimonial } from './testimonial-card'
export {
  ComparisonTable,
  CompetitorComparisonTable,
  type ComparisonTableProps,
  type CompetitorComparisonTableProps,
  type ComparisonRow,
  type CompetitorComparisonRow,
} from './comparison-table'
export { CreditBadge, type CreditBadgeProps } from './credit-badge'
export { StatusBadge, type StatusBadgeProps } from './status-badge'
export { ProjectCard, ProjectCardSkeleton, type ProjectCardProps } from './project-card'
export { GenerationCard, GenerationCardSkeleton, type GenerationCardProps } from './generation-card'
export { VisibilityToggle, VisibilityBadge, type VisibilityToggleProps } from './visibility-toggle'
export { PricingCard, type PricingCardProps } from './pricing-card'
export { ProductCard, AddProductCard, type ProductCardProps } from './product-card'
export { AvatarCard, type AvatarCardProps } from './avatar-card'
export { EmptyState, emptyStatePresets, type EmptyStateProps, type EmptyStateAction } from './empty-state'
export {
  illustrations as emptyStateIllustrations,
  FilmReelIllustration,
  ClapperboardIllustration,
  CameraIllustration,
  ScriptIllustration,
  SpotlightIllustration,
  DirectorChairIllustration,
  type IllustrationType,
} from './empty-state-illustrations'
export { VideoPlayer, type VideoPlayerProps } from './video-player'
export { GenerationView, type GenerationViewProps, type GenerationStage } from './generation-view'
export { ManualProductForm, isManualProductValid, type ManualProductFormProps, type ManualProductData } from './manual-product-form'

// New Mode Selection Cards
export { ModeSelectionCard, ModeSelectionCardCompact, type ModeSelectionCardProps } from './mode-selection-card'

// Reel It In Flow Components
export { ProductPreview, ProductPreviewSkeleton, type ProductPreviewProps } from './product-preview'
export { ScriptPreview, ScriptPreviewSkeleton, type ScriptPreviewProps } from './script-preview'
export { SocialCopyCard, SocialCopyCardSkeleton, type SocialCopyCardProps } from './social-copy-card'
// Backward compatibility
export { VideoCaptionComponent, VideoCaptionSkeleton, type VideoCaptionProps } from './social-copy-card'
export { StrategyResults, StrategyResultsSkeleton, type StrategyResultsProps } from './strategy-results'
export { ScheduleUpgradeCard, type ScheduleUpgradeCardProps } from './schedule-upgrade-card'

// Credit Modals
export { InsufficientCreditsModal, LowCreditsBanner, type InsufficientCreditsModalProps, type LowCreditsBannerProps } from './insufficient-credits-modal'

// SVG Illustrations
export { RobotMascot, RobotIcon } from './svg-illustrations/robot-mascot'
export { DIYIllustration } from './svg-illustrations/diy-illustration'
export { ReelIllustration } from './svg-illustrations/reel-illustration'
export { EmptyStateArt } from './svg-illustrations/empty-state-art'
