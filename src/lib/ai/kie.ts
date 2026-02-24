/**
 * Kie.ai Unified Gateway Client
 *
 * Kie.ai is an AI model aggregator providing unified API access to:
 * - Video generation (Sora 2, Sora 2 Pro, Veo 3)
 * - Image generation (Nano Banana, Flux)
 * - Text-to-Speech (ElevenLabs Multilingual V2)
 * - Speech-to-Text (ElevenLabs Speech-to-Text)
 *
 * Single API key provides access to all models.
 * All generation tasks are async: Submit → Poll → Get result
 *
 * API Documentation: https://docs.kie.ai
 *
 * UPDATED: 2026-02 - New unified API structure using /jobs/createTask
 */

// ============================================
// CONFIGURATION
// ============================================

const KIE_API_KEY = process.env.KIE_AI_API_KEY;
const KIE_API_BASE_URL = 'https://api.kie.ai/api/v1';

if (!KIE_API_KEY) {
  console.warn('KIE_AI_API_KEY not configured. Video/Audio generation will be disabled.');
}

// ============================================
// NEW API MODEL NAMES
// ============================================

const KIE_MODELS = {
  // Image generation
  IMAGE_NANO_BANANA: 'google/nano-banana',

  // Video generation
  VIDEO_SORA_2: 'sora-2-text-to-video',
  VIDEO_SORA_2_PRO: 'sora-2-pro-text-to-video',
  VIDEO_SORA_2_IMAGE_TO_VIDEO: 'sora-2-image-to-video',

  // Text-to-Speech
  TTS_ELEVENLABS: 'elevenlabs/text-to-speech-multilingual-v2',

  // Speech-to-Text
  STT_ELEVENLABS: 'elevenlabs/speech-to-text',
} as const;

// ============================================
// TYPES - Task Management
// ============================================

export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'pending';

export interface KieTask<T = unknown> {
  taskId: string;
  status: TaskStatus;
  result?: T;
  error?: string;
  progress?: number;
  createdAt?: string;
  completedAt?: string;
}

// New API response format - taskId is nested inside data object
interface CreateTaskApiResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    recordId?: string;
  };
}

// API response for recordInfo/getTask - data is nested inside "data" wrapper
interface RecordInfoApiResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    model?: string;
    state: string;  // Note: Kie.ai uses "state" not "status", values: "waiting", "success", "failed"
    param?: string; // Stringified JSON of input parameters
    resultJson?: string; // Stringified JSON containing the result (e.g., {"resultUrls":["https://..."]})
    failCode?: number | null;
    failMsg?: string | null;
    costTime?: number;
    completeTime?: number;
    createTime?: number;
    // Legacy fields (may still be used by some endpoints)
    output?: {
      url?: string;
      images?: Array<{ url: string }>;
      audio_url?: string;
      text?: string;
      words?: Array<{
        text: string;
        start: number;
        end: number;
        type: string;
        speaker_id?: string;
      }>;
      duration?: number;
      width?: number;
      height?: number;
    };
    error?: string;
    progress?: number;
    created_at?: string;
    completed_at?: string;
  };
}

// ============================================
// TYPES - Video Generation
// ============================================

export type VideoModel = 'sora-2' | 'sora-2-pro' | 'veo-3';

export interface VideoGenerateRequest {
  model?: VideoModel;
  prompt: string;
  imageUrl?: string; // For image-to-video
  duration?: number; // 10 or 15 seconds
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

export interface VideoResult {
  url: string;
  duration: number;
  width: number;
  height: number;
}

// ============================================
// TYPES - Image Generation
// ============================================

export type ImageModel = 'nano-banana-pro' | 'flux';

export interface ImageGenerateRequest {
  model?: ImageModel;
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

export interface ImageResult {
  url: string;
  width: number;
  height: number;
}

// ============================================
// TYPES - Text-to-Speech (TTS)
// ============================================

export type TTSModel = 'elevenlabs/flash' | 'elevenlabs/multilingual-v2';

export interface TTSRequest {
  model?: TTSModel;
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface TTSResult {
  url: string;
  duration: number;
  format: string;
}

// ============================================
// TYPES - Speech-to-Text (STT)
// ============================================

export type STTModel = 'elevenlabs/scribe-v1';

export interface STTRequest {
  model?: STTModel;
  audioUrl: string;
  languageCode?: string;
}

export interface STTWord {
  text: string;
  start: number; // seconds (from ElevenLabs API) - converted to ms in stt.ts
  end: number; // seconds (from ElevenLabs API) - converted to ms in stt.ts
  type: 'word' | 'spacing';
  speaker_id?: string;
}

export interface STTResult {
  text: string;
  words: STTWord[];
  languageCode: string;
  duration: number;
}

// ============================================
// CORE API CLIENT
// ============================================

async function kieRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, unknown>
): Promise<T> {
  if (!KIE_API_KEY) {
    throw new Error('KIE_AI_API_KEY not configured');
  }

  const url = `${KIE_API_BASE_URL}${endpoint}`;
  console.log(`[Kie.ai] ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Kie.ai] Error ${response.status}: ${errorText}`);
    throw new Error(`Kie.ai API error: ${response.status} - ${errorText}`);
  }

  const json = await response.json();
  // Log full response for success states to debug result extraction
  const jsonStr = JSON.stringify(json);
  if (json.data?.state === 'success' || json.data?.state === 'completed') {
    console.log(`[Kie.ai] COMPLETED Response (full):`, jsonStr);
  } else {
    console.log(`[Kie.ai] Response:`, jsonStr.substring(0, 300));
  }
  return json;
}

// ============================================
// UNIFIED TASK CREATION
// ============================================

/**
 * Create a task using the unified /jobs/createTask endpoint
 */
async function createTask(
  model: string,
  input: Record<string, unknown>
): Promise<string> {
  const response = await kieRequest<CreateTaskApiResponse>('/jobs/createTask', 'POST', {
    model,
    input,
  });

  // taskId is nested inside the data object
  if (!response.data?.taskId) {
    console.error('[Kie.ai] createTask failed - no taskId in response');
    console.error('[Kie.ai] Full response:', JSON.stringify(response, null, 2));
    console.error('[Kie.ai] Request was:', JSON.stringify({ model, input }, null, 2));
    throw new Error(`Kie.ai createTask failed: no taskId in response. Response code: ${response.code}, msg: ${response.msg}`);
  }

  console.log(`[Kie.ai] Task created: ${response.data.taskId} for model: ${model}`);
  return response.data.taskId;
}

// ============================================
// TASK STATUS & POLLING
// ============================================

/**
 * Map Kie.ai status strings to our TaskStatus type
 */
function mapStatus(status: string): TaskStatus {
  const statusMap: Record<string, TaskStatus> = {
    'pending': 'queued',
    'queued': 'queued',
    'waiting': 'queued',  // Kie.ai uses "waiting" for queued tasks
    'processing': 'processing',
    'running': 'processing',
    'completed': 'completed',
    'success': 'completed',
    'failed': 'failed',
    'fail': 'failed',     // Kie.ai returns "fail" not "failed"
    'error': 'failed',
  };
  return statusMap[status.toLowerCase()] || 'processing';
}

/**
 * Get the status of an image task
 */
async function getImageTaskStatus(taskId: string): Promise<KieTask<ImageResult>> {
  const response = await kieRequest<RecordInfoApiResponse>(
    `/playground/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    'GET'
  );

  const status = mapStatus(response.data.state);
  let result: ImageResult | undefined;

  if (status === 'completed') {
    let imageUrl: string | undefined;

    // Primary: Extract from resultJson (new API format)
    if (response.data.resultJson) {
      try {
        const resultData = JSON.parse(response.data.resultJson);
        imageUrl = resultData.resultUrls?.[0] || resultData.url;
        console.log('[Kie.ai] Image result extracted from resultJson:', imageUrl);
      } catch (e) {
        console.error('[Kie.ai] Failed to parse resultJson:', e);
      }
    }

    // Fallback: Legacy output format
    if (!imageUrl && response.data.output) {
      imageUrl = response.data.output.url || response.data.output.images?.[0]?.url;
      if (imageUrl) {
        console.log('[Kie.ai] Image result extracted from output:', imageUrl);
      }
    }

    if (imageUrl) {
      result = {
        url: imageUrl,
        width: response.data.output?.width || 1024,
        height: response.data.output?.height || 1024,
      };
    } else {
      console.error('[Kie.ai] Task completed but no image URL found in response:', JSON.stringify(response.data));
    }
  }

  return {
    taskId,
    status,
    result,
    error: response.data.error || response.data.failMsg || undefined,
    progress: response.data.progress,
    createdAt: response.data.created_at || (response.data.createTime ? new Date(response.data.createTime).toISOString() : undefined),
    completedAt: response.data.completed_at || (response.data.completeTime ? new Date(response.data.completeTime).toISOString() : undefined),
  };
}

/**
 * Get the status of a video task
 */
async function getVideoTaskStatus(taskId: string): Promise<KieTask<VideoResult>> {
  // Try the jobs endpoint first
  const response = await kieRequest<RecordInfoApiResponse>(
    `/playground/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    'GET'
  );

  const status = mapStatus(response.data.state);
  let result: VideoResult | undefined;

  if (status === 'completed') {
    let videoUrl: string | undefined;

    // Primary: Extract from resultJson (new API format)
    if (response.data.resultJson) {
      try {
        const resultData = JSON.parse(response.data.resultJson);
        videoUrl = resultData.resultUrls?.[0] || resultData.url;
        console.log('[Kie.ai] Video result extracted from resultJson:', videoUrl);
      } catch (e) {
        console.error('[Kie.ai] Failed to parse resultJson:', e);
      }
    }

    // Fallback: Legacy output format
    if (!videoUrl && response.data.output?.url) {
      videoUrl = response.data.output.url;
      console.log('[Kie.ai] Video result extracted from output:', videoUrl);
    }

    if (videoUrl) {
      result = {
        url: videoUrl,
        duration: response.data.output?.duration || 10,
        width: response.data.output?.width || 1080,
        height: response.data.output?.height || 1920,
      };
    } else {
      console.error('[Kie.ai] Video task completed but no URL found in response:', JSON.stringify(response.data));
    }
  }

  return {
    taskId,
    status,
    result,
    error: response.data.error || response.data.failMsg || undefined,
    progress: response.data.progress,
    createdAt: response.data.created_at || (response.data.createTime ? new Date(response.data.createTime).toISOString() : undefined),
    completedAt: response.data.completed_at || (response.data.completeTime ? new Date(response.data.completeTime).toISOString() : undefined),
  };
}

/**
 * Get the status of a TTS task
 */
async function getTTSTaskStatus(taskId: string): Promise<KieTask<TTSResult>> {
  const response = await kieRequest<RecordInfoApiResponse>(
    `/playground/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    'GET'
  );

  const status = mapStatus(response.data.state);
  let result: TTSResult | undefined;

  if (status === 'completed') {
    let audioUrl: string | undefined;

    // Primary: Extract from resultJson (new API format)
    if (response.data.resultJson) {
      try {
        const resultData = JSON.parse(response.data.resultJson);
        audioUrl = resultData.resultUrls?.[0] || resultData.url || resultData.audio_url;
        console.log('[Kie.ai] TTS result extracted from resultJson:', audioUrl);
      } catch (e) {
        console.error('[Kie.ai] Failed to parse resultJson:', e);
      }
    }

    // Fallback: Legacy output format
    if (!audioUrl && response.data.output) {
      audioUrl = response.data.output.url || response.data.output.audio_url;
      if (audioUrl) {
        console.log('[Kie.ai] TTS result extracted from output:', audioUrl);
      }
    }

    if (audioUrl) {
      result = {
        url: audioUrl,
        duration: response.data.output?.duration || 0,
        format: 'mp3',
      };
    } else {
      console.error('[Kie.ai] TTS task completed but no audio URL found in response:', JSON.stringify(response.data));
    }
  }

  return {
    taskId,
    status,
    result,
    error: response.data.error || response.data.failMsg || undefined,
    progress: response.data.progress,
    createdAt: response.data.created_at || (response.data.createTime ? new Date(response.data.createTime).toISOString() : undefined),
    completedAt: response.data.completed_at || (response.data.completeTime ? new Date(response.data.completeTime).toISOString() : undefined),
  };
}

/**
 * Get the status of an STT task
 */
async function getSTTTaskStatus(taskId: string): Promise<KieTask<STTResult>> {
  const response = await kieRequest<RecordInfoApiResponse>(
    `/playground/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    'GET'
  );

  const status = mapStatus(response.data.state);
  let result: STTResult | undefined;

  if (status === 'completed') {
    let sttData: { text?: string; words?: Array<{ text: string; start: number; end: number; type: string; speaker_id?: string }>; duration?: number } | undefined;

    // Primary: Extract from resultJson (new API format)
    if (response.data.resultJson) {
      try {
        const resultData = JSON.parse(response.data.resultJson);
        // API returns nested structure: { resultObject: { text, words, ... } }
        sttData = resultData.resultObject || resultData;
        console.log('[Kie.ai] STT result extracted from resultJson');
      } catch (e) {
        console.error('[Kie.ai] Failed to parse resultJson:', e);
      }
    }

    // Fallback: Legacy output format
    if (!sttData && response.data.output) {
      sttData = response.data.output;
      console.log('[Kie.ai] STT result extracted from output');
    }

    if (sttData) {
      result = {
        text: sttData.text || '',
        words: (sttData.words || []).map(w => ({
          text: w.text,
          start: w.start,
          end: w.end,
          type: w.type as 'word' | 'spacing',
          speaker_id: w.speaker_id,
        })),
        languageCode: 'en',
        duration: sttData.duration || 0,
      };
    } else {
      console.error('[Kie.ai] STT task completed but no transcription found in response:', JSON.stringify(response.data));
    }
  }

  return {
    taskId,
    status,
    result,
    error: response.data.error || response.data.failMsg || undefined,
    progress: response.data.progress,
    createdAt: response.data.created_at || (response.data.createTime ? new Date(response.data.createTime).toISOString() : undefined),
    completedAt: response.data.completed_at || (response.data.completeTime ? new Date(response.data.completeTime).toISOString() : undefined),
  };
}

/**
 * Generic task status (legacy compatibility)
 */
export async function getTaskStatus<T>(taskId: string): Promise<KieTask<T>> {
  // Try to determine task type from taskId prefix
  if (taskId.includes('nano-banana') || taskId.includes('image')) {
    return getImageTaskStatus(taskId) as Promise<KieTask<T>>;
  } else if (taskId.includes('sora') || taskId.includes('video')) {
    return getVideoTaskStatus(taskId) as Promise<KieTask<T>>;
  } else if (taskId.includes('tts') || taskId.includes('speech')) {
    return getTTSTaskStatus(taskId) as Promise<KieTask<T>>;
  } else if (taskId.includes('stt') || taskId.includes('transcribe')) {
    return getSTTTaskStatus(taskId) as Promise<KieTask<T>>;
  }

  // Default to video task status
  return getVideoTaskStatus(taskId) as Promise<KieTask<T>>;
}

/**
 * Poll for task completion with type-specific status checking
 */
async function pollForCompletionWithType<T>(
  taskId: string,
  getStatus: (taskId: string) => Promise<KieTask<T>>,
  options: {
    interval?: number;
    timeout?: number;
    onProgress?: (task: KieTask<T>) => void;
  } = {}
): Promise<T> {
  const { interval = 5000, timeout = 300000, onProgress } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const task = await getStatus(taskId);

    if (onProgress) {
      onProgress(task);
    }

    if (task.status === 'completed' && task.result) {
      return task.result;
    }

    if (task.status === 'failed') {
      throw new Error(task.error || 'Task failed');
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Task ${taskId} timed out after ${timeout}ms`);
}

/**
 * Poll for task completion (legacy compatibility)
 */
export async function pollForCompletion<T>(
  taskId: string,
  options: {
    interval?: number;
    timeout?: number;
    onProgress?: (task: KieTask<T>) => void;
  } = {}
): Promise<T> {
  return pollForCompletionWithType(
    taskId,
    (id) => getTaskStatus<T>(id),
    options
  );
}

// ============================================
// VIDEO GENERATION
// ============================================

/**
 * Start a video generation task
 * Uses image-to-video when imageUrl is provided, otherwise text-to-video
 */
export async function generateVideo(request: VideoGenerateRequest): Promise<string> {
  // Use image-to-video model when imageUrl is provided
  const model = request.imageUrl
    ? KIE_MODELS.VIDEO_SORA_2_IMAGE_TO_VIDEO
    : (request.model === 'sora-2-pro' ? KIE_MODELS.VIDEO_SORA_2_PRO : KIE_MODELS.VIDEO_SORA_2);

  const aspectRatio = request.aspectRatio === '9:16' ? 'portrait' :
                      request.aspectRatio === '16:9' ? 'landscape' : 'portrait';

  // n_frames valid values: likely 5, 10, 15 (in seconds)
  // Map duration to closest valid value
  const validFrames = request.duration && request.duration >= 10 ? '15' : '10';

  const input: Record<string, unknown> = {
    prompt: request.prompt,
    aspect_ratio: aspectRatio,
    n_frames: validFrames,
    remove_watermark: true,
  };

  if (request.imageUrl) {
    // API expects image_urls as an array, not singular image_url
    input.image_urls = [request.imageUrl];
    console.log('[Kie.ai] Using image-to-video with URL:', request.imageUrl.substring(0, 60) + '...');
  }

  return createTask(model, input);
}

/**
 * Generate video and wait for completion
 */
export async function generateVideoSync(
  request: VideoGenerateRequest,
  onProgress?: (task: KieTask<VideoResult>) => void
): Promise<VideoResult> {
  const taskId = await generateVideo(request);
  return pollForCompletionWithType(taskId, getVideoTaskStatus, { onProgress });
}

// ============================================
// IMAGE GENERATION
// ============================================

/**
 * Start an image generation task
 */
export async function generateImage(request: ImageGenerateRequest): Promise<string> {
  // Map aspect ratio to Kie.ai format
  const imageSizeMap: Record<string, string> = {
    '9:16': '9:16',
    '16:9': '16:9',
    '1:1': '1:1',
  };

  return createTask(KIE_MODELS.IMAGE_NANO_BANANA, {
    prompt: request.prompt,
    output_format: 'png',
    image_size: imageSizeMap[request.aspectRatio || '9:16'] || '9:16',
  });
}

/**
 * Generate image and wait for completion
 */
export async function generateImageSync(
  request: ImageGenerateRequest,
  onProgress?: (task: KieTask<ImageResult>) => void
): Promise<ImageResult> {
  const taskId = await generateImage(request);
  return pollForCompletionWithType(taskId, getImageTaskStatus, { onProgress });
}

// ============================================
// TEXT-TO-SPEECH (TTS)
// ============================================

/**
 * Start a text-to-speech task
 */
export async function generateVoiceover(request: TTSRequest): Promise<string> {
  return createTask(KIE_MODELS.TTS_ELEVENLABS, {
    text: request.text,
    voice: request.voiceId || 'Rachel',
    stability: request.stability ?? 0.5,
    similarity_boost: request.similarityBoost ?? 0.75,
    speed: 1,
    timestamps: true,
  });
}

/**
 * Generate voiceover and wait for completion
 */
export async function generateVoiceoverSync(
  request: TTSRequest,
  onProgress?: (task: KieTask<TTSResult>) => void
): Promise<TTSResult> {
  const taskId = await generateVoiceover(request);
  return pollForCompletionWithType(taskId, getTTSTaskStatus, { onProgress });
}

// ============================================
// SPEECH-TO-TEXT (STT)
// ============================================

/**
 * Start a speech-to-text task for word-level timestamps
 */
export async function getWordTimestamps(request: STTRequest): Promise<string> {
  return createTask(KIE_MODELS.STT_ELEVENLABS, {
    audio_url: request.audioUrl,
    language_code: request.languageCode || 'en',
    diarize: false,
  });
}

/**
 * Get word timestamps and wait for completion
 */
export async function getWordTimestampsSync(
  request: STTRequest,
  onProgress?: (task: KieTask<STTResult>) => void
): Promise<STTResult> {
  const taskId = await getWordTimestamps(request);
  return pollForCompletionWithType(taskId, getSTTTaskStatus, { onProgress });
}

/**
 * Extract only actual words from STT result (filter out spacing)
 */
export function filterWordTimestamps(result: STTResult): STTWord[] {
  return result.words.filter(word => word.type === 'word');
}

// ============================================
// PROMPT CONSTRUCTION
// ============================================

/**
 * Build an optimized prompt for Sora-2 video generation
 */
export function buildVideoPrompt(
  script: string,
  frameDescription: string
): string {
  const hook = script.split('\n')[0] || script.substring(0, 50);

  return `
A person speaks directly to camera with natural expressions and gestures.
Opening expression matches the energy of: "${hook}"
${frameDescription}

The person speaks naturally with subtle movements:
- Eye contact with camera
- Natural hand gestures
- Authentic facial expressions matching the script mood
- Slight head movements for emphasis

Style: Authentic UGC content, not polished commercial
Movement: Natural, subtle, not exaggerated
Mood: Engaging, relatable, genuine
`.trim();
}

/**
 * Build an optimized prompt for frame/image generation
 * Simplified to avoid text appearing in generated frames
 */
export function buildFramePrompt(
  productName: string,
  style: 'casual' | 'professional' | 'energetic' = 'casual'
): string {
  const styleDescriptions: Record<string, string> = {
    casual: 'casual, relatable, authentic vibe, soft natural lighting',
    professional: 'clean, polished, professional look, studio lighting',
    energetic: 'dynamic, vibrant, high energy, bright colorful lighting',
  };

  // Fallback to casual if style is not recognized
  const styleDescription = styleDescriptions[style] || styleDescriptions.casual;

  return `
Photo-realistic UGC style image of a person holding or showing a product to camera.
${styleDescription}
Product: ${productName}
Vertical format (9:16), TikTok/Instagram Reels style.
Clear face visible, natural expression, authentic feel.

IMPORTANT: Generate a clean image with NO text, NO captions, NO overlays, NO watermarks, NO logos, NO words of any kind visible in the image. The image must be completely free of any written text or typography.
`.trim();
}

// ============================================
// COST ESTIMATION
// ============================================

export interface CostEstimate {
  credits: number;
  usd: number;
}

const CREDIT_TO_USD = 0.005; // $0.005 per credit

export function estimateVideoCost(model: VideoModel, durationSeconds: number): CostEstimate {
  const creditsPerSecond: Record<VideoModel, number> = {
    'sora-2': 1.5, // ~15 credits for 10s
    'sora-2-pro': 6, // ~60 credits for 10s
    'veo-3': 20, // ~200 credits for 10s
  };

  const credits = Math.ceil(durationSeconds * creditsPerSecond[model]);
  return { credits, usd: credits * CREDIT_TO_USD };
}

export function estimateImageCost(model: ImageModel): CostEstimate {
  const creditsPerImage: Record<ImageModel, number> = {
    'nano-banana-pro': 8, // ~8 credits per image
    'flux': 12, // ~12 credits per image
  };

  const credits = creditsPerImage[model];
  return { credits, usd: credits * CREDIT_TO_USD };
}

export function estimateTTSCost(model: TTSModel, characterCount: number): CostEstimate {
  const creditsPerChar: Record<TTSModel, number> = {
    'elevenlabs/flash': 0.5,
    'elevenlabs/multilingual-v2': 1,
  };

  const credits = Math.ceil(characterCount * creditsPerChar[model]);
  return { credits, usd: credits * CREDIT_TO_USD };
}

export function estimateSTTCost(durationSeconds: number): CostEstimate {
  // ~10-15 credits per 15 seconds
  const credits = Math.ceil((durationSeconds / 15) * 12);
  return { credits, usd: credits * CREDIT_TO_USD };
}

/**
 * Estimate total cost for a complete video
 */
export function estimateTotalVideoCost(options: {
  frameCount?: number;
  videoDuration?: number;
  scriptLength?: number;
  videoModel?: VideoModel;
  imageModel?: ImageModel;
  ttsModel?: TTSModel;
}): CostEstimate {
  const {
    frameCount = 3,
    videoDuration = 15,
    scriptLength = 300,
    videoModel = 'sora-2',
    imageModel = 'nano-banana-pro',
    ttsModel = 'elevenlabs/flash',
  } = options;

  const frameCost = estimateImageCost(imageModel);
  const videoCost = estimateVideoCost(videoModel, videoDuration);
  const ttsCost = estimateTTSCost(ttsModel, scriptLength);
  const sttCost = estimateSTTCost(videoDuration);

  const totalCredits =
    frameCost.credits * frameCount +
    videoCost.credits +
    ttsCost.credits +
    sttCost.credits;

  return {
    credits: totalCredits,
    usd: totalCredits * CREDIT_TO_USD,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if Kie.ai is configured
 */
export function isConfigured(): boolean {
  return !!KIE_API_KEY;
}

/**
 * Download a file from URL
 */
export async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ============================================
// WEBHOOK HELPERS (Legacy support)
// ============================================

export interface WebhookPayload {
  jobId: string;
  status: 'completed' | 'failed';
  videoUrl?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, string>;
}

/**
 * Verify a webhook signature
 * Note: With polling-based approach, webhooks are optional
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Parse a webhook payload
 */
export function parseWebhookPayload(body: string): WebhookPayload {
  const data = JSON.parse(body);

  return {
    jobId: data.taskId || data.task_id || data.job_id,
    status: data.status === 'completed' || data.status === 'success' ? 'completed' : 'failed',
    videoUrl: data.output?.url || data.result?.url || data.video_url,
    duration: data.output?.duration || data.result?.duration || data.duration,
    error: data.error,
    metadata: data.metadata,
  };
}

// ============================================
// EXPORTS
// ============================================

export const KieService = {
  // Task management
  getTaskStatus,
  pollForCompletion,
  getImageTaskStatus,
  getVideoTaskStatus,
  getTTSTaskStatus,
  getSTTTaskStatus,

  // Video generation
  generateVideo,
  generateVideoSync,

  // Image generation
  generateImage,
  generateImageSync,

  // Text-to-Speech
  generateVoiceover,
  generateVoiceoverSync,

  // Speech-to-Text
  getWordTimestamps,
  getWordTimestampsSync,
  filterWordTimestamps,

  // Prompt helpers
  buildVideoPrompt,
  buildFramePrompt,

  // Cost estimation
  estimateVideoCost,
  estimateImageCost,
  estimateTTSCost,
  estimateSTTCost,
  estimateTotalVideoCost,

  // Utilities
  isConfigured,
  downloadFile,

  // Webhook helpers (legacy support)
  verifyWebhookSignature,
  parseWebhookPayload,
};
