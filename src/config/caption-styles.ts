/**
 * Caption Style Presets
 *
 * Defines the available caption styles for video generation.
 * All styles use smart semantic grouping by default (wordsPerGroup: 0).
 */

import { CaptionStyleConfig } from '@/types/captions';

// ============================================
// COLOR UTILITIES
// ============================================

/**
 * Convert hex color #RRGGBB to ASS BGR format &H00BBGGRR
 * ASS uses BGR byte order with alpha prefix.
 * Alpha: 00 = fully opaque, FF = fully transparent (inverted from CSS)
 */
export function hexToAssBgr(hex: string, alpha: string = '00'): string {
  const clean = hex.replace('#', '');
  const r = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const b = clean.substring(4, 6);
  return `&H${alpha}${b}${g}${r}`;
}

/**
 * Convert ASS BGR format to hex #RRGGBB
 */
export function assBgrToHex(ass: string): string {
  // Remove &H prefix and alpha
  const clean = ass.replace(/&H[0-9A-Fa-f]{2}/, '');
  const b = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const r = clean.substring(4, 6);
  return `#${r}${g}${b}`;
}

// ============================================
// CAPTION PRESETS
// ============================================

/**
 * Hormozi Bold - The classic TikTok viral caption style
 * Montserrat Black, amber highlight, bold outline
 */
const HORMOZI_BOLD: CaptionStyleConfig = {
  id: 'hormozi-bold',
  name: 'Hormozi Bold',
  description: 'Classic viral style with amber highlights',
  tier: 'standard',
  category: 'bold',

  fontFamily: 'Montserrat',
  fontSize: 52,
  primaryColor: hexToAssBgr('#FFFFFF'),       // White
  highlightColor: hexToAssBgr('#FBBF24'),     // Amber
  outlineColor: hexToAssBgr('#000000'),       // Black
  outlineWidth: 3,
  shadowColor: hexToAssBgr('#000000', '80'),  // Semi-transparent black
  shadowDepth: 2,
  bold: true,
  italic: false,
  uppercase: false,

  alignment: 2,   // Bottom center
  marginV: 150,
  marginL: 10,
  marginR: 10,

  wordsPerGroup: 0,  // Smart semantic grouping

  animationType: 'highlight',
  fadeInMs: 0,
  fadeOutMs: 0,
  scaleOvershoot: false,

  backgroundBox: false,
  backgroundAlpha: '00',
  backgroundPadding: 0,
};

/**
 * Clean Minimal - Subtle and professional
 * DM Sans, dim-to-bright highlight effect
 */
const CLEAN_MINIMAL: CaptionStyleConfig = {
  id: 'clean-minimal',
  name: 'Clean Minimal',
  description: 'Subtle and professional appearance',
  tier: 'standard',
  category: 'clean',

  fontFamily: 'DM Sans',
  fontSize: 42,
  primaryColor: hexToAssBgr('#9CA3AF'),       // Gray-400 (dim)
  highlightColor: hexToAssBgr('#FFFFFF'),     // Bright white
  outlineColor: hexToAssBgr('#000000'),
  outlineWidth: 0,  // No outline
  shadowColor: hexToAssBgr('#000000', 'C0'),
  shadowDepth: 1,
  bold: false,
  italic: false,
  uppercase: false,

  alignment: 2,
  marginV: 120,
  marginL: 10,
  marginR: 10,

  wordsPerGroup: 0,

  animationType: 'highlight',
  fadeInMs: 0,
  fadeOutMs: 0,
  scaleOvershoot: false,

  backgroundBox: false,
  backgroundAlpha: '00',
  backgroundPadding: 0,
};

/**
 * Boxed Subtitle - Modern with background box
 * Roboto Condensed Bold, mint highlight, semi-transparent box
 */
const BOXED_SUBTITLE: CaptionStyleConfig = {
  id: 'boxed-subtitle',
  name: 'Boxed Subtitle',
  description: 'Modern style with background box',
  tier: 'standard',
  category: 'clean',

  fontFamily: 'Roboto Condensed',
  fontSize: 44,
  primaryColor: hexToAssBgr('#FFFFFF'),
  highlightColor: hexToAssBgr('#10B981'),     // Mint
  outlineColor: hexToAssBgr('#000000'),
  outlineWidth: 0,
  shadowColor: hexToAssBgr('#000000', '80'),
  shadowDepth: 0,
  bold: true,
  italic: false,
  uppercase: false,

  alignment: 2,
  marginV: 130,
  marginL: 10,
  marginR: 10,

  wordsPerGroup: 0,

  animationType: 'highlight',
  fadeInMs: 0,
  fadeOutMs: 0,
  scaleOvershoot: false,

  backgroundBox: true,
  backgroundAlpha: '80',  // ~50% opacity
  backgroundPadding: 12,
};

/**
 * All Caps Impact - Bold centered uppercase
 * Montserrat Black, fuchsia highlight, maximum impact
 */
const ALL_CAPS_IMPACT: CaptionStyleConfig = {
  id: 'all-caps-impact',
  name: 'All Caps Impact',
  description: 'Maximum visual impact, centered',
  tier: 'standard',
  category: 'bold',

  fontFamily: 'Montserrat',
  fontSize: 56,
  primaryColor: hexToAssBgr('#FFFFFF'),
  highlightColor: hexToAssBgr('#E879F9'),     // Fuchsia
  outlineColor: hexToAssBgr('#000000'),
  outlineWidth: 4,
  shadowColor: hexToAssBgr('#000000', '80'),
  shadowDepth: 3,
  bold: true,
  italic: false,
  uppercase: true,  // Transform to uppercase

  alignment: 5,     // Center (not bottom)
  marginV: 0,
  marginL: 10,
  marginR: 10,

  wordsPerGroup: 2,  // Fewer words for impact

  animationType: 'bounce',
  fadeInMs: 0,
  fadeOutMs: 0,
  scaleOvershoot: true,

  backgroundBox: false,
  backgroundAlpha: '00',
  backgroundPadding: 0,
};

/**
 * Warm Story - Soft and inviting for storytelling
 * DM Sans, warm yellow tones, fade animation
 */
const WARM_STORY: CaptionStyleConfig = {
  id: 'warm-story',
  name: 'Warm Story',
  description: 'Soft and inviting for storytelling',
  tier: 'standard',
  category: 'editorial',

  fontFamily: 'DM Sans',
  fontSize: 44,
  primaryColor: hexToAssBgr('#FDE68A'),       // Warm yellow
  highlightColor: hexToAssBgr('#FFFFFF'),     // Bright white
  outlineColor: hexToAssBgr('#1C1917'),       // Dark brown (stone-900)
  outlineWidth: 2,
  shadowColor: hexToAssBgr('#1C1917', '80'),
  shadowDepth: 1,
  bold: false,
  italic: false,
  uppercase: false,

  alignment: 2,
  marginV: 140,
  marginL: 10,
  marginR: 10,

  wordsPerGroup: 0,

  animationType: 'fade',
  fadeInMs: 150,
  fadeOutMs: 100,
  scaleOvershoot: false,

  backgroundBox: false,
  backgroundAlpha: '00',
  backgroundPadding: 0,
};

// ============================================
// PRESETS ARRAY
// ============================================

/**
 * All available caption presets
 */
export const CAPTION_PRESETS: CaptionStyleConfig[] = [
  HORMOZI_BOLD,
  CLEAN_MINIMAL,
  BOXED_SUBTITLE,
  ALL_CAPS_IMPACT,
  WARM_STORY,
];

// ============================================
// LOOKUP FUNCTIONS
// ============================================

/**
 * Get a caption preset by ID
 */
export function getCaptionPreset(id: string): CaptionStyleConfig | undefined {
  return CAPTION_PRESETS.find((p) => p.id === id);
}

/**
 * Get the default caption preset (hormozi-bold)
 */
export function getDefaultPreset(): CaptionStyleConfig {
  return CAPTION_PRESETS.find((p) => p.id === 'hormozi-bold') || CAPTION_PRESETS[0];
}

/**
 * Get all presets for a specific tier
 */
export function getPresetsByTier(tier: 'standard' | 'premium'): CaptionStyleConfig[] {
  return CAPTION_PRESETS.filter((p) => p.tier === tier);
}

/**
 * Get all presets for a specific category
 */
export function getPresetsByCategory(
  category: 'bold' | 'clean' | 'creative' | 'editorial'
): CaptionStyleConfig[] {
  return CAPTION_PRESETS.filter((p) => p.category === category);
}

// ============================================
// EXPORTS
// ============================================

export const CaptionStyles = {
  presets: CAPTION_PRESETS,
  getPreset: getCaptionPreset,
  getDefault: getDefaultPreset,
  getByTier: getPresetsByTier,
  getByCategory: getPresetsByCategory,
  hexToAssBgr,
  assBgrToHex,
};
