import { Inngest } from 'inngest';

/**
 * Inngest Client Configuration
 *
 * Inngest provides background job processing with:
 * - Automatic retries with exponential backoff
 * - Event-driven architecture
 * - Webhook handling
 * - Step functions for complex workflows
 *
 * Free tier: 25,000 events/month
 */

// ============================================
// EVENT TYPES
// ============================================

export type Events = {
  // Video generation events
  'generation/start': {
    data: {
      generationId: string;
      userId: string;
      productName: string;
      productImageUrl: string;
      avatarId?: string;
      templateId?: string;
      customScript?: string;
      captionsEnabled: boolean;
      mode: 'diy' | 'concierge' | 'spotlight';
      creditTransactionId: string;
      voiceId?: string;
      applyWatermark?: boolean;
      existingPersona?: import('@/types/generation').PersonaProfile; // For regeneration - skip analysis
      endScreenEnabled?: boolean;
      endScreenCtaText?: string;
      endScreenBrandText?: string;
      // Spotlight-specific fields
      spotlightCategoryId?: string;
      spotlightStyleId?: string;
      spotlightDuration?: '5' | '10';
    };
  };

  // Video processing events
  'video/process': {
    data: {
      generationId: string;
      scriptIndex: number;
      videoUrl: string;
      captionsEnabled: boolean;
    };
  };

  // Webhook events
  'webhook/kie-completed': {
    data: {
      generationId: string;
      scriptIndex: number;
      jobId: string;
      videoUrl: string;
      duration: number;
    };
  };

  'webhook/kie-failed': {
    data: {
      generationId: string;
      scriptIndex: number;
      jobId: string;
      error: string;
    };
  };

  // Strategy generation (Concierge)
  'strategy/generate': {
    data: {
      generationId: string;
    };
  };

  // Social media scheduling events
  'schedule/post': {
    data: {
      scheduledPostId: string;
      userId: string;
      videoUrl: string;
      caption: string;
      platforms: string[];
      scheduledFor?: string;
    };
  };

  'schedule/check-status': {
    data: {
      scheduledPostId: string;
      latePostId: string;
    };
  };

  // Waitlist nurture cron
  'waitlist/nurture-check': {
    data: Record<string, never>;
  };
};

// ============================================
// INNGEST CLIENT
// ============================================

// Check if we're in dev mode (no keys configured)
const isDev = !process.env.INNGEST_EVENT_KEY || process.env.INNGEST_EVENT_KEY.trim() === '';

export const inngest = new Inngest({
  id: 'ugcfirst',
  // In dev mode, use the local dev server
  // In production, use the configured keys
  ...(isDev
    ? {
        // Dev mode: connect to local Inngest dev server
        isDev: true,
      }
    : {
        // Production: use API keys
        eventKey: process.env.INNGEST_EVENT_KEY,
        ...(process.env.INNGEST_SIGNING_KEY && { signingKey: process.env.INNGEST_SIGNING_KEY }),
      }),
});

// ============================================
// EXPORTS
// ============================================

export default inngest;
