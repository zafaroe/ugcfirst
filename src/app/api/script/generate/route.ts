import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/ai/gemini';
import { OpenAIService } from '@/lib/ai/openai';
import { ApproachSelector } from '@/lib/ai/approach-selector';
import type { PersonaProfile, FetchedProduct, GeneratedScript, ScriptApproach } from '@/types/generation';

// ============================================
// POST /api/script/generate
// Generate video scripts using Gemini
// ============================================

interface ScriptGenerateRequest {
  product: FetchedProduct;
  persona?: PersonaProfile;
  approach?: ScriptApproach; // Optional single approach
  approaches?: ScriptApproach[]; // Or multiple approaches
  templateId?: string | null; // 'pas', 'unboxing', 'testimonial', or null
}

// Template → forced approach mapping
// When a user selects a template, we force the matching approach
const TEMPLATE_APPROACH_MAP: Record<string, ScriptApproach> = {
  'pas': 'problem_agitate_solution',
  'unboxing': 'excited_discovery',
  'testimonial': 'skeptic_to_believer',
};

interface ScriptGenerateResponse {
  success: boolean;
  scripts?: GeneratedScript[];
  persona?: PersonaProfile;
  selectedApproach?: ScriptApproach; // Which approach was used (if auto-selected)
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ScriptGenerateResponse>> {
  try {
    const body: ScriptGenerateRequest = await request.json();

    // Validate input
    if (!body.product) {
      return NextResponse.json(
        { success: false, error: 'Product data is required' },
        { status: 400 }
      );
    }

    // Check if Gemini is configured
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Script generation is not configured. Please add your Google AI API key.' },
        { status: 500 }
      );
    }

    // Get or create persona profile
    let persona = body.persona;

    if (!persona) {
      // If no persona provided, analyze product to create one
      if (body.product.image && process.env.OPENAI_API_KEY) {
        try {
          persona = await OpenAIService.analyzeProduct(body.product.image, body.product.name);
        } catch (error) {
          console.warn('Persona analysis failed, using fallback:', error);
        }
      }

      // Fallback persona if analysis failed or no image
      if (!persona) {
        persona = createFallbackPersona(body.product);
      }
    }

    // Determine which approaches to use
    let approaches: ScriptApproach[];
    let autoSelectedApproach: ScriptApproach | undefined;

    if (body.templateId && TEMPLATE_APPROACH_MAP[body.templateId]) {
      // Template selected — force the matching approach
      const forcedApproach = TEMPLATE_APPROACH_MAP[body.templateId];
      console.log(`[Script Generation] Template "${body.templateId}" → forced approach: ${forcedApproach}`);
      approaches = [forcedApproach];
    } else if (body.approach) {
      // Single approach explicitly requested
      approaches = [body.approach];
    } else if (body.approaches && body.approaches.length > 0) {
      // Multiple approaches explicitly requested
      approaches = body.approaches;
    } else {
      // No template or approach specified - intelligently select the best one
      console.log('[Script Generation] No template or approach specified, using intelligent selection...');
      autoSelectedApproach = await ApproachSelector.selectBestApproach(persona, body.product);
      console.log(`[Script Generation] Intelligently selected: ${autoSelectedApproach}`);
      approaches = [autoSelectedApproach];
    }

    // Generate scripts - try Gemini first, fall back to OpenAI on ANY error
    let scripts: GeneratedScript[];
    let usedFallback = false;

    try {
      console.log('[Script Generation] Attempting Gemini...');
      // Try Gemini first
      scripts = await GeminiService.generateScripts(
        persona,
        body.product.name,
        approaches,
        body.templateId || undefined
      );
      console.log('[Script Generation] Gemini succeeded!');
    } catch (geminiError) {
      // IMPORTANT: Log immediately to verify catch block is reached
      console.log('[Script Generation] ===== CATCH BLOCK ENTERED =====');
      console.log('[Script Generation] Gemini error:', geminiError instanceof Error ? geminiError.message : String(geminiError));

      // Check if OpenAI is available for fallback
      const isConfigured = OpenAIService.isConfigured();
      console.log('[Script Generation] OpenAI isConfigured:', isConfigured);

      // Fall back to OpenAI on ANY Gemini error (not just rate limits)
      if (isConfigured) {
        console.log('[Script Generation] Falling back to OpenAI...');
        usedFallback = true;

        try {
          // Fall back to OpenAI
          scripts = await OpenAIService.generateScripts(
            persona,
            body.product.name,
            approaches,
            body.templateId || undefined
          );
          console.log('[Script Generation] OpenAI fallback succeeded!');
        } catch (openaiError) {
          console.error('[Script Generation] OpenAI fallback also failed:', openaiError instanceof Error ? openaiError.message : String(openaiError));
          // Both failed - throw original Gemini error
          throw geminiError;
        }
      } else {
        // OpenAI not configured - rethrow Gemini error
        console.log('[Script Generation] OpenAI not configured, cannot fallback');
        throw geminiError;
      }
    }

    if (usedFallback) {
      console.log('Successfully generated scripts using OpenAI fallback');
    }

    return NextResponse.json({
      success: true,
      scripts,
      persona,
      ...(autoSelectedApproach && { selectedApproach: autoSelectedApproach }),
    });
  } catch (error) {
    console.error('Script generation error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { success: false, error: `Failed to generate scripts: ${message}` },
      { status: 500 }
    );
  }
}

// Helper to create a fallback persona when analysis is unavailable
function createFallbackPersona(product: FetchedProduct): PersonaProfile {
  return {
    // Core Identity (new n8n format)
    name: 'Alex',
    age: 28,
    gender: 'Non-binary',
    location: 'A suburban area near a mid-size city',
    occupation: 'Marketing Coordinator',

    // Physical Appearance & Personal Style
    appearance: {
      generalAppearance: 'Friendly, approachable presence with a warm smile',
      hair: 'Medium-length, natural color, often styled casually',
      clothingAesthetic: 'Casual-smart, comfortable yet put-together',
      signatureDetails: 'Always has a coffee nearby',
    },

    // Personality & Communication
    personality: {
      keyTraits: ['Enthusiastic', 'genuine', 'helpful', 'relatable', 'honest'],
      demeanor: 'Warm and approachable, talks like a trusted friend',
      communicationStyle: 'Conversational, uses "you guys" and "honestly", authentic speech patterns',
    },

    // Lifestyle & Worldview
    lifestyle: {
      hobbiesAndInterests: ['Online shopping', 'product reviews', 'social media', 'trying new things'],
      valuesAndPriorities: ['Quality over quantity', 'value for money', 'authentic recommendations'],
      dailyFrustrations: ['Wasting money on bad products', 'not knowing what to buy', 'decision fatigue'],
      homeEnvironment: 'Clean and organized with some personality, good natural lighting',
    },

    // The "Why" - Credibility
    credibility: 'As someone who tries tons of products and shares honest opinions, their recommendation feels earned and authentic.',

    // Legacy fields for backward compatibility
    targetAudience: 'People looking for quality products online',
    painPoints: [
      'Struggling to find products that work',
      'Tired of wasting money on low-quality items',
      'Looking for trusted recommendations',
    ],
    benefits: product.features?.length
      ? product.features.slice(0, 5)
      : [
          'High quality materials',
          'Great value for money',
          'Fast shipping',
        ],
    tone: 'casual',
    keywords: [
      'must-have',
      'game changer',
      'viral',
      'tiktok made me buy it',
      'best purchase',
    ],
  };
}
