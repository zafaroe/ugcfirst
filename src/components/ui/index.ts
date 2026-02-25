// Base UI Components

// Motion (Framer Motion wrappers)
export {
  // Components
  FadeIn,
  SlideUp,
  SlideDown,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  // Presets
  DURATIONS,
  EASINGS,
  SPRING,
  hoverScale,
  hoverLift,
  hoverGlow,
  // Variants
  fadeInVariants,
  slideUpVariants,
  slideDownVariants,
  slideRightVariants,
  slideLeftVariants,
  scaleInVariants,
  scaleUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
  // Re-exports
  motion,
  AnimatePresence,
} from './motion'

// Core
export { Spinner } from './spinner'
export { Button, type ButtonProps } from './button'

// Form
export { Input, type InputProps } from './input'
export { Textarea, type TextareaProps } from './textarea'
export { Dropdown, type DropdownProps, type DropdownOption } from './dropdown'
export { FileUpload, type FileUploadProps } from './file-upload'

// Brand
export { Logo, type LogoProps } from './logo'

// Animated Icons (6-stage loading + complete + sparkle)
export {
  AnalyzingIcon,
  WritingIcon,
  CastingIcon,
  VoiceoverIcon,
  AssemblingIcon,
  RenderingIcon,
  CompleteIcon,
  SparkleIcon,
} from './animated-icons'

// Display
export { Badge, type BadgeProps } from './badge'
export { Avatar, type AvatarProps } from './avatar'
export { Skeleton } from './skeleton'
export { Progress, type ProgressProps } from './progress'

// Layout
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, type CardProps } from './card'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

// Overlay
export { Modal, ConfirmModal, type ModalProps, type ConfirmModalProps } from './modal'
export { ToastProvider, useToast, useToastActions, type Toast, type ToastVariant } from './toast'

// Background Effects
export {
  GridBackground,
  FloatingStars,
  GradientOrb,
  SparkleBurst,
  CornerStar,
  WaveDecoration,
  FloatingOrbs,
  GlowingGrid,
  WaveLines,
  AmbientParticles,
  PulseRings,
} from './background-effects'

// Enhanced Cards
export {
  GradientCard,
  GlassCard,
  FeatureCard,
  StatCard,
  type GradientCardProps,
  type GlassCardProps,
  type FeatureCardProps,
  type StatCardProps,
} from './gradient-card'

// Theme Toggle
export { ThemeToggle } from './theme-toggle'

// Confetti & Celebrations
export { Confetti, ConfettiBurst, EmojiConfetti } from './confetti'

// Accordion
export { Accordion, FAQ, type AccordionItem, type AccordionProps, type FAQProps } from './accordion'

// Demo Animation
export { DemoAnimation } from './demo-animation'

// Demo Gallery (Premium horizontal scroll showcase)
export { DemoGallery } from './demo-gallery'

// Trust Bar (Social proof section)
export { TrustBar, TrustBarCompact } from './trust-bar'

// Hero Video Showcase (Floating cards)
export { HeroVideoShowcase } from './hero-video-showcase'

// Rotating Headline (Animated word cycling)
export { RotatingHeadline } from './rotating-headline'

// Platform Badges (Social platform icons)
export { PlatformBadges } from './platform-badges'

// High-Voltage Animation Components
export { ElectricalConnector, type ElectricalConnectorProps } from './electrical-connector'
export { GlitchText, type GlitchTextProps } from './glitch-text'
export { StageIcon, type StageType } from './stage-icon'

// Hero Phone Animation
export { HeroPhoneAnimation } from './hero-phone-animation'
