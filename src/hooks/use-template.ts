'use client';

import { create } from 'zustand';
import {
  VideoTemplate,
  TemplateScript,
  ScriptSection,
  ProductContext,
} from '@/types/templates';
import {
  getTemplateById,
  calculateDuration,
  validateSectionContent,
} from '@/data/templates';

// ============================================
// STORE INTERFACE
// ============================================

interface TemplateState {
  // Selected template
  selectedTemplate: VideoTemplate | null;

  // Script content
  script: TemplateScript | null;

  // Product context for generation
  productContext: ProductContext | null;

  // UI state
  isGenerating: boolean;
  activeSection: string | null;

  // Actions
  selectTemplate: (templateId: string) => void;
  clearTemplate: () => void;
  setProductContext: (product: ProductContext) => void;
  updateSectionContent: (sectionId: string, content: string) => void;
  setActiveSection: (sectionId: string | null) => void;
  useHookExample: (hookText: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  resetScript: () => void;

  // Computed helpers
  getTotalDuration: () => number;
  getTotalWordCount: () => number;
  isScriptComplete: () => boolean;
  getSectionValidation: (sectionId: string) => { isValid: boolean; message?: string };
  getScriptContent: () => Record<string, string>;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useTemplateStore = create<TemplateState>((set, get) => ({
  selectedTemplate: null,
  script: null,
  productContext: null,
  isGenerating: false,
  activeSection: null,

  selectTemplate: (templateId: string) => {
    const template = getTemplateById(templateId);
    if (!template) return;

    // Initialize empty script with all sections
    const sections: ScriptSection[] = template.sections.map((section) => ({
      sectionId: section.id,
      content: '',
      wordCount: 0,
      estimatedDuration: 0,
      isValid: !section.required, // Valid if not required and empty
    }));

    set({
      selectedTemplate: template,
      script: {
        templateId: template.id,
        sections,
        totalDuration: 0,
        totalWordCount: 0,
        isComplete: false,
      },
      activeSection: template.sections[0]?.id || null,
    });
  },

  clearTemplate: () => {
    set({
      selectedTemplate: null,
      script: null,
      activeSection: null,
    });
  },

  setProductContext: (product: ProductContext) => {
    set({ productContext: product });
  },

  updateSectionContent: (sectionId: string, content: string) => {
    const { selectedTemplate, script } = get();
    if (!selectedTemplate || !script) return;

    const templateSection = selectedTemplate.sections.find(
      (s) => s.id === sectionId
    );
    if (!templateSection) return;

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const estimatedDuration = calculateDuration(wordCount);
    const validation = validateSectionContent(content, templateSection);

    const updatedSections = script.sections.map((section) =>
      section.sectionId === sectionId
        ? {
            ...section,
            content,
            wordCount,
            estimatedDuration,
            isValid: validation.isValid,
            validationMessage: validation.message,
          }
        : section
    );

    const totalWordCount = updatedSections.reduce(
      (sum, s) => sum + s.wordCount,
      0
    );
    const totalDuration = calculateDuration(totalWordCount);
    const isComplete = updatedSections.every((s) => s.isValid);

    set({
      script: {
        ...script,
        sections: updatedSections,
        totalWordCount,
        totalDuration,
        isComplete,
      },
    });
  },

  setActiveSection: (sectionId: string | null) => {
    set({ activeSection: sectionId });
  },

  useHookExample: (hookText: string) => {
    const { selectedTemplate } = get();
    if (!selectedTemplate) return;

    // Find the first section (usually the hook)
    const hookSection = selectedTemplate.sections.find(
      (s) => s.id === 'hook' || s.id === 'anticipation' || s.id === 'context'
    );
    if (hookSection) {
      get().updateSectionContent(hookSection.id, hookText);
    }
  },

  setIsGenerating: (isGenerating: boolean) => {
    set({ isGenerating });
  },

  resetScript: () => {
    const { selectedTemplate } = get();
    if (!selectedTemplate) return;

    const sections: ScriptSection[] = selectedTemplate.sections.map((section) => ({
      sectionId: section.id,
      content: '',
      wordCount: 0,
      estimatedDuration: 0,
      isValid: !section.required,
    }));

    set({
      script: {
        templateId: selectedTemplate.id,
        sections,
        totalDuration: 0,
        totalWordCount: 0,
        isComplete: false,
      },
      activeSection: selectedTemplate.sections[0]?.id || null,
    });
  },

  getTotalDuration: () => {
    const { script } = get();
    return script?.totalDuration || 0;
  },

  getTotalWordCount: () => {
    const { script } = get();
    return script?.totalWordCount || 0;
  },

  isScriptComplete: () => {
    const { script } = get();
    return script?.isComplete || false;
  },

  getSectionValidation: (sectionId: string) => {
    const { script, selectedTemplate } = get();
    if (!script || !selectedTemplate) {
      return { isValid: false, message: 'No template selected' };
    }

    const section = script.sections.find((s) => s.sectionId === sectionId);
    const templateSection = selectedTemplate.sections.find(
      (s) => s.id === sectionId
    );

    if (!section || !templateSection) {
      return { isValid: false, message: 'Section not found' };
    }

    return validateSectionContent(section.content, templateSection);
  },

  getScriptContent: () => {
    const { script } = get();
    if (!script) return {};

    return script.sections.reduce(
      (acc, section) => ({
        ...acc,
        [section.sectionId]: section.content,
      }),
      {} as Record<string, string>
    );
  },
}));

// ============================================
// CONVENIENCE HOOK
// ============================================

export function useTemplate() {
  return useTemplateStore();
}
