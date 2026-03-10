/**
 * Direct OpenAI Sora 2 API Client
 *
 * Bypasses Kie.ai and calls OpenAI's Sora video generation API directly.
 * Used as Tier 4 fallback in the Concierge pipeline when Kie.ai models fail.
 *
 * API Reference: https://platform.openai.com/docs/api-reference/videos
 * Guide: https://platform.openai.com/docs/guides/video-generation
 *
 * Requires SORA_API_KEY or OPENAI_API_KEY environment variable.
 */

// ============================================
// CONFIGURATION
// ============================================

const SORA_API_KEY = process.env.SORA_API_KEY || process.env.OPENAI_API_KEY;
const SORA_API_BASE = 'https://api.openai.com/v1';

if (!SORA_API_KEY) {
  console.warn('[Sora Direct] No SORA_API_KEY or OPENAI_API_KEY configured. Direct Sora fallback disabled.');
}

// ============================================
// TYPES
// ============================================

export interface SoraVideoRequest {
  prompt: string;
  imageUrl?: string;        // Start frame — passed as input_reference
  seconds?: number;         // Duration: 4, 8, or 12
  aspectRatio?: '9:16' | '16:9' | '1:1';
  model?: 'sora-2' | 'sora-2-pro';
}

/**
 * OpenAI Sora Video object shape
 * Returned by POST /v1/videos and GET /v1/videos/{id}
 */
interface SoraVideoResponse {
  id: string;
  object: 'video';
  created_at: number;
  completed_at: number | null;
  error: {
    message: string;
    code: string;
  } | null;
  expires_at: number | null;
  model: string;
  progress: number;
  prompt: string;
  remixed_from_video_id: string | null;
  seconds: string;          // e.g. "8"
  size: string;             // e.g. "720x1280"
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
}

// ============================================
// CORE API
// ============================================

async function soraRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, unknown>,
): Promise<T> {
  if (!SORA_API_KEY) {
    throw new Error('SORA_API_KEY not configured');
  }

  const url = `${SORA_API_BASE}${endpoint}`;
  console.log(`[Sora Direct] ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${SORA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Sora Direct] Error ${response.status}: ${errorText}`);
    throw new Error(`Sora API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============================================
// VIDEO GENERATION
// ============================================

/**
 * Start a Sora 2 video generation job.
 *
 * OpenAI API: POST /v1/videos
 * Returns the video job ID for polling.
 */
export async function createVideo(request: SoraVideoRequest): Promise<string> {
  const sizeMap: Record<string, string> = {
    '9:16': '720x1280',
    '16:9': '1280x720',
    '1:1': '720x720',
  };

  const body: Record<string, unknown> = {
    model: request.model || 'sora-2',
    prompt: request.prompt,
    size: sizeMap[request.aspectRatio || '9:16'],
    seconds: String(request.seconds || 8),
  };

  // Image-to-video: OpenAI uses "input_reference" (URL string)
  if (request.imageUrl) {
    body.input_reference = request.imageUrl;
  }

  const response = await soraRequest<SoraVideoResponse>('/videos', 'POST', body);

  if (!response.id) {
    throw new Error('Sora API did not return a video ID');
  }

  console.log(`[Sora Direct] Video job created: ${response.id} (status: ${response.status})`);
  return response.id;
}

/**
 * Poll video job status.
 *
 * OpenAI API: GET /v1/videos/{video_id}
 */
export async function getVideoStatus(videoId: string): Promise<SoraVideoResponse> {
  return soraRequest<SoraVideoResponse>(`/videos/${videoId}`, 'GET');
}

/**
 * Download the completed video as a Buffer.
 *
 * OpenAI API: GET /v1/videos/{video_id}/content
 * Streams the raw MP4 binary.
 */
export async function downloadVideoContent(videoId: string): Promise<Buffer> {
  if (!SORA_API_KEY) {
    throw new Error('SORA_API_KEY not configured');
  }

  const url = `${SORA_API_BASE}/videos/${videoId}/content`;
  console.log(`[Sora Direct] Downloading video: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SORA_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download Sora video: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Generate video and wait for completion (full sync wrapper).
 *
 * Handles: create job → poll status → download MP4 buffer.
 */
export async function generateVideoSync(
  request: SoraVideoRequest,
  options: {
    timeout?: number;
    interval?: number;
    onProgress?: (status: string, progress: number) => void;
  } = {}
): Promise<{ buffer: Buffer; duration: number; width: number; height: number }> {
  const { timeout = 600000, interval = 10000, onProgress } = options;

  const videoId = await createVideo(request);
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await getVideoStatus(videoId);

    if (onProgress) {
      onProgress(status.status, status.progress || 0);
    }

    if (status.status === 'completed') {
      console.log(`[Sora Direct] Video ${videoId} completed, downloading...`);

      const buffer = await downloadVideoContent(videoId);
      const [width, height] = (status.size || '720x1280').split('x').map(Number);

      return {
        buffer,
        duration: parseInt(status.seconds) || 8,
        width: width || 720,
        height: height || 1280,
      };
    }

    if (status.status === 'failed') {
      throw new Error(
        `Sora generation failed: ${status.error?.message || 'Unknown error'} (code: ${status.error?.code || 'none'})`
      );
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Sora generation ${videoId} timed out after ${timeout}ms`);
}

// ============================================
// UTILITY
// ============================================

export function isConfigured(): boolean {
  return !!SORA_API_KEY;
}

// ============================================
// EXPORTS
// ============================================

export const SoraService = {
  createVideo,
  getVideoStatus,
  downloadVideoContent,
  generateVideoSync,
  isConfigured,
};
