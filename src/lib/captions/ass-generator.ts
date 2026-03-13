/**
 * ASS Subtitle Generator
 *
 * Generates ASS (Advanced SubStation Alpha) subtitle files
 * with word-by-word highlighting and animation support.
 *
 * Supports multiple caption styles with:
 * - Smart semantic grouping
 * - Moving highlight effect
 * - Fade, bounce, and typewriter animations
 * - Background box support
 * - Uppercase transform
 */

import * as fs from 'fs';
import { WordGroup as LegacyWordGroup, formatTimestamp, groupWordsSmooth, WordTimestamp } from './stt';
import { groupWordsSmartly, groupWordsFixed } from './smart-grouping';
import {
  CaptionStyleConfig,
  WordGroup,
  STTWord,
  DEFAULT_GROUPING_CONFIG,
  LegacyCaptionStyle,
  toLegacyStyle,
} from '@/types/captions';
import { getCaptionPreset, getDefaultPreset, hexToAssBgr } from '@/config/caption-styles';

// ============================================
// LEGACY TYPES (for backward compatibility)
// ============================================

export interface CaptionStyle {
  fontName: string;
  fontSize: number;
  primaryColor: string; // ASS color format: &HBBGGRR
  highlightColor: string;
  outlineColor: string;
  outlineWidth: number;
  alignment: number; // 2 = center bottom, 8 = center top
  marginV: number; // Vertical margin from bottom
  bold: boolean;
  shadow: number;
}

export interface GenerateASSOptions {
  style?: Partial<CaptionStyle> | CaptionStyleConfig;
  wordsPerGroup?: number;
  smoothTransitions?: boolean;
  videoWidth?: number;
  videoHeight?: number;
  /** New: Use CaptionStyleConfig directly */
  captionStyle?: CaptionStyleConfig;
}

// ============================================
// DEFAULT STYLE (Hormozi-Style) - Legacy
// ============================================

const DEFAULT_STYLE: CaptionStyle = {
  fontName: 'Montserrat',
  fontSize: 52,
  primaryColor: '&HFFFFFF', // White
  highlightColor: '&H00BFFF', // Amber (#FBBF24) in BGR
  outlineColor: '&H000000', // Black
  outlineWidth: 3,
  alignment: 2, // Center bottom
  marginV: 150, // 150px from bottom
  bold: true,
  shadow: 2,
};

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Check if style is a full CaptionStyleConfig
 */
function isCaptionStyleConfig(style: unknown): style is CaptionStyleConfig {
  return (
    typeof style === 'object' &&
    style !== null &&
    'id' in style &&
    'animationType' in style &&
    'tier' in style
  );
}

// ============================================
// ASS HEADER GENERATION
// ============================================

/**
 * Generate ASS header with style line from CaptionStyleConfig
 */
function generateHeaderFromConfig(
  config: CaptionStyleConfig,
  videoWidth: number,
  videoHeight: number
): string {
  // BorderStyle: 1 = outline, 3 = opaque box
  const borderStyle = config.backgroundBox ? 3 : 1;

  // BackColour with alpha for background box
  const backColour = config.backgroundBox
    ? hexToAssBgr('#000000', config.backgroundAlpha)
    : '&H00000000';

  return `[Script Info]
Title: UGCFirst Auto Captions
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${config.fontFamily},${config.fontSize},${config.primaryColor},&H0000FF00,${config.outlineColor},${backColour},${config.bold ? -1 : 0},${config.italic ? -1 : 0},0,0,100,100,0,0,${borderStyle},${config.outlineWidth},${config.shadowDepth},${config.alignment},${config.marginL},${config.marginR},${config.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
}

/**
 * Generate ASS header section (legacy)
 */
function generateHeader(
  style: CaptionStyle,
  videoWidth: number,
  videoHeight: number
): string {
  return `[Script Info]
Title: UGCFirst Auto Captions
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontName},${style.fontSize},${style.primaryColor},&H0000FF00,${style.outlineColor},&H00000000,${style.bold ? -1 : 0},0,0,0,100,100,0,0,1,${style.outlineWidth},${style.shadow},${style.alignment},10,10,${style.marginV},1
Style: Highlight,${style.fontName},${style.fontSize},${style.highlightColor},&H0000FF00,${style.outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${style.outlineWidth},${style.shadow},${style.alignment},10,10,${style.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
}

// ============================================
// TIME FORMATTING
// ============================================

/**
 * Format milliseconds to ASS timecode: H:MM:SS.CC
 */
function formatAssTime(ms: number): string {
  const seconds = ms / 1000;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

// ============================================
// DIALOGUE GENERATION WITH ANIMATIONS
// ============================================

/**
 * Generate dialogue events for a word group with moving highlight
 */
function generateGroupDialogueEvents(
  group: WordGroup,
  config: CaptionStyleConfig
): string[] {
  const events: string[] = [];

  for (let i = 0; i < group.words.length; i++) {
    const word = group.words[i];

    // Build the text line with highlight on the active word
    const textParts = group.words.map((w, j) => {
      let displayText = config.uppercase ? w.text.toUpperCase() : w.text;

      if (j === i) {
        // Active word - apply highlight color (and bold if style allows)
        return `{\\c${config.highlightColor}\\b1}${displayText}{\\c${config.primaryColor}\\b0}`;
      }
      return displayText;
    });

    // Timing: this sub-event starts when the word starts
    // and ends when the next word starts (or group ends)
    const startTime = word.start;
    const endTime =
      i < group.words.length - 1 ? group.words[i + 1].start : group.endTime;

    // Build animation prefix
    let prefix = '';

    // Fade animation on first word of group
    if (config.animationType === 'fade' && i === 0) {
      prefix = `{\\fad(${config.fadeInMs},${config.fadeOutMs})}`;
    }

    // Bounce animation on first word of group
    if (config.animationType === 'bounce' && i === 0 && config.scaleOvershoot) {
      // Start at 130% scale, animate to 100% over 100ms
      prefix = `{\\fscx130\\fscy130\\t(0,100,\\fscx100\\fscy100)}`;
    }

    // Typewriter: progressive reveal (each word fades in)
    if (config.animationType === 'typewriter') {
      const fadeMs = 50; // Quick fade per word
      prefix = `{\\fad(${fadeMs},0)}`;
    }

    const startTimecode = formatAssTime(startTime);
    const endTimecode = formatAssTime(endTime);
    const text = prefix + textParts.join(' ');

    events.push(`Dialogue: 0,${startTimecode},${endTimecode},Default,,0,0,0,,${text}`);
  }

  return events;
}

/**
 * Generate dialogue events for karaoke mode (one word at a time)
 */
function generateKaraokeDialogueEvents(
  words: STTWord[],
  config: CaptionStyleConfig
): string[] {
  const events: string[] = [];

  for (const word of words) {
    let displayText = config.uppercase ? word.text.toUpperCase() : word.text;

    // Apply highlight color to the single word
    const text = `{\\c${config.highlightColor}\\b1}${displayText}{\\c${config.primaryColor}\\b0}`;

    const startTimecode = formatAssTime(word.start);
    const endTimecode = formatAssTime(word.end);

    events.push(`Dialogue: 0,${startTimecode},${endTimecode},Default,,0,0,0,,${text}`);
  }

  return events;
}

// ============================================
// MAIN GENERATION FUNCTIONS
// ============================================

/**
 * Generate ASS file content using CaptionStyleConfig
 */
export function generateASSWithConfig(
  words: STTWord[],
  config: CaptionStyleConfig,
  videoWidth: number = 1080,
  videoHeight: number = 1920
): string {
  if (words.length === 0) {
    return generateHeaderFromConfig(config, videoWidth, videoHeight);
  }

  // Group words based on style config
  let dialogueEvents: string[] = [];

  if (config.wordsPerGroup === 0) {
    // Smart semantic grouping
    const groups = groupWordsSmartly(words, DEFAULT_GROUPING_CONFIG);

    for (const group of groups) {
      const events = generateGroupDialogueEvents(group, config);
      dialogueEvents.push(...events);
    }
  } else if (config.wordsPerGroup === 1 || config.animationType === 'karaoke') {
    // Karaoke mode - one word at a time
    dialogueEvents = generateKaraokeDialogueEvents(words, config);
  } else {
    // Fixed group size
    const groups = groupWordsFixed(words, config.wordsPerGroup);

    for (const group of groups) {
      const events = generateGroupDialogueEvents(group, config);
      dialogueEvents.push(...events);
    }
  }

  // Build complete ASS file
  let ass = generateHeaderFromConfig(config, videoWidth, videoHeight);
  ass += dialogueEvents.join('\n') + '\n';

  return ass;
}

/**
 * Generate ASS dialogue line with word highlighting (legacy)
 */
function generateDialogueLine(
  group: LegacyWordGroup,
  style: CaptionStyle
): string {
  const start = formatTimestamp(group.start, 'ass');
  const end = formatTimestamp(group.end, 'ass');

  // Build text with highlighting
  const textParts = group.words.map((word, idx) => {
    if (idx === group.highlightIndex) {
      // Highlighted word - use highlight color and bold
      return `{\\c${style.highlightColor}\\b1}${word}{\\c${style.primaryColor}\\b0}`;
    }
    return word;
  });

  const text = textParts.join(' ');

  return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
}

/**
 * Generate complete ASS subtitle file from word timestamps
 *
 * @param words - Array of word timestamps from STT
 * @param options - Generation options
 * @returns ASS file content as string
 */
export function generateASS(
  words: WordTimestamp[],
  options: GenerateASSOptions = {}
): string {
  const {
    style: customStyle = {},
    wordsPerGroup = 3,
    smoothTransitions = true,
    videoWidth = 1080,
    videoHeight = 1920,
    captionStyle,
  } = options;

  // If captionStyle is provided, use the new generation path
  if (captionStyle) {
    // Convert WordTimestamp to STTWord format
    const sttWords: STTWord[] = words.map((w) => ({
      text: w.word,
      start: w.start,
      end: w.end,
    }));

    return generateASSWithConfig(sttWords, captionStyle, videoWidth, videoHeight);
  }

  // Check if customStyle is a full CaptionStyleConfig
  if (isCaptionStyleConfig(customStyle)) {
    const sttWords: STTWord[] = words.map((w) => ({
      text: w.word,
      start: w.start,
      end: w.end,
    }));

    return generateASSWithConfig(sttWords, customStyle, videoWidth, videoHeight);
  }

  // Legacy path: merge custom style with defaults
  const style: CaptionStyle = { ...DEFAULT_STYLE, ...customStyle };

  // Group words using legacy grouping
  const groups = smoothTransitions
    ? groupWordsSmooth(words, wordsPerGroup)
    : groupWords(words, wordsPerGroup);

  // Generate header
  let ass = generateHeader(style, videoWidth, videoHeight);

  // Generate dialogue lines
  for (const group of groups) {
    ass += generateDialogueLine(group, style) + '\n';
  }

  return ass;
}

/**
 * Group words helper (legacy - imported from stt.ts but exposed here for convenience)
 */
function groupWords(
  words: WordTimestamp[],
  wordsPerGroup: number = 3
): LegacyWordGroup[] {
  const groups: LegacyWordGroup[] = [];

  for (let i = 0; i < words.length; i += wordsPerGroup) {
    const groupWords = words.slice(i, i + wordsPerGroup);

    if (groupWords.length === 0) continue;

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
 * Write ASS content to file
 */
export function writeASSFile(assContent: string, outputPath: string): void {
  fs.writeFileSync(outputPath, assContent, 'utf-8');
}

/**
 * Generate ASS file from words and write to disk
 */
export function generateASSFile(
  words: WordTimestamp[],
  outputPath: string,
  options: GenerateASSOptions = {}
): string {
  const assContent = generateASS(words, options);
  writeASSFile(assContent, outputPath);
  return outputPath;
}

// ============================================
// COLOR UTILITIES
// ============================================

/**
 * Convert hex color to ASS color format
 * Hex: #RRGGBB -> ASS: &HBBGGRR
 */
export function hexToASSColor(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB
  const r = cleanHex.substring(0, 2);
  const g = cleanHex.substring(2, 4);
  const b = cleanHex.substring(4, 6);

  // Return in BGR format
  return `&H${b}${g}${r}`;
}

/**
 * Convert ASS color to hex
 * ASS: &HBBGGRR -> Hex: #RRGGBB
 */
export function assColorToHex(assColor: string): string {
  // Remove &H prefix
  const cleanAss = assColor.replace('&H', '');

  // Parse BGR
  const b = cleanAss.substring(0, 2);
  const g = cleanAss.substring(2, 4);
  const r = cleanAss.substring(4, 6);

  return `#${r}${g}${b}`;
}

// ============================================
// PRESET STYLES (Legacy - use config/caption-styles.ts instead)
// ============================================

export const CaptionPresets = {
  // Default Hormozi-style
  hormozi: {
    fontName: 'Montserrat',
    fontSize: 52,
    primaryColor: hexToASSColor('#FFFFFF'),
    highlightColor: hexToASSColor('#FBBF24'), // Amber
    outlineColor: hexToASSColor('#000000'),
    outlineWidth: 3,
    bold: true,
  } as Partial<CaptionStyle>,

  // Minimal white
  minimal: {
    fontName: 'Inter',
    fontSize: 48,
    primaryColor: hexToASSColor('#FFFFFF'),
    highlightColor: hexToASSColor('#FFFFFF'),
    outlineColor: hexToASSColor('#000000'),
    outlineWidth: 2,
    bold: false,
  } as Partial<CaptionStyle>,

  // Bold gradient (fuchsia highlight)
  gradient: {
    fontName: 'Montserrat',
    fontSize: 56,
    primaryColor: hexToASSColor('#FFFFFF'),
    highlightColor: hexToASSColor('#F43F5E'), // Vibrant fuchsia
    outlineColor: hexToASSColor('#000000'),
    outlineWidth: 4,
    bold: true,
  } as Partial<CaptionStyle>,

  // Electric indigo
  indigo: {
    fontName: 'Inter',
    fontSize: 50,
    primaryColor: hexToASSColor('#FFFFFF'),
    highlightColor: hexToASSColor('#10B981'), // Electric indigo
    outlineColor: hexToASSColor('#000000'),
    outlineWidth: 3,
    bold: true,
  } as Partial<CaptionStyle>,

  // Green/success highlight
  success: {
    fontName: 'Montserrat',
    fontSize: 52,
    primaryColor: hexToASSColor('#FFFFFF'),
    highlightColor: hexToASSColor('#10B981'), // Success green
    outlineColor: hexToASSColor('#000000'),
    outlineWidth: 3,
    bold: true,
  } as Partial<CaptionStyle>,
};

// ============================================
// EXPORTS
// ============================================

export const ASSGenerator = {
  generate: generateASS,
  generateWithConfig: generateASSWithConfig,
  generateFile: generateASSFile,
  writeFile: writeASSFile,
  hexToASSColor,
  assColorToHex,
  presets: CaptionPresets,
  defaultStyle: DEFAULT_STYLE,
};

// Re-export types
export type { CaptionStyleConfig, STTWord, WordGroup };
