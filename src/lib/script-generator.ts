import {
  VideoTemplate,
  ProductContext,
  ScriptGeneratorInput,
  GeneratedScript,
  GeneratedSection,
} from '@/types/templates';

// ============================================
// SCRIPT GENERATION (MOCK FOR NOW)
// ============================================

/**
 * Generate a complete script for a template.
 * Currently returns mock content - will be replaced with AI API calls.
 */
export async function generateScript(
  input: ScriptGeneratorInput
): Promise<GeneratedScript> {
  const { template, product, tone = 'casual' } = input;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const sections: GeneratedSection[] = template.sections.map((section) => {
    const content = generateSectionContent(section.id, template.id, product, tone);
    return {
      sectionId: section.id,
      content,
      alternativeOptions: isHookSection(section.id)
        ? generateAlternativeHooks(template, product)
        : undefined,
    };
  });

  // Calculate estimated duration
  const totalWords = sections.reduce(
    (sum, s) => sum + s.content.split(/\s+/).length,
    0
  );
  const estimatedDuration = Math.ceil(totalWords / 2.5);

  return {
    sections,
    estimatedDuration,
  };
}

/**
 * Check if a section is a hook section
 */
function isHookSection(sectionId: string): boolean {
  return ['hook', 'anticipation', 'context'].includes(sectionId);
}

/**
 * Generate content for a single section.
 * This is a placeholder - will be replaced with AI generation.
 */
function generateSectionContent(
  sectionId: string,
  templateId: string,
  product: ProductContext,
  tone: string
): string {
  const productName = product.name;
  const mainBenefit = product.benefits?.[0] || 'amazing results';
  const problem = product.targetProblem || 'this common problem';

  // Template-specific generation
  const contentMap: Record<string, Record<string, string>> = {
    pas: {
      hook: `I was SO tired of ${problem}... then I found this.`,
      problem: `You know that frustrating feeling when ${problem}? I dealt with it for months, trying everything.`,
      agitate: `I wasted so much money on products that didn't work. Nothing seemed to help, and I was about to give up.`,
      solution: `Then I discovered ${productName}. Within just a week, I noticed ${mainBenefit}. It actually works, and here's why...`,
      cta: `If you're dealing with the same thing, link is in my bio. Trust me on this one.`,
    },
    unboxing: {
      anticipation: `My ${productName} finally arrived! I've been waiting for this, let me show you what's inside.`,
      'package-reveal': `Okay, the packaging is actually really nice. Look at this... Let's open it up.`,
      'product-reveal': `Oh wow, it's even better than I expected! Look at the quality here. This is the ${productName} and it feels premium.`,
      reaction: `I'm genuinely impressed. The quality is incredible and it's exactly what I was hoping for.`,
      'feature-highlight': `What I love most is ${mainBenefit}. Plus it has these other features that make it stand out.`,
      cta: `Link in bio if you want one! They sell out fast.`,
    },
    testimonial: {
      context: `Okay so I've been dealing with ${problem} for a while now.`,
      skepticism: `I was really skeptical about trying another product because nothing seemed to work before. I've tried so many things.`,
      introduction: `But I kept seeing people talk about ${productName}, so I decided to give it one more shot.`,
      results: `After using it for two weeks, I can honestly say ${mainBenefit}. The difference is actually noticeable, and I wish I had tried this sooner.`,
      recommendation: `If you're on the fence, just try it. Seriously. Link in bio - this one's worth it.`,
    },
  };

  return contentMap[templateId]?.[sectionId] || `Content for ${sectionId}...`;
}

/**
 * Generate alternative hook options.
 */
function generateAlternativeHooks(
  template: VideoTemplate,
  product: ProductContext
): string[] {
  const problem = product.targetProblem || '[problem]';
  const productName = product.name;

  return template.hookExamples
    .slice(0, 3)
    .map((hook) =>
      hook
        .replace(/\[problem\]/g, problem)
        .replace(/\[product\]/g, productName)
        .replace(/\[old solution\]/g, 'other products')
    );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Estimate reading time for text.
 */
export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 2.5); // 2.5 words per second
}

/**
 * Count words in text.
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Format duration as mm:ss.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate that all required sections have content
 */
export function validateScript(
  template: VideoTemplate,
  sections: Record<string, string>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const section of template.sections) {
    const content = sections[section.id] || '';
    const wordCount = countWords(content);

    if (section.required && wordCount === 0) {
      errors.push(`${section.name} is required`);
    } else if (wordCount > 0 && wordCount < section.wordCount.min) {
      errors.push(`${section.name} is too short (min ${section.wordCount.min} words)`);
    } else if (wordCount > section.wordCount.max) {
      errors.push(`${section.name} is too long (max ${section.wordCount.max} words)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
