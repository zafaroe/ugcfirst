import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PersonaProfile, FetchedProduct, ScriptApproach } from '@/types/generation';

// ============================================
// INTELLIGENT SCRIPT APPROACH SELECTOR
// ============================================

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null;

/**
 * All available script approaches with selection criteria
 */
const APPROACH_CRITERIA: Record<ScriptApproach, {
  label: string;
  bestFor: string[];
  signals: string[];
}> = {
  excited_discovery: {
    label: 'Excited Discovery',
    bestFor: ['new products', 'trending items', 'impulse buys', 'viral products'],
    signals: ['novelty', 'trending', 'unique', 'new release', 'limited edition'],
  },
  casual_recommendation: {
    label: 'Casual Recommendation',
    bestFor: ['everyday items', 'essentials', 'reliable products', 'repurchases'],
    signals: ['daily use', 'essential', 'staple', 'must-have', 'go-to'],
  },
  in_the_moment_demo: {
    label: 'In-the-Moment Demo',
    bestFor: ['products needing demonstration', 'how-to products', 'gadgets', 'tools'],
    signals: ['works like', 'how to use', 'application', 'technique', 'process'],
  },
  skeptic_to_believer: {
    label: 'Skeptic to Believer',
    bestFor: ['products with surprising results', 'skepticism-prone categories', 'high claims'],
    signals: ['actually works', 'surprised', 'didnt expect', 'proven', 'results'],
  },
  pov_storytime: {
    label: 'POV Storytime',
    bestFor: ['lifestyle products', 'relatable scenarios', 'emotional connection'],
    signals: ['finally found', 'been looking for', 'life-changing', 'story', 'journey'],
  },
  problem_agitate_solution: {
    label: 'Problem-Agitate-Solution',
    bestFor: ['pain-point products', 'solutions', 'problem solvers'],
    signals: ['frustration', 'annoying', 'hate when', 'problem', 'solution', 'fix'],
  },
  before_after_transformation: {
    label: 'Before/After Transformation',
    bestFor: ['visual transformation', 'skincare', 'cleaning', 'organization', 'fitness'],
    signals: ['transformation', 'before after', 'results', 'change', 'improvement'],
  },
};

/**
 * Intelligently select the best script approach for a product
 * Uses Gemini to analyze product + persona and pick optimal approach
 */
export async function selectBestApproach(
  persona: PersonaProfile,
  product: FetchedProduct
): Promise<ScriptApproach> {
  // If Gemini not configured, use rule-based fallback
  if (!genAI) {
    console.warn('Gemini not configured, using rule-based approach selection');
    return selectApproachByRules(product);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an expert UGC content strategist. Analyze this product and creator persona to select the SINGLE BEST script approach.

## Product Information
- Name: ${product.name}
- Description: ${product.description || 'Not provided'}
- Features: ${product.features?.join(', ') || 'Not provided'}
- Price: ${product.price || 'Not provided'}

## Creator Persona
- Personality Traits: ${persona.personality?.keyTraits?.join(', ') || persona.tone || 'casual'}
- Communication Style: ${persona.personality?.communicationStyle || 'conversational'}
- Daily Frustrations: ${persona.lifestyle?.dailyFrustrations?.join(', ') || persona.painPoints?.join(', ') || 'general frustrations'}
- Values: ${persona.lifestyle?.valuesAndPriorities?.join(', ') || 'quality, value'}

## Available Approaches
${Object.entries(APPROACH_CRITERIA).map(([key, val]) =>
  `- ${key}: ${val.label} - Best for: ${val.bestFor.join(', ')}`
).join('\n')}

## Task
Analyze the product type, features, and persona to select the ONE approach that will create the most engaging, authentic UGC content.

Consider:
1. What product category is this? (beauty, tech, home, fashion, etc.)
2. Does the product solve a specific problem?
3. Is there a visual transformation aspect?
4. Does the product require demonstration?
5. Would skepticism be natural for this product?
6. Is this a lifestyle/identity product?

Respond with ONLY a JSON object:
{
  "selectedApproach": "approach_key_here",
  "reasoning": "Brief 1-sentence explanation"
}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3, // Lower temp for more consistent selection
        maxOutputTokens: 200,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();
    console.log('[Approach Selector] Gemini response:', responseText);

    const parsed = JSON.parse(responseText);
    const selectedApproach = parsed.selectedApproach as ScriptApproach;

    // Validate the approach is valid
    if (!APPROACH_CRITERIA[selectedApproach]) {
      console.warn(`[Approach Selector] Invalid approach "${selectedApproach}", falling back`);
      return selectApproachByRules(product);
    }

    console.log(`[Approach Selector] Selected: ${selectedApproach} - ${parsed.reasoning}`);
    return selectedApproach;

  } catch (error) {
    console.error('[Approach Selector] Gemini error, using rule-based fallback:', error);
    return selectApproachByRules(product);
  }
}

/**
 * Rule-based approach selection (fallback when AI unavailable)
 */
function selectApproachByRules(product: FetchedProduct): ScriptApproach {
  const name = product.name.toLowerCase();
  const description = (product.description || '').toLowerCase();
  const features = (product.features || []).map(f => f.toLowerCase()).join(' ');
  const combined = `${name} ${description} ${features}`;

  // Check for transformation keywords
  if (
    combined.includes('before') ||
    combined.includes('after') ||
    combined.includes('transform') ||
    combined.includes('results') ||
    combined.includes('skincare') ||
    combined.includes('clean')
  ) {
    return 'before_after_transformation';
  }

  // Check for problem-solving keywords
  if (
    combined.includes('problem') ||
    combined.includes('solution') ||
    combined.includes('fix') ||
    combined.includes('annoying') ||
    combined.includes('frustrat')
  ) {
    return 'problem_agitate_solution';
  }

  // Check for demo-friendly products
  if (
    combined.includes('how to') ||
    combined.includes('easy to use') ||
    combined.includes('gadget') ||
    combined.includes('tool') ||
    combined.includes('device')
  ) {
    return 'in_the_moment_demo';
  }

  // Check for surprising/skepticism keywords
  if (
    combined.includes('actually') ||
    combined.includes('really') ||
    combined.includes('surprising') ||
    combined.includes('believe')
  ) {
    return 'skeptic_to_believer';
  }

  // Check for lifestyle keywords
  if (
    combined.includes('lifestyle') ||
    combined.includes('daily') ||
    combined.includes('routine') ||
    combined.includes('essential')
  ) {
    return 'pov_storytime';
  }

  // Check for everyday/trusted items
  if (
    combined.includes('everyday') ||
    combined.includes('favorite') ||
    combined.includes('recommend') ||
    combined.includes('love')
  ) {
    return 'casual_recommendation';
  }

  // Default: excited discovery (works for most products)
  return 'excited_discovery';
}

/**
 * Get all available approaches with their metadata
 */
export function getAvailableApproaches(): Array<{
  key: ScriptApproach;
  label: string;
  bestFor: string[];
}> {
  return Object.entries(APPROACH_CRITERIA).map(([key, val]) => ({
    key: key as ScriptApproach,
    label: val.label,
    bestFor: val.bestFor,
  }));
}

export const ApproachSelector = {
  selectBestApproach,
  selectApproachByRules,
  getAvailableApproaches,
  APPROACH_CRITERIA,
};
