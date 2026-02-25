import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ============================================
// R2 CLIENT CONFIGURATION
// ============================================

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ugcfirst-videos';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://videos.ugcfirst.com';

// Validate environment variables
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn('R2 credentials not configured. Storage operations will fail.');
}

// S3-compatible client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ============================================
// UPLOAD FUNCTIONS
// ============================================

export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

/**
 * Internal upload function - returns the key only
 * @param key - Storage path (e.g., "frames/gen123/0.png")
 * @param body - File content (Buffer, Uint8Array, Blob, or ReadableStream)
 * @param options - Upload options
 * @returns Storage key
 */
async function uploadToR2Internal(
  key: string,
  body: Buffer | Uint8Array | Blob | ReadableStream,
  options: UploadOptions = {}
): Promise<string> {
  const { contentType, cacheControl, metadata } = options;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType || inferContentType(key),
      CacheControl: cacheControl || 'private, max-age=31536000', // Private cache
      Metadata: metadata,
    })
  );

  return key;
}

/**
 * Upload a file to R2 and return a signed URL
 * @param key - Storage path (e.g., "frames/gen123/0.png")
 * @param body - File content (Buffer, Uint8Array, Blob, or ReadableStream)
 * @param options - Upload options
 * @param signedUrlExpiry - Signed URL expiration in seconds (default: 1 hour)
 * @returns Object with storage key and signed URL
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | Blob | ReadableStream,
  options: UploadOptions = {},
  signedUrlExpiry: number = 3600
): Promise<{ key: string; signedUrl: string }> {
  await uploadToR2Internal(key, body, options);
  const signedUrl = await getSignedDownloadUrl(key, signedUrlExpiry);
  return { key, signedUrl };
}

/**
 * Upload a video file to R2 (raw, without captions)
 * @param generationId - Generation ID for path organization
 * @param scriptIndex - Script index (0, 1, 2)
 * @param videoBuffer - Video content as Buffer
 * @returns Object with R2 key and signed URL
 */
export async function uploadVideo(
  generationId: string,
  scriptIndex: number,
  videoBuffer: Buffer
): Promise<{ key: string; signedUrl: string }> {
  const key = `videos/${generationId}/${scriptIndex}.mp4`;
  await uploadToR2Internal(key, videoBuffer, {
    contentType: 'video/mp4',
  });
  // Return signed URL valid for 24 hours for user viewing
  const signedUrl = await getSignedDownloadUrl(key, 86400);
  return { key, signedUrl };
}

/**
 * Upload a captioned video file to R2
 * @param generationId - Generation ID for path organization
 * @param scriptIndex - Script index (0, 1, 2)
 * @param videoBuffer - Video content as Buffer (with burned-in subtitles)
 * @returns Object with R2 key and signed URL
 */
export async function uploadSubtitledVideo(
  generationId: string,
  scriptIndex: number,
  videoBuffer: Buffer
): Promise<{ key: string; signedUrl: string }> {
  const key = `videos/${generationId}/${scriptIndex}_subtitled.mp4`;
  await uploadToR2Internal(key, videoBuffer, {
    contentType: 'video/mp4',
  });
  // Return signed URL valid for 24 hours for user viewing
  const signedUrl = await getSignedDownloadUrl(key, 86400);
  return { key, signedUrl };
}

// Backward compatibility alias
export const uploadCaptionedVideo = uploadSubtitledVideo;

/**
 * Upload a frame/image to R2
 * Returns PUBLIC URL because Kie.ai needs direct access for video generation
 * @param generationId - Generation ID for path organization
 * @param scriptIndex - Script index (0, 1, 2)
 * @param imageBuffer - Image content as Buffer
 * @returns Public URL of uploaded frame
 */
export async function uploadFrame(
  generationId: string,
  scriptIndex: number,
  imageBuffer: Buffer
): Promise<string> {
  const key = `frames/${generationId}/${scriptIndex}.png`;
  await uploadToR2Internal(key, imageBuffer, {
    contentType: 'image/png',
  });
  // Return public URL - Kie.ai needs direct access without signed URL auth
  return getPublicUrl(key);
}

/**
 * Upload from a URL (download then upload)
 * @param sourceUrl - URL to download from
 * @param destinationKey - R2 storage key
 * @param signedUrlExpiry - Signed URL expiration in seconds (default: 1 hour)
 * @returns Object with R2 key and signed URL
 */
export async function uploadFromUrl(
  sourceUrl: string,
  destinationKey: string,
  signedUrlExpiry: number = 3600
): Promise<{ key: string; signedUrl: string }> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch from URL: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || undefined;

  await uploadToR2Internal(destinationKey, buffer, { contentType });
  const signedUrl = await getSignedDownloadUrl(destinationKey, signedUrlExpiry);
  return { key: destinationKey, signedUrl };
}

// ============================================
// DOWNLOAD FUNCTIONS
// ============================================

/**
 * Download a video from R2 by generation ID and script index
 * Used by subtitle generation and burning steps for reliable access
 * @param generationId - Generation ID
 * @param scriptIndex - Script index (0, 1, 2)
 * @returns Video content as Buffer
 */
export async function downloadVideo(
  generationId: string,
  scriptIndex: number
): Promise<Buffer> {
  const key = `videos/${generationId}/${scriptIndex}.mp4`;
  console.log(`[R2] Downloading video: ${key}`);

  const buffer = await downloadFromR2(key);

  if (!buffer || buffer.length === 0) {
    throw new Error(`Failed to download video from R2: ${key}`);
  }

  console.log(`[R2] Downloaded video: ${key} (${buffer.length} bytes)`);
  return buffer;
}

/**
 * Download a file from R2
 * @param key - Storage path
 * @returns File content as Buffer
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error(`File not found: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  const stream = response.Body as NodeJS.ReadableStream;

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Get a pre-signed URL for temporary access
 * @param key - Storage path
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns Pre-signed URL
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Get a pre-signed URL for direct upload
 * @param key - Storage path
 * @param contentType - MIME type
 * @param expiresIn - URL expiration in seconds (default: 15 minutes)
 * @returns Pre-signed upload URL
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 900
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

// ============================================
// DELETE FUNCTIONS
// ============================================

/**
 * Delete a file from R2
 * @param key - Storage path
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Delete all files for a generation
 * @param generationId - Generation ID
 */
export async function deleteGenerationFiles(generationId: string): Promise<void> {
  // List and delete frames
  const framesToDelete = await listFiles(`frames/${generationId}/`);
  for (const key of framesToDelete) {
    await deleteFromR2(key);
  }

  // List and delete videos
  const videosToDelete = await listFiles(`videos/${generationId}/`);
  for (const key of videosToDelete) {
    await deleteFromR2(key);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a file exists in R2
 * @param key - Storage path
 * @returns Whether file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * List files with a given prefix
 * @param prefix - Path prefix
 * @returns Array of file keys
 */
export async function listFiles(prefix: string): Promise<string[]> {
  const response = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
    })
  );

  return (response.Contents || []).map((obj) => obj.Key!).filter(Boolean);
}

/**
 * Get public URL for a key
 * @param key - Storage path
 * @returns Public URL
 */
export function getPublicUrl(key: string): string {
  // Ensure no double slashes
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}

/**
 * Parse a public URL to get the storage key
 * @param url - Public URL
 * @returns Storage key or null if not a valid R2 URL
 */
export function parsePublicUrl(url: string): string | null {
  if (!url.startsWith(R2_PUBLIC_URL)) {
    return null;
  }
  return url.replace(`${R2_PUBLIC_URL}/`, '');
}

/**
 * Infer content type from file extension
 */
function inferContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    json: 'application/json',
    ass: 'text/plain',
    srt: 'text/plain',
  };
  return types[ext || ''] || 'application/octet-stream';
}

// ============================================
// PATH BUILDERS
// ============================================

export const R2Paths = {
  frame: (generationId: string, scriptIndex: number) =>
    `frames/${generationId}/${scriptIndex}.png`,

  video: (generationId: string, scriptIndex: number) =>
    `videos/${generationId}/${scriptIndex}.mp4`,

  videoCaptioned: (generationId: string, scriptIndex: number) =>
    `videos/${generationId}/${scriptIndex}_captioned.mp4`,

  rawVideo: (generationId: string, scriptIndex: number) =>
    `videos/${generationId}/${scriptIndex}_raw.mp4`,

  audioExtract: (generationId: string, scriptIndex: number) =>
    `temp/${generationId}/${scriptIndex}.wav`,

  captions: (generationId: string, scriptIndex: number) =>
    `temp/${generationId}/${scriptIndex}.ass`,
};

/**
 * Get the R2 client singleton
 * Used for pre-warming and advanced operations
 */
export function getR2Client(): S3Client {
  return r2Client;
}

// Export the client for advanced use cases
export { r2Client, R2_BUCKET_NAME };
