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

// Path to FFmpeg binary (defaults to system PATH)
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE_PATH = process.env.FFPROBE_PATH || 'ffprobe';

ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

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

  console.log(`[FFmpeg] Burning subtitles with ASS file: ${assFilePath}`);
  console.log(`[FFmpeg] FFmpeg filter: ass='${escapedAssPath}'`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(`ass='${escapedAssPath}'`)
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
// VIDEO CONCATENATION
// ============================================

/**
 * Concatenate multiple videos
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
  concatenateVideos,
  convertToWebMp4,
  createThumbnail,
  processVideo,
  cleanupTempFile,
  checkFfmpegInstalled,
};
