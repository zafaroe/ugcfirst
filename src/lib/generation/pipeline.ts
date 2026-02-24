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
import { GeminiService, generateFramePrompt, generateProductFrame } from '@/lib/ai/gemini';
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
} from '@/lib/ai/kie';
import { uploadFrame, uploadVideo, uploadSubtitledVideo, R2Paths, getSignedDownloadUrl, getPublicUrl, uploadToR2, downloadVideo } from '@/lib/r2';
import { burnSubtitles, cleanupTempFile, extractAudio } from '@/lib/ffmpeg';
import { generateASSFile } from '@/lib/subtitles/ass-generator';
import { WordTimestamp } from '@/lib/subtitles/stt';
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

  const frames: GeneratedFrame[] = [];

  // Generate frames for each script
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    console.log(`[Pipeline] Generating frame ${i + 1}/${scripts.length}...`);

    // Generate frame prompt metadata (for logging/debugging)
    const framePromptData = await generateFramePrompt(
      productImageUrl,
      i,
      script.fullScript
    );

    let imageBuffer: Buffer | undefined;

    // Try Gemini image-to-image first (product image visible)
    try {
      console.log(`[Pipeline] Using Gemini for frame ${i} (image-to-image)...`);
      const geminiResult = await generateProductFrame(productImageUrl);
      imageBuffer = Buffer.from(geminiResult.imageBase64, 'base64');
      console.log(`[Pipeline] Gemini frame ${i} generated successfully`);
    } catch (geminiError) {
      console.error(`[Pipeline] Gemini frame generation failed for ${i}:`, geminiError);

      // Fallback to Kie.ai nano-banana (text-to-image)
      if (KieService.isConfigured()) {
        console.log(`[Pipeline] Falling back to Kie.ai nano-banana for frame ${i}...`);
        try {
          const toneStyle = (persona.tone as 'casual' | 'professional' | 'energetic') || 'casual';
          const imagePrompt = buildFramePrompt(productName, toneStyle);

          const imageResult = await KieService.generateImageSync(
            {
              model: 'nano-banana-pro',
              prompt: imagePrompt,
              aspectRatio: '9:16',
            },
            (task: KieTask<ImageResult>) => {
              console.log(`Frame ${i} progress: ${task.status} (${task.progress || 0}%)`);
            }
          );

          // Download the image from Kie.ai
          imageBuffer = await KieService.downloadFile(imageResult.url);
          console.log(`[Pipeline] Kie.ai fallback frame ${i} generated successfully`);
        } catch (kieError) {
          console.error(`[Pipeline] Kie.ai fallback also failed for frame ${i}:`, kieError);
          throw new Error(`Failed to generate frame ${i}: Both Gemini and Kie.ai failed`);
        }
      } else {
        throw new Error(`Failed to generate frame ${i}: Gemini failed and Kie.ai not configured`);
      }
    }

    frames.push({
      scriptIndex: i,
      prompt: framePromptData,
      imageBuffer,
    });
  }

  return frames;
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
  // Temp file path: os.tmpdir()/vidnary_buffer_{generationId}_{scriptIndex}.mp4
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
      tempVideoPath = path.join(os.tmpdir(), `vidnary_subtitle_input_${generationId}_${video.scriptIndex}_${Date.now()}.mp4`);
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
      const words = KieService.filterWordTimestamps(sttResult).map((w) => ({
        text: w.text,
        start: w.start,
        end: w.end,
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
 */
export async function stepBurnSubtitles(
  generationId: string,
  videos: CompletedVideo[],
  subtitles: GeneratedSubtitle[]
): Promise<BurnedSubtitleVideo[]> {
  await updateGenerationStatus(generationId, 'captioning', 9); // DB constraint expects 'captioning'

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
      const tempVideoPath = path.join(os.tmpdir(), `vidnary_burn_input_${generationId}_${video.scriptIndex}_${Date.now()}.mp4`);
      fs.writeFileSync(tempVideoPath, videoBuffer);
      tempFiles.push(tempVideoPath); // Clean up after processing

      // 2. Convert subtitle words to WordTimestamp format
      const wordTimestamps: WordTimestamp[] = subtitle.words.map((w) => ({
        word: w.text,
        start: w.start,
        end: w.end,
      }));

      // 3. Generate ASS file
      const assPath = path.join(os.tmpdir(), `vidnary_subtitles_${generationId}_${video.scriptIndex}.ass`);
      generateASSFile(wordTimestamps, assPath, {
        wordsPerGroup: 3,
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
  webhookBaseUrl?: string; // Optional - only needed for webhook-based flow
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
  } = input;

  try {
    // Mark as started
    const supabase = getAdminClient();
    await supabase
      .from('generations')
      .update({ started_at: new Date().toISOString() })
      .eq('id', generationId);

    // Step 1: Analyze product
    const persona = await stepAnalyzeProduct(
      generationId,
      productImageUrl,
      productName
    );

    // Step 2: Generate scripts (uses intelligent approach selection)
    const scripts = await stepGenerateScripts(
      generationId,
      persona,
      productName,
      input.productDescription,
      input.productFeatures
    );

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

    // Step 5: SKIPPED - Video models (Sora 2) generate audio natively
    // No need for separate TTS voiceover generation

    // Step 6: Create video jobs (no voiceovers - video model handles audio)
    const videoJobs = await stepCreateVideoJobs(
      generationId,
      scripts,
      frames,
      frameUrls
      // voiceovers parameter omitted - video model generates audio
    );

    // Step 7: Poll for video completion and upload to R2
    const videos = await stepPollVideoCompletion(
      generationId,
      videoJobs,
      (scriptIndex, progress) => {
        console.log(`Video ${scriptIndex}: ${progress}% complete`);
      }
    );

    // Step 8: Generate subtitles from video audio
    console.log(`[Pipeline] Generating subtitles for ${videos.length} videos, subtitlesEnabled=${subtitlesEnabled}`);
    const subtitles = await stepGenerateSubtitles(generationId, videos);
    console.log(`[Pipeline] Generated ${subtitles.length} subtitle sets:`, subtitles.map(s => ({ scriptIndex: s.scriptIndex, wordCount: s.words?.length || 0 })));

    // Step 9: Burn subtitles into videos (if enabled)
    let burnedSubtitles: BurnedSubtitleVideo[] = [];
    if (subtitlesEnabled && subtitles.length > 0) {
      console.log('[Pipeline] Burning subtitles into videos...');
      burnedSubtitles = await stepBurnSubtitles(generationId, videos, subtitles);
      console.log(`[Pipeline] Burned subtitles for ${burnedSubtitles.length} videos:`, burnedSubtitles.map(bs => ({ scriptIndex: bs.scriptIndex, key: bs.videoSubtitledR2Key })));
    } else {
      console.log(`[Pipeline] Skipping subtitle burning: subtitlesEnabled=${subtitlesEnabled}, subtitles.length=${subtitles.length}`);
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
    if (mode === 'concierge') {
      try {
        console.log('[Pipeline] Generating strategy brief...');
        strategyBrief = await generateStrategy(generationId);
        console.log('[Pipeline] Strategy brief generated successfully');
      } catch (error) {
        console.error('[Pipeline] Strategy generation failed:', error);
        // Don't fail the entire generation - video is still usable
      }
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
    // Backward compatibility
    generateCaptions: stepGenerateSubtitles,
    burnCaptions: stepBurnSubtitles,
  },
  webhooks: {
    handleVideoComplete,
    handleVideoFailed,
  },
  updateStatus: updateGenerationStatus,
  generateStrategy,
};
