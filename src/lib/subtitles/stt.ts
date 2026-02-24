/**
 * Speech-to-Text Integration
 *
 * Provides word-level timestamp transcription for caption generation.
 * Uses Kie.ai unified gateway to access ElevenLabs STT.
 *
 * All STT requests go through Kie.ai's unified API.
 */

import * as fs from 'fs';
import { KieService, STTResult, STTWord } from '@/lib/ai/kie';

// ============================================
// TYPES
// ============================================

export interface WordTimestamp {
  word: string;
  start: number; // milliseconds (from Kie.ai)
  end: number; // milliseconds
  confidence?: number;
}

export interface TranscriptionResult {
  text: string;
  words: WordTimestamp[];
  duration: number; // seconds
  language?: string;
}

export interface STTOptions {
  language?: string; // ISO 639-1 code, e.g., 'en'
}

// ============================================
// TRANSCRIPTION VIA KIE.AI
// ============================================

/**
 * Transcribe audio from URL and get word-level timestamps
 * Uses Kie.ai unified gateway (elevenlabs/scribe-v1)
 *
 * @param audioUrl - URL to audio file
 * @param options - Transcription options
 * @returns Transcription with word timestamps
 */
export async function transcribeFromUrl(
  audioUrl: string,
  options: STTOptions = {}
): Promise<TranscriptionResult> {
  if (!KieService.isConfigured()) {
    throw new Error('KIE_AI_API_KEY not configured');
  }

  const { language = 'en' } = options;

  // Use Kie.ai STT
  const sttResult = await KieService.getWordTimestampsSync({
    model: 'elevenlabs/scribe-v1',
    audioUrl,
    languageCode: language,
  });

  // Filter to only words (not spacing) and convert to our format
  // Note: Kie.ai/ElevenLabs returns timestamps in SECONDS, we need MILLISECONDS
  const words: WordTimestamp[] = KieService.filterWordTimestamps(sttResult).map((w) => ({
    word: w.text,
    start: w.start * 1000, // Convert seconds → milliseconds
    end: w.end * 1000,     // Convert seconds → milliseconds
  }));

  return {
    text: sttResult.text,
    words,
    duration: sttResult.duration,
    language: sttResult.languageCode,
  };
}

/**
 * Transcribe audio file and get word-level timestamps
 * Note: File must be uploaded to a URL first for Kie.ai
 *
 * @param audioPath - Path to audio file
 * @param uploadFn - Function to upload file and return URL
 * @param options - Transcription options
 * @returns Transcription with word timestamps
 */
export async function transcribeAudio(
  audioPath: string,
  uploadFn?: (buffer: Buffer) => Promise<string>,
  options: STTOptions = {}
): Promise<TranscriptionResult> {
  if (!uploadFn) {
    throw new Error('Upload function required to transcribe local files via Kie.ai');
  }

  // Read and upload the audio file
  const audioBuffer = fs.readFileSync(audioPath);
  const audioUrl = await uploadFn(audioBuffer);

  // Transcribe via URL
  return transcribeFromUrl(audioUrl, options);
}

/**
 * Start an async transcription task
 * Returns task ID for polling
 */
export async function startTranscription(
  audioUrl: string,
  options: STTOptions = {}
): Promise<string> {
  if (!KieService.isConfigured()) {
    throw new Error('KIE_AI_API_KEY not configured');
  }

  const { language = 'en' } = options;

  return KieService.getWordTimestamps({
    model: 'elevenlabs/scribe-v1',
    audioUrl,
    languageCode: language,
  });
}

// ============================================
// WORD GROUPING
// ============================================

export interface WordGroup {
  words: string[];
  text: string;
  start: number; // milliseconds
  end: number;
  highlightIndex: number; // Which word to highlight
}

/**
 * Group words for caption display (2-4 words per group)
 * This creates the TikTok-style word highlighting effect
 *
 * @param words - Array of word timestamps
 * @param wordsPerGroup - Target words per group (default 3)
 * @returns Array of word groups with timing
 */
export function groupWords(
  words: WordTimestamp[],
  wordsPerGroup: number = 3
): WordGroup[] {
  const groups: WordGroup[] = [];

  for (let i = 0; i < words.length; i += wordsPerGroup) {
    const groupWords = words.slice(i, i + wordsPerGroup);

    if (groupWords.length === 0) continue;

    // Create a group for each word highlight within the group
    for (let j = 0; j < groupWords.length; j++) {
      groups.push({
        words: groupWords.map((w) => w.word),
        text: groupWords.map((w) => w.word).join(' '),
        start: groupWords[j].start,
        end: groupWords[j].end,
        highlightIndex: j,
      });
    }
  }

  return groups;
}

/**
 * Create word groups with overlap for smoother transitions
 */
export function groupWordsSmooth(
  words: WordTimestamp[],
  groupSize: number = 3
): WordGroup[] {
  const groups: WordGroup[] = [];

  for (let i = 0; i < words.length; i++) {
    // Build context: previous word, current word, next words
    const contextStart = Math.max(0, i - 1);
    const contextEnd = Math.min(words.length, i + groupSize);
    const contextWords = words.slice(contextStart, contextEnd);

    // Find which index in context is the current highlighted word
    const highlightIndex = i - contextStart;

    groups.push({
      words: contextWords.map((w) => w.word),
      text: contextWords.map((w) => w.word).join(' '),
      start: words[i].start,
      end: words[i].end,
      highlightIndex,
    });
  }

  return groups;
}

// ============================================
// CONVERSION UTILITIES
// ============================================

/**
 * Convert milliseconds to seconds
 */
export function msToSeconds(ms: number): number {
  return ms / 1000;
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Convert word timestamps from milliseconds to seconds
 */
export function convertToSeconds(words: WordTimestamp[]): WordTimestamp[] {
  return words.map((w) => ({
    ...w,
    start: msToSeconds(w.start),
    end: msToSeconds(w.end),
  }));
}

// ============================================
// COST ESTIMATION
// ============================================

/**
 * Calculate estimated cost for STT via Kie.ai
 * ~10-15 credits per 15 seconds of audio
 */
export function estimateCost(durationSeconds: number): { credits: number; usd: number } {
  return KieService.estimateSTTCost(durationSeconds);
}

// ============================================
// TIMESTAMP FORMATTING
// ============================================

/**
 * Format milliseconds to SRT/ASS timestamp
 */
export function formatTimestamp(ms: number, format: 'srt' | 'ass' = 'ass'): string {
  const seconds = ms / 1000;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centisecs = Math.floor((seconds % 1) * 100);

  if (format === 'srt') {
    const msStr = String(Math.floor((seconds % 1) * 1000)).padStart(3, '0');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${msStr}`;
  }

  // ASS format: H:MM:SS.CC
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centisecs).padStart(2, '0')}`;
}

/**
 * Format seconds to SRT/ASS timestamp (for backward compatibility)
 */
export function formatTimestampSeconds(seconds: number, format: 'srt' | 'ass' = 'ass'): string {
  return formatTimestamp(seconds * 1000, format);
}

// ============================================
// EXPORTS
// ============================================

export const STTService = {
  // Main transcription methods
  transcribeFromUrl,
  transcribeAudio,
  startTranscription,

  // Word grouping
  groupWords,
  groupWordsSmooth,

  // Conversion utilities
  msToSeconds,
  secondsToMs,
  convertToSeconds,

  // Cost estimation
  estimateCost,

  // Timestamp formatting
  formatTimestamp,
  formatTimestampSeconds,

  // Check if configured
  isConfigured: () => KieService.isConfigured(),
};
