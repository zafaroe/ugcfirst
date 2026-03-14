import { inngest, Events } from '../client';
import { Pipeline } from '@/lib/generation/pipeline';
import {
  stepAnalyzeProduct,
  stepGenerateScripts,
  stepGenerateFrames,
  stepUploadFrames,
  stepSubmitVideoJobs,
  stepPollVideoCompletionV2,
  stepGenerateSubtitles,
  stepBurnSubtitles,
  stepAddWatermark,
  stepUseCustomScript,
  updateGenerationStatus,
  saveGenerationState,
  loadGenerationState,
  mergeGenerationState,
  generateStrategy as generateStrategyBrief,
  GeneratedFrame,
  VideoJobSubmission,
} from '@/lib/generation/pipeline';
import { CreditService } from '@/services/credits';
import { getAdminClient } from '@/lib/supabase';
import { FFmpegService } from '@/lib/ffmpeg';
import { KieService } from '@/lib/ai/kie';
import { ASSGenerator } from '@/lib/subtitles/ass-generator';
import { uploadVideo, downloadFromR2 } from '@/lib/r2';
import { GenerationState, GeneratedScript, PersonaProfile, GenerationVideo } from '@/types/generation';
import * as path from 'path';
import * as os from 'os';

// Feature flag for new multi-step pipeline (can be controlled via env var)
const USE_MULTI_STEP_PIPELINE = process.env.USE_INNGEST_PIPELINE_V2 !== 'false';

// Video model tiers for fallback
const VIDEO_MODEL_TIERS = ['sora-2-stable', 'sora-2', 'sora-2-pro', 'sora-direct', 'veo3-fast'] as const;
const MAX_TIERS = VIDEO_MODEL_TIERS.length;

// ============================================
// MAIN GENERATION FUNCTION (Multi-Step Architecture)
// ============================================

/**
 * Video Generation Background Job (v2 - Multi-Step)
 *
 * This function breaks the pipeline into 4 checkpointed steps
 * to comply with Vercel's 300-second function timeout:
 *
 * Step 1: prepare-generation (~60-90s)
 *   - Analyze product (GPT-4o Vision)
 *   - Generate scripts (Gemini 2.5 Pro)
 *   - Generate frames (Kie.ai nano-banana-pro)
 *   - Upload frames to R2
 *
 * Step 2: generate-raw-videos (~270s per tier, with fallback)
 *   - Submit video jobs to Kie.ai/Sora
 *   - Poll for completion with 270s timeout
 *   - Fallback to next tier on failure
 *   - Upload completed videos to R2
 *
 * Step 3: post-process-videos (~60-120s)
 *   - Generate subtitles (STT)
 *   - Burn subtitles into videos (FFmpeg)
 *   - Add watermark (free tier only)
 *   - Generate strategy (Concierge only)
 *
 * Step 4: confirm-credits
 *   - Confirm or refund credits
 *
 * Database is used as state bus - only generationId crosses step boundaries.
 */
export const generateVideo = inngest.createFunction(
  {
    id: 'generate-video',
    name: 'Generate Video',
    retries: 2,
    cancelOn: [
      {
        event: 'generation/cancel',
        match: 'data.generationId',
      },
    ],
  },
  { event: 'generation/start' },
  async ({ event, step }) => {
    const {
      generationId,
      userId,
      productName,
      productImageUrl,
      templateId,
      captionsEnabled,
      captionStyleId,
      mode,
      creditTransactionId,
      voiceId,
      applyWatermark,
      existingPersona,
      customScript,
      endScreenEnabled,
      endScreenCtaText,
      endScreenBrandText,
      spotlightCategoryId,
      spotlightStyleId,
      spotlightDuration,
    } = event.data;

    // Debug logging
    console.log('[Inngest generate-video] Starting with config:', {
      generationId,
      mode,
      captionsEnabled,
      captionStyleId,
      useMultiStep: USE_MULTI_STEP_PIPELINE,
    });

    // Spotlight mode should use the dedicated generateSpotlight function
    if (mode === 'spotlight') {
      throw new Error('Spotlight mode should use generation/spotlight-start event, not generation/start');
    }

    // For DIY mode or if multi-step is disabled, use the original pipeline
    if (mode === 'diy' || !USE_MULTI_STEP_PIPELINE) {
      return runLegacyPipeline(event, step);
    }

    // ========================================
    // CONCIERGE MODE - MULTI-STEP PIPELINE
    // ========================================

    try {
      // Step 1: Prepare generation (analyze, scripts, frames)
      await step.run('prepare-generation', async () => {
        console.log(`[Inngest:Step1] Preparing generation ${generationId}`);

        const supabase = getAdminClient();

        // Mark as started
        await supabase
          .from('generations')
          .update({ started_at: new Date().toISOString() })
          .eq('id', generationId);

        // 1a. Analyze product (or reuse existing persona)
        let persona: PersonaProfile;
        if (existingPersona) {
          console.log('[Inngest:Step1] Reusing existing persona');
          persona = existingPersona as PersonaProfile;
          await updateGenerationStatus(generationId, 'analyzing', 1, {
            persona_profile: persona,
          } as any);
        } else {
          persona = await stepAnalyzeProduct(generationId, productImageUrl, productName);
        }

        // 1b. Generate scripts (or use custom script)
        let scripts: GeneratedScript[];
        if (customScript && customScript.trim().length > 0) {
          console.log('[Inngest:Step1] Using custom script');
          scripts = await stepUseCustomScript(generationId, customScript, persona, productName);
        } else {
          console.log('[Inngest:Step1] Generating scripts');
          scripts = await stepGenerateScripts(generationId, persona, productName);
        }

        // 1c. Generate frames
        console.log('[Inngest:Step1] Generating frames');
        const frames = await stepGenerateFrames(generationId, productImageUrl, productName, scripts, persona);

        // 1d. Upload frames to R2
        console.log('[Inngest:Step1] Uploading frames to R2');
        const frameUrls = await stepUploadFrames(generationId, frames);

        // Clear image buffers to avoid serialization issues
        const framesWithoutBuffers = frames.map((f, i) => ({
          scriptIndex: f.scriptIndex,
          prompt: f.prompt,
          imageUrl: frameUrls[i],
        }));

        // Save state to DB
        await saveGenerationState(generationId, {
          persona,
          scripts,
          frames: framesWithoutBuffers,
          frameUrls,
        });

        console.log(`[Inngest:Step1] Complete - ${scripts.length} scripts, ${frames.length} frames`);
        return { scriptCount: scripts.length, frameCount: frames.length };
      });

      // Step 2: Generate raw videos with tier fallback
      // This step may be called multiple times if tiers fail
      let currentTier = 1;
      let videoGenerationComplete = false;

      while (!videoGenerationComplete && currentTier <= MAX_TIERS) {
        try {
          await step.run(`generate-raw-videos-tier-${currentTier}`, async () => {
            console.log(`[Inngest:Step2] Generating videos (tier ${currentTier})`);

            // Load state from DB
            const state = await loadGenerationState(generationId);
            if (!state.scripts || !state.frames || !state.frameUrls) {
              throw new Error('Missing preparation state - scripts, frames, or frameUrls');
            }

            // Submit video jobs for this tier
            const jobs = await stepSubmitVideoJobs(
              generationId,
              state.scripts,
              state.frames as GeneratedFrame[],
              state.frameUrls,
              currentTier
            );

            // Poll for completion with 270s timeout
            const completedVideos = await stepPollVideoCompletionV2(generationId, jobs, {
              timeout: 270000, // 4.5 minutes - leaves buffer for Vercel
              onProgress: (scriptIndex, progress) => {
                console.log(`[Inngest:Step2] Video ${scriptIndex}: ${progress}%`);
              },
            });

            // Save completed videos to state
            await mergeGenerationState(generationId, {
              completedVideos,
            });

            console.log(`[Inngest:Step2] Complete - ${completedVideos.length} videos generated`);
          });

          videoGenerationComplete = true;
        } catch (tierError) {
          const errorMsg = tierError instanceof Error ? tierError.message : String(tierError);
          console.error(`[Inngest:Step2] Tier ${currentTier} failed:`, errorMsg);

          currentTier++;

          if (currentTier > MAX_TIERS) {
            throw new Error(`All ${MAX_TIERS} video generation tiers failed. Last error: ${errorMsg}`);
          }

          console.log(`[Inngest:Step2] Falling back to tier ${currentTier}`);
        }
      }

      // Step 3: Post-process videos (subtitles, watermark, strategy)
      await step.run('post-process-videos', async () => {
        console.log(`[Inngest:Step3] Post-processing videos`);

        // Load state from DB
        const state = await loadGenerationState(generationId);
        if (!state.completedVideos || state.completedVideos.length === 0) {
          throw new Error('No completed videos to process');
        }

        // Convert to CompletedVideo format
        const videos = state.completedVideos.map(v => ({
          scriptIndex: v.scriptIndex,
          videoR2Key: v.videoR2Key,
          videoSignedUrl: v.videoSignedUrl,
          duration: v.duration,
        }));

        // 3a. Generate and burn subtitles (if enabled)
        let subtitles: any[] = [];
        let burnedSubtitles: any[] = [];

        if (captionsEnabled) {
          console.log('[Inngest:Step3] Generating subtitles');
          subtitles = await stepGenerateSubtitles(generationId, videos);

          if (subtitles.length > 0 && subtitles.some(s => s.words?.length > 0)) {
            console.log('[Inngest:Step3] Burning subtitles');
            burnedSubtitles = await stepBurnSubtitles(generationId, videos, subtitles, captionStyleId);
          }

          // Store subtitles in state
          await mergeGenerationState(generationId, {
            subtitles,
            burnedSubtitles: burnedSubtitles.map(bs => ({
              scriptIndex: bs.scriptIndex,
              videoSubtitledR2Key: bs.videoSubtitledR2Key,
              videoSubtitledSignedUrl: bs.videoSubtitledSignedUrl,
            })),
          });
        }

        // 3b. Add watermark (free tier only)
        if (applyWatermark) {
          console.log('[Inngest:Step3] Adding watermark');
          try {
            await stepAddWatermark(generationId, videos, burnedSubtitles);
          } catch (watermarkError) {
            console.error('[Inngest:Step3] Watermark failed, continuing:', watermarkError);
          }
        }

        // 3c. Generate strategy (Concierge only)
        let strategyBrief = null;
        if (mode === 'concierge') {
          console.log('[Inngest:Step3] Generating strategy brief');
          try {
            strategyBrief = await generateStrategyBrief(generationId);
          } catch (strategyError) {
            console.error('[Inngest:Step3] Strategy generation failed:', strategyError);
          }
        }

        // 3d. Build final generation videos array
        const subtitledKeyMap = new Map(
          burnedSubtitles.map((bs: any) => [bs.scriptIndex, bs.videoSubtitledR2Key])
        );

        const generationVideos: GenerationVideo[] = videos.map((v, i) => ({
          scriptIndex: v.scriptIndex,
          frameUrl: state.frameUrls?.[i] || '',
          videoR2Key: v.videoR2Key,
          videoSubtitledR2Key: subtitledKeyMap.get(v.scriptIndex),
          duration: v.duration,
          subtitleWords: subtitles[i]?.words,
        }));

        // 3e. Mark as completed
        await updateGenerationStatus(generationId, 'completed', 10, {
          videos: generationVideos,
          strategy_brief: strategyBrief,
        } as any);

        console.log(`[Inngest:Step3] Complete - ${generationVideos.length} final videos`);
        return { videoCount: generationVideos.length };
      });

      // Step 4: Confirm credits
      await step.run('confirm-credits', async () => {
        if (creditTransactionId) {
          console.log('[Inngest:Step4] Confirming credits');
          await CreditService.confirmCredits(creditTransactionId);
        }
      });

      // Load final state for return value
      const finalState = await loadGenerationState(generationId);

      return {
        success: true,
        generationId,
        scriptsGenerated: finalState.scripts?.length || 0,
        videosGenerated: finalState.completedVideos?.length || 0,
        subtitlesGenerated: finalState.subtitles?.filter((s: any) => s.words?.length > 0).length || 0,
      };

    } catch (error) {
      // Refund credits on failure
      await step.run('refund-credits', async () => {
        if (creditTransactionId) {
          await CreditService.refundCredits(
            creditTransactionId,
            `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        // Mark as failed
        await updateGenerationStatus(generationId, 'failed', -1, {
          error_message: error instanceof Error ? error.message : 'Unknown error',
        } as any);
      });

      throw error;
    }
  }
);

// ============================================
// LEGACY PIPELINE (for DIY mode and fallback)
// ============================================

/**
 * Run the original single-step pipeline
 * Used for DIY mode and when multi-step is disabled
 */
async function runLegacyPipeline(event: any, step: any) {
  const {
    generationId,
    productName,
    productImageUrl,
    templateId,
    captionsEnabled,
    captionStyleId,
    mode,
    creditTransactionId,
    voiceId,
    applyWatermark,
    existingPersona,
    customScript,
    endScreenEnabled,
    endScreenCtaText,
    endScreenBrandText,
    spotlightCategoryId,
    spotlightStyleId,
    spotlightDuration,
  } = event.data;

  try {
    // Run the full pipeline in a single step
    const result = await step.run('run-pipeline', async () => {
      return Pipeline.run({
        generationId,
        productName,
        productImageUrl,
        templateId,
        mode,
        voiceId,
        captionsEnabled: captionsEnabled ?? false,
        captionStyleId,
        applyWatermark: applyWatermark ?? false,
        existingPersona,
        customScript,
        endScreenEnabled,
        endScreenCtaText,
        endScreenBrandText,
        spotlightCategoryId,
        spotlightStyleId,
        spotlightDuration,
      });
    });

    // Store subtitle words in DB
    if (captionsEnabled && result.videos.length > 0 && result.subtitles) {
      await step.run('store-subtitle-data', async () => {
        const supabase = getAdminClient();

        for (let i = 0; i < result.videos.length; i++) {
          const video = result.videos[i];
          const subtitle = result.subtitles[i];

          if (subtitle && subtitle.words.length > 0) {
            await supabase
              .from('video_jobs')
              .update({
                captions: subtitle.words,
              })
              .eq('generation_id', generationId)
              .eq('script_index', video.scriptIndex);
          }
        }
      });
    }

    // Confirm credits
    await step.run('confirm-credits', async () => {
      if (creditTransactionId) {
        await CreditService.confirmCredits(creditTransactionId);
      }
    });

    return {
      success: true,
      generationId,
      scriptsGenerated: result.scripts.length,
      videosGenerated: result.videos.length,
      subtitlesGenerated: result.subtitles?.filter((s: { words: unknown[] }) => s.words.length > 0).length || 0,
    };
  } catch (error) {
    // Refund credits on failure
    await step.run('refund-credits', async () => {
      if (creditTransactionId) {
        await CreditService.refundCredits(
          creditTransactionId,
          `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    throw error;
  }
}

// ============================================
// SPOTLIGHT GENERATION FUNCTION
// ============================================

/**
 * Spotlight Animation Background Job
 *
 * Dedicated function for Spotlight mode that breaks each phase
 * into its own Inngest step for proper checkpointing.
 *
 * Spotlight pipeline (3 checkpointed steps):
 * 1. Generate enhanced product frame (Nano Banana)
 * 2. Animate frame (Kling 2.6, with Veo 3.1 fallback)
 * 3. Finalize + confirm credits
 *
 * Each step is a separate HTTP request, so Vercel timeouts
 * only apply per-step, not across the whole pipeline.
 */
export const generateSpotlight = inngest.createFunction(
  {
    id: 'generate-spotlight',
    name: 'Generate Spotlight Animation',
    retries: 2,
    cancelOn: [
      {
        event: 'generation/cancel',
        match: 'data.generationId',
      },
    ],
  },
  { event: 'generation/spotlight-start' },
  async ({ event, step }) => {
    const {
      generationId,
      userId,
      productName,
      productImageUrl,
      creditTransactionId,
      applyWatermark,
      spotlightCategoryId,
      spotlightStyleId,
      spotlightDuration = '5',
    } = event.data;

    try {
      // Step 1: Generate enhanced product frame (Nano Banana)
      // Typically takes 30-60s — well within Vercel limits
      const frameResult = await step.run('spotlight-enhance-frame', async () => {
        const { getSpotlightStyle } = await import('@/data/spotlight-styles');
        const { stepSpotlightEnhanceFrame, updateGenerationStatus } = await import('@/lib/generation/pipeline');
        const { getAdminClient } = await import('@/lib/supabase');

        const style = getSpotlightStyle(spotlightCategoryId as any, spotlightStyleId);
        if (!style) {
          throw new Error(`Invalid spotlight style: ${spotlightCategoryId}/${spotlightStyleId}`);
        }

        // Mark generation as started
        const supabase = getAdminClient();
        await supabase
          .from('generations')
          .update({ started_at: new Date().toISOString() })
          .eq('id', generationId);

        console.log(`[Spotlight] Step 1: Generating frame with style "${style.name}"`);

        const { frameUrl } = await stepSpotlightEnhanceFrame(
          generationId,
          productImageUrl,
          style.framePrompt,
        );

        return {
          frameUrl,
          styleName: style.name,
          animationPrompt: style.animationPrompt,
        };
      });

      // Step 2: Animate with Kling 2.6 (fallback to Veo 3.1)
      // This is the long step — Kling 2.6 can take 2-5 minutes
      // Having it as its own step means it gets a fresh Vercel timeout
      const videoResult = await step.run('spotlight-animate', async () => {
        const { stepSpotlightAnimate, updateGenerationStatus } = await import('@/lib/generation/pipeline');
        const { KieService } = await import('@/lib/ai/kie');
        const { uploadVideo } = await import('@/lib/r2');
        const { getAdminClient } = await import('@/lib/supabase');

        console.log(`[Spotlight] Step 2: Animating with Kling 2.6 (${spotlightDuration}s)`);

        try {
          const result = await stepSpotlightAnimate(
            generationId,
            frameResult.frameUrl,
            frameResult.animationPrompt,
            spotlightDuration as '5' | '10',
          );
          return result;
        } catch (klingError) {
          // Fallback to Veo 3.1 Fast if Kling 2.6 fails
          console.warn(`[Spotlight] Kling 2.6 failed:`, klingError instanceof Error ? klingError.message : String(klingError));
          console.log(`[Spotlight] Falling back to Veo 3.1 Fast...`);

          const supabase = getAdminClient();

          // Update status
          await updateGenerationStatus(generationId, 'generating', 2);

          const veoPrompt = `Cinematic product showcase animation. ${frameResult.animationPrompt} Smooth, professional motion design. Premium product commercial quality. 9:16 vertical format.`;

          const veoResult = await KieService.generateVeo3VideoSync(
            {
              model: 'veo3_fast',
              prompt: veoPrompt,
              imageUrls: [frameResult.frameUrl],
              aspectRatio: '9:16',
              sound: false,
              duration: spotlightDuration === '10' ? '8' : '5',
            },
            (task) => console.log(`[Spotlight] Veo 3.1 fallback: ${task.status} (${task.progress || 0}%)`)
          );

          const videoBuffer = await KieService.downloadFile(veoResult.url);
          const uploadResult = await uploadVideo(generationId, 0, videoBuffer);

          // Update video_jobs
          await supabase
            .from('video_jobs')
            .upsert({
              generation_id: generationId,
              script_index: 0,
              status: 'completed',
              frame_url: frameResult.frameUrl,
              video_r2_key: uploadResult.key,
              duration_seconds: veoResult.duration || parseInt(spotlightDuration),
              completed_at: new Date().toISOString(),
            });

          return {
            videoR2Key: uploadResult.key,
            videoSignedUrl: uploadResult.signedUrl,
            duration: veoResult.duration || parseInt(spotlightDuration),
          };
        }
      });

      // Step 3: Finalize — mark complete, apply watermark if needed, confirm credits
      await step.run('spotlight-finalize', async () => {
        const { updateGenerationStatus, stepAddWatermark } = await import('@/lib/generation/pipeline');
        const { getAdminClient } = await import('@/lib/supabase');
        const { confirmCredits } = await import('@/services/credits');

        const supabase = getAdminClient();

        // Apply watermark for free tier if needed
        if (applyWatermark) {
          try {
            await stepAddWatermark(
              generationId,
              [{
                scriptIndex: 0,
                videoR2Key: videoResult.videoR2Key,
                videoSignedUrl: videoResult.videoSignedUrl,
                duration: videoResult.duration,
              }],
              [] // No burned subtitles for spotlight
            );
          } catch (watermarkError) {
            console.error('[Spotlight] Watermark failed:', watermarkError);
            // Don't fail — deliver unwatermarked video
          }
        }

        // Build final video array for generations table
        const generationVideos = [{
          scriptIndex: 0,
          frameUrl: frameResult.frameUrl,
          videoR2Key: videoResult.videoR2Key,
          duration: videoResult.duration,
        }];

        // Mark complete
        await updateGenerationStatus(generationId, 'completed', 3, {
          videos: generationVideos,
          total_steps: 3,
        } as any);

        // Confirm credits
        if (creditTransactionId) {
          try {
            await confirmCredits(creditTransactionId);
            console.log(`[Spotlight] Credits confirmed for ${generationId}`);
          } catch (creditError) {
            console.error('[Spotlight] Credit confirm failed:', creditError);
          }
        }

        console.log(`[Spotlight] Generation ${generationId} completed successfully`);
      });

      return {
        success: true,
        generationId,
        videosGenerated: 1,
      };
    } catch (error) {
      // Refund credits on failure
      await step.run('spotlight-refund-credits', async () => {
        const { refundCredits } = await import('@/services/credits');
        const { updateGenerationStatus } = await import('@/lib/generation/pipeline');

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Mark as failed
        await updateGenerationStatus(generationId, 'failed', -1, {
          error_message: errorMessage,
        } as any);

        // Refund credits
        if (creditTransactionId) {
          try {
            await refundCredits(creditTransactionId, errorMessage);
            console.log(`[Spotlight] Credits refunded for failed generation ${generationId}`);
          } catch (refundError) {
            console.error('[Spotlight] Failed to refund credits:', refundError);
          }
        }
      });

      throw error;
    }
  }
);

// ============================================
// VIDEO PROCESSING FUNCTION
// ============================================

/**
 * Process a completed video (trim, captions, upload)
 *
 * This function is for post-processing videos that need
 * additional processing like trimming or burning captions.
 */
export const processVideo = inngest.createFunction(
  {
    id: 'process-video',
    name: 'Process Video',
    retries: 2,
  },
  { event: 'video/process' },
  async ({ event, step }) => {
    const {
      generationId,
      scriptIndex,
      videoUrl,
      voiceoverUrl,
      captionsEnabled,
    } = event.data;

    const supabase = getAdminClient();
    const tempDir = os.tmpdir();

    try {
      // Step 1: Download video
      const rawVideoPath = await step.run('download-video', async () => {
        const response = await fetch(videoUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const videoPath = path.join(tempDir, `${generationId}_${scriptIndex}_raw.mp4`);
        const fs = require('fs');
        fs.writeFileSync(videoPath, buffer);
        return videoPath;
      });

      // Step 2: Trim first second
      const trimmedPath = await step.run('trim-video', async () => {
        return FFmpegService.trimFirstSecond(rawVideoPath);
      });

      let finalPath = trimmedPath;

      // Step 3: Add captions (if enabled and voiceover exists)
      if (captionsEnabled && voiceoverUrl) {
        finalPath = await step.run('add-captions', async () => {
          // Get word timestamps from Kie.ai STT
          const sttResult = await KieService.getWordTimestampsSync({
            model: 'elevenlabs/scribe-v1',
            audioUrl: voiceoverUrl,
            languageCode: 'en',
          });

          // Filter to only actual words
          const words = KieService.filterWordTimestamps(sttResult);

          if (words.length === 0) {
            console.warn('No words detected in voiceover');
            return trimmedPath;
          }

          // Generate ASS file
          const assPath = path.join(tempDir, `${generationId}_${scriptIndex}.ass`);
          ASSGenerator.generateFile(
            words.map((w) => ({
              word: w.text,
              start: w.start,
              end: w.end,
            })),
            assPath
          );

          // Burn subtitles
          const captionedPath = await FFmpegService.burnSubtitles(trimmedPath, {
            assFilePath: assPath,
          });

          // Cleanup temp files
          const fs = require('fs');
          fs.unlinkSync(assPath);

          return captionedPath;
        });
      }

      // Step 4: Upload to R2
      const finalUrl = await step.run('upload-video', async () => {
        const fs = require('fs');
        const buffer = fs.readFileSync(finalPath);
        return uploadVideo(generationId, scriptIndex, buffer);
      });

      // Step 5: Update database
      await step.run('update-database', async () => {
        await supabase
          .from('video_jobs')
          .update({
            video_url: finalUrl,
            status: 'completed',
          })
          .eq('generation_id', generationId)
          .eq('script_index', scriptIndex);

        // Check if all videos are complete
        const { data: jobs } = await supabase
          .from('video_jobs')
          .select('*')
          .eq('generation_id', generationId);

        const allComplete = jobs?.every((j) => j.video_url);

        if (allComplete) {
          // Update generation status
          const videos = jobs?.map((j) => ({
            scriptIndex: j.script_index,
            frameUrl: j.frame_url,
            videoUrl: j.video_url,
            duration: j.duration_seconds,
            voiceoverUrl: j.voiceover_url,
            captions: j.captions,
          }));

          await supabase
            .from('generations')
            .update({
              status: 'completed',
              videos,
              completed_at: new Date().toISOString(),
            })
            .eq('id', generationId);

          // Get generation to check if concierge
          const { data: generation } = await supabase
            .from('generations')
            .select('mode, credit_transaction_id')
            .eq('id', generationId)
            .single();

          // Confirm credits
          if (generation?.credit_transaction_id) {
            await CreditService.confirmCredits(generation.credit_transaction_id);
          }

          // Trigger strategy generation for Concierge
          if (generation?.mode === 'concierge') {
            await inngest.send({
              name: 'strategy/generate',
              data: { generationId },
            });
          }
        }
      });

      // Cleanup temp files
      const fs = require('fs');
      fs.unlinkSync(rawVideoPath);
      fs.unlinkSync(trimmedPath);
      if (finalPath !== trimmedPath) {
        fs.unlinkSync(finalPath);
      }

      return { success: true, videoUrl: finalUrl };
    } catch (error) {
      // Mark video job as failed
      await supabase
        .from('video_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('generation_id', generationId)
        .eq('script_index', scriptIndex);

      throw error;
    }
  }
);

// ============================================
// STRATEGY GENERATION FUNCTION
// ============================================

/**
 * Generate strategy brief for Concierge mode
 */
export const generateStrategy = inngest.createFunction(
  {
    id: 'generate-strategy',
    name: 'Generate Strategy Brief',
    retries: 2,
  },
  { event: 'strategy/generate' },
  async ({ event, step }) => {
    const { generationId } = event.data;

    await step.run('generate-strategy', async () => {
      await Pipeline.generateStrategy(generationId);
    });

    return { success: true, generationId };
  }
);

// ============================================
// WEBHOOK HANDLERS (Legacy support)
// ============================================

/**
 * Handle kie.ai video completion webhook
 * Kept for backward compatibility
 */
export const handleKieCompleted = inngest.createFunction(
  {
    id: 'handle-kie-completed',
    name: 'Handle Video Completed',
  },
  { event: 'webhook/kie-completed' },
  async ({ event }) => {
    const { generationId, scriptIndex, videoUrl, duration } = event.data;

    // Get generation to check if captions enabled
    const supabase = getAdminClient();

    // Get video job to find voiceover URL
    const { data: job } = await supabase
      .from('video_jobs')
      .select('voiceover_url')
      .eq('generation_id', generationId)
      .eq('script_index', scriptIndex)
      .single();

    const { data: generation } = await supabase
      .from('generations')
      .select('captions_enabled')
      .eq('id', generationId)
      .single();

    // Trigger video processing
    await inngest.send({
      name: 'video/process',
      data: {
        generationId,
        scriptIndex,
        videoUrl,
        voiceoverUrl: job?.voiceover_url,
        captionsEnabled: generation?.captions_enabled ?? false,
      },
    });

    return { success: true };
  }
);

/**
 * Handle kie.ai video failure webhook
 * Kept for backward compatibility
 */
export const handleKieFailed = inngest.createFunction(
  {
    id: 'handle-kie-failed',
    name: 'Handle Video Failed',
  },
  { event: 'webhook/kie-failed' },
  async ({ event }) => {
    const { generationId, scriptIndex, error } = event.data;

    await Pipeline.webhooks.handleVideoFailed(generationId, scriptIndex, error);

    // Get generation to refund credits
    const supabase = getAdminClient();
    const { data: generation } = await supabase
      .from('generations')
      .select('credit_transaction_id')
      .eq('id', generationId)
      .single();

    if (generation?.credit_transaction_id) {
      await CreditService.refundCredits(
        generation.credit_transaction_id,
        `Video generation failed: ${error}`
      );
    }

    return { success: true };
  }
);

// ============================================
// SINGLE VIDEO GENERATION (for DIY mode)
// ============================================

/**
 * Generate a single video for DIY mode
 * Uses the same Kie.ai services but with more user control
 */
export const generateSingleVideo = inngest.createFunction(
  {
    id: 'generate-single-video',
    name: 'Generate Single Video',
    retries: 2,
  },
  { event: 'generation/single' },
  async ({ event, step }) => {
    const {
      generationId,
      userId,
      script,
      frameUrl,
      voiceId,
      creditTransactionId,
      model = 'sora-2',
    } = event.data;

    const supabase = getAdminClient();

    try {
      // Step 1: Generate voiceover
      const voiceover = await step.run('generate-voiceover', async () => {
        if (!KieService.isConfigured()) {
          throw new Error('KIE_AI_API_KEY not configured');
        }

        return KieService.generateVoiceoverSync({
          model: 'elevenlabs/flash',
          text: script,
          voiceId,
        });
      });

      // Step 2: Generate video
      const video = await step.run('generate-video', async () => {
        const videoPrompt = KieService.buildVideoPrompt(
          script,
          'Person speaking to camera in UGC style'
        );

        return KieService.generateVideoSync({
          model: model as 'sora-2' | 'sora-2-pro' | 'veo-3',
          prompt: videoPrompt,
          imageUrl: frameUrl,
          duration: 5,
          aspectRatio: '9:16',
        });
      });

      // Step 3: Get word timestamps for captions
      const captions = await step.run('generate-captions', async () => {
        const sttResult = await KieService.getWordTimestampsSync({
          model: 'elevenlabs/scribe-v1',
          audioUrl: voiceover.url,
          languageCode: 'en',
        });

        return KieService.filterWordTimestamps(sttResult).map((w) => ({
          text: w.text,
          start: w.start,
          end: w.end,
        }));
      });

      // Step 4: Update database
      await step.run('update-database', async () => {
        await supabase
          .from('video_jobs')
          .upsert({
            generation_id: generationId,
            script_index: 0,
            status: 'completed',
            frame_url: frameUrl,
            raw_video_url: video.url,
            video_url: video.url,
            voiceover_url: voiceover.url,
            duration_seconds: video.duration,
            captions,
            completed_at: new Date().toISOString(),
          });

        await supabase
          .from('generations')
          .update({
            status: 'completed',
            videos: [
              {
                scriptIndex: 0,
                frameUrl,
                videoUrl: video.url,
                duration: video.duration,
                voiceoverUrl: voiceover.url,
                captions,
              },
            ],
            completed_at: new Date().toISOString(),
          })
          .eq('id', generationId);
      });

      // Step 5: Confirm credits
      await step.run('confirm-credits', async () => {
        if (creditTransactionId) {
          await CreditService.confirmCredits(creditTransactionId);
        }
      });

      return {
        success: true,
        generationId,
        videoUrl: video.url,
        voiceoverUrl: voiceover.url,
        captionCount: captions.length,
      };
    } catch (error) {
      // Refund credits on failure
      await step.run('refund-credits', async () => {
        if (creditTransactionId) {
          await CreditService.refundCredits(
            creditTransactionId,
            `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      });

      // Mark as failed
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', generationId);

      throw error;
    }
  }
);

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export const functions = [
  generateVideo,
  generateSpotlight,
  processVideo,
  generateStrategy,
  handleKieCompleted,
  handleKieFailed,
  generateSingleVideo,
];
