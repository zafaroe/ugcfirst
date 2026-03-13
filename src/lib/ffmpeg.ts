/**
 * FFmpeg Video Processing Utilities
 *
 * Provides video trimming, audio extraction, and caption burn-in
 * for the video generation pipeline.
 */

import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================
// CONFIGURATION
// ============================================

// Path to FFmpeg binary
// 1. Use env var if set (local development with custom install)
// 2. Use @ffmpeg-installer/ffmpeg package (Vercel compatible)
// 3. Fall back to system PATH
let ffmpegPath = process.env.FFMPEG_PATH || '';
let ffprobePath = process.env.FFPROBE_PATH || '';

if (!ffmpegPath) {
  try {
    // @ffmpeg-installer/ffmpeg works better on Vercel than ffmpeg-static
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    if (ffmpegInstaller?.path) {
      ffmpegPath = ffmpegInstaller.path;
      console.log(`[FFmpeg] Using @ffmpeg-installer binary: ${ffmpegPath}`);
    }
  } catch (e) {
    console.log('[FFmpeg] @ffmpeg-installer not available, trying ffmpeg-static...');
    try {
      const ffmpegStatic = require('ffmpeg-static');
      if (ffmpegStatic) {
        ffmpegPath = ffmpegStatic;
        console.log(`[FFmpeg] Using ffmpeg-static binary: ${ffmpegPath}`);
      }
    } catch {
      console.log('[FFmpeg] No FFmpeg package available, using system PATH');
    }
  }
}

if (!ffprobePath) {
  try {
    // @ffprobe-installer/ffprobe works better on Vercel
    const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
    if (ffprobeInstaller?.path) {
      ffprobePath = ffprobeInstaller.path;
      console.log(`[FFmpeg] Using @ffprobe-installer binary: ${ffprobePath}`);
    }
  } catch {
    console.log('[FFmpeg] @ffprobe-installer not available');
  }
}

if (!ffmpegPath) {
  ffmpegPath = 'ffmpeg';
}
if (!ffprobePath) {
  ffprobePath = 'ffprobe';
}

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// ============================================
// TYPES
// ============================================

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}

export interface TrimOptions {
  startTime?: number; // seconds, default 1
  endTime?: number; // seconds, optional
  outputPath?: string;
}

export interface AudioExtractionOptions {
  format?: 'wav' | 'mp3';
  sampleRate?: number;
  channels?: number;
}

// Moved to subtitle burn-in section below

// ============================================
// VIDEO METADATA
// ============================================

/**
 * Get video metadata using ffprobe
 */
export function getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: eval(videoStream.r_frame_rate || '30/1'),
        codec: videoStream.codec_name || 'unknown',
        bitrate: metadata.format.bit_rate || 0,
      });
    });
  });
}

// ============================================
// VIDEO TRIMMING
// ============================================

/**
 * Trim the first second from a video
 * This removes the static frame that appears at the start of AI-generated videos
 *
 * @param inputPath - Path to input video
 * @param options - Trim options
 * @returns Path to trimmed video
 */
export function trimFirstSecond(
  inputPath: string,
  options: TrimOptions = {}
): Promise<string> {
  const { startTime = 1, endTime, outputPath } = options;

  const output = outputPath || generateTempPath('trimmed', '.mp4');

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .setStartTime(startTime)
      .outputOptions([
        '-c:v', 'copy', // Copy video stream without re-encoding (fast)
        '-c:a', 'copy', // Copy audio stream
        '-avoid_negative_ts', '1',
      ])
      .output(output);

    if (endTime) {
      command = command.setDuration(endTime - startTime);
    }

    command
      .on('end', () => resolve(output))
      .on('error', reject)
      .run();
  });
}

/**
 * Trim video to specific start and end times
 */
export function trimVideo(
  inputPath: string,
  startTime: number,
  endTime: number,
  outputPath?: string
): Promise<string> {
  const output = outputPath || generateTempPath('trimmed', '.mp4');

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .outputOptions([
        '-c:v', 'copy',
        '-c:a', 'copy',
        '-avoid_negative_ts', '1',
      ])
      .output(output)
      .on('end', () => resolve(output))
      .on('error', reject)
      .run();
  });
}

// ============================================
// AUDIO EXTRACTION
// ============================================

/**
 * Extract audio from a video file
 * Used for speech-to-text caption generation
 *
 * @param inputPath - Path to video file
 * @param options - Extraction options
 * @returns Path to extracted audio file
 */
export function extractAudio(
  inputPath: string,
  options: AudioExtractionOptions = {}
): Promise<string> {
  const {
    format = 'wav',
    sampleRate = 16000, // 16kHz is optimal for STT
    channels = 1, // Mono
  } = options;

  const outputPath = generateTempPath('audio', `.${format}`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioFrequency(sampleRate)
      .audioChannels(channels)
      .format(format)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

// ============================================
// SUBTITLE BURN-IN
// ============================================

export interface SubtitleBurnOptions {
  assFilePath: string;
  outputPath?: string;
}

// Backward compatibility alias
export type CaptionBurnOptions = SubtitleBurnOptions;

/**
 * Get the path to bundled caption fonts
 * These fonts are used by the ASS subtitle renderer
 */
function getCaptionFontsDir(): string {
  // In development, use the public folder
  // In production (Vercel), public folder is served statically
  // but for server-side FFmpeg, we need to reference from project root
  return path.join(process.cwd(), 'public', 'fonts', 'captions');
}

/**
 * Burn subtitles into video using ASS subtitle file
 *
 * @param inputPath - Path to video file
 * @param options - Subtitle options
 * @returns Path to video with burned-in subtitles
 */
export function burnSubtitles(
  inputPath: string,
  options: SubtitleBurnOptions
): Promise<string> {
  const { assFilePath, outputPath } = options;
  const output = outputPath || generateTempPath('subtitled', '.mp4');

  // Escape single quotes in path and wrap in single quotes for FFmpeg ASS filter
  const escapedAssPath = assFilePath.replace(/'/g, "'\\''");

  // Get the fonts directory for custom caption fonts
  const fontsDirPath = getCaptionFontsDir();
  const escapedFontsDir = fontsDirPath.replace(/'/g, "'\\''");

  // Check if fonts directory exists, use it if so
  const fontsExist = fs.existsSync(fontsDirPath);

  console.log(`[FFmpeg] Burning subtitles with ASS file: ${assFilePath}`);
  console.log(`[FFmpeg] Fonts directory: ${fontsDirPath} (exists: ${fontsExist})`);

  // Build the ASS filter with optional fontsdir
  // Format: ass=filename:fontsdir=path
  const assFilter = fontsExist
    ? `ass='${escapedAssPath}':fontsdir='${escapedFontsDir}'`
    : `ass='${escapedAssPath}'`;

  console.log(`[FFmpeg] FFmpeg filter: ${assFilter}`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(assFilter)
      .outputOptions([
        '-c:v', 'libx264', // Re-encode video (required for filter)
        '-preset', 'fast',
        '-crf', '23', // Quality level (18-28, lower is better)
        '-c:a', 'copy', // Copy audio
      ])
      .output(output)
      .on('end', () => resolve(output))
      .on('error', reject)
      .run();
  });
}

// ============================================
// WATERMARK
// ============================================

export interface WatermarkOptions {
  text?: string;
  fontSize?: number;
  fontColor?: string;
  opacity?: number;
  paddingBottom?: number;
  outputPath?: string;
}

/**
 * Add a text watermark to video
 * Used for free tier videos to display "Made with ugcfirst.com"
 *
 * @param inputPath - Path to video file
 * @param options - Watermark options
 * @returns Path to watermarked video
 */
export function addWatermark(
  inputPath: string,
  options: WatermarkOptions = {}
): Promise<string> {
  const {
    text = 'Made with ugcfirst.com',
    fontSize = 24,
    fontColor = 'white',
    opacity = 0.6,
    paddingBottom = 40,
    outputPath,
  } = options;

  const output = outputPath || generateTempPath('watermarked', '.mp4');

  // Convert opacity to hex (0.6 = 99 in hex for ~60%)
  const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');

  // FFmpeg drawtext filter for bottom-center watermark with drop shadow
  // First draw shadow (offset by 2px), then draw main text
  const shadowFilter = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=black@0.5:x=(w-text_w)/2:y=h-${paddingBottom + 2}-text_h:shadowx=2:shadowy=2`;
  const textFilter = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}@${opacity}:x=(w-text_w)/2:y=h-${paddingBottom}-text_h`;

  console.log(`[FFmpeg] Adding watermark: "${text}"`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters([shadowFilter, textFilter])
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'copy',
      ])
      .output(output)
      .on('end', () => resolve(output))
      .on('error', reject)
      .run();
  });
}

// ============================================
// VIDEO CONCATENATION
// ============================================

/**
 * Concatenate multiple videos (requires matching codecs)
 * Use concatenateVideosReencode for videos from different sources
 */
export function concatenateVideos(
  inputPaths: string[],
  outputPath?: string
): Promise<string> {
  const output = outputPath || generateTempPath('concatenated', '.mp4');

  // Create a file list for FFmpeg
  const listPath = generateTempPath('concat_list', '.txt');
  const listContent = inputPaths.map((p) => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, listContent);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy'])
      .output(output)
      .on('end', () => {
        // Clean up list file
        fs.unlinkSync(listPath);
        resolve(output);
      })
      .on('error', (err) => {
        fs.unlinkSync(listPath);
        reject(err);
      })
      .run();
  });
}

/**
 * Concatenate videos with re-encoding (handles different codecs)
 * Used when concatenating videos from different AI sources (e.g., Veo 3.1 + Kling 2.6)
 *
 * Uses filter_complex to handle videos with different codecs, resolutions, etc.
 */
export function concatenateVideosReencode(
  inputPaths: string[],
  outputPath?: string
): Promise<string> {
  const output = outputPath || generateTempPath('concatenated', '.mp4');

  console.log(`[FFmpeg] Re-encoding concatenation of ${inputPaths.length} videos`);

  return new Promise((resolve, reject) => {
    // Build filter complex for scaling and concatenating
    // Scale all videos to 720x1280 (9:16) and normalize frame rate
    const scaleFilters = inputPaths.map((_, i) =>
      `[${i}:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,fps=30,setsar=1[v${i}];`
    ).join('');

    const audioFilters = inputPaths.map((_, i) =>
      `[${i}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}];`
    ).join('');

    const videoConcat = inputPaths.map((_, i) => `[v${i}]`).join('') + `concat=n=${inputPaths.length}:v=1:a=0[outv];`;
    const audioConcat = inputPaths.map((_, i) => `[a${i}]`).join('') + `concat=n=${inputPaths.length}:v=0:a=1[outa]`;

    const filterComplex = scaleFilters + audioFilters + videoConcat + audioConcat;

    let command = ffmpeg();

    // Add all input files
    inputPaths.forEach((inputPath) => {
      command = command.input(inputPath);
    });

    command
      .complexFilter(filterComplex)
      .outputOptions([
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
      ])
      .output(output)
      .on('start', (cmd) => {
        console.log(`[FFmpeg] Concatenate command: ${cmd.substring(0, 200)}...`);
      })
      .on('end', () => {
        console.log(`[FFmpeg] Re-encoding concatenation complete: ${output}`);
        resolve(output);
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] Re-encoding concatenation failed:`, err);
        reject(err);
      })
      .run();
  });
}

// ============================================
// VIDEO CONVERSION
// ============================================

/**
 * Convert video to optimized MP4 format for web
 */
export function convertToWebMp4(
  inputPath: string,
  outputPath?: string
): Promise<string> {
  const output = outputPath || generateTempPath('web_optimized', '.mp4');

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-profile:v', 'high',
        '-level', '4.0',
        '-movflags', '+faststart', // Enable streaming
        '-c:a', 'aac',
        '-b:a', '128k',
      ])
      .output(output)
      .on('end', () => resolve(output))
      .on('error', reject)
      .run();
  });
}

/**
 * Create a thumbnail from a video
 */
export function createThumbnail(
  inputPath: string,
  timeSeconds: number = 1,
  outputPath?: string
): Promise<string> {
  const output = outputPath || generateTempPath('thumbnail', '.jpg');

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timeSeconds],
        filename: path.basename(output),
        folder: path.dirname(output),
        size: '720x1280', // TikTok aspect ratio
      })
      .on('end', () => resolve(output))
      .on('error', reject);
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a temporary file path
 */
function generateTempPath(prefix: string, extension: string): string {
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return path.join(tempDir, `ugcfirst_${prefix}_${timestamp}_${random}${extension}`);
}

/**
 * Clean up a temporary file
 */
export function cleanupTempFile(filePath: string): void {
  if (filePath.includes('ugcfirst_') && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Check if FFmpeg is installed and accessible
 */
export function checkFfmpegInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      resolve(!err);
    });
  });
}

// ============================================
// FULL PROCESSING PIPELINE
// ============================================

export interface ProcessVideoOptions {
  trimStart?: boolean; // Trim first second
  addCaptions?: boolean;
  assFilePath?: string;
  optimize?: boolean; // Convert to web-optimized MP4
}

/**
 * Full video processing pipeline
 * Combines trimming, captions, and optimization
 */
export async function processVideo(
  inputPath: string,
  options: ProcessVideoOptions
): Promise<string> {
  let currentPath = inputPath;
  const tempFiles: string[] = [];

  try {
    // Step 1: Trim first second
    if (options.trimStart) {
      currentPath = await trimFirstSecond(currentPath);
      tempFiles.push(currentPath);
    }

    // Step 2: Add captions
    if (options.addCaptions && options.assFilePath) {
      currentPath = await burnCaptions(currentPath, {
        assFilePath: options.assFilePath,
      });
      tempFiles.push(currentPath);
    }

    // Step 3: Optimize for web
    if (options.optimize) {
      currentPath = await convertToWebMp4(currentPath);
      tempFiles.push(currentPath);
    }

    // Clean up intermediate files (except the final one)
    tempFiles.slice(0, -1).forEach(cleanupTempFile);

    return currentPath;
  } catch (error) {
    // Clean up all temp files on error
    tempFiles.forEach(cleanupTempFile);
    throw error;
  }
}

// ============================================
// EXPORTS
// ============================================

// Backward compatibility alias
export const burnCaptions = burnSubtitles;

export const FFmpegService = {
  getVideoMetadata,
  trimFirstSecond,
  trimVideo,
  extractAudio,
  burnSubtitles,
  burnCaptions: burnSubtitles, // backward compat
  addWatermark,
  concatenateVideos,
  concatenateVideosReencode,
  convertToWebMp4,
  createThumbnail,
  processVideo,
  cleanupTempFile,
  checkFfmpegInstalled,
};
