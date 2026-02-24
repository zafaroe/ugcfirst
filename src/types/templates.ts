// ============================================
// TEMPLATE SECTION TYPES
// ============================================

export interface TemplateSection {
  /** Unique identifier for the section */
  id: string;
  /** Display name (e.g., "Hook", "Problem") */
  name: string;
  /** Brief description of section purpose */
  description: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Placeholder text to guide user */
  placeholder: string;
  /** Writing tips for this section */
  tips: string[];
  /** Whether section must be filled */
  required: boolean;
  /** Recommended word count range */
  wordCount: {
    min: number;
    max: number;
    recommended: number;
  };
  /** Color for timeline visualization (Tailwind class) */
  color: string;
}

// ============================================
// TEMPLATE TYPES
// ============================================

export type TemplateCategory = 'conversion' | 'engagement' | 'awareness';
export type TemplatePriority = 'critical' | 'high' | 'medium';
export type AIModel = 'sora-2' | 'veo-3';

export interface VideoTemplate {
  /** Unique template identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description for cards */
  shortDescription: string;
  /** Detailed description */
  description: string;
  /** Template category */
  category: TemplateCategory;
  /** Implementation priority */
  priority: TemplatePriority;
  /** Conversion rating 1-5 */
  conversionRating: number;
  /** Duration constraints in seconds */
  duration: {
    min: number;
    max: number;
    recommended: number;
  };
  /** Ordered list of sections */
  sections: TemplateSection[];
  /** Example hooks users can use */
  hookExamples: string[];
  /** Best use cases */
  bestFor: string[];
  /** AI model configuration */
  aiModel: {
    primary: AIModel;
    secondary?: AIModel;
    secondaryUsage?: string;
  };
  /** Tags for filtering/display */
  tags: string[];
  /** Icon name from Lucide */
  icon: string;
}

// ============================================
// SCRIPT TYPES
// ============================================

export interface ScriptSection {
  sectionId: string;
  content: string;
  wordCount: number;
  estimatedDuration: number;
  isValid: boolean;
  validationMessage?: string;
}

export interface TemplateScript {
  templateId: string;
  sections: ScriptSection[];
  totalDuration: number;
  totalWordCount: number;
  isComplete: boolean;
}

// ============================================
// GENERATOR TYPES
// ============================================

export interface ProductContext {
  name: string;
  description: string;
  features: string[];
  benefits: string[];
  targetProblem?: string;
  price?: number;
  category?: string;
}

export interface ScriptGeneratorInput {
  template: VideoTemplate;
  product: ProductContext;
  tone?: 'casual' | 'professional' | 'energetic' | 'friendly';
  targetAudience?: string;
}

export interface GeneratedSection {
  sectionId: string;
  content: string;
  alternativeOptions?: string[];
}

export interface GeneratedScript {
  sections: GeneratedSection[];
  estimatedDuration: number;
}
