# Video Generation Pipeline - Implementation Plan

> Complete technical specification for converting the n8n UGC workflow to a code-based pipeline.
> Last Updated: February 2025

---

## Table of Contents

### Part 1: Video Generation Pipeline
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Storage (Cloudflare R2)](#storage-cloudflare-r2)
4. [Database Schema](#database-schema)
5. [File Structure](#file-structure)
6. [Pipeline Steps](#pipeline-steps)
7. [Credit System](#credit-system)
8. [Captions Module](#captions-module)
9. [Video Trimming](#video-trimming)
10. [AI Consultant (Concierge)](#ai-consultant-concierge-exclusive)
11. [API Routes](#api-routes)
12. [Implementation Phases](#implementation-phases)
13. [Cost Summary](#cost-summary)
14. [Environment Variables](#environment-variables)

### Part 2: DIY Template System
15. [Template System Overview](#template-system-overview)
16. [Template 1: PAS](#template-1-problem-agitate-solution-pas)
17. [Template 2: Unboxing](#template-2-unboxingfirst-impressions)
18. [Template 3: Testimonial](#template-3-testimonialreview-style)
19. [Template System Architecture](#template-system-architecture)
20. [Type Definitions](#type-definitions)
21. [Template Store (Zustand)](#template-store-zustand)
22. [DIY Workflow Integration](#diy-workflow-integration)
23. [Component Design Specs](#component-design-specs)
24. [Implementation Order](#implementation-order)

---

## Overview

Convert the Basic Austin UGC n8n workflow into a TypeScript-based video generation pipeline with:
- Async job processing with callbacks/webhooks (Inngest)
- Cloudflare R2 for video storage (zero egress fees)
- Supabase for job tracking and user data
- Next.js API routes for the backend

### User Decisions
- **Background Jobs**: Inngest (free tier: 25k events/month)
- **Video Access**: Permanent public URLs (users have indefinite access)
- **Completion Notification**: Webhook callback from kie.ai

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                            │
│  DIY Page → Submit Job → Poll Status / Receive Webhook → View Video    │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API ROUTES (/api)                                │
│  /api/generate/start     - Create job, deduct credits, queue           │
│  /api/generate/status    - Poll job status                             │
│  /api/generate/webhook   - Receive kie.ai completion callback          │
│  /api/videos/[id]        - Get video details & URL                     │
│  /api/credits/*          - Credit management                           │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND JOB PROCESSOR (Inngest)                   │
│                                                                         │
│  Step 1: analyze_product (GPT-4o Vision)           ~$0.015            │
│  Step 2: generate_scripts (Gemini 2.5 Pro)         ~$0.035            │
│  Step 3: generate_frames (Gemini 2.5 Flash) x3     ~$0.01             │
│  Step 4: upload_frames (Cloudflare R2)             ~FREE              │
│  Step 5: generate_videos (kie.ai Sora-2) x3        ~$0.45             │
│  Step 6: trim_videos (FFmpeg - remove first 1s)    ~FREE              │
│  Step 7: add_captions (if enabled)                 ~$0.01             │
│  Step 8: store_videos (Cloudflare R2)              ~FREE              │
│  Step 9: generate_strategy (Concierge only)        ~$0.02             │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         STORAGE LAYER                                   │
│  Supabase: users, projects, generations, credits                       │
│  Cloudflare R2: frames/, videos/ (permanent public URLs)               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Storage (Cloudflare R2)

### Why R2 over S3/Bunny
- **Zero egress fees** - Users can view/download videos for free
- **$0.015/GB storage** - Cheap storage for generated videos
- **S3-compatible API** - Easy migration path, familiar SDK
- **10GB free** - Great for development/testing

### Cost Projection (1000 videos/month @ 50MB each)
- Storage: 50GB × $0.015 = $0.75/month
- Egress: $0 (unlimited)
- Operations: ~$0.01

### Configuration
```
Bucket: vidnary-videos
Public Access: Enabled (via custom domain or R2.dev)
URL Pattern: https://videos.vidnary.com/{userId}/{generationId}/{index}.mp4
```

**Sources:** [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/), [R2 vs S3 Comparison](https://www.cloudflare.com/pg-cloudflare-r2-vs-aws-s3/)

---

## Database Schema

### Generations Table
```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),

  -- Input
  product_name TEXT NOT NULL,
  product_image_url TEXT NOT NULL,
  avatar_id TEXT,
  custom_script TEXT,
  captions_enabled BOOLEAN DEFAULT true,

  -- Processing state
  status TEXT DEFAULT 'queued', -- queued, analyzing, scripting, framing, generating, uploading, completed, failed
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 9,

  -- AI outputs
  persona_profile JSONB,
  scripts JSONB, -- Array of 3 scripts
  strategy_brief JSONB, -- Concierge only

  -- Results
  videos JSONB, -- Array of {script_index, frame_url, video_url, duration}

  -- Metadata
  mode TEXT DEFAULT 'diy', -- 'diy' or 'concierge'
  credit_cost INTEGER DEFAULT 10,
  credit_transaction_id UUID,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Video Jobs Table (kie.ai tracking)
```sql
CREATE TABLE video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id),
  script_index INTEGER NOT NULL,
  kie_job_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### User Credits Table
```sql
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance INTEGER DEFAULT 0,           -- Total available
  held INTEGER DEFAULT 0,              -- Reserved for pending jobs
  lifetime_purchased INTEGER DEFAULT 0,
  lifetime_used INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Credit Transactions Table
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,  -- 'purchase', 'subscription', 'usage', 'refund', 'hold', 'release'
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  generation_id UUID REFERENCES generations(id),
  stripe_payment_id TEXT,
  description TEXT,
  status TEXT DEFAULT 'completed',  -- 'pending', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_generations_user_status ON generations(user_id, status);
CREATE INDEX idx_video_jobs_kie_id ON video_jobs(kie_job_id);
CREATE INDEX idx_credit_txn_user ON credit_transactions(user_id, created_at DESC);
```

---

## File Structure

```
vidnary/src/
├── app/api/
│   ├── generate/
│   │   ├── start/route.ts       # POST: Start generation job
│   │   ├── status/route.ts      # GET: Poll job status
│   │   └── webhook/route.ts     # POST: kie.ai completion callback
│   ├── videos/
│   │   └── [id]/route.ts        # GET: Video details + URL
│   └── credits/
│       ├── balance/route.ts     # GET: Current balance
│       ├── history/route.ts     # GET: Transaction history
│       ├── check/route.ts       # POST: Verify sufficient balance
│       └── purchase/route.ts    # POST: Stripe checkout
│
├── lib/
│   ├── r2.ts                    # Cloudflare R2 client
│   ├── ffmpeg.ts                # Video trimming utilities
│   ├── ai/
│   │   ├── openai.ts            # GPT-4o Vision client
│   │   ├── gemini.ts            # Gemini Pro/Flash client
│   │   ├── kie.ts               # kie.ai Sora-2 client
│   │   ├── elevenlabs.ts        # ElevenLabs Speech-to-Text
│   │   └── strategy.ts          # Strategy brief generation
│   ├── captions/
│   │   ├── stt.ts               # ElevenLabs STT integration
│   │   ├── ass-generator.ts     # ASS subtitle file generator
│   │   └── types.ts             # Caption types
│   └── generation/
│       ├── pipeline.ts          # Main orchestration logic
│       ├── prompts.ts           # All AI prompts
│       └── types.ts             # Generation types
│
├── inngest/
│   ├── client.ts                # Inngest client setup
│   └── functions/
│       └── generate-video.ts    # Background job function
│
├── services/
│   ├── generation.ts            # Generation service (DB operations)
│   └── credits.ts               # Credit management service
│
├── components/blocks/
│   ├── create/
│   │   └── caption-toggle.tsx   # Captions toggle component
│   └── strategy/
│       ├── platform-card.tsx
│       ├── testing-roadmap.tsx
│       ├── metrics-targets.tsx
│       └── audience-suggestions.tsx
│
└── types/
    ├── generation.ts            # Generation types
    └── credits.ts               # Credit types
```

---

## Pipeline Steps

### Full Pipeline (with Captions & Trimming)

```
Step 1: analyze_product (GPT-4o Vision)           ~$0.015
Step 2: generate_scripts (Gemini 2.5 Pro)         ~$0.035
Step 3: generate_frames (Gemini 2.5 Flash) x3     ~$0.01
Step 4: upload_frames (Cloudflare R2)             ~FREE
Step 5: generate_videos (kie.ai Sora-2) x3        ~$0.45
Step 6: trim_videos (FFmpeg - remove first 1s)    ~FREE
Step 7: add_captions (if enabled)                 ~$0.01 (ElevenLabs STT)
        ├─ Extract audio (FFmpeg)
        ├─ ElevenLabs STT API
        ├─ Generate ASS file
        └─ FFmpeg burn-in
Step 8: store_videos (Cloudflare R2)              ~FREE
Step 9: generate_strategy (Concierge only)        ~$0.02
Step 10: notify_complete (Webhook callback)
```

### Pipeline Code Structure

```typescript
// src/lib/generation/pipeline.ts

export async function runGenerationPipeline(generationId: string) {
  // Step 1: Analyze product → Persona
  await updateStatus(generationId, 'analyzing', 1);
  const persona = await analyzeProduct(productImage, productName);

  // Step 2: Generate scripts
  await updateStatus(generationId, 'scripting', 2);
  const scripts = await generateScripts(persona, productImage, productName);

  // Step 3-7: For each script (can parallelize)
  const videoPromises = scripts.map(async (script, index) => {
    // Generate frame
    const frame = await generateFrame(productImage);

    // Upload frame to R2
    const frameUrl = await uploadToR2(`frames/${generationId}/${index}.png`, frame);

    // Create video job with webhook callback
    const jobId = await createVideoJob(script, frameUrl, webhookUrl);

    // Store job reference
    await saveVideoJob(generationId, index, jobId);

    return { index, jobId };
  });

  await Promise.all(videoPromises);
  // Webhook will handle: trim → captions → store → complete
}
```

---

## Credit System

### Credit Economy

| Action | Credits | Notes |
|--------|---------|-------|
| DIY Video (3 scripts) | 10 | Standard generation |
| DIY Video + Captions | 11 | +1 for ElevenLabs captions |
| Concierge Video | 15 | Full service + strategy brief |
| Concierge + Captions | 16 | +1 for ElevenLabs captions |
| Re-edit/Fix | 5 | Modify existing video |
| Single Script | 4 | Generate just 1 video instead of 3 |

### Credit Flow

```
User clicks "Generate" (10 credits)
        │
        ▼
┌─────────────────────────────────┐
│  1. Check credit balance ≥ 10  │
│     - If insufficient, show     │
│       "Buy Credits" modal       │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  2. HOLD credits (soft deduct) │
│     - credits.held += 10        │
│     - credits.available -= 10   │
│     - Create pending transaction│
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  3. Start generation pipeline   │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        │             │
   SUCCESS         FAILURE
        │             │
        ▼             ▼
┌───────────────┐  ┌───────────────┐
│ 4a. CONFIRM   │  │ 4b. REFUND    │
│ - held → used │  │ - held → 0    │
│ - Log usage   │  │ - available+10│
│ - Update txn  │  │ - Cancel txn  │
└───────────────┘  └───────────────┘
```

### Credit Service Functions

```typescript
// src/services/credits.ts

export async function checkBalance(userId: string, required: number): Promise<boolean>
export async function holdCredits(userId: string, amount: number, generationId: string): Promise<string>
export async function confirmCredits(transactionId: string): Promise<void>
export async function refundCredits(transactionId: string): Promise<void>
export async function getBalance(userId: string): Promise<{ balance: number, held: number }>
export async function addCredits(userId: string, amount: number, source: 'purchase' | 'subscription'): Promise<void>
```

---

## Captions Module

### Overview
TikTok-style word-by-word highlighting ("Hormozi style") using ElevenLabs Speech-to-Text for precise word timestamps and FFmpeg for caption burn-in.

### Pipeline Flow
```
Sora Video Output
       │
       ▼
captionsEnabled? ─── NO ──→ Skip to Final Output
       │
      YES
       │
       ▼
Extract Audio (FFmpeg: ffmpeg -i video.mp4 -vn audio.wav)
       │
       ▼
ElevenLabs STT API (get word-level timestamps)
       │
       ▼
Filter words (type === 'word', exclude 'spacing')
       │
       ▼
Generate ASS Subtitle File (Hormozi styling)
       │
       ▼
FFmpeg Burn-in (ffmpeg -i video.mp4 -vf "ass=captions.ass" output.mp4)
       │
       ▼
Final Video with Captions
```

### Caption Style (Hormozi)

| Property | Value |
|----------|-------|
| Font | Montserrat Black / Inter Black |
| Font Size | 52px |
| Primary Text | White (#FFFFFF) |
| Highlight Word | Amber (#FBBF24) |
| Outline | 3px black stroke |
| Position | Centered, 150px from bottom |
| Words Per Group | 2-4 words |

### ElevenLabs STT Response

```typescript
interface ElevenLabsSTTResponse {
  resultObject: {
    words: Array<{
      text: string;
      start: number;  // seconds
      end: number;    // seconds
      type: 'word' | 'spacing';
    }>;
  };
}

// Filter to get words only:
const words = response.resultObject.words
  .filter(w => w.type === 'word')
  .map(w => ({ word: w.text, start: w.start, end: w.end }));
```

### Frontend Component

```tsx
// src/components/blocks/create/caption-toggle.tsx
'use client';

import { motion } from 'framer-motion';
import { Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptionToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function CaptionToggle({ enabled, onToggle, className }: CaptionToggleProps) {
  return (
    <div className={cn(
      "rounded-xl bg-surface border border-border-default p-4",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-elevated">
            <Type className="w-5 h-5 text-electric-indigo" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Auto Captions</p>
            <p className="text-xs text-text-muted">TikTok-style word highlighting</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            "text-xs font-medium transition-colors",
            enabled ? "text-electric-indigo" : "text-text-muted"
          )}>
            {enabled ? "+1 credit" : "Off"}
          </span>

          <button
            onClick={() => onToggle(!enabled)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              enabled
                ? "bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia"
                : "bg-elevated"
            )}
          >
            <motion.div
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              animate={{ left: enabled ? 28 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Video Trimming

### Problem
Image-to-video generation (Sora-2) starts with a static frame, creating an awkward first second.

### Solution: FFmpeg Post-Processing

```typescript
// src/lib/ffmpeg.ts
import ffmpeg from 'fluent-ffmpeg';

export async function trimFirstSecond(inputPath: string, outputPath: string) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(1)  // Start from 1 second
      .outputOptions(['-c copy'])  // Fast copy without re-encoding
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}
```

### Alternative Approaches
1. **FFmpeg WASM** - Use `@ffmpeg/ffmpeg` for serverless environments
2. **Cloudinary** - Upload, apply trim transformation, re-download
3. **kie.ai** - Check if start offset parameter is supported

---

## AI Consultant (Concierge Exclusive)

### Overview
Generate a personalized "Strategy Brief" for Concierge users with platform recommendations, testing strategy, and optimization tips.

### What the Strategy Brief Includes

1. **Platform Recommendations**
   - Primary, secondary, also-test platforms
   - Ad format suggestions
   - Starting budget recommendations

2. **14-Day Testing Framework**
   | Phase | Duration | Action | Budget |
   |-------|----------|--------|--------|
   | Phase 1 | Days 1-3 | Test all 3 hooks | $180 |
   | Phase 2 | Days 4-7 | Scale winner | $50-100/day |
   | Phase 3 | Days 8-14 | Test audiences | $100/day |

3. **Key Metrics**
   - Hook Rate: >30% (watched 3+ seconds)
   - Hold Rate: >10% (watched to end)
   - CTR: >1%

4. **Hook Priority** - Which script to test first and why

5. **Audience Targeting** - Interests, demographics, lookalike strategy

6. **Optimization Tips** - Best posting times, CTA variations, refresh timing

### Output Schema

```typescript
interface StrategyBrief {
  platforms: {
    primary: Platform;
    secondary: Platform;
    alsoTest: Platform;
  };
  testingRoadmap: {
    phase: number;
    days: string;
    action: string;
    budget: string;
    kpis: string[];
  }[];
  hookPriority: {
    scriptIndex: number;
    reason: string;
    alternativeHooks: string[];
  };
  metrics: {
    name: string;
    target: string;
    howToImprove: string;
  }[];
  audienceTargeting: {
    interests: string[];
    demographics: string;
    lookalikeStrategy: string;
  };
  optimizationTips: string[];
  bestPostingTimes: string[];
}

interface Platform {
  name: 'tiktok' | 'instagram' | 'youtube';
  reason: string;
  adFormat: string;
  startingBudget: string;
  tips: string[];
}
```

### Frontend Page

New page at `/projects/[id]/strategy` with:
- Platform recommendation cards
- Visual testing roadmap timeline
- Metrics dashboard with targets
- Downloadable PDF option

---

## API Routes

### Generate Endpoints

**POST `/api/generate/start`**
1. Validate user credits
2. Create generation record (status: 'queued')
3. Hold credits
4. Trigger Inngest background job
5. Return generation ID

**GET `/api/generate/status`**
1. Get generation by ID
2. Return current status, step, videos array
3. Frontend polls every 5 seconds

**POST `/api/generate/webhook`**
1. Verify webhook signature from kie.ai
2. Find video_job by kie_job_id
3. Download video → Trim → Captions → Upload to R2
4. Update video_job with R2 URL
5. Check if all 3 videos complete
6. If complete, confirm credits, update status

### Video Endpoints

**GET `/api/videos/[id]`**
1. Verify user owns generation
2. Return video metadata + permanent URLs

### Credit Endpoints

```
GET  /api/credits/balance    - Get current balance
GET  /api/credits/history    - Get transaction history
POST /api/credits/check      - Verify sufficient balance
POST /api/credits/purchase   - Stripe checkout
```

---

## Implementation Phases

### Phase 1: Infrastructure & Database
- Set up Cloudflare R2 bucket (public access)
- Add all environment variables
- Create R2 client library
- Create Supabase tables

### Phase 2: Credit System
- Credit service functions
- Credit API routes
- Hold/confirm/refund logic
- Zustand store integration

### Phase 3: AI Services
- OpenAI client (persona prompt)
- Gemini client (script/frame prompts)
- kie.ai client (job management)
- ElevenLabs client (STT)

### Phase 4: Video Processing
- FFmpeg trimming utility
- Caption generation (ASS files)
- Test in isolation

### Phase 5: API Routes & Pipeline
- Generation endpoints
- Inngest background job
- Error handling with refunds

### Phase 6: Frontend Integration
- Connect DIY page to real API
- Add captions toggle
- Real-time status updates
- Video viewing & download

### Phase 7: Captions Module
- Frontend toggle component
- Backend caption generation
- FFmpeg burn-in

### Phase 8: AI Consultant (Concierge)
- Strategy brief generation
- Frontend strategy page
- PDF export

---

## Cost Summary

### Per Execution

| Component | Cost | Notes |
|-----------|------|-------|
| GPT-4o Vision | $0.015 | Persona analysis |
| Gemini 2.5 Pro | $0.035 | Script generation |
| Gemini 2.5 Flash | $0.01 | 3 frame generations |
| kie.ai Sora-2 | $0.45 | 3 videos @ $0.15 each |
| ElevenLabs STT | $0.01 | If captions enabled |
| GPT-4o Strategy | $0.02 | Concierge only |
| Cloudflare R2 | ~$0 | Zero egress |

### Totals

| Mode | Without Captions | With Captions |
|------|------------------|---------------|
| DIY | ~$0.51 | ~$0.52 |
| Concierge | ~$0.53 | ~$0.54 |

---

## Environment Variables

```env
# AI APIs
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
KIE_AI_API_KEY=...
ELEVENLABS_API_KEY=...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=vidnary-videos
R2_PUBLIC_URL=https://videos.vidnary.com

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Webhook
WEBHOOK_SECRET=...
APP_URL=https://app.vidnary.com

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe (for credits)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

---

## Research Sources

- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [kie.ai Sora-2 API](https://kie.ai/sora-2)
- [Insense - Creative Testing](https://insense.pro/blog/creative-testing)
- [Uplifted AI - UGC Analytics](https://www.uplifted.ai/blog/post/2025-video-marketing-guide-hooks-ugc-analytics)
- [TikTok UGC Guide](https://taggbox.com/blog/ugc-tiktok-ads/)

---

# Part 2: DIY Template System Implementation

> **Purpose:** Implement a scalable UGC video template system for Vidnary's DIY workflow with proven high-converting formats.

---

## Template System Overview

The template-driven script generation system guides users through creating high-converting UGC videos. Phase 1 focuses on the three highest-converting templates identified through market research.

### Phase 1 Templates

| Template | ID | Priority | Conversion | Duration |
|----------|-----|----------|------------|----------|
| Problem-Agitate-Solution | `pas` | CRITICAL | Highest (#1) | 15-25s |
| Unboxing/First Impressions | `unboxing` | CRITICAL | Very High | 20-30s |
| Testimonial/Review | `testimonial` | CRITICAL | Highest | 15-30s |

---

## Template 1: Problem-Agitate-Solution (PAS)

**The highest-converting UGC format.** Start by identifying a relatable problem, amplify the frustration, then position your product as the perfect solution.

### Sections

| Section | Time | Purpose | Word Count |
|---------|------|---------|------------|
| **Hook** | 0-3s | Pattern interrupt, grab attention | 5-15 words |
| **Problem** | 3-7s | Identify relatable pain point | 15-30 words |
| **Agitate** | 7-12s | Amplify the pain, create urgency | 20-40 words |
| **Solution** | 12-20s | Introduce product as the answer | 30-60 words |
| **CTA** | 20-25s | Clear call to action | 8-20 words |

### Hook Examples
```
• "I was SO tired of [problem]... then I found this."
• "If you're still struggling with [problem], watch this."
• "Stop wasting money on [old solution] - here's what actually works."
• "I wish someone told me this sooner about [problem]."
• "POV: You finally found the solution to [problem]."
```

### Best For
- Products that solve a clear pain point
- Health & wellness products
- Productivity tools
- Home improvement items
- Skincare & beauty

---

## Template 2: Unboxing/First Impressions

**Leverage the viral #TikTokMadeMeBuyIt trend** with genuine first impressions. Perfect for visually appealing products where the "reveal" moment creates excitement.

### Sections

| Section | Time | Purpose | Word Count |
|---------|------|---------|------------|
| **Anticipation Hook** | 0-3s | Build excitement | 5-15 words |
| **Package Reveal** | 3-8s | Show unboxing moment | 10-25 words |
| **Product Reveal** | 8-15s | First look at product | 25-50 words |
| **Genuine Reaction** | 15-22s | Authentic response | 20-40 words |
| **Feature Highlight** | 22-27s | Quick key features | 15-30 words |
| **CTA** | 27-30s | Where to get it | 5-15 words |

### Hook Examples
```
• "My [product] finally arrived! Let me show you what's inside..."
• "You guys have been asking about this - it's here!"
• "I've been waiting 2 weeks for this unboxing..."
• "Okay THIS is the package everyone's been talking about."
• "Let's see if this lives up to the hype..."
```

### AI Model Notes
- **Primary:** Sora 2 (for reactions)
- **Secondary:** Veo 3 (for product close-ups and B-roll)

### Best For
- Visually appealing products
- Premium or luxury items
- Trending viral products
- Gift-worthy items
- Tech gadgets with nice packaging

---

## Template 3: Testimonial/Review Style

**The core social proof format.** "I didn't believe it at first" converts 4x higher than direct product claims.

### Sections

| Section | Time | Purpose | Word Count |
|---------|------|---------|------------|
| **Personal Context** | 0-3s | Establish relatability | 8-18 words |
| **Skepticism Statement** | 3-8s | "I didn't believe it at first" | 18-35 words |
| **Product Introduction** | 8-13s | How they discovered it | 18-35 words |
| **Results/Benefits** | 13-22s | What changed for them | 35-65 words |
| **Recommendation** | 22-30s | Enthusiastic endorsement | 20-40 words |

### Hook Examples
```
• "Okay I was skeptical, but I've been using this for 2 weeks and..."
• "I didn't believe this at first, but here's my honest review."
• "Everyone said this was overhyped - they were WRONG."
• "I've tried everything for [problem]. This actually worked."
• "Real talk - is [product] worth it? Here's my experience."
```

### Best For
- Products with measurable results
- Health and wellness supplements
- Skincare with visible improvements
- Fitness equipment or programs
- Any product with initial skepticism barrier

---

## Template System Architecture

### File Structure

```
src/
├── types/
│   └── templates.ts                    # Template type definitions
│
├── data/
│   └── templates/
│       ├── index.ts                    # Template registry & helpers
│       ├── pas.ts                      # PAS template configuration
│       ├── unboxing.ts                 # Unboxing template configuration
│       └── testimonial.ts              # Testimonial template configuration
│
├── components/
│   └── blocks/
│       └── create/
│           ├── template-selector.tsx   # Template selection grid
│           ├── template-preview.tsx    # Visual timeline preview
│           └── script-editor.tsx       # MODIFY: Add template support
│
├── hooks/
│   └── use-template.ts                 # Template state management
│
└── lib/
    └── script-generator.ts             # Script generation utilities
```

---

## Type Definitions

### Template Section Types

```typescript
export interface TemplateSection {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  placeholder: string;
  tips: string[];
  required: boolean;
  wordCount: {
    min: number;
    max: number;
    recommended: number;
  };
  color: string; // Tailwind class
}

export type TemplateCategory = 'conversion' | 'engagement' | 'awareness';
export type TemplatePriority = 'critical' | 'high' | 'medium';
export type AIModel = 'sora-2' | 'veo-3';

export interface VideoTemplate {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  category: TemplateCategory;
  priority: TemplatePriority;
  conversionRating: number; // 1-5
  duration: {
    min: number;
    max: number;
    recommended: number;
  };
  sections: TemplateSection[];
  hookExamples: string[];
  bestFor: string[];
  aiModel: {
    primary: AIModel;
    secondary?: AIModel;
    secondaryUsage?: string;
  };
  tags: string[];
  icon: string; // Lucide icon name
}
```

### Script Types

```typescript
export interface ScriptSection {
  sectionId: string;
  content: string;
  wordCount: number;
  estimatedDuration: number;
  isValid: boolean;
  validationMessage?: string;
}

export interface TemplateScript {
  templateId: string;
  sections: ScriptSection[];
  totalDuration: number;
  totalWordCount: number;
  isComplete: boolean;
}

export interface ProductContext {
  name: string;
  description: string;
  features: string[];
  benefits: string[];
  targetProblem?: string;
  price?: number;
  category?: string;
}
```

---

## Template Store (Zustand)

```typescript
// src/hooks/use-template.ts

interface TemplateState {
  selectedTemplate: VideoTemplate | null;
  script: TemplateScript | null;
  productContext: ProductContext | null;
  isGenerating: boolean;
  activeSection: string | null;

  // Actions
  selectTemplate: (templateId: string) => void;
  clearTemplate: () => void;
  setProductContext: (product: ProductContext) => void;
  updateSectionContent: (sectionId: string, content: string) => void;
  setActiveSection: (sectionId: string | null) => void;
  useHookExample: (hookText: string) => void;

  // Computed
  getTotalDuration: () => number;
  getTotalWordCount: () => number;
  isScriptComplete: () => boolean;
  getSectionValidation: (sectionId: string) => { isValid: boolean; message?: string };
}
```

---

## Utility Functions

```typescript
// src/data/templates/index.ts

// Calculate duration from word count (2.5 words/second speaking rate)
export function calculateDuration(wordCount: number): number {
  return Math.ceil(wordCount / 2.5);
}

// Calculate word count from duration
export function calculateWordCount(durationSeconds: number): number {
  return Math.floor(durationSeconds * 2.5);
}

// Validate section content
export function validateSectionContent(
  content: string,
  section: TemplateSection
): { isValid: boolean; message?: string } {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  if (section.required && wordCount === 0) {
    return { isValid: false, message: 'This section is required' };
  }

  if (wordCount < section.wordCount.min) {
    return { isValid: false, message: `Too short. Min ${section.wordCount.min} words.` };
  }

  if (wordCount > section.wordCount.max) {
    return { isValid: false, message: `Too long. Max ${section.wordCount.max} words.` };
  }

  return { isValid: true };
}
```

---

## DIY Workflow Integration

### Updated Step Flow

```
Step 1: Select Product          (existing)
Step 2: Choose Template         (NEW)
Step 3: Choose Avatar           (existing, renumbered)
Step 4: Write Script            (enhanced with template sections)
Step 5: Review & Generate       (existing, renumbered)
```

### Template Selection UI

The `TemplateSelector` component displays:
- Template cards in a responsive grid
- Conversion rating (5 stars)
- Duration range
- Tags for quick scanning
- "Top Performer" badge for critical templates
- Selection indicator with gradient border

### Script Editor Enhancement

When a template is selected:
- Shows section-based editor instead of free-form
- Timeline preview on the side
- Real-time word count per section
- Writing tips for active section
- Quick-fill hook examples
- Validation feedback per section

When no template (backward compatibility):
- Original free-form textarea
- "Generate with AI" button

---

## Component Design Specs

### Template Card

```
┌────────────────────────────────────┐
│ [Icon]              [Top Performer]│
│                                    │
│ Problem-Agitate-Solution           │
│ Hook viewers with their pain       │
│ point, then present your product...│
│                                    │
│ ⏱ 15-25s        ⭐⭐⭐⭐⭐       │
│                                    │
│ [high-converting] [pain-point]     │
│                                    │
│ ✓ Selected →                       │
└────────────────────────────────────┘
```

### Timeline Preview

```
┌────────────────────────────────────┐
│ Script Timeline     ~20s | 85 words│
├────────────────────────────────────┤
│ ● Hook          0s - 3s            │
│   [███████████████████] 10/10      │
│                                    │
│ ● Problem       3s - 7s            │
│   [█████████░░░░░░░░░░] 15/20      │
│                                    │
│ ● Agitate       7s - 12s           │
│   [░░░░░░░░░░░░░░░░░░░] 0/30       │
│                                    │
│ ● Solution      12s - 20s          │
│   [░░░░░░░░░░░░░░░░░░░] 0/45       │
│                                    │
│ ● CTA           20s - 25s          │
│   [░░░░░░░░░░░░░░░░░░░] 0/12       │
├────────────────────────────────────┤
│ 💡 Writing Tips                  ▼ │
│ • Use "I" statements for auth...   │
│ • Reference a specific, relatable..│
└────────────────────────────────────┘
```

---

## Implementation Order

Create files in this sequence to avoid import errors:

1. `src/types/templates.ts` - Type definitions
2. `src/data/templates/pas.ts` - PAS template config
3. `src/data/templates/unboxing.ts` - Unboxing template config
4. `src/data/templates/testimonial.ts` - Testimonial template config
5. `src/data/templates/index.ts` - Registry & helpers
6. `src/lib/script-generator.ts` - Generation utilities
7. `src/hooks/use-template.ts` - Zustand store
8. `src/components/blocks/create/template-selector.tsx` - Selection UI
9. `src/components/blocks/create/template-preview.tsx` - Timeline preview
10. Update `src/components/blocks/create/script-editor.tsx` - Add template support
11. Update `src/app/(dashboard)/create/diy/page.tsx` - Integrate templates

---

## Testing Checklist

- [ ] All three templates render correctly in selector
- [ ] Template selection persists when navigating DIY steps
- [ ] Section-based editor shows correct sections for each template
- [ ] Word count updates in real-time as user types
- [ ] Section validation shows appropriate feedback
- [ ] Timeline preview updates with content progress
- [ ] Hook examples can be quick-filled into hook section
- [ ] Total duration calculates correctly from word count
- [ ] Mobile responsive at 375px, 768px, 1024px breakpoints
- [ ] Keyboard navigation works for template cards
- [ ] Animations are smooth (no jank)
- [ ] All TypeScript types compile without errors

---

## Future Extensibility

This architecture supports easy Phase 2/3 additions:

- **New templates:** Create file in `src/data/templates/` and add to index
- **Template categories:** Enable filtering UI in the future
- **AI model config:** Per template allows optimization as models improve
- **Section structure:** Supports any number of sections per template

### Planned Future Templates

| Template | Category | Priority |
|----------|----------|----------|
| POV Storytime | engagement | high |
| Before/After | conversion | high |
| Skeptic-to-Believer | conversion | high |
| Day-in-the-Life | awareness | medium |
| GRWM (Get Ready With Me) | engagement | medium |
| Challenge Format | engagement | medium |
