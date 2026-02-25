// ============================================
// VIDEO GENERATION TYPES
// ============================================

export type GenerationStage =
  | 'analyzing'
  | 'writing'
  | 'casting'
  | 'voiceover'
  | 'assembling'
  | 'rendering'
  | 'complete';

export type GenerationStatus =
  | 'queued'
  | 'analyzing'
  | 'scripting'
  | 'framing'
  | 'generating'
  | 'trimming'
  | 'captioning'  // DB constraint expects 'captioning', UI displays as "Adding subtitles"
  | 'uploading'
  | 'completed'
  | 'failed';

export type GenerationMode = 'diy' | 'concierge';

export type VideoJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type VideoVisibility = 'private' | 'public' | 'unlisted';

// ============================================
// DATABASE TYPES
// ============================================

export interface GenerationVideo {
  scriptIndex: number;
  frameUrl: string;              // Public URL for frame (Kie.ai needs access)
  videoR2Key: string;            // R2 storage key for raw video (no subtitles)
  videoSubtitledR2Key?: string;  // R2 storage key for subtitled video (with burned-in subtitles)
  videoCaptionedR2Key?: string;  // DEPRECATED: backward compat for old generations
  duration: number;
  subtitleWords?: Array<{        // Word-level timestamps for subtitle rendering
    text: string;
    start: number;
    end: number;
  }>;
  captions?: Array<{             // DEPRECATED: backward compat for old generations
    text: string;
    start: number;
    end: number;
  }>;
}

// ============================================
// PERSONA PROFILE (n8n Casting Director format)
// ============================================

export interface PersonaProfile {
  // Core Identity
  name: string;
  age: number;
  gender: string;
  location: string;
  occupation: string;

  // Physical Appearance & Personal Style
  appearance: {
    generalAppearance: string;
    hair: string;
    clothingAesthetic: string;
    signatureDetails: string;
  };

  // Personality & Communication
  personality: {
    keyTraits: string[];
    demeanor: string;
    communicationStyle: string;
  };

  // Lifestyle & Worldview
  lifestyle: {
    hobbiesAndInterests: string[];
    valuesAndPriorities: string[];
    dailyFrustrations: string[];
    homeEnvironment: string;
  };

  // The "Why" - Credibility justification
  credibility: string;

  // Legacy fields for backward compatibility
  targetAudience?: string;
  painPoints?: string[];
  benefits?: string[];
  tone?: string;
  keywords?: string[];
}

export interface StrategyBrief {
  platforms: {
    primary: PlatformRecommendation;
    secondary: PlatformRecommendation;
    alsoTest: PlatformRecommendation;
  };
  testingRoadmap: TestingPhase[];
  hookPriority: HookRecommendation[];
  metrics: MetricTarget[];
  audiences: AudienceSuggestion[];
  optimizationTips: {
    do: string[];
    dont: string[];
    proTips?: string[];
  };
  quickStats?: {
    estimatedCPM?: string;
    expectedROAS?: string;
    testingDuration?: string;
    totalBudget?: string;
  };
  bestPostingTimes: string[];
  socialCaptions?: {
    tiktok: { text: string; hashtags: string[] };
    instagram: { text: string; hashtags: string[] };
    youtube: { text: string; hashtags: string[] };
  };
}

export interface PlatformRecommendation {
  name: 'tiktok' | 'instagram' | 'youtube';
  reason: string;
  adFormat: string;
  startingBudget: string;
  tips: string[];
}

export interface TestingPhase {
  phase: number;
  days: string;
  action: string;
  budget: string;
  kpis: string[];
}

export interface MetricTarget {
  name: string;
  target: string;
  howToImprove: string;
}

export interface AudienceSuggestion {
  segment: string;
  ageRange: string;
  whyItWorks: string;
  interests: string[];
  behaviors?: string[];
}

export interface HookRecommendation {
  scriptIndex: number;
  hookType: string;
  openingLine: string;
  reasoning: string;
  expectedHookRate: string;
  priority: number;
}

export interface Generation {
  id: string;
  user_id: string;
  project_id: string | null;

  // Input
  product_name: string;
  product_image_url: string;
  avatar_id: string | null;
  template_id: string | null;
  custom_script: string | null;
  captions_enabled: boolean;

  // Processing state
  status: GenerationStatus;
  current_step: number;
  total_steps: number;

  // AI outputs
  persona_profile: PersonaProfile | null;
  scripts: string[] | null;
  strategy_brief: StrategyBrief | null;

  // Results
  videos: GenerationVideo[] | null;

  // Metadata
  mode: GenerationMode;
  credit_cost: number;
  credit_transaction_id: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;

  // Visibility
  visibility: VideoVisibility;
  share_token: string | null;
}

export interface VideoJob {
  id: string;
  generation_id: string;
  script_index: number;
  kie_job_id: string;
  status: VideoJobStatus;
  frame_url: string | null;
  raw_video_url: string | null;
  video_url: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// ============================================
// API REQUEST TYPES
// ============================================

export interface StartGenerationRequest {
  productName: string;
  productImageUrl: string;
  avatarId?: string;
  templateId?: string;
  customScript?: string;
  captionsEnabled: boolean;
  mode: GenerationMode;
}

export interface StartGenerationResponse {
  generationId: string;
  status: GenerationStatus;
  creditCost: number;
  estimatedTime: number; // seconds
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Video data with signed URLs for API responses
 * Extends GenerationVideo with temporary access URLs
 */
export interface GenerationVideoWithUrls extends GenerationVideo {
  videoUrl: string | null;           // Signed URL for raw video (no subtitles)
  videoSubtitledUrl: string | null;  // Signed URL for subtitled video (with burned-in subtitles)
  videoCaptionedUrl?: string | null; // DEPRECATED: backward compat for old generations
  // frameUrl is already in GenerationVideo as a public URL
}

export interface GenerationStatusResponse {
  id: string;
  status: GenerationStatus;
  currentStep: number;
  totalSteps: number;
  videos: GenerationVideoWithUrls[] | null;
  strategyBrief: StrategyBrief | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface KieWebhookPayload {
  job_id: string;
  status: 'completed' | 'failed';
  video_url?: string;
  duration?: number;
  error?: string;
}

// ============================================
// STEP DEFINITIONS
// ============================================

export const GENERATION_STEPS: Record<GenerationStatus, { step: number; label: string }> = {
  queued: { step: 0, label: 'Queued' },
  analyzing: { step: 1, label: 'Analyzing product' },
  scripting: { step: 2, label: 'Writing scripts' },
  framing: { step: 3, label: 'Generating frames' },
  generating: { step: 4, label: 'Creating videos' },
  trimming: { step: 5, label: 'Trimming videos' },
  captioning: { step: 6, label: 'Adding subtitles' }, // DB value is 'captioning', UI shows "Adding subtitles"
  uploading: { step: 7, label: 'Uploading to cloud' },
  completed: { step: 8, label: 'Complete' },
  failed: { step: -1, label: 'Failed' },
};

export function getStepLabel(status: GenerationStatus): string {
  return GENERATION_STEPS[status]?.label || 'Processing';
}

export function getStepProgress(status: GenerationStatus, totalSteps: number): number {
  if (status === 'completed') return 100;
  if (status === 'failed') return 0;

  const step = GENERATION_STEPS[status]?.step || 0;
  return Math.round((step / totalSteps) * 100);
}

// ============================================
// ESTIMATED TIMES (seconds)
// ============================================

export const ESTIMATED_STEP_TIMES: Record<GenerationStatus, number> = {
  queued: 5,
  analyzing: 15,
  scripting: 20,
  framing: 30,
  generating: 120, // 2 minutes for video generation
  trimming: 10,
  captioning: 30, // DB value is 'captioning' for subtitle burning step
  uploading: 15,
  completed: 0,
  failed: 0,
};

export function getEstimatedTotalTime(subtitlesEnabled: boolean): number {
  let total = Object.values(ESTIMATED_STEP_TIMES).reduce((a, b) => a + b, 0);
  if (!subtitlesEnabled) {
    total -= ESTIMATED_STEP_TIMES.captioning;
  }
  return total;
}

// ============================================
// REEL IT IN FLOW TYPES
// ============================================

export interface FetchedProduct {
  name: string;
  image: string;           // Selected/primary image
  images?: string[];       // All available images from extraction
  price?: string;
  description?: string;
  features: string[];
  source: 'url' | 'manual';
  url?: string;
}

// ============================================
// SCRIPT TYPES (n8n 12-Second UGC format)
// ============================================

export type ScriptApproach =
  | 'excited_discovery'     // Just found it, have to share
  | 'casual_recommendation' // Talking to camera like a friend
  | 'in_the_moment_demo'    // Showing while using it
  | 'skeptic_to_believer'   // "I didn't think this would work..."
  | 'pov_storytime'         // "POV: you finally found [solution]..."
  | 'problem_agitate_solution' // Pain → Amplify → Solution
  | 'before_after_transformation'; // Before state → transition → dramatic after

export interface DialogueLine {
  timestamp: string; // e.g., "0:00-0:02"
  text: string;
}

export interface ShotBreakdown {
  second: number; // 0-11
  cameraPosition: string;
  cameraMovement: string;
  whatsInFrame: string;
  creatorAction: string;
  productVisibility: string;
  audioCue: string;
  lighting?: string;
  focusPoint?: string;
  backgroundActivity?: string;
  productInteraction?: string;
  physicalDetails?: string;
  productHighlight?: string;
  howItEnds?: string;
  finalAudio?: string;
}

export interface TechnicalDetails {
  phoneOrientation: string;
  filmingMethod: string;
  dominantHand: string;
  locationSpecifics: string;
  audioEnvironment: string;
}

export interface GeneratedScript {
  // New n8n format
  approach: ScriptApproach;
  approachLabel: string; // Human readable e.g., "Excited Discovery"
  energy: string; // e.g., "Excited, caffeinated, can't wait to share"
  dialogue: DialogueLine[];
  shotBreakdown: ShotBreakdown[];
  technicalDetails: TechnicalDetails;

  // Computed fields
  fullScript: string; // All dialogue concatenated
  wordCount: number;
  estimatedDuration: number; // 12 seconds

  // Legacy fields for backward compatibility
  content?: string;
  hookLine?: string;
}

export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube';

export interface SocialPostCopy {
  text: string;
  hashtags: string[];
  platform: SocialPlatform;
  characterCount: number;
}

// Backward compatibility aliases
export type CaptionPlatform = SocialPlatform;
export type VideoCaption = SocialPostCopy;

export interface PostingTimeRecommendation {
  day: string;
  times: string[];
  engagement: 'high' | 'medium' | 'low';
}

// Wizard step type for Auto Pilot flow
export type ReelItInStep = 1 | 2 | 3 | 4;

export interface ReelItInState {
  step: ReelItInStep;
  product: FetchedProduct | null;
  script: GeneratedScript | null;
  subtitlesEnabled: boolean;
  isGenerating: boolean;
  generationStage: GenerationStage;
  videoUrl: string | null;
  socialCopy: SocialPostCopy | null;
  strategyBrief: StrategyBrief | null;
}
