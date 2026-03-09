import { inngest, Events } from '../client';
import { Pipeline } from '@/lib/generation/pipeline';
import { CreditService } from '@/services/credits';
import { getAdminClient } from '@/lib/supabase';
import { FFmpegService } from '@/lib/ffmpeg';
import { KieService } from '@/lib/ai/kie';
import { ASSGenerator } from '@/lib/subtitles/ass-generator';
import { uploadVideo, downloadFromR2 } from '@/lib/r2';
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
      existingPersona, // Optional - for regeneration, skip analysis and reuse persona
      customScript,
      endScreenEnabled,
      endScreenCtaText,
      endScreenBrandText,
      // Spotlight-specific fields
      spotlightCategoryId,
      spotlightStyleId,
      spotlightDuration,
    } = event.data;

    try {
      // Step 1: Run the full pipeline (now includes polling and caption burning)
      const result = await step.run('run-pipeline', async () => {
        return Pipeline.run({
          generationId,
          productName,
          productImageUrl,
          templateId,
          mode,
          voiceId,
          captionsEnabled: captionsEnabled ?? false,
          applyWatermark: applyWatermark ?? false,
          existingPersona, // Skip analysis if provided (regeneration)
          customScript,
          endScreenEnabled,
          endScreenCtaText,
          endScreenBrandText,
          // Spotlight-specific fields
          spotlightCategoryId,
          spotlightStyleId,
          spotlightDuration,
        });
      });

      // Step 2: Store subtitle words in DB (separate step = checkpoint after pipeline)
      if (captionsEnabled && result.videos.length > 0 && result.subtitles) {
        await step.run('store-subtitle-data', async () => {
          const supabase = getAdminClient();

          for (let i = 0; i < result.videos.length; i++) {
            const video = result.videos[i];
            const subtitle = result.subtitles[i];

            // If we have subtitles, update the video job
            if (subtitle && subtitle.words.length > 0) {
              await supabase
                .from('video_jobs')
                .update({
                  captions: subtitle.words, // DB field still named captions for backward compat
                })
                .eq('generation_id', generationId)
                .eq('script_index', video.scriptIndex);
            }
          }
        });
      }

      // Step 3: Confirm credits on success
      await step.run('confirm-credits', async () => {
        if (creditTransactionId) {
          await CreditService.confirmCredits(creditTransactionId);
        }
      });

      // Return success (voiceovers removed - video models generate audio natively)
      return {
        success: true,
        generationId,
        scriptsGenerated: result.scripts.length,
        videosGenerated: result.videos.length,
        subtitlesGenerated: result.subtitles?.filter((s) => s.words.length > 0).length || 0,
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
  processVideo,
  generateStrategy,
  handleKieCompleted,
  handleKieFailed,
  generateSingleVideo,
];
