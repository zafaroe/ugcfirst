import { inngest, Events } from '../client';
import { Pipeline } from '@/lib/generation/pipeline';
import {
  stepAnalyzeProduct,
  stepGenerateScripts,
  stepUseCustomScript,
  stepGenerateFrames,
  stepUploadFrames,
  stepGenerateVideoWithFallback,
  stepGenerateSubtitles,
  stepBurnSubtitles,
  stepAddWatermark,
  stepGenerateComposite,
  stepAnimateWithVeo31,
  stepGenerateEndScreen,
  stepConcatenateWithEndScreen,
  updateGenerationStatus,
  generateStrategy as generateStrategyBrief,
  GeneratedFrame,
  CompletedVideo,
  GeneratedSubtitle,
  BurnedSubtitleVideo,
} from '@/lib/generation/pipeline';
import { CreditService } from '@/services/credits';
import { confirmCredits, refundCredits } from '@/services/credits';
import { getAdminClient } from '@/lib/supabase';
import { FFmpegService } from '@/lib/ffmpeg';
import { KieService } from '@/lib/ai/kie';
import { ASSGenerator } from '@/lib/subtitles/ass-generator';
import { uploadVideo, downloadFromR2 } from '@/lib/r2';
import { PersonaProfile, GenerationVideo, GeneratedScript } from '@/types/generation';
import * as path from 'path';
import * as os from 'os';

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

/**
 * Video Generation Background Job
 *
 * This function handles the full video generation pipeline:
 * 1. Analyze product (GPT-4o Vision)
 * 2. Generate scripts (Gemini 2.5 Pro)
 * 3. Generate frames via Kie.ai (nano-banana-pro)
 * 4. Upload frames to R2
 * 5. Generate voiceovers via Kie.ai (elevenlabs/flash)
 * 6. Create video jobs via Kie.ai (sora-2)
 * 7. Poll for video completion
 * 8. Generate captions via Kie.ai STT (elevenlabs/scribe)
 * 9. Generate strategy (Concierge only)
 *
 * All async tasks use polling instead of webhooks.
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

    // Spotlight mode should use the dedicated generateSpotlight function
    if (mode === 'spotlight') {
      throw new Error('Spotlight mode should use generation/spotlight-start event, not generation/start');
    }

    try {
      // ══════════════════════════════════════════════════════════════
      // STEP 1: ANALYZE PRODUCT
      // ══════════════════════════════════════════════════════════════
      const persona = await step.run('analyze-product', async () => {
        const supabase = getAdminClient();
        await supabase
          .from('generations')
          .update({ started_at: new Date().toISOString() })
          .eq('id', generationId);

        if (existingPersona) {
          console.log('[Pipeline] Reusing existing persona (regeneration)');
          await updateGenerationStatus(generationId, 'analyzing', 1, {
            persona_profile: existingPersona,
          } as any);
          return existingPersona as PersonaProfile;
        }

        return stepAnalyzeProduct(generationId, productImageUrl, productName);
      });

      if (mode === 'diy') {
        // ══════════════════════════════════════════════════════════════
        // DIY PIPELINE (Veo 3.1 + Compositing)
        // ══════════════════════════════════════════════════════════════

        // Step 2: Use custom script
        const scripts = await step.run('diy-use-script', async () => {
          return stepUseCustomScript(generationId, customScript, persona, productName);
        });

        // Step 3: Generate composite image
        const composite = await step.run('diy-generate-composite', async () => {
          return stepGenerateComposite(
            generationId,
            productImageUrl,
            productName,
            persona,
            templateId
          );
        });

        // Step 4: Animate with Veo 3.1
        const diyVideo = await step.run('diy-animate', async () => {
          return stepAnimateWithVeo31(
            generationId,
            composite.compositeImageUrl,
            scripts[0],
            productName,
            templateId
          );
        });

        // Build CompletedVideo for subtitle/watermark steps
        const videos: CompletedVideo[] = [
          {
            scriptIndex: 0,
            videoR2Key: diyVideo.videoR2Key,
            videoSignedUrl: diyVideo.videoSignedUrl,
            duration: diyVideo.duration,
          },
        ];

        // Step 5: Generate and burn subtitles (if enabled)
        const subtitlesEnabled = captionsEnabled ?? false;
        let subtitleData = { subtitles: [] as GeneratedSubtitle[], burnedSubtitles: [] as BurnedSubtitleVideo[] };

        if (subtitlesEnabled) {
          subtitleData = await step.run('diy-subtitles', async () => {
            const subs = await stepGenerateSubtitles(generationId, videos);
            let burned: BurnedSubtitleVideo[] = [];
            if (subs.length > 0 && subs[0].words.length > 0) {
              burned = await stepBurnSubtitles(generationId, videos, subs);
            }
            return { subtitles: subs, burnedSubtitles: burned };
          });
        }

        // Step 6: Watermark (if free tier)
        if (applyWatermark) {
          await step.run('diy-watermark', async () => {
            await stepAddWatermark(generationId, videos, subtitleData.burnedSubtitles);
          });
        }

        // Step 7: End screen (if enabled)
        let finalVideoR2Key = subtitleData.burnedSubtitles[0]?.videoSubtitledR2Key || diyVideo.videoR2Key;
        let finalDuration = diyVideo.duration;

        if (endScreenEnabled && endScreenCtaText) {
          const endScreenResult = await step.run('diy-end-screen', async () => {
            const endScreen = await stepGenerateEndScreen(
              generationId,
              productImageUrl,
              productName,
              endScreenCtaText,
              endScreenBrandText
            );

            const videoToConcat = subtitleData.burnedSubtitles[0]?.videoSubtitledR2Key || diyVideo.videoR2Key;
            const concatResult = await stepConcatenateWithEndScreen(
              generationId,
              videoToConcat,
              endScreen.videoR2Key
            );

            return concatResult;
          });

          finalVideoR2Key = endScreenResult.videoR2Key;
          finalDuration = endScreenResult.duration;
        }

        // Step 8: Finalize
        await step.run('diy-finalize', async () => {
          const subtitledKeyMap = new Map(
            subtitleData.burnedSubtitles.map((bs) => [bs.scriptIndex, bs.videoSubtitledR2Key])
          );

          const generationVideos: GenerationVideo[] = [
            {
              scriptIndex: 0,
              frameUrl: composite.compositeImageUrl,
              videoR2Key: finalVideoR2Key,
              videoSubtitledR2Key: subtitledKeyMap.get(0),
              duration: finalDuration,
              subtitleWords: subtitleData.subtitles[0]?.words,
            },
          ];

          await updateGenerationStatus(generationId, 'completed', 10, {
            videos: generationVideos,
            strategy_brief: null,
          } as any);

          if (creditTransactionId) {
            await confirmCredits(creditTransactionId);
          }
        });

        return {
          success: true,
          generationId,
          scriptsGenerated: scripts.length,
          videosGenerated: 1,
          subtitlesGenerated: subtitleData.subtitles.filter((s) => s.words.length > 0).length,
        };
      } else {
        // ══════════════════════════════════════════════════════════════
        // CONCIERGE PIPELINE (Sora 2 with 5-tier fallback)
        // ══════════════════════════════════════════════════════════════

        // Step 2: Generate or use custom script
        const scripts = await step.run('generate-scripts', async () => {
          if (customScript && customScript.trim().length > 0) {
            console.log('[Pipeline:Concierge] Using pre-approved custom script');
            return stepUseCustomScript(generationId, customScript, persona, productName);
          }
          console.log('[Pipeline:Concierge] Generating scripts from scratch');
          return stepGenerateScripts(generationId, persona, productName);
        });

        // Step 3: Generate frames
        const frames = await step.run('generate-frames', async () => {
          return stepGenerateFrames(generationId, productImageUrl, productName, scripts, persona);
        });

        // Step 4: Upload frames to R2
        // We pass frames directly since stepUploadFrames handles them
        const uploadResult = await step.run('upload-frames', async () => {
          const urls = await stepUploadFrames(generationId, frames as GeneratedFrame[]);
          // Build frame data for video generation (just prompts, no buffers)
          const frameData = frames.map((frame, i) => ({
            scriptIndex: frame.scriptIndex,
            prompt: frame.prompt,
            imageUrl: urls[i],
          }));
          return { urls, frameData };
        });

        const frameUrls = uploadResult.urls;

        // Step 5: Generate video with 5-tier fallback (longest step ~120-300s)
        const videos = await step.run('generate-video', async () => {
          // Reconstruct frames with just the data needed for video generation
          const framesForVideo = uploadResult.frameData.map((fd) => ({
            scriptIndex: fd.scriptIndex,
            prompt: fd.prompt,
            imageUrl: fd.imageUrl,
          })) as GeneratedFrame[];
          return stepGenerateVideoWithFallback(generationId, scripts as GeneratedScript[], framesForVideo, frameUrls);
        });

        // Step 6: Generate and burn subtitles (if enabled)
        const subtitlesEnabled = captionsEnabled ?? false;
        let subtitleData = { subtitles: [] as GeneratedSubtitle[], burnedSubtitles: [] as BurnedSubtitleVideo[] };

        if (subtitlesEnabled) {
          subtitleData = await step.run('generate-subtitles', async () => {
            console.log(`[Pipeline] Generating subtitles for ${videos.length} videos...`);
            const subs = await stepGenerateSubtitles(generationId, videos);
            let burned: BurnedSubtitleVideo[] = [];
            if (subs.length > 0) {
              burned = await stepBurnSubtitles(generationId, videos, subs);
            }
            return { subtitles: subs, burnedSubtitles: burned };
          });
        }

        // Step 7: Watermark (if free tier)
        if (applyWatermark) {
          await step.run('add-watermark', async () => {
            await stepAddWatermark(generationId, videos, subtitleData.burnedSubtitles);
          });
        }

        // Step 8: Generate strategy (Concierge only)
        const strategyBrief = await step.run('concierge-generate-strategy', async () => {
          try {
            console.log('[Pipeline] Generating strategy brief...');
            return await generateStrategyBrief(generationId);
          } catch (error) {
            console.error('[Pipeline] Strategy generation failed:', error);
            return null;
          }
        });

        // Step 9: Finalize — mark complete + confirm credits
        await step.run('finalize', async () => {
          const subtitledKeyMap = new Map(
            subtitleData.burnedSubtitles.map((bs) => [bs.scriptIndex, bs.videoSubtitledR2Key])
          );

          const generationVideos: GenerationVideo[] = videos.map((v, i) => ({
            scriptIndex: v.scriptIndex,
            frameUrl: frameUrls[i],
            videoR2Key: v.videoR2Key,
            videoSubtitledR2Key: subtitledKeyMap.get(v.scriptIndex),
            duration: v.duration,
            subtitleWords: subtitleData.subtitles[i]?.words,
          }));

          await updateGenerationStatus(generationId, 'completed', 10, {
            videos: generationVideos,
            strategy_brief: strategyBrief,
          } as any);

          if (creditTransactionId) {
            await confirmCredits(creditTransactionId);
          }
        });

        // Step 10: Store subtitle data in DB
        if (subtitlesEnabled && videos.length > 0 && subtitleData.subtitles.length > 0) {
          await step.run('store-subtitle-data', async () => {
            const supabase = getAdminClient();
            for (let i = 0; i < videos.length; i++) {
              const video = videos[i];
              const subtitle = subtitleData.subtitles[i];
              if (subtitle && subtitle.words.length > 0) {
                await supabase
                  .from('video_jobs')
                  .update({ captions: subtitle.words })
                  .eq('generation_id', generationId)
                  .eq('script_index', video.scriptIndex);
              }
            }
          });
        }

        return {
          success: true,
          generationId,
          scriptsGenerated: scripts.length,
          videosGenerated: videos.length,
          subtitlesGenerated: subtitleData.subtitles.filter((s) => s.words.length > 0).length,
        };
      }
    } catch (error) {
      // Refund credits on failure
      await step.run('refund-credits', async () => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Mark generation as failed
        await updateGenerationStatus(generationId, 'failed', -1, {
          error_message: errorMessage,
        } as any);

        // Refund credits
        if (creditTransactionId) {
          await refundCredits(creditTransactionId, `Generation failed: ${errorMessage}`);
        }
      });

      throw error;
    }
  }
);

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
