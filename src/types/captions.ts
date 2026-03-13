/**
 * Caption System Types
 *
 * Type definitions for the caption generation system including:
 * - STT word timestamps
 * - Smart word grouping
 * - Caption style configuration
 * - Generation config
 */

// ============================================
// STT WORD TYPES
// ============================================

/**
 * Word timestamp from speech-to-text service (ElevenLabs via Kie.ai)
 */
export interface STTWord {
  text: string;      // The word with punctuation, e.g. "product."
  start: number;     // Start time in milliseconds
  end: number;       // End time in milliseconds
}

// ============================================
// WORD GROUPING TYPES
// ============================================

/**
 * A group of words to display together as a caption frame
 */
export interface WordGroup {
  words: STTWord[];     // Words in this group
  text: string;         // Joined text of all words
  startTime: number;    // First word's start time (ms)
  endTime: number;      // Last word's end time (ms)
}

/**
 * Configuration for smart semantic word grouping
 */
export interface GroupingConfig {
  maxWords: number;           // Max words per group. Default: 6
  minWords: number;           // Min words per group. Default: 2
  maxDuration: number;        // Max milliseconds per group. Default: 2500
  hardPauseThreshold: number; // Milliseconds - hard break above this. Default: 400
  softPauseThreshold: number; // Milliseconds - soft break above this. Default: 200
}

/**
 * Default grouping configuration
 */
export const DEFAULT_GROUPING_CONFIG: GroupingConfig = {
  maxWords: 6,
  minWords: 2,
  maxDuration: 2500,
  hardPauseThreshold: 400,
  softPauseThreshold: 200,
};

// ============================================
// CAPTION STYLE TYPES
// ============================================

/**
 * Caption tier for pricing/feature gating
 */
export type CaptionTier = 'standard' | 'premium';

/**
 * Caption style category for organization
 */
export type CaptionCategory = 'bold' | 'clean' | 'creative' | 'editorial';

/**
 * Animation type for caption appearance
 */
export type CaptionAnimationType =
  | 'highlight'    // Color change on active word (default)
  | 'karaoke'      // One word at a time
  | 'fade'         // Fade in/out per group
  | 'typewriter'   // Progressive reveal
  | 'bounce';      // Scale overshoot on appear

/**
 * Complete caption style configuration
 * Defines all visual properties for ASS subtitle generation
 */
export interface CaptionStyleConfig {
  // ========== Identity ==========
  id: string;                    // Unique preset ID, e.g. 'hormozi-bold'
  name: string;                  // Display name, e.g. 'Hormozi Bold'
  description: string;           // Short description for UI
  tier: CaptionTier;             // 'standard' or 'premium'
  category: CaptionCategory;     // For filtering/grouping in UI

  // ========== ASS Style Properties ==========
  fontFamily: string;            // Must match installed .ttf font name
  fontSize: number;              // ASS font size units
  primaryColor: string;          // ASS BGR format: &H00BBGGRR (white = &H00FFFFFF)
  highlightColor: string;        // ASS BGR format for active word
  outlineColor: string;          // ASS BGR format for text outline
  outlineWidth: number;          // Outline thickness in pixels (0-4)
  shadowColor: string;           // ASS BGR with alpha: &H80000000
  shadowDepth: number;           // Shadow offset (0 = none, 2-4 = visible)
  bold: boolean;                 // -1 in ASS = bold
  italic: boolean;               // -1 in ASS = italic
  uppercase: boolean;            // Transform text to uppercase before ASS

  // ========== Position & Layout ==========
  alignment: number;             // ASS numpad position (2=bottom-center, 5=center, 8=top)
  marginV: number;               // Vertical margin in pixels
  marginL: number;               // Left margin
  marginR: number;               // Right margin

  // ========== Grouping Mode ==========
  // 0 = smart semantic grouping (DEFAULT)
  // 1 = single word per frame (karaoke)
  // 2-6 = fixed group size
  wordsPerGroup: number;

  // ========== Animation ==========
  animationType: CaptionAnimationType;
  fadeInMs: number;              // 0 for instant appear
  fadeOutMs: number;             // 0 for instant disappear
  scaleOvershoot: boolean;       // For bounce: momentary 120% scale on appear

  // ========== Background Box ==========
  backgroundBox: boolean;        // ASS BorderStyle: 3
  backgroundAlpha: string;       // ASS alpha hex, e.g. '80' = ~50% opacity
  backgroundPadding: number;     // Padding around text in box
}

// ============================================
// GENERATION CONFIG
// ============================================

/**
 * Caption configuration passed in generation request
 */
export interface CaptionGenerationConfig {
  enabled: boolean;              // Whether to generate captions
  styleId: string;               // Preset ID like 'hormozi-bold', or 'none'
}

// ============================================
// LEGACY TYPE COMPATIBILITY
// ============================================

/**
 * Legacy CaptionStyle interface for backward compatibility
 * Used by existing ass-generator.ts
 */
export interface LegacyCaptionStyle {
  fontName: string;
  fontSize: number;
  primaryColor: string;
  highlightColor: string;
  outlineColor: string;
  outlineWidth: number;
  alignment: number;
  marginV: number;
  bold: boolean;
  shadow: number;
}

/**
 * Convert new CaptionStyleConfig to legacy format
 */
export function toLegacyStyle(config: CaptionStyleConfig): LegacyCaptionStyle {
  return {
    fontName: config.fontFamily,
    fontSize: config.fontSize,
    primaryColor: config.primaryColor,
    highlightColor: config.highlightColor,
    outlineColor: config.outlineColor,
    outlineWidth: config.outlineWidth,
    alignment: config.alignment,
    marginV: config.marginV,
    bold: config.bold,
    shadow: config.shadowDepth,
  };
}
