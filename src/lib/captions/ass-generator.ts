/**
 * ASS Subtitle Generator
 *
 * Generates ASS (Advanced SubStation Alpha) subtitle files
 * with Hormozi-style word-by-word highlighting.
 */

import * as fs from 'fs';
import { WordGroup, formatTimestamp, groupWordsSmooth, WordTimestamp } from './stt';

// ============================================
// TYPES
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
  style?: Partial<CaptionStyle>;
  wordsPerGroup?: number;
  smoothTransitions?: boolean;
  videoWidth?: number;
  videoHeight?: number;
}

// ============================================
// DEFAULT STYLE (Hormozi-Style)
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
// ASS FILE GENERATION
// ============================================

/**
 * Generate ASS header section
 */
function generateHeader(
  style: CaptionStyle,
  videoWidth: number,
  videoHeight: number
): string {
  return `[Script Info]
Title: Vidnary Auto Captions
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

/**
 * Generate ASS dialogue line with word highlighting
 */
function generateDialogueLine(
  group: WordGroup,
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
  } = options;

  // Merge custom style with defaults
  const style: CaptionStyle = { ...DEFAULT_STYLE, ...customStyle };

  // Group words
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
 * Group words helper (imported from stt.ts but exposed here for convenience)
 */
function groupWords(
  words: WordTimestamp[],
  wordsPerGroup: number = 3
): WordGroup[] {
  const groups: WordGroup[] = [];

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
// PRESET STYLES
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
    highlightColor: hexToASSColor('#D946EF'), // Vibrant fuchsia
    outlineColor: hexToASSColor('#000000'),
    outlineWidth: 4,
    bold: true,
  } as Partial<CaptionStyle>,

  // Electric indigo
  indigo: {
    fontName: 'Inter',
    fontSize: 50,
    primaryColor: hexToASSColor('#FFFFFF'),
    highlightColor: hexToASSColor('#6366F1'), // Electric indigo
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
  generateFile: generateASSFile,
  writeFile: writeASSFile,
  hexToASSColor,
  assColorToHex,
  presets: CaptionPresets,
  defaultStyle: DEFAULT_STYLE,
};
