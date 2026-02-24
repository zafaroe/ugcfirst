import { VideoTemplate, TemplateSection } from '@/types/templates';
import { pasTemplate } from './pas';
import { unboxingTemplate } from './unboxing';
import { testimonialTemplate } from './testimonial';

// ============================================
// TEMPLATE REGISTRY
// ============================================

export const templates: VideoTemplate[] = [
  pasTemplate,
  unboxingTemplate,
  testimonialTemplate,
];

// ============================================
// LOOKUP FUNCTIONS
// ============================================

export function getTemplateById(id: string): VideoTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): VideoTemplate[] {
  return templates.filter((t) => t.category === category);
}

export function getTemplatesByPriority(priority: string): VideoTemplate[] {
  return templates.filter((t) => t.priority === priority);
}

export function getAllTemplates(): VideoTemplate[] {
  return templates;
}

// ============================================
// DURATION/WORD COUNT UTILITIES
// ============================================

/**
 * Calculate estimated duration based on word count
 * Average speaking rate: ~150 words per minute = 2.5 words per second
 */
export function calculateDuration(wordCount: number): number {
  const wordsPerSecond = 2.5;
  return Math.ceil(wordCount / wordsPerSecond);
}

/**
 * Calculate word count from duration
 */
export function calculateWordCount(durationSeconds: number): number {
  const wordsPerSecond = 2.5;
  return Math.floor(durationSeconds * wordsPerSecond);
}

/**
 * Get total template duration from sections
 */
export function getTemplateTotalDuration(template: VideoTemplate): number {
  const lastSection = template.sections[template.sections.length - 1];
  return lastSection.endTime;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate a section's content against its constraints
 */
export function validateSectionContent(
  content: string,
  section: TemplateSection
): { isValid: boolean; message?: string } {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  if (section.required && wordCount === 0) {
    return { isValid: false, message: 'This section is required' };
  }

  if (wordCount < section.wordCount.min) {
    return {
      isValid: false,
      message: `Too short. Minimum ${section.wordCount.min} words recommended.`,
    };
  }

  if (wordCount > section.wordCount.max) {
    return {
      isValid: false,
      message: `Too long. Maximum ${section.wordCount.max} words recommended.`,
    };
  }

  return { isValid: true };
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Format duration as mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration as "Xs" or "Xm Ys"
 */
export function formatDurationShort(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// ============================================
// HOOK HELPERS
// ============================================

/**
 * Replace placeholders in hook examples with product context
 */
export function personalizeHook(
  hookTemplate: string,
  context: {
    problem?: string;
    product?: string;
    oldSolution?: string;
  }
): string {
  let result = hookTemplate;

  if (context.problem) {
    result = result.replace(/\[problem\]/g, context.problem);
  }
  if (context.product) {
    result = result.replace(/\[product\]/g, context.product);
  }
  if (context.oldSolution) {
    result = result.replace(/\[old solution\]/g, context.oldSolution);
  }

  return result;
}

// ============================================
// RE-EXPORTS
// ============================================

export { pasTemplate, unboxingTemplate, testimonialTemplate };
