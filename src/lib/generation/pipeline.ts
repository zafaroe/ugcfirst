/**
 * Video Generation Pipeline
 *
 * Orchestrates the full video generation flow:
 * 1. Analyze product → Persona
 * 2. Generate script (intelligent approach selection)
 * 3. Generate frames via Kie.ai (nano-banana)
 * 4. Upload frames to R2
 * 5. Create video jobs via Kie.ai (sora-2) - video model generates audio
 * 6. Poll for video completion
 * 7. Generate captions via Kie.ai STT (elevenlabs/scribe) from video audio
 * 8. Generate strategy (Concierge only)
 */

import { getAdminClient } from '@/lib/supabase';
import { analyzeProduct, generateStrategyBrief, OpenAIService } from '@/lib/ai/openai';
import { GeminiService, generateFramePrompt } from '@/lib/ai/gemini';
import { ApproachSelector } from '@/lib/ai/approach-selector';
import {
  KieService,
  buildVideoPrompt,
  buildFramePrompt,
  VideoResult,
  TTSResult,
  STTResult,
  ImageResult,
  KieTask,
  Veo3Result,
  Kling26Result,
} from '@/lib/ai/kie';
import { SoraService } from '@/lib/ai/sora';
import { uploadFrame, uploadVideo, uploadSubtitledVideo, R2Paths, getSignedDownloadUrl, getPublicUrl, uploadToR2, downloadVideo, downloadFromR2 } from '@/lib/r2';
import { burnSubtitles, cleanupTempFile, extractAudio, addWatermark, concatenateVideos, concatenateVideosReencode } from '@/lib/ffmpeg';
import { generateASSFile } from '@/lib/captions/ass-generator';
import { WordTimestamp } from '@/lib/captions/stt';
import { getCaptionPreset, getDefaultPreset } from '@/config/caption-styles';
import { confirmCredits, refundCredits } from '@/services/credits';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  Generation,
  GenerationStatus,
  PersonaProfile,
  GenerationMode,
  GenerationVideo,
  GeneratedScript,
  ScriptApproach,
  StrategyBrief,
} from '@/types/generation';
import {
  getSpotlightStyle,
  type SpotlightCategory,
} from '@/data/spotlight-styles';

// ============================================
// STATUS UPDATE HELPER
// ============================================

/**
 * Update generation status in database
 */
export async function updateGenerationStatus(
  generationId: string,
  status: GenerationStatus,
  currentStep: number,
  additionalData?: Partial<Generation>
): Promise<void> {
  const supabase = getAdminClient();

  const updateData: Partial<Generation> = {
    status,
    current_step: currentStep,
    ...additionalData,
  };

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('generations')
    .update(updateData)
    .eq('id', generationId);

  if (error) {
    console.error('Failed to update generation status:', error);
    throw error;
  }
}

// ============================================
// PIPELINE STEP 1: ANALYZE PRODUCT
// ============================================

/**
 * Analyze product image to create persona profile
 */
export async function stepAnalyzeProduct(
  generationId: string,
  productImageUrl: string,
  productName: string
): Promise<PersonaProfile> {
  await updateGenerationStatus(generationId, 'analyzing', 1);

  const persona = await analyzeProduct(productImageUrl, productName);

  await updateGenerationStatus(generationId, 'analyzing', 1, {
    persona_profile: persona,
  } as Partial<Generation>);

  return persona;
}

// ============================================
// PIPELINE STEP 2: GENERATE SCRIPTS
// ============================================

/**
 * Generate video scripts based on persona
 * Uses the n8n 12-second UGC format with detailed shot breakdowns
 * If no approaches specified, uses intelligent selection based on product/persona
 */
export async function stepGenerateScripts(
  generationId: string,
  persona: PersonaProfile,
  productName: string,
  productDescription?: string,
  productFeatures?: string[],
  approaches?: ScriptApproach[]
): Promise<GeneratedScript[]> {
  await updateGenerationStatus(generationId, 'scripting', 2);

  // If no approaches specified, use intelligent selection
  let selectedApproaches: ScriptApproach[];
  if (approaches && approaches.length > 0) {
    selectedApproaches = approaches;
  } else {
    // Create minimal product for approach selection
    const product = {
      name: productName,
      image: '', // Not needed for selection
      description: productDescription,
      features: productFeatures || [],
      source: 'url' as const,
    };

    console.log('[Pipeline] Using intelligent approach selection...');
    const bestApproach = await ApproachSelector.selectBestApproach(persona, product);
    console.log(`[Pipeline] Selected approach: ${bestApproach}`);
    selectedApproaches = [bestApproach];
  }

  // Generate scripts with Gemini, fallback to OpenAI on rate limit
  let scripts;
  try {
    console.log('[Pipeline] Attempting Gemini for script generation...');
    scripts = await GeminiService.generateScripts(
      persona,
      productName,
      selectedApproaches
    );
    console.log('[Pipeline] Gemini script generation succeeded!');
  } catch (geminiError) {
    console.log('[Pipeline] Gemini failed:', geminiError instanceof Error ? geminiError.message : String(geminiError));

    if (OpenAIService.isConfigured()) {
      console.log('[Pipeline] Falling back to OpenAI for script generation...');
      try {
        scripts = await OpenAIService.generateScripts(
          persona,
          productName,
          selectedApproaches
        );
        console.log('[Pipeline] OpenAI fallback succeeded!');
      } catch (openaiError) {
        console.error('[Pipeline] OpenAI fallback also failed:', openaiError instanceof Error ? openaiError.message : String(openaiError));
        throw geminiError;
      }
    } else {
      console.log('[Pipeline] OpenAI not configured, cannot fallback');
      throw geminiError;
    }
  }

  // Store scripts in database
  const supabase = getAdminClient();
  await supabase
    .from('generations')
    .update({
      scripts: scripts.map((s) => s.fullScript),
    })
    .eq('id', generationId);

  return scripts;
}

// ============================================
// PIPELINE STEP 3: GENERATE FRAMES
// ============================================

export interface GeneratedFrame {
  scriptIndex: number;
  prompt: {
    description: string;
    cameraAngle: string;
    lighting: string;
    mood: string;
  };
  imageBuffer?: Buffer;
  imageUrl?: string;
  taskId?: string;
}

/**
 * Generate frame images for each script using Gemini Image-to-Image
 * Falls back to Kie.ai nano-banana if Gemini fails
 */
export async function stepGenerateFrames(
  generationId: string,
  productImageUrl: string,
  productName: string,
  scripts: GeneratedScript[],
  persona: PersonaProfile
): Promise<GeneratedFrame[]> {
  await updateGenerationStatus(generationId, 'framing', 3);

  if (!KieService.isConfigured()) {
    throw new Error('KIE_AI_API_KEY not configured — required for Concierge pipeline');
  }

  const frames: GeneratedFrame[] = [];

  // Generate frames for each script using reference image approach
  // This preserves the EXACT product appearance by passing it as a reference
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    console.log(`[Pipeline] Generating frame ${i + 1}/${scripts.length} with product reference...`);

    // Generate frame prompt metadata (for logging/debugging)
    const framePromptData = await generateFramePrompt(
      productImageUrl,
      i,
      script.fullScript
    );

    // Build a prompt that features the product prominently
    // The referenceImageUrls ensures the EXACT product appearance is preserved
    const toneStyle = (persona.tone as 'casual' | 'professional' | 'energetic') || 'casual';
    const framePrompt = buildConciergeFramePrompt(productName, toneStyle, persona);

    console.log(`[Pipeline] Using Kie.ai nano-banana with product reference image`);

    const imageResult = await KieService.generateImageSync(
      {
        model: 'nano-banana-pro',
        prompt: framePrompt,
        aspectRatio: '9:16',
        referenceImageUrls: [productImageUrl], // CRITICAL: Pass product as reference to preserve exact appearance
      },
      (task: KieTask<ImageResult>) => {
        console.log(`[Pipeline] Frame ${i} progress: ${task.status} (${task.progress || 0}%)`);
      }
    );

    // Download the image from Kie.ai
    const imageBuffer = await KieService.downloadFile(imageResult.url);
    console.log(`[Pipeline] Frame ${i} generated successfully with product reference`);

    frames.push({
      scriptIndex: i,
      prompt: framePromptData,
      imageBuffer,
    });
  }

  return frames;
}

/**
 * Build a frame prompt for Concierge mode that preserves the product
 * Used with referenceImageUrls to ensure exact product appearance
 */
function buildConciergeFramePrompt(
  productName: string,
  tone: 'casual' | 'professional' | 'energetic',
  persona: PersonaProfile
): string {
  const toneDescriptions = {
    casual: 'relaxed, friendly, approachable',
    professional: 'polished, confident, trustworthy',
    energetic: 'dynamic, excited, enthusiastic',
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.casual;

  // The prompt describes the scene but the referenceImageUrls ensures
  // the product appears EXACTLY as in the original image
  return `UGC-style product showcase frame for TikTok/Instagram Reels.
The EXACT product from the reference image is prominently displayed in the center-foreground.
CRITICAL: Preserve the product's exact appearance - same colors, shape, textures, details. Do NOT modify the product.
Background: Clean, modern, lifestyle setting that complements the product.
Mood: ${toneDesc}.
Lighting: Warm, natural, flattering product photography style.
Aspect ratio: 9:16 vertical format.
Style: Authentic UGC content, not overly polished commercial.
NO text, NO watermarks, NO logos, NO overlays.
Product: ${productName}`.trim();
}

// ============================================
// PIPELINE STEP 4: UPLOAD FRAMES TO R2
// ============================================

/**
 * Upload generated frames to R2
 * Returns PUBLIC URLs (Kie.ai needs direct access for video generation)
 */
export async function stepUploadFrames(
  generationId: string,
  frames: GeneratedFrame[]
): Promise<string[]> {
  await updateGenerationStatus(generationId, 'framing', 4);

  const frameUrls: string[] = [];

  for (const frame of frames) {
    if (frame.imageUrl) {
      // If we have a URL from Kie.ai, download and re-upload to R2 for persistence
      try {
        const imageBuffer = await KieService.downloadFile(frame.imageUrl);
        const url = await uploadFrame(
          generationId,
          frame.scriptIndex,
          imageBuffer
        );
        frameUrls.push(url);
        console.log(`[Pipeline] Frame ${frame.scriptIndex} uploaded to R2: ${url}`);
      } catch (error) {
        console.error(`Failed to download/upload frame ${frame.scriptIndex}:`, error);
        throw new Error(`Failed to upload frame ${frame.scriptIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (frame.imageBuffer) {
      const url = await uploadFrame(
        generationId,
        frame.scriptIndex,
        frame.imageBuffer
      );
      frameUrls.push(url);
    } else {
      throw new Error(`Frame ${frame.scriptIndex} has no image data`);
    }
  }

  return frameUrls;
}

// ============================================
// PIPELINE STEP 5: GENERATE VOICEOVER
// ============================================

export interface GeneratedVoiceover {
  scriptIndex: number;
  audioUrl: string;
  duration: number;
}

/**
 * Generate voiceovers for each script using Kie.ai TTS
 */
export async function stepGenerateVoiceovers(
  generationId: string,
  scripts: GeneratedScript[],
  voiceId?: string
): Promise<GeneratedVoiceover[]> {
  await updateGenerationStatus(generationId, 'generating', 5);

  if (!KieService.isConfigured()) {
    console.warn('Kie.ai not configured - skipping voiceover generation');
    return scripts.map((_, i) => ({
      scriptIndex: i,
      audioUrl: '',
      duration: 0,
    }));
  }

  const voiceovers: GeneratedVoiceover[] = [];

  // Generate voiceovers in parallel
  const voiceoverPromises = scripts.map(async (script, i) => {
    const ttsResult = await KieService.generateVoiceoverSync(
      {
        model: 'elevenlabs/flash',
        text: script.fullScript,
        voiceId,
      },
      (task: KieTask<TTSResult>) => {
        console.log(`Voiceover ${i} progress: ${task.status} (${task.progress || 0}%)`);
      }
    );

    return {
      scriptIndex: i,
      audioUrl: ttsResult.url,
      duration: ttsResult.duration,
    };
  });

  const results = await Promise.all(voiceoverPromises);
  voiceovers.push(...results);

  return voiceovers;
}

// ============================================
// PIPELINE STEP 6: CREATE VIDEO JOBS
// ============================================

/**
 * Calculate video duration in actual seconds based on script word count.
 * - ≤35 words → 10 seconds
 * - >35 words → 15 seconds
 *
 * This allows 12-second scripts (~42 words) to fit in 15-second videos
 * with a 3-second buffer for natural speech variation.
 */
function calculateVideoDuration(script: GeneratedScript): number {
  const wordCount = script.wordCount || script.fullScript.split(/\s+/).filter(w => w.length > 0).length;
  const actualSeconds = wordCount > 35 ? 15 : 10;
  console.log(`[Pipeline] Script word count: ${wordCount} → ${actualSeconds}s video`);
  return actualSeconds;
}

/**
 * Convert actual seconds to Kie.ai duration parameter code.
 * Kie.ai uses these codes:
 * - 5 → generates ~10 second video
 * - 10 → generates ~15 second video
 */
function getKieAiDurationCode(actualSeconds: number): number {
  return actualSeconds >= 15 ? 10 : 5;
}

export interface VideoJobInfo {
  scriptIndex: number;
  taskId: string;
  frameUrl: string;
  voiceoverUrl?: string;
  expectedDuration: number; // Calculated duration in seconds (10 or 15)
}

/**
 * Create video generation jobs using Kie.ai Sora-2
 * Uses PUBLIC frame URLs (Kie.ai needs direct access)
 */
export async function stepCreateVideoJobs(
  generationId: string,
  scripts: GeneratedScript[],
  frames: GeneratedFrame[],
  frameUrls: string[],
  voiceovers?: GeneratedVoiceover[]
): Promise<VideoJobInfo[]> {
  await updateGenerationStatus(generationId, 'generating', 6);

  if (!KieService.isConfigured()) {
    console.warn('Kie.ai not configured - skipping video generation');
    return scripts.map((script, i) => ({
      scriptIndex: i,
      taskId: `placeholder-task-${i}`,
      frameUrl: frameUrls[i] || '',
      expectedDuration: calculateVideoDuration(script),
    }));
  }

  const supabase = getAdminClient();
  const jobs: VideoJobInfo[] = [];

  // Create video jobs in parallel
  const jobPromises = scripts.map(async (script, i) => {
    const frame = frames[i];
    const frameUrl = frameUrls[i];
    const voiceover = voiceovers?.[i];

    // Build the video prompt
    const videoPrompt = buildVideoPrompt(
      script.fullScript,
      frame.prompt.description
    );

    // Calculate actual duration in seconds from script word count
    const actualDuration = calculateVideoDuration(script);
    // Convert to Kie.ai API parameter code
    const kieAiDuration = getKieAiDurationCode(actualDuration);

    console.log(`[Pipeline] Creating video job ${i} with public frame URL: ${frameUrl} (duration: ${actualDuration}s, kieCode: ${kieAiDuration})`);

    // Create video job via Kie.ai (async - returns task ID)
    // Pass public URL so Kie.ai can fetch the frame directly
    const taskId = await KieService.generateVideo({
      model: 'sora-2',
      prompt: videoPrompt,
      imageUrl: frameUrl,
      duration: kieAiDuration,
      aspectRatio: '9:16',
    });

    // Store job in database
    await supabase.from('video_jobs').insert({
      generation_id: generationId,
      script_index: i,
      kie_job_id: taskId,
      status: 'pending',
      frame_url: frameUrl,
      voiceover_url: voiceover?.audioUrl,
    });

    return {
      scriptIndex: i,
      taskId,
      frameUrl,
      voiceoverUrl: voiceover?.audioUrl,
      expectedDuration: actualDuration, // Store our calculated duration
    };
  });

  const results = await Promise.all(jobPromises);
  jobs.push(...results);

  return jobs;
}

// ============================================
// PIPELINE STEP 7: POLL FOR VIDEO COMPLETION
// ============================================

export interface CompletedVideo {
  scriptIndex: number;
  videoR2Key: string;
  videoSignedUrl: string;
  duration: number;
  // NOTE: videoBuffer removed - now written to temp file directly to avoid Inngest serialization limits
  // Temp file path: os.tmpdir()/ugcfirst_buffer_{generationId}_{scriptIndex}.mp4
}

/**
 * Poll for video completion, download from Kie.ai, and upload to R2
 * Returns R2 keys and signed URLs for private access
 */
export async function stepPollVideoCompletion(
  generationId: string,
  jobs: VideoJobInfo[],
  onProgress?: (scriptIndex: number, progress: number) => void
): Promise<CompletedVideo[]> {
  await updateGenerationStatus(generationId, 'generating', 7);

  if (!KieService.isConfigured()) {
    console.warn('Kie.ai not configured - returning placeholder videos');
    return jobs.map((job) => ({
      scriptIndex: job.scriptIndex,
      videoR2Key: `placeholder-video-${job.scriptIndex}`,
      videoSignedUrl: '',
      duration: job.expectedDuration,
    }));
  }

  const supabase = getAdminClient();

  // Poll all jobs in parallel
  const completionPromises = jobs.map(async (job) => {
    const result = await KieService.pollForCompletion<VideoResult>(
      job.taskId,
      {
        interval: 5000,
        timeout: 600000, // 10 minute timeout for video generation
        onProgress: (task) => {
          if (onProgress) {
            onProgress(job.scriptIndex, task.progress || 0);
          }
        },
      }
    );

    console.log(`[Pipeline] Video ${job.scriptIndex} completed, downloading from Kie.ai...`);

    // Download video from Kie.ai and upload to R2 for persistence
    const videoBuffer = await KieService.downloadFile(result.url);
    const uploadResult = await uploadVideo(
      generationId,
      job.scriptIndex,
      videoBuffer
    );

    console.log(`[Pipeline] Video ${job.scriptIndex} uploaded to R2: ${uploadResult.key}`);

    // Use actual duration from Kie.ai response (not estimated duration)
    const actualDuration = result.duration || job.expectedDuration;
    console.log(`[Pipeline] Video ${job.scriptIndex} actual duration: ${actualDuration}s (expected: ${job.expectedDuration}s)`);

    // Video is now stored in R2 - no need for temp files
    // Later steps (subtitle generation, burning) will download from R2 directly
    // This approach is reliable across server restarts and multi-server environments

    // Update job status in database with R2 key and actual duration
    await supabase
      .from('video_jobs')
      .update({
        status: 'completed',
        video_r2_key: uploadResult.key,
        duration_seconds: actualDuration,
        completed_at: new Date().toISOString(),
      })
      .eq('generation_id', generationId)
      .eq('script_index', job.scriptIndex);

    return {
      scriptIndex: job.scriptIndex,
      videoR2Key: uploadResult.key,
      videoSignedUrl: uploadResult.signedUrl,
      duration: actualDuration,
      // NOTE: videoBuffer not returned - saved to temp file to avoid Inngest size limits
    };
  });

  return Promise.all(completionPromises);
}

// ============================================
// CONCIERGE VIDEO GENERATION WITH FALLBACK
// ============================================

// ============================================
// CONCIERGE VIDEO GENERATION WITH 5-TIER FALLBACK
// ============================================

/**
 * Fallback chain for Concierge video generation:
 *
 * Tier 1: Kie.ai Sora 2 Stable   — cheapest, most reliable on Kie.ai
 * Tier 2: Kie.ai Sora 2           — standard Kie.ai model
 * Tier 3: Kie.ai Sora 2 Pro       — higher quality, more expensive
 * Tier 4: Sora 2 Direct API       — bypasses Kie.ai entirely (OpenAI direct)
 * Tier 5: Kie.ai Veo 3.1 Fast     — last resort, different model entirely
 *
 * Each tier gets a 5-minute timeout so failures cascade quickly.
 * In practice, Tier 1 succeeds >90% of the time.
 */

interface FallbackTier {
  name: string;
  attempt: (ctx: {
    generationId: string;
    scriptIndex: number;
    videoPrompt: string;
    frameUrl: string;
    kieAiDuration: number;
    actualDuration: number;
    script: GeneratedScript;
  }) => Promise<{ videoBuffer: Buffer; duration: number; model: string }>;
}

function buildFallbackTiers(): FallbackTier[] {
  const tiers: FallbackTier[] = [];

  // ------- TIER 1: Kie.ai Sora 2 Stable -------
  if (KieService.isConfigured()) {
    tiers.push({
      name: 'Kie Sora 2 Stable',
      attempt: async (ctx) => {
        const taskId = await KieService.generateVideo({
          model: 'sora-2-stable',
          prompt: ctx.videoPrompt,
          imageUrl: ctx.frameUrl,
          duration: ctx.kieAiDuration,
          aspectRatio: '9:16',
        });

        const result = await KieService.pollForCompletion<VideoResult>(
          taskId,
          {
            interval: 5000,
            timeout: 300000,
            onProgress: (task) => {
              console.log(`[Fallback:T1] Sora 2 Stable: ${task.status} (${task.progress || 0}%)`);
            },
          }
        );

        const videoBuffer = await KieService.downloadFile(result.url);
        return { videoBuffer, duration: result.duration, model: 'kie-sora-2-stable' };
      },
    });
  }

  // ------- TIER 2: Kie.ai Sora 2 -------
  if (KieService.isConfigured()) {
    tiers.push({
      name: 'Kie Sora 2',
      attempt: async (ctx) => {
        const taskId = await KieService.generateVideo({
          model: 'sora-2',
          prompt: ctx.videoPrompt,
          imageUrl: ctx.frameUrl,
          duration: ctx.kieAiDuration,
          aspectRatio: '9:16',
        });

        const result = await KieService.pollForCompletion<VideoResult>(
          taskId,
          {
            interval: 5000,
            timeout: 300000,
            onProgress: (task) => {
              console.log(`[Fallback:T2] Sora 2: ${task.status} (${task.progress || 0}%)`);
            },
          }
        );

        const videoBuffer = await KieService.downloadFile(result.url);
        return { videoBuffer, duration: result.duration, model: 'kie-sora-2' };
      },
    });
  }

  // ------- TIER 3: Kie.ai Sora 2 Pro -------
  if (KieService.isConfigured()) {
    tiers.push({
      name: 'Kie Sora 2 Pro',
      attempt: async (ctx) => {
        const taskId = await KieService.generateVideo({
          model: 'sora-2-pro',
          prompt: ctx.videoPrompt,
          imageUrl: ctx.frameUrl,
          duration: ctx.kieAiDuration,
          aspectRatio: '9:16',
        });

        const result = await KieService.pollForCompletion<VideoResult>(
          taskId,
          {
            interval: 5000,
            timeout: 300000,
            onProgress: (task) => {
              console.log(`[Fallback:T3] Sora 2 Pro: ${task.status} (${task.progress || 0}%)`);
            },
          }
        );

        const videoBuffer = await KieService.downloadFile(result.url);
        return { videoBuffer, duration: result.duration, model: 'kie-sora-2-pro' };
      },
    });
  }

  // ------- TIER 4: OpenAI Sora 2 Direct API -------
  if (SoraService.isConfigured()) {
    tiers.push({
      name: 'Sora 2 Direct API',
      attempt: async (ctx) => {
        const result = await SoraService.generateVideoSync(
          {
            prompt: ctx.videoPrompt,
            imageUrl: ctx.frameUrl,
            seconds: ctx.actualDuration >= 15 ? 12 : 8,
            aspectRatio: '9:16',
            model: 'sora-2',
          },
          {
            timeout: 600000,
            interval: 10000,
            onProgress: (status, progress) => {
              console.log(`[Fallback:T4] Sora Direct: ${status} (${progress}%)`);
            },
          }
        );

        return { videoBuffer: result.buffer, duration: result.duration, model: 'openai-sora-2-direct' };
      },
    });
  }

  // ------- TIER 5: Kie.ai Veo 3.1 Fast -------
  if (KieService.isConfigured()) {
    tiers.push({
      name: 'Veo 3.1 Fast',
      attempt: async (ctx) => {
        const veoPrompt = `UGC style selfie video of a person talking directly to camera, showing a product. The person speaks naturally with authentic energy. They say: "${ctx.script.fullScript}" Natural hand gestures, genuine facial expressions, casual indoor setting. 9:16 vertical TikTok format, warm natural lighting.`;

        const veoResult = await KieService.generateVeo3VideoSync(
          {
            model: 'veo3_fast',
            prompt: veoPrompt,
            imageUrls: [ctx.frameUrl],
            aspectRatio: '9:16',
            sound: true,
            duration: '8',
          },
          (task) => console.log(`[Fallback:T5] Veo 3.1 Fast: ${task.status} (${task.progress || 0}%)`)
        );

        const videoBuffer = await KieService.downloadFile(veoResult.url);
        return { videoBuffer, duration: veoResult.duration || 8, model: 'kie-veo3-fast' };
      },
    });
  }

  return tiers;
}

/**
 * Generate video with automatic 5-tier fallback.
 * Handles: create task → poll → download → upload to R2.
 */
export async function stepGenerateVideoWithFallback(
  generationId: string,
  scripts: GeneratedScript[],
  frames: GeneratedFrame[],
  frameUrls: string[],
): Promise<CompletedVideo[]> {
  await updateGenerationStatus(generationId, 'generating', 6);

  if (!KieService.isConfigured() && !SoraService.isConfigured()) {
    throw new Error('No video generation service configured (need KIE_AI_API_KEY or SORA_API_KEY)');
  }

  const supabase = getAdminClient();
  const completedVideos: CompletedVideo[] = [];
  const tiers = buildFallbackTiers();

  if (tiers.length === 0) {
    throw new Error('No video generation tiers available. Check API key configuration.');
  }

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const frame = frames[i];
    const frameUrl = frameUrls[i];

    const videoPrompt = buildVideoPrompt(
      script.fullScript,
      frame.prompt.description
    );

    const actualDuration = calculateVideoDuration(script);
    const kieAiDuration = getKieAiDurationCode(actualDuration);

    // Insert video_job record
    await supabase.from('video_jobs').insert({
      generation_id: generationId,
      script_index: i,
      status: 'pending',
      frame_url: frameUrl,
    });

    // Cascade through tiers
    let videoBuffer: Buffer | null = null;
    let videoDuration: number = actualDuration;
    let modelUsed: string = 'unknown';
    let lastError: Error | null = null;
    const tiersAttempted: string[] = [];

    for (const tier of tiers) {
      tiersAttempted.push(tier.name);
      try {
        console.log(`[Pipeline:Concierge] Trying ${tier.name} for video ${i}...`);

        const result = await tier.attempt({
          generationId,
          scriptIndex: i,
          videoPrompt,
          frameUrl,
          kieAiDuration,
          actualDuration,
          script,
        });

        videoBuffer = result.videoBuffer;
        videoDuration = result.duration || actualDuration;
        modelUsed = result.model;

        console.log(`[Pipeline:Concierge] ✓ ${tier.name} succeeded for video ${i} (${videoDuration}s)`);
        break;

      } catch (tierError) {
        lastError = tierError instanceof Error ? tierError : new Error(String(tierError));
        console.warn(`[Pipeline:Concierge] ✗ ${tier.name} failed for video ${i}: ${lastError.message}`);
      }
    }

    // All tiers exhausted
    if (!videoBuffer) {
      await supabase
        .from('video_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('generation_id', generationId)
        .eq('script_index', i);

      throw new Error(
        `Video generation failed for video ${i}. All ${tiersAttempted.length} tiers exhausted. ` +
        `Chain: ${tiersAttempted.join(' → ')}. ` +
        `Last error: ${lastError?.message || 'Unknown'}`
      );
    }

    // Upload to R2
    const uploadResult = await uploadVideo(generationId, i, videoBuffer);
    console.log(`[Pipeline:Concierge] Video ${i} uploaded to R2: ${uploadResult.key} (model: ${modelUsed})`);

    await supabase
      .from('video_jobs')
      .update({
        status: 'completed',
        video_r2_key: uploadResult.key,
        duration_seconds: videoDuration,
        completed_at: new Date().toISOString(),
      })
      .eq('generation_id', generationId)
      .eq('script_index', i);

    completedVideos.push({
      scriptIndex: i,
      videoR2Key: uploadResult.key,
      videoSignedUrl: uploadResult.signedUrl,
      duration: videoDuration,
    });
  }

  return completedVideos;
}

// ============================================
// PIPELINE STEP 8: GENERATE CAPTIONS
// ============================================

export interface GeneratedSubtitle {
  scriptIndex: number;
  words: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  fullText: string;
}

// Backward compatibility alias
export type GeneratedCaption = GeneratedSubtitle;

/**
 * Generate word-level subtitles using Kie.ai STT
 * Extracts audio from video first since Kie.ai STT only accepts audio files
 */
export async function stepGenerateSubtitles(
  generationId: string,
  videos: CompletedVideo[]
): Promise<GeneratedSubtitle[]> {
  await updateGenerationStatus(generationId, 'captioning', 8); // DB constraint expects 'captioning'

  if (!KieService.isConfigured()) {
    console.warn('Kie.ai not configured - skipping subtitle generation');
    return videos.map((v) => ({
      scriptIndex: v.scriptIndex,
      words: [],
      fullText: '',
    }));
  }

  const subtitles: GeneratedSubtitle[] = [];

  // Process videos sequentially to avoid overwhelming FFmpeg
  for (const video of videos) {
    if (!video.videoR2Key) {
      subtitles.push({
        scriptIndex: video.scriptIndex,
        words: [],
        fullText: '',
      });
      continue;
    }

    let tempVideoPath: string | null = null;
    let tempAudioPath: string | null = null;

    try {
      console.log(`[Pipeline] Subtitle ${video.scriptIndex}: Extracting audio for STT...`);

      // 1. Download video from R2 (reliable source, survives server restarts)
      console.log(`[Pipeline] Subtitle ${video.scriptIndex}: Downloading video from R2...`);
      const videoBuffer = await downloadVideo(generationId, video.scriptIndex);

      // Write to temp for FFmpeg processing (unique filename to avoid conflicts)
      tempVideoPath = path.join(os.tmpdir(), `ugcfirst_subtitle_input_${generationId}_${video.scriptIndex}_${Date.now()}.mp4`);
      fs.writeFileSync(tempVideoPath, videoBuffer);
      console.log(`[Pipeline] Subtitle ${video.scriptIndex}: Using video from ${tempVideoPath}`);

      // 2. Extract audio using FFmpeg (wav format is optimal for STT)
      tempAudioPath = await extractAudio(tempVideoPath, { format: 'wav', sampleRate: 16000, channels: 1 });
      console.log(`[Pipeline] Subtitle ${video.scriptIndex}: Extracted audio to ${tempAudioPath}`);

      // 3. Upload audio to R2
      const audioBuffer = fs.readFileSync(tempAudioPath);
      const audioKey = `audio/${generationId}/${video.scriptIndex}.wav`;
      await uploadToR2(audioKey, audioBuffer, { contentType: 'audio/wav' });
      const audioUrl = getPublicUrl(audioKey);
      console.log(`[Pipeline] Subtitle ${video.scriptIndex}: Uploaded audio, URL: ${audioUrl}`);

      // 4. Send audio URL to STT
      const sttResult = await KieService.getWordTimestampsSync(
        {
          model: 'elevenlabs/scribe-v1',
          audioUrl: audioUrl,
          languageCode: 'en',
        },
        (task: KieTask<STTResult>) => {
          console.log(`[Pipeline] Subtitle ${video.scriptIndex} STT progress: ${task.status}`);
        }
      );

      // Filter to only actual words (not spacing)
      // IMPORTANT: Kie.ai/ElevenLabs returns timestamps in SECONDS
      // but our subtitle system (WordTimestamp, ASS generator) expects MILLISECONDS
      const words = KieService.filterWordTimestamps(sttResult).map((w) => ({
        text: w.text,
        start: w.start * 1000,  // seconds → milliseconds
        end: w.end * 1000,      // seconds → milliseconds
      }));

      console.log(`[Pipeline] Subtitle ${video.scriptIndex}: STT complete, ${words.length} words extracted`);

      subtitles.push({
        scriptIndex: video.scriptIndex,
        words,
        fullText: sttResult.text,
      });
    } catch (error) {
      console.error(`[Pipeline] Subtitle generation failed for video ${video.scriptIndex}:`, error);
      subtitles.push({
        scriptIndex: video.scriptIndex,
        words: [],
        fullText: '',
      });
    } finally {
      // 5. Clean up temp files
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      if (tempAudioPath && fs.existsSync(tempAudioPath)) {
        fs.unlinkSync(tempAudioPath);
      }
    }
  }

  return subtitles;
}

// Backward compatibility alias
export const stepGenerateCaptions = stepGenerateSubtitles;

// ============================================
// PIPELINE STEP 9: BURN SUBTITLES INTO VIDEOS
// ============================================

export interface BurnedSubtitleVideo {
  scriptIndex: number;
  videoSubtitledR2Key: string;
  videoSubtitledSignedUrl: string;
}

// Backward compatibility alias
export type BurnedCaptionVideo = BurnedSubtitleVideo;

/**
 * Burn subtitles into videos using FFmpeg
 * Downloads raw videos from R2, burns in subtitles, uploads subtitled versions
 *
 * @param captionStyleId - Optional caption style preset ID (defaults to 'hormozi-bold')
 */
export async function stepBurnSubtitles(
  generationId: string,
  videos: CompletedVideo[],
  subtitles: GeneratedSubtitle[],
  captionStyleId?: string
): Promise<BurnedSubtitleVideo[]> {
  await updateGenerationStatus(generationId, 'captioning', 9); // DB constraint expects 'captioning'

  // Get the caption style configuration
  const styleId = captionStyleId || 'hormozi-bold';
  const captionStyle = getCaptionPreset(styleId) || getDefaultPreset();
  console.log(`[Pipeline] Using caption style: ${captionStyle.name} (${captionStyle.id})`);

  const results: BurnedSubtitleVideo[] = [];

  for (const video of videos) {
    const subtitle = subtitles.find((s) => s.scriptIndex === video.scriptIndex);

    // Skip if no subtitles for this video
    if (!subtitle || !subtitle.words || subtitle.words.length === 0) {
      console.log(`[Pipeline] No subtitles for video ${video.scriptIndex}, skipping burn`);
      continue;
    }

    const tempFiles: string[] = [];

    try {
      console.log(`[Pipeline] Burning subtitles for video ${video.scriptIndex}...`);

      // 1. Download video from R2 (reliable source, survives server restarts)
      console.log(`[Pipeline] Burning subtitles for video ${video.scriptIndex}: Downloading from R2...`);
      const videoBuffer = await downloadVideo(generationId, video.scriptIndex);

      // Write to temp for FFmpeg processing (unique filename to avoid conflicts)
      const tempVideoPath = path.join(os.tmpdir(), `ugcfirst_burn_input_${generationId}_${video.scriptIndex}_${Date.now()}.mp4`);
      fs.writeFileSync(tempVideoPath, videoBuffer);
      tempFiles.push(tempVideoPath); // Clean up after processing

      // 2. Convert subtitle words to WordTimestamp format
      const wordTimestamps: WordTimestamp[] = subtitle.words.map((w) => ({
        word: w.text,
        start: w.start,
        end: w.end,
      }));

      // 3. Generate ASS file with caption style
      const assPath = path.join(os.tmpdir(), `ugcfirst_subtitles_${generationId}_${video.scriptIndex}.ass`);
      generateASSFile(wordTimestamps, assPath, {
        captionStyle, // Use the full style config for smart grouping + animations
        smoothTransitions: true,
      });
      tempFiles.push(assPath);

      // 4. Burn subtitles using FFmpeg
      const subtitledVideoPath = await burnSubtitles(tempVideoPath, {
        assFilePath: assPath,
      });
      tempFiles.push(subtitledVideoPath);

      // 5. Upload subtitled video to R2
      const subtitledBuffer = fs.readFileSync(subtitledVideoPath);
      const uploadResult = await uploadSubtitledVideo(
        generationId,
        video.scriptIndex,
        subtitledBuffer
      );

      console.log(`[Pipeline] Subtitled video ${video.scriptIndex} uploaded: ${uploadResult.key}`);

      results.push({
        scriptIndex: video.scriptIndex,
        videoSubtitledR2Key: uploadResult.key,
        videoSubtitledSignedUrl: uploadResult.signedUrl,
      });
    } catch (error) {
      console.error(`[Pipeline] Failed to burn subtitles for video ${video.scriptIndex}:`, error);
      // Continue with other videos - don't fail the entire pipeline
    } finally {
      // Clean up temp files
      for (const tempFile of tempFiles) {
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  return results;
}

// ============================================
// PIPELINE STEP 9.5: ADD WATERMARK (FREE TIER)
// ============================================

export interface WatermarkedVideo {
  scriptIndex: number;
  videoR2Key: string;
  videoSignedUrl: string;
}

/**
 * Add watermark to videos for free tier users
 * Downloads video from R2, applies watermark, overwrites R2 key
 *
 * @param generationId - Generation ID
 * @param videos - Videos to watermark (either burned subtitle videos or raw videos)
 * @param burnedSubtitles - Burned subtitle videos (prefer these over raw)
 * @returns Array of watermarked video info
 */
export async function stepAddWatermark(
  generationId: string,
  videos: CompletedVideo[],
  burnedSubtitles: BurnedSubtitleVideo[]
): Promise<WatermarkedVideo[]> {
  console.log('[Pipeline] Adding watermark for free tier user...');

  const results: WatermarkedVideo[] = [];

  for (const video of videos) {
    const tempFiles: string[] = [];

    try {
      // Determine which video to watermark (prefer subtitled version)
      const subtitled = burnedSubtitles.find((bs) => bs.scriptIndex === video.scriptIndex);
      const sourceR2Key = subtitled?.videoSubtitledR2Key || video.videoR2Key;

      if (!sourceR2Key) {
        console.log(`[Pipeline] No video found for index ${video.scriptIndex}, skipping watermark`);
        continue;
      }

      console.log(`[Pipeline] Watermarking video ${video.scriptIndex} from R2 key: ${sourceR2Key}`);

      // 1. Download video from R2 using the key directly
      const videoBuffer = await downloadFromR2(sourceR2Key);

      // 2. Write to temp for FFmpeg processing
      const tempVideoPath = path.join(os.tmpdir(), `ugcfirst_watermark_input_${generationId}_${video.scriptIndex}_${Date.now()}.mp4`);
      fs.writeFileSync(tempVideoPath, videoBuffer);
      tempFiles.push(tempVideoPath);

      // 3. Apply watermark using FFmpeg
      const watermarkedPath = await addWatermark(tempVideoPath, {
        text: 'Made with ugcfirst.com',
        fontSize: 24,
        fontColor: 'white',
        opacity: 0.6,
        paddingBottom: 40,
      });
      tempFiles.push(watermarkedPath);

      // 4. Upload watermarked video back to R2 (overwrite same key)
      const watermarkedBuffer = fs.readFileSync(watermarkedPath);
      await uploadToR2(sourceR2Key, watermarkedBuffer, { contentType: 'video/mp4' });

      // Get fresh signed URL
      const signedUrl = await getSignedDownloadUrl(sourceR2Key);

      console.log(`[Pipeline] Watermark applied to video ${video.scriptIndex}`);

      results.push({
        scriptIndex: video.scriptIndex,
        videoR2Key: sourceR2Key,
        videoSignedUrl: signedUrl,
      });
    } catch (error) {
      console.error(`[Pipeline] Failed to watermark video ${video.scriptIndex}:`, error);
      // Don't fail the entire pipeline - deliver unwatermarked video instead
    } finally {
      // Clean up temp files
      for (const tempFile of tempFiles) {
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  return results;
}

// ============================================
// DIY PIPELINE STEP 2: USE CUSTOM SCRIPT
// ============================================

/**
 * Use user's custom script directly (DIY mode)
 * Falls back to AI generation if no custom script provided
 */
export async function stepUseCustomScript(
  generationId: string,
  customScript: string | undefined,
  persona: PersonaProfile,
  productName: string,
): Promise<GeneratedScript[]> {
  await updateGenerationStatus(generationId, 'scripting', 2);

  if (customScript && customScript.trim().length > 0) {
    console.log('[Pipeline:DIY] Using user custom script');
    const wordCount = customScript.trim().split(/\s+/).filter(w => w.length > 0).length;

    const script: GeneratedScript = {
      approach: 'casual_recommendation',
      approachLabel: 'Custom Script',
      energy: 'User-directed',
      dialogue: [{ timestamp: '0:00-0:08', text: customScript.trim() }],
      shotBreakdown: [],
      technicalDetails: {
        phoneOrientation: 'vertical',
        filmingMethod: 'selfie',
        dominantHand: 'right',
        locationSpecifics: 'neutral background',
        audioEnvironment: 'quiet indoor',
      },
      fullScript: customScript.trim(),
      wordCount,
      estimatedDuration: 8,
    };

    const supabase = getAdminClient();
    await supabase
      .from('generations')
      .update({ scripts: [script.fullScript] })
      .eq('id', generationId);

    return [script];
  }

  console.log('[Pipeline:DIY] No custom script, falling back to AI generation');
  return stepGenerateScripts(generationId, persona, productName);
}

// ============================================
// TEMPLATE-SPECIFIC VISUAL PROMPTS
// ============================================

const TEMPLATE_VISUAL_CONFIG: Record<string, {
  actorPromptOverride?: string;       // How the actor should look/pose
  compositePrompt: string;            // How to composite actor + product
  veoPrompt: (productName: string, script: string) => string;  // Veo 3.1 animation prompt
}> = {
  'pas': {
    compositePrompt: `Photo-realistic UGC selfie image of the person from the first reference image looking directly at camera with a relatable, slightly frustrated expression — like they're about to vent to a friend. They are holding or gesturing toward the product from the second reference image. The product should be visible but not the main focus yet — the person's expression is the hook. Casual indoor setting, warm natural lighting, vertical 9:16 format. IMPORTANT: NO text, NO watermarks, NO overlays.`,
    veoPrompt: (productName, script) => `UGC selfie video of a person talking to camera about a problem they had, then getting excited as they show ${productName} as the solution. The person starts with a relatable, slightly frustrated energy then transitions to genuine enthusiasm when presenting the product. They speak: "${script}" Natural hand gestures, authentic facial expressions matching the emotional arc from frustration to excitement. Product becomes more prominent as the person gets excited. 9:16 vertical, TikTok style, warm lighting.`,
  },
  'unboxing': {
    actorPromptOverride: `looking down at something in their hands with excited anticipation, like they're about to open a package`,
    compositePrompt: `Photo-realistic UGC image of the person from the first reference image excitedly holding a package or box containing the product from the second reference image. The person looks thrilled and is about to open or has just opened the package. Their expression shows genuine anticipation and excitement. The product packaging should be visible. Casual indoor setting (kitchen counter, bed, desk), warm natural lighting, vertical 9:16 format. IMPORTANT: NO text, NO watermarks, NO overlays.`,
    veoPrompt: (productName, script) => `UGC selfie video of a person doing an authentic unboxing of ${productName}. They start by showing the package excitedly, then open/reveal the product with genuine surprise and delight. Their hands are active — touching, holding up, examining the product. High energy throughout. They speak: "${script}" The camera is slightly shaky from excitement. Close-ups of the product as they react to quality and details. 9:16 vertical, TikTok #unboxing style, natural indoor lighting.`,
  },
  'testimonial': {
    compositePrompt: `Photo-realistic UGC selfie image of the person from the first reference image holding the product from the second reference image with a thoughtful, slightly skeptical but curious expression — like they're about to give an honest review. Product is visible in their hand. The vibe is "real talk" — not overly polished. Casual setting, natural lighting, vertical 9:16 format. IMPORTANT: NO text, NO watermarks, NO overlays.`,
    veoPrompt: (productName, script) => `UGC selfie video of a person giving an honest testimonial about ${productName}. They start with a skeptical, uncertain energy — like they genuinely didn't expect it to work. Then their expression and tone shifts to surprised satisfaction as they share results. The emotional arc goes from doubt to genuine recommendation. They speak: "${script}" Natural, conversational delivery. Holding the product up at the end. 9:16 vertical, TikTok review style, warm indoor lighting.`,
  },
};

// Default visual config (when no template or unknown template)
const DEFAULT_VISUAL_CONFIG = {
  compositePrompt: `Photo-realistic image of the person from the first reference image naturally holding the product from the second reference image. The person is showing the product to camera in a casual, authentic UGC selfie style. Natural hand positioning, product clearly visible, warm lighting matching both references. Vertical 9:16 format, TikTok/Instagram Reels style. IMPORTANT: NO text, NO watermarks, NO logos, NO overlays in the image.`,
  veoPrompt: (productName: string, script: string) => `UGC style selfie video of a person showing ${productName} to camera while speaking naturally. The person looks directly at camera and speaks: "${script}" Natural hand gestures, authentic expressions, casual vibe. The person is holding the product visible in frame throughout. 9:16 vertical format, TikTok style, warm natural lighting.`,
};

// ============================================
// DIY PIPELINE STEP 3: GENERATE COMPOSITE IMAGE
// ============================================

export interface DIYCompositeResult {
  actorImageUrl: string;
  productGridUrl: string;
  compositeImageUrl: string;
}

/**
 * Generate composite image using Nano Banana
 * 1. Generate actor photo from persona
 * 2. Generate product angle grid
 * 3. Composite actor holding product
 */
export async function stepGenerateComposite(
  generationId: string,
  productImageUrl: string,
  productName: string,
  persona: PersonaProfile,
  templateId?: string,
): Promise<DIYCompositeResult> {
  await updateGenerationStatus(generationId, 'framing', 3);

  if (!KieService.isConfigured()) {
    throw new Error('KIE_AI_API_KEY not configured — required for DIY pipeline');
  }

  // Get template-specific visual config
  const visualConfig = templateId ? TEMPLATE_VISUAL_CONFIG[templateId] : undefined;

  // 3a: Generate actor photo
  console.log('[Pipeline:DIY] Step 3a: Generating actor photo...');
  const actorExpression = visualConfig?.actorPromptOverride || 'looking directly at camera with a warm, natural expression';
  const actorPrompt = `Photo-realistic selfie portrait of a ${persona.age || 'young'} year old ${persona.gender || 'person'}. ${persona.appearance?.generalAppearance || 'Natural, approachable look'}. ${persona.appearance?.clothingAesthetic || 'Casual everyday clothing'}. ${actorExpression}. Warm natural lighting, neutral background. Vertical 9:16 format, TikTok/UGC style. IMPORTANT: NO text, NO watermarks, NO logos, NO overlays in the image.`;

  const actorResult = await KieService.generateImageSync(
    { prompt: actorPrompt, aspectRatio: '9:16' },
    (task) => console.log(`[Pipeline:DIY] Actor photo: ${task.status} (${task.progress || 0}%)`)
  );

  const actorBuffer = await KieService.downloadFile(actorResult.url);
  const actorR2Url = await uploadFrame(generationId, 0, actorBuffer);
  console.log(`[Pipeline:DIY] Actor photo uploaded: ${actorR2Url}`);

  // 3b: Generate product angle grid
  console.log('[Pipeline:DIY] Step 3b: Generating product angle grid...');
  const gridPrompt = `3x3 grid showing ${productName} from 9 different angles on white background. Product photography style, clean studio lighting, consistent scale. Angles: front, back, left, right, top, 3/4 left, 3/4 right, close-up detail, in-use shot. Landscape 16:9 format. IMPORTANT: NO text, NO labels, NO watermarks, NO logos anywhere in the image.`;

  const gridResult = await KieService.generateImageSync(
    { prompt: gridPrompt, aspectRatio: '16:9', referenceImageUrls: [productImageUrl] },
    (task) => console.log(`[Pipeline:DIY] Product grid: ${task.status} (${task.progress || 0}%)`)
  );

  const gridBuffer = await KieService.downloadFile(gridResult.url);
  const gridKey = `frames/${generationId}/product-grid.png`;
  await uploadToR2(gridKey, gridBuffer, { contentType: 'image/png' });
  const gridR2Url = getPublicUrl(gridKey);
  console.log(`[Pipeline:DIY] Product grid uploaded: ${gridR2Url}`);

  // 3c: Composite actor + product
  console.log('[Pipeline:DIY] Step 3c: Compositing actor + product...');
  const compositePrompt = visualConfig?.compositePrompt || DEFAULT_VISUAL_CONFIG.compositePrompt;

  const compositeResult = await KieService.generateImageSync(
    { prompt: compositePrompt, aspectRatio: '9:16', referenceImageUrls: [actorR2Url, gridR2Url] },
    (task) => console.log(`[Pipeline:DIY] Composite: ${task.status} (${task.progress || 0}%)`)
  );

  const compositeBuffer = await KieService.downloadFile(compositeResult.url);
  const compositeR2Url = await uploadFrame(generationId, 1, compositeBuffer);
  console.log(`[Pipeline:DIY] Composite uploaded: ${compositeR2Url}`);

  return { actorImageUrl: actorR2Url, productGridUrl: gridR2Url, compositeImageUrl: compositeR2Url };
}

// ============================================
// DIY PIPELINE STEP 6: ANIMATE WITH VEO 3.1
// ============================================

export interface DIYVideoResult {
  scriptIndex: number;
  videoR2Key: string;
  videoSignedUrl: string;
  duration: number;
}

/**
 * Animate composite image with Veo 3.1 Fast
 * Uses prompt with script text for native audio generation
 */
export async function stepAnimateWithVeo31(
  generationId: string,
  compositeImageUrl: string,
  script: GeneratedScript,
  productName: string,
  templateId?: string,
): Promise<DIYVideoResult> {
  await updateGenerationStatus(generationId, 'generating', 6);

  if (!KieService.isConfigured()) {
    throw new Error('KIE_AI_API_KEY not configured');
  }

  const supabase = getAdminClient();

  // Get template-specific visual config for Veo prompt
  const visualConfig = templateId ? TEMPLATE_VISUAL_CONFIG[templateId] : undefined;
  const veoPromptBuilder = visualConfig?.veoPrompt || DEFAULT_VISUAL_CONFIG.veoPrompt;
  const veoPrompt = veoPromptBuilder(productName, script.fullScript);

  console.log(`[Pipeline:DIY] Veo 3.1 prompt (${script.wordCount} words)`);

  await supabase.from('video_jobs').insert({
    generation_id: generationId,
    script_index: 0,
    status: 'pending',
    frame_url: compositeImageUrl,
  });

  const veoResult = await KieService.generateVeo3VideoSync(
    {
      model: 'veo3_fast',
      prompt: veoPrompt,
      imageUrls: [compositeImageUrl],
      aspectRatio: '9:16',
      sound: true,
      duration: '8',
    },
    (task) => console.log(`[Pipeline:DIY] Veo 3.1: ${task.status} (${task.progress || 0}%)`)
  );

  console.log(`[Pipeline:DIY] Veo 3.1 complete, downloading...`);
  const videoBuffer = await KieService.downloadFile(veoResult.url);
  const uploadResult = await uploadVideo(generationId, 0, videoBuffer);

  await supabase
    .from('video_jobs')
    .update({
      status: 'completed',
      video_r2_key: uploadResult.key,
      duration_seconds: veoResult.duration || 8,
      completed_at: new Date().toISOString(),
    })
    .eq('generation_id', generationId)
    .eq('script_index', 0);

  return {
    scriptIndex: 0,
    videoR2Key: uploadResult.key,
    videoSignedUrl: uploadResult.signedUrl,
    duration: veoResult.duration || 8,
  };
}

// ============================================
// DIY PIPELINE STEP 9.6: GENERATE END SCREEN
// ============================================

export interface EndScreenResult {
  videoR2Key: string;
  videoSignedUrl: string;
  duration: number;
}

/**
 * Generate end screen with CTA using Nano Banana + Kling 2.6
 * 1. Generate end frame image with CTA text
 * 2. Animate with Kling 2.6 for premium product reveal effect
 */
export async function stepGenerateEndScreen(
  generationId: string,
  productImageUrl: string,
  productName: string,
  ctaText: string,
  brandText?: string,
): Promise<EndScreenResult> {
  console.log('[Pipeline:DIY] Step 9.6: Generating end screen...');

  if (!KieService.isConfigured()) {
    throw new Error('KIE_AI_API_KEY not configured');
  }

  const brandLine = brandText ? `\nBrand text visible: "${brandText}"` : '';
  const endFramePrompt = `Sleek product reveal frame for a video end card. Product: ${productName} centered, dramatic studio lighting, subtle glow effect. Dark premium background with soft gradient. Call-to-action text area at bottom: "${ctaText}"${brandLine} Cinematic product photography style, 9:16 vertical. IMPORTANT: Only include the CTA text specified, no other text.`;

  const frameResult = await KieService.generateImageSync(
    { prompt: endFramePrompt, aspectRatio: '9:16', referenceImageUrls: [productImageUrl] },
    (task) => console.log(`[Pipeline:DIY] End frame: ${task.status}`)
  );

  const frameBuffer = await KieService.downloadFile(frameResult.url);
  const frameKey = `frames/${generationId}/end-screen-frame.png`;
  await uploadToR2(frameKey, frameBuffer, { contentType: 'image/png' });
  const frameUrl = getPublicUrl(frameKey);

  console.log('[Pipeline:DIY] Animating end screen with Kling 2.6...');
  const kling26Result = await KieService.generateKling26VideoSync(
    {
      prompt: 'Slow cinematic product reveal with subtle glow and shimmer effect. Camera slowly pushes in. Premium product showcase motion design. Elegant and minimal.',
      imageUrls: [frameUrl],
      duration: '5',
      sound: false,
    },
    (task) => console.log(`[Pipeline:DIY] Kling 2.6: ${task.status}`)
  );

  const endVideoBuffer = await KieService.downloadFile(kling26Result.url);
  const endVideoKey = `videos/${generationId}/end-screen.mp4`;
  await uploadToR2(endVideoKey, endVideoBuffer, { contentType: 'video/mp4' });
  const endVideoSignedUrl = await getSignedDownloadUrl(endVideoKey);

  return { videoR2Key: endVideoKey, videoSignedUrl: endVideoSignedUrl, duration: kling26Result.duration || 5 };
}

// ============================================
// DIY PIPELINE STEP 9.7: CONCATENATE MAIN + END SCREEN
// ============================================

/**
 * Concatenate main video with end screen video
 * Uses FFmpeg re-encoding to handle different codecs (Veo 3.1 + Kling 2.6)
 */
export async function stepConcatenateWithEndScreen(
  generationId: string,
  mainVideoR2Key: string,
  endScreenR2Key: string,
): Promise<{ videoR2Key: string; videoSignedUrl: string; duration: number }> {
  console.log('[Pipeline:DIY] Step 9.7: Concatenating main + end screen...');
  console.log(`[Pipeline:DIY] Main video: ${mainVideoR2Key}`);
  console.log(`[Pipeline:DIY] End screen: ${endScreenR2Key}`);

  const tempFiles: string[] = [];

  try {
    const mainBuffer = await downloadFromR2(mainVideoR2Key);
    console.log(`[Pipeline:DIY] Downloaded main video: ${mainBuffer.length} bytes`);
    const mainPath = path.join(os.tmpdir(), `ugcfirst_main_${generationId}_${Date.now()}.mp4`);
    fs.writeFileSync(mainPath, mainBuffer);
    tempFiles.push(mainPath);

    const endBuffer = await downloadFromR2(endScreenR2Key);
    console.log(`[Pipeline:DIY] Downloaded end screen: ${endBuffer.length} bytes`);
    const endPath = path.join(os.tmpdir(), `ugcfirst_end_${generationId}_${Date.now()}.mp4`);
    fs.writeFileSync(endPath, endBuffer);
    tempFiles.push(endPath);

    // Use re-encoding concatenation to handle different codecs from Veo 3.1 and Kling 2.6
    const concatPath = await concatenateVideosReencode([mainPath, endPath]);
    tempFiles.push(concatPath);

    const concatBuffer = fs.readFileSync(concatPath);
    console.log(`[Pipeline:DIY] Concatenated video: ${concatBuffer.length} bytes`);
    await uploadToR2(mainVideoR2Key, concatBuffer, { contentType: 'video/mp4' });
    const signedUrl = await getSignedDownloadUrl(mainVideoR2Key);

    console.log('[Pipeline:DIY] End screen concatenation complete');
    return { videoR2Key: mainVideoR2Key, videoSignedUrl: signedUrl, duration: 13 };
  } finally {
    for (const f of tempFiles) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }
}

// ============================================
// SPOTLIGHT PIPELINE STEP 1: ENHANCE PRODUCT FRAME
// ============================================

/**
 * Generate enhanced product frame using Nano Banana with style-specific prompt
 */
export async function stepSpotlightEnhanceFrame(
  generationId: string,
  productImageUrl: string,
  framePrompt: string,
): Promise<{ frameUrl: string }> {
  await updateGenerationStatus(generationId, 'framing', 1);

  if (!KieService.isConfigured()) {
    throw new Error('KIE_AI_API_KEY not configured');
  }

  console.log('[Pipeline:Spotlight] Generating enhanced product frame...');
  const result = await KieService.generateImageSync(
    {
      prompt: framePrompt,
      aspectRatio: '9:16',
      referenceImageUrls: [productImageUrl],
    },
    (task) => console.log(`[Pipeline:Spotlight] Frame: ${task.status} (${task.progress || 0}%)`)
  );

  const buffer = await KieService.downloadFile(result.url);
  const frameUrl = await uploadFrame(generationId, 0, buffer);
  console.log(`[Pipeline:Spotlight] Frame uploaded: ${frameUrl}`);

  return { frameUrl };
}

// ============================================
// SPOTLIGHT PIPELINE STEP 2: ANIMATE WITH KLING 2.6
// ============================================

/**
 * Animate the enhanced product frame with Kling 2.6
 */
export async function stepSpotlightAnimate(
  generationId: string,
  frameUrl: string,
  animationPrompt: string,
  duration: '5' | '10',
): Promise<{ videoR2Key: string; videoSignedUrl: string; duration: number }> {
  await updateGenerationStatus(generationId, 'generating', 2);

  if (!KieService.isConfigured()) {
    throw new Error('KIE_AI_API_KEY not configured');
  }

  const supabase = getAdminClient();

  await supabase.from('video_jobs').insert({
    generation_id: generationId,
    script_index: 0,
    status: 'pending',
    frame_url: frameUrl,
  });

  console.log(`[Pipeline:Spotlight] Animating with Kling 2.6 (${duration}s)...`);
  const result = await KieService.generateKling26VideoSync(
    {
      prompt: animationPrompt,
      imageUrls: [frameUrl],
      duration,
      sound: false,
    },
    (task) => console.log(`[Pipeline:Spotlight] Kling 2.6: ${task.status} (${task.progress || 0}%)`)
  );

  const videoBuffer = await KieService.downloadFile(result.url);
  const uploadResult = await uploadVideo(generationId, 0, videoBuffer);

  await supabase
    .from('video_jobs')
    .update({
      status: 'completed',
      video_r2_key: uploadResult.key,
      duration_seconds: result.duration || parseInt(duration),
      completed_at: new Date().toISOString(),
    })
    .eq('generation_id', generationId)
    .eq('script_index', 0);

  console.log(`[Pipeline:Spotlight] Video uploaded: ${uploadResult.key}`);

  return {
    videoR2Key: uploadResult.key,
    videoSignedUrl: uploadResult.signedUrl,
    duration: result.duration || parseInt(duration),
  };
}

// ============================================
// FULL PIPELINE ORCHESTRATION
// ============================================

export interface PipelineInput {
  generationId: string;
  productName: string;
  productImageUrl: string;
  productDescription?: string; // Optional for intelligent approach selection
  productFeatures?: string[];  // Optional for intelligent approach selection
  templateId?: string;
  mode: GenerationMode;
  voiceId?: string;
  subtitlesEnabled?: boolean; // Whether to burn subtitles into video
  captionsEnabled?: boolean;  // DEPRECATED: backward compat, use subtitlesEnabled
  captionStyleId?: string;    // Caption style preset ID (e.g., 'hormozi-bold', 'clean-minimal')
  webhookBaseUrl?: string; // Optional - only needed for webhook-based flow
  applyWatermark?: boolean; // Whether to add watermark (true for pure free users only)
  existingPersona?: PersonaProfile; // Optional - skip analysis and reuse persona (for regeneration)
  customScript?: string; // User-provided script for DIY mode
  endScreenEnabled?: boolean; // Whether to generate end screen
  endScreenCtaText?: string; // CTA text for end screen
  endScreenBrandText?: string; // Brand/URL text for end screen
  // Spotlight-specific fields
  spotlightCategoryId?: string; // Category ID (e.g., 'beauty', 'tech')
  spotlightStyleId?: string;    // Style ID (e.g., 'glass-glow', 'orbit')
  spotlightDuration?: '5' | '10'; // Animation duration in seconds
}

export interface PipelineOutput {
  persona: PersonaProfile;
  scripts: GeneratedScript[];
  frames: GeneratedFrame[];
  // voiceovers removed - video models generate audio natively
  videos: CompletedVideo[];
  subtitles: GeneratedSubtitle[];
  burnedSubtitles: BurnedSubtitleVideo[];
  // Backward compatibility aliases
  captions?: GeneratedSubtitle[];
  burnedCaptions?: BurnedSubtitleVideo[];
}

/**
 * Run the full video generation pipeline
 * This handles all steps synchronously with polling
 */
export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const {
    generationId,
    productName,
    productImageUrl,
    templateId,
    mode,
    voiceId,
    subtitlesEnabled = input.captionsEnabled ?? false, // Support both new and legacy param
    captionStyleId, // Caption style preset ID (e.g., 'hormozi-bold')
    applyWatermark = false, // Only true for pure free users (free tier + never paid)
    existingPersona, // Optional - skip analysis if provided (for regeneration)
  } = input;

  try {
    // Mark as started
    const supabase = getAdminClient();
    await supabase
      .from('generations')
      .update({ started_at: new Date().toISOString() })
      .eq('id', generationId);

    // Step 1: Analyze product (or reuse existing persona for regeneration)
    let persona: PersonaProfile;
    if (existingPersona) {
      console.log('[Pipeline] Reusing existing persona (regeneration)');
      persona = existingPersona;
      // Still update status for progress tracking
      await updateGenerationStatus(generationId, 'analyzing', 1, {
        persona_profile: persona,
      } as Partial<Generation>);
    } else {
      persona = await stepAnalyzeProduct(
        generationId,
        productImageUrl,
        productName
      );
    }

    if (mode === 'spotlight') {
      // ========================================
      // SPOTLIGHT PIPELINE (Nano Banana + Kling 2.6)
      // ========================================

      const { spotlightCategoryId, spotlightStyleId, spotlightDuration = '5' } = input;

      // Validate spotlight inputs
      if (!spotlightCategoryId || !spotlightStyleId) {
        throw new Error('Spotlight mode requires categoryId and styleId');
      }

      // Get style config
      const style = getSpotlightStyle(spotlightCategoryId as SpotlightCategory, spotlightStyleId);
      if (!style) {
        throw new Error(`Invalid spotlight style: ${spotlightCategoryId}/${spotlightStyleId}`);
      }

      console.log(`[Pipeline:Spotlight] Starting with style: ${style.name} (${spotlightDuration}s)`);

      // Step 1: Generate enhanced product frame
      const { frameUrl } = await stepSpotlightEnhanceFrame(
        generationId,
        productImageUrl,
        style.framePrompt,
      );

      // Step 2: Animate with Kling 2.6
      const videoResult = await stepSpotlightAnimate(
        generationId,
        frameUrl,
        style.animationPrompt,
        spotlightDuration,
      );

      // Build final generation video (no subtitles for spotlight - it's a product animation)
      const generationVideos: GenerationVideo[] = [{
        scriptIndex: 0,
        frameUrl,
        videoR2Key: videoResult.videoR2Key,
        duration: videoResult.duration,
      }];

      // Step 3: Complete (no strategy, no subtitles for spotlight)
      await updateGenerationStatus(generationId, 'completed', 3, {
        videos: generationVideos,
        total_steps: 3,
      } as Partial<Generation>);

      // Confirm credits
      const { data: completedGen } = await supabase
        .from('generations')
        .select('credit_transaction_id')
        .eq('id', generationId)
        .single();

      if (completedGen?.credit_transaction_id) {
        try {
          await confirmCredits(completedGen.credit_transaction_id);
        } catch (creditError) {
          console.error('[Pipeline:Spotlight] Credit confirm failed:', creditError);
        }
      }

      console.log(`[Pipeline:Spotlight] Completed successfully`);

      // Return minimal output (spotlight doesn't generate scripts/personas meaningfully)
      return {
        persona: persona, // Keep for consistency but not really used
        scripts: [],
        frames: [{ scriptIndex: 0, prompt: { description: style.name, cameraAngle: '', lighting: '', mood: '' }, imageUrl: frameUrl }],
        videos: [{ scriptIndex: 0, videoR2Key: videoResult.videoR2Key, videoSignedUrl: videoResult.videoSignedUrl, duration: videoResult.duration }],
        subtitles: [],
        burnedSubtitles: [],
        captions: [],
        burnedCaptions: [],
      };
    }

    if (mode === 'diy') {
      // ========================================
      // DIY PIPELINE (Veo 3.1 + Compositing)
      // ========================================

      // Step 2: Use custom script directly
      const scripts = await stepUseCustomScript(
        generationId, input.customScript, persona, productName,
      );

      // Step 3: Generate composite image (template-aware)
      const composite = await stepGenerateComposite(
        generationId, productImageUrl, productName, persona,
        templateId,
      );

      // Step 6: Animate with Veo 3.1 Fast (template-aware)
      const diyVideo = await stepAnimateWithVeo31(
        generationId, composite.compositeImageUrl, scripts[0], productName,
        templateId,
      );

      // Build CompletedVideo for subtitle/watermark steps
      const videos: CompletedVideo[] = [{
        scriptIndex: 0,
        videoR2Key: diyVideo.videoR2Key,
        videoSignedUrl: diyVideo.videoSignedUrl,
        duration: diyVideo.duration,
      }];

      // Step 8 + 9: Generate and burn subtitles (only if enabled)
      let subtitles: GeneratedSubtitle[] = [];
      let burnedSubtitles: BurnedSubtitleVideo[] = [];

      if (subtitlesEnabled) {
        subtitles = await stepGenerateSubtitles(generationId, videos);
        if (subtitles.length > 0 && subtitles[0].words.length > 0) {
          burnedSubtitles = await stepBurnSubtitles(generationId, videos, subtitles, captionStyleId);
        }
      } else {
        console.log('[Pipeline:DIY] Captions disabled, skipping STT + subtitle burn');
      }

      // Step 9.5: Watermark (if pure free user)
      if (applyWatermark) {
        try {
          await stepAddWatermark(generationId, videos, burnedSubtitles);
        } catch (watermarkError) {
          console.error('[Pipeline:DIY] Watermark failed:', watermarkError);
        }
      }

      // Step 9.6 + 9.7: End screen (if enabled)
      if (input.endScreenEnabled && input.endScreenCtaText) {
        try {
          const endScreen = await stepGenerateEndScreen(
            generationId, productImageUrl, productName,
            input.endScreenCtaText, input.endScreenBrandText,
          );

          const videoToConcat = burnedSubtitles[0]?.videoSubtitledR2Key || diyVideo.videoR2Key;
          const concatResult = await stepConcatenateWithEndScreen(
            generationId, videoToConcat, endScreen.videoR2Key,
          );

          videos[0].duration = concatResult.duration;
          if (burnedSubtitles.length > 0) {
            burnedSubtitles[0].videoSubtitledR2Key = concatResult.videoR2Key;
          } else {
            videos[0].videoR2Key = concatResult.videoR2Key;
          }
        } catch (endScreenError) {
          console.error('[Pipeline:DIY] End screen failed:', endScreenError);
        }
      }

      // Build final generation videos
      const subtitledKeyMap = new Map(
        burnedSubtitles.map((bs) => [bs.scriptIndex, bs.videoSubtitledR2Key])
      );

      const generationVideos: GenerationVideo[] = videos.map((v) => ({
        scriptIndex: v.scriptIndex,
        frameUrl: composite.compositeImageUrl,
        videoR2Key: v.videoR2Key,
        videoSubtitledR2Key: subtitledKeyMap.get(v.scriptIndex),
        duration: v.duration,
        subtitleWords: subtitles[0]?.words,
      }));

      // Step 10: Complete (no strategy for DIY)
      await updateGenerationStatus(generationId, 'completed', 10, {
        videos: generationVideos,
        strategy_brief: null,
      } as Partial<Generation>);

      // Confirm credits
      const { data: completedGen } = await supabase
        .from('generations')
        .select('credit_transaction_id')
        .eq('id', generationId)
        .single();

      if (completedGen?.credit_transaction_id) {
        try {
          await confirmCredits(completedGen.credit_transaction_id);
        } catch (creditError) {
          console.error('[Pipeline:DIY] Credit confirm failed:', creditError);
        }
      }

      const frames: GeneratedFrame[] = [{
        scriptIndex: 0,
        prompt: { description: 'Veo 3.1 composite', cameraAngle: 'selfie', lighting: 'natural', mood: 'casual' },
        imageUrl: composite.compositeImageUrl,
      }];

      return {
        persona, scripts, frames, videos, subtitles, burnedSubtitles,
        captions: subtitles, burnedCaptions: burnedSubtitles,
      };

    } else {
      // ========================================
      // CONCIERGE PIPELINE (Sora 2)
      // ========================================

      // Step 2: Use custom script if provided (from frontend review), otherwise generate
      let scripts: GeneratedScript[];
      if (input.customScript && input.customScript.trim().length > 0) {
        console.log('[Pipeline:Concierge] Using pre-approved custom script (skipping regeneration)');
        // Use the script the user already reviewed and approved on the frontend
        scripts = await stepUseCustomScript(
          generationId, input.customScript, persona, productName,
        );
      } else {
        console.log('[Pipeline:Concierge] No custom script provided, generating from scratch');
        scripts = await stepGenerateScripts(
          generationId,
          persona,
          productName,
          input.productDescription,
          input.productFeatures
        );
      }

      // Step 3: Generate frames
      const frames = await stepGenerateFrames(
        generationId,
        productImageUrl,
        productName,
        scripts,
        persona
      );

      // Step 4: Upload frames to R2 (public URLs for Kie.ai access)
      const frameUrls = await stepUploadFrames(generationId, frames);

      // Clear image buffers after upload to prevent Inngest serialization issues
      // The buffers are no longer needed - images are now stored in R2
      for (let i = 0; i < frames.length; i++) {
        if (frames[i].imageBuffer) {
          delete frames[i].imageBuffer;
        }
        // Add the R2 URL to the frame for reference
        frames[i].imageUrl = frameUrls[i];
      }
      console.log(`[Pipeline] Cleared ${frames.length} image buffers after R2 upload`);

      // Step 5: SKIPPED - Video models (Sora 2 / Veo 3.1) generate audio natively
      // No need for separate TTS voiceover generation

      // Step 6+7: Generate video with Sora 2 → Veo 3.1 fallback
      // Combines task creation + polling + R2 upload with automatic model fallback
      const videos = await stepGenerateVideoWithFallback(
        generationId,
        scripts,
        frames,
        frameUrls,
      );

      // Step 8 + 9: Generate and burn subtitles (only if enabled)
      let subtitles: GeneratedSubtitle[] = [];
      let burnedSubtitles: BurnedSubtitleVideo[] = [];

      if (subtitlesEnabled) {
        console.log(`[Pipeline] Generating subtitles for ${videos.length} videos...`);
        subtitles = await stepGenerateSubtitles(generationId, videos);
        console.log(`[Pipeline] Generated ${subtitles.length} subtitle sets:`, subtitles.map(s => ({ scriptIndex: s.scriptIndex, wordCount: s.words?.length || 0 })));

        if (subtitles.length > 0) {
          console.log('[Pipeline] Burning subtitles into videos...');
          burnedSubtitles = await stepBurnSubtitles(generationId, videos, subtitles, captionStyleId);
          console.log(`[Pipeline] Burned subtitles for ${burnedSubtitles.length} videos:`, burnedSubtitles.map(bs => ({ scriptIndex: bs.scriptIndex, key: bs.videoSubtitledR2Key })));
        }
      } else {
        console.log('[Pipeline] Captions disabled, skipping STT + subtitle burn');
      }

      // Step 9.5: Add watermark for pure free users only
      if (applyWatermark) {
        console.log('[Pipeline] Pure free tier - adding watermark to videos...');
        try {
          await stepAddWatermark(generationId, videos, burnedSubtitles);
          console.log('[Pipeline] Watermark successfully added to all videos');
        } catch (watermarkError) {
          // Don't fail the pipeline - deliver unwatermarked video instead
          console.error('[Pipeline] Watermark step failed, delivering unwatermarked videos:', watermarkError);
        }
      } else {
        console.log('[Pipeline] Paid user or has_paid=true - skipping watermark');
      }

      // Create lookup map for subtitled video keys
      const subtitledKeyMap = new Map(
        burnedSubtitles.map((bs) => [bs.scriptIndex, bs.videoSubtitledR2Key])
      );
      console.log('[Pipeline] Subtitled key map:', Object.fromEntries(subtitledKeyMap));

      // Mark as completed - store frame URL (public), video R2 key, and subtitled video R2 key
      const generationVideos: GenerationVideo[] = videos.map((v, i) => ({
        scriptIndex: v.scriptIndex,
        frameUrl: frameUrls[i],
        videoR2Key: v.videoR2Key,
        videoSubtitledR2Key: subtitledKeyMap.get(v.scriptIndex),
        duration: v.duration,
        subtitleWords: subtitles[i]?.words,
      }));
      console.log('[Pipeline] Final generation videos:', generationVideos.map(gv => ({ scriptIndex: gv.scriptIndex, hasRawKey: !!gv.videoR2Key, hasSubtitledKey: !!gv.videoSubtitledR2Key })));

      // Step 10: Generate strategy (Concierge only) - MUST run BEFORE marking completed
      // so the frontend receives strategyBrief on the same poll that shows 'completed'
      let strategyBrief = null;
      try {
        console.log('[Pipeline] Generating strategy brief...');
        strategyBrief = await generateStrategy(generationId);
        console.log('[Pipeline] Strategy brief generated successfully');
      } catch (error) {
        console.error('[Pipeline] Strategy generation failed:', error);
        // Don't fail the entire generation - video is still usable
      }

      // Now mark as completed - frontend will receive strategyBrief with this status
      await updateGenerationStatus(generationId, 'completed', 10, {
        videos: generationVideos,
        strategy_brief: strategyBrief,
      } as Partial<Generation>);

      // Confirm credits immediately after completion (don't rely on Inngest step)
      const { data: completedGeneration } = await supabase
        .from('generations')
        .select('credit_transaction_id')
        .eq('id', generationId)
        .single();

      if (completedGeneration?.credit_transaction_id) {
        try {
          await confirmCredits(completedGeneration.credit_transaction_id);
          console.log(`[Pipeline] Credits confirmed for generation ${generationId}`);
        } catch (creditError) {
          console.error(`[Pipeline] Failed to confirm credits for generation ${generationId}:`, creditError);
          // Don't throw - video is still usable, credits can be confirmed later
        }
      }

      // Temp files are now created and cleaned up within each step
      // No global cleanup needed - each step is self-contained

      return {
        persona,
        scripts,
        frames,
        videos,
        subtitles,
        burnedSubtitles,
        // Backward compatibility aliases
        captions: subtitles,
        burnedCaptions: burnedSubtitles,
      };
    }
  } catch (error) {
    // Mark generation as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateGenerationStatus(generationId, 'failed', -1, {
      error_message: errorMessage,
    } as Partial<Generation>);

    // Refund credits on failure
    const supabase = getAdminClient();
    const { data: failedGeneration } = await supabase
      .from('generations')
      .select('credit_transaction_id')
      .eq('id', generationId)
      .single();

    if (failedGeneration?.credit_transaction_id) {
      try {
        await refundCredits(failedGeneration.credit_transaction_id, errorMessage);
        console.log(`[Pipeline] Credits refunded for failed generation ${generationId}`);
      } catch (refundError) {
        console.error(`[Pipeline] Failed to refund credits for generation ${generationId}:`, refundError);
      }
    }

    throw error;
  }
}

// ============================================
// WEBHOOK HANDLERS (Legacy support)
// ============================================

/**
 * Handle video completion webhook from kie.ai
 * This is for backward compatibility with webhook-based flow
 * Downloads video from temp URL and uploads to R2 for persistence
 */
export async function handleVideoComplete(
  generationId: string,
  scriptIndex: number,
  tempVideoUrl: string,
  duration: number
): Promise<void> {
  const supabase = getAdminClient();

  // Download video from temp URL and upload to R2
  console.log(`[Webhook] Downloading video ${scriptIndex} from temp URL...`);
  const videoBuffer = await KieService.downloadFile(tempVideoUrl);
  const uploadResult = await uploadVideo(generationId, scriptIndex, videoBuffer);
  console.log(`[Webhook] Video ${scriptIndex} uploaded to R2: ${uploadResult.key}`);

  // Update video job with R2 key
  await supabase
    .from('video_jobs')
    .update({
      status: 'completed',
      video_r2_key: uploadResult.key,
      duration_seconds: duration,
      completed_at: new Date().toISOString(),
    })
    .eq('generation_id', generationId)
    .eq('script_index', scriptIndex);

  // Check if all videos are complete
  const { data: jobs } = await supabase
    .from('video_jobs')
    .select('*')
    .eq('generation_id', generationId);

  const allComplete = jobs?.every((j) => j.status === 'completed');

  if (allComplete) {
    // All videos complete - mark generation as complete
    const videos: GenerationVideo[] = (jobs || []).map((job) => ({
      scriptIndex: job.script_index,
      frameUrl: job.frame_url,
      videoR2Key: job.video_r2_key,
      duration: job.duration_seconds,
    }));

    await updateGenerationStatus(generationId, 'completed', 9, {
      videos,
    } as Partial<Generation>);

    // Confirm credits for the completed generation
    const { data: generation } = await supabase
      .from('generations')
      .select('credit_transaction_id')
      .eq('id', generationId)
      .single();

    if (generation?.credit_transaction_id) {
      try {
        await confirmCredits(generation.credit_transaction_id);
        console.log(`[Pipeline] Credits confirmed for generation ${generationId}`);
      } catch (error) {
        console.error(`[Pipeline] Failed to confirm credits for generation ${generationId}:`, error);
      }
    }
  }
}

/**
 * Handle video failure webhook from kie.ai
 */
export async function handleVideoFailed(
  generationId: string,
  scriptIndex: number,
  errorMessage: string
): Promise<void> {
  const supabase = getAdminClient();

  // Update video job
  await supabase
    .from('video_jobs')
    .update({
      status: 'failed',
      error_message: errorMessage,
    })
    .eq('generation_id', generationId)
    .eq('script_index', scriptIndex);

  // Mark the entire generation as failed
  await updateGenerationStatus(generationId, 'failed', -1, {
    error_message: `Video ${scriptIndex} failed: ${errorMessage}`,
  } as Partial<Generation>);
}

// ============================================
// STRATEGY GENERATION (Concierge)
// ============================================

/**
 * Generate strategy brief for Concierge mode
 * Called after all videos are complete
 */
export async function generateStrategy(generationId: string): Promise<StrategyBrief | null> {
  const supabase = getAdminClient();

  // Get generation data
  const { data: generation } = await supabase
    .from('generations')
    .select('*')
    .eq('id', generationId)
    .single();

  if (!generation || generation.mode !== 'concierge') {
    return null;
  }

  const persona = generation.persona_profile as PersonaProfile;
  const scripts = generation.scripts as string[];

  // Generate strategy brief
  const strategy = await generateStrategyBrief(
    persona,
    generation.product_name,
    scripts
  );

  // Return strategy to be saved with final status update
  // (No longer saving separately - avoids double database write)
  return strategy;
}

// ============================================
// EXPORTS
// ============================================

export const Pipeline = {
  run: runPipeline,
  steps: {
    analyzeProduct: stepAnalyzeProduct,
    generateScripts: stepGenerateScripts,
    generateFrames: stepGenerateFrames,
    uploadFrames: stepUploadFrames,
    generateVoiceovers: stepGenerateVoiceovers,
    createVideoJobs: stepCreateVideoJobs,
    pollVideoCompletion: stepPollVideoCompletion,
    generateSubtitles: stepGenerateSubtitles,
    burnSubtitles: stepBurnSubtitles,
    addWatermark: stepAddWatermark,
    // Backward compatibility
    generateCaptions: stepGenerateSubtitles,
    burnCaptions: stepBurnSubtitles,
    // Concierge with fallback
    generateVideoWithFallback: stepGenerateVideoWithFallback,
    // DIY Pipeline steps
    useCustomScript: stepUseCustomScript,
    generateComposite: stepGenerateComposite,
    animateWithVeo31: stepAnimateWithVeo31,
    generateEndScreen: stepGenerateEndScreen,
    concatenateWithEndScreen: stepConcatenateWithEndScreen,
    // Spotlight Pipeline steps
    spotlightEnhanceFrame: stepSpotlightEnhanceFrame,
    spotlightAnimate: stepSpotlightAnimate,
  },
  webhooks: {
    handleVideoComplete,
    handleVideoFailed,
  },
  updateStatus: updateGenerationStatus,
  generateStrategy,
};
