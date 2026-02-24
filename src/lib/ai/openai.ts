import OpenAI from 'openai';
import {
  PersonaProfile,
  GeneratedScript,
  ScriptApproach,
} from '@/types/generation';

// ============================================
// OPENAI CLIENT CONFIGURATION
// ============================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not configured. OpenAI features will be disabled.');
}

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * Get the OpenAI client (throws if not configured)
 */
function getClient(): OpenAI {
  if (!openai) {
    throw new Error('OpenAI client not configured. Check OPENAI_API_KEY.');
  }
  return openai;
}

/**
 * Check if OpenAI is configured
 */
export function isConfigured(): boolean {
  return !!openai;
}

// ============================================
// RETRY UTILITY WITH EXPONENTIAL BACKOFF
// ============================================

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

/**
 * Check if an error is a rate limit error (429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('429') ||
      message.includes('too many requests') ||
      message.includes('rate limit') ||
      message.includes('quota exceeded')
    );
  }
  return false;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 5000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRateLimitError(error)) {
        throw error;
      }

      if (attempt === maxRetries) {
        console.error(`OpenAI: Max retries (${maxRetries}) exceeded for rate limit error`);
        throw new Error(
          `OpenAI API rate limit exceeded. (Attempted ${maxRetries + 1} times)`
        );
      }

      console.log(
        `OpenAI rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay / 1000}s...`
      );

      await sleep(delay);
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError || new Error('Retry failed');
}

// ============================================
// SCRIPT APPROACHES
// ============================================

const APPROACH_LABELS: Record<ScriptApproach, string> = {
  excited_discovery: 'Excited Discovery',
  casual_recommendation: 'Casual Recommendation',
  in_the_moment_demo: 'In-the-Moment Demo',
  skeptic_to_believer: 'Skeptic to Believer',
  pov_storytime: 'POV Storytime',
  problem_agitate_solution: 'Problem-Agitate-Solution',
  before_after_transformation: 'Before/After Transformation',
};

const APPROACH_DESCRIPTIONS: Record<ScriptApproach, string> = {
  excited_discovery: 'Just found it, have to share - high energy, genuine excitement about discovering something amazing',
  casual_recommendation: 'Talking to camera like a friend - relaxed, conversational, like chatting with a bestie',
  in_the_moment_demo: 'Showing while using it - real-time demonstration with natural reactions',
  skeptic_to_believer: '"I didn\'t think this would work..." - starts doubtful, becomes a convert',
  pov_storytime: '"POV: you finally found [solution]..." - narrative format, puts viewer in the story',
  problem_agitate_solution: 'Pain → Amplify → Solution - highlights the problem, makes it worse, then saves the day',
  before_after_transformation: 'Before state → transition → dramatic after - shows the transformation journey',
};

// ============================================
// PRODUCT ANALYSIS (GPT-4o Vision)
// ============================================

/**
 * Supported image formats for OpenAI Vision API
 */
const SUPPORTED_IMAGE_FORMATS = ['png', 'jpeg', 'jpg', 'gif', 'webp'];
const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/**
 * Check if an image URL has a supported format for OpenAI Vision
 * First checks the URL extension, then falls back to fetching headers
 */
function isSupportedImageFormat(imageUrl: string): boolean {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname.toLowerCase();
    return SUPPORTED_IMAGE_FORMATS.some(fmt => pathname.endsWith(`.${fmt}`));
  } catch {
    // If we can't parse the URL, try to check the string directly
    const lower = imageUrl.toLowerCase();
    return SUPPORTED_IMAGE_FORMATS.some(fmt => lower.includes(`.${fmt}`));
  }
}

/**
 * Validate image URL by checking content-type headers
 * Returns true if the image is valid, throws descriptive error otherwise
 */
async function validateImageUrl(imageUrl: string): Promise<boolean> {
  // First check if URL has a known good extension
  if (isSupportedImageFormat(imageUrl)) {
    return true;
  }

  // If no extension, try to fetch headers to check content-type
  try {
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Vidnary/1.0',
      },
    });

    if (!response.ok) {
      console.warn(`Image URL returned status ${response.status}: ${imageUrl}`);
      // Don't throw, let OpenAI try anyway
      return true;
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() || '';

    // Check if content type is supported
    if (SUPPORTED_MIME_TYPES.some(mime => contentType.includes(mime))) {
      return true;
    }

    // Check for unsupported formats
    if (contentType.includes('svg') || contentType.includes('avif') || contentType.includes('bmp')) {
      throw new Error(
        `Image format not supported by OpenAI Vision. Got content-type: ${contentType}. ` +
        `Supported formats: ${SUPPORTED_MIME_TYPES.join(', ')}`
      );
    }

    // If we can't determine, let OpenAI try anyway
    console.warn(`Unknown content-type for image: ${contentType}, attempting anyway`);
    return true;
  } catch (error) {
    // If fetch fails, log and let OpenAI try anyway
    if (error instanceof Error && error.message.includes('not supported')) {
      throw error;
    }
    console.warn(`Could not validate image URL: ${error}`);
    return true;
  }
}

/**
 * Analyze a product image to create a detailed persona profile
 * Uses GPT-4o Vision for multimodal understanding
 *
 * This uses the n8n "Casting Director and Consumer Psychologist" prompt
 * to create a rich, believable character profile for UGC content.
 *
 * @param imageUrl - URL of the product image
 * @param productName - Name of the product
 * @returns Detailed persona profile for script generation
 */
export async function analyzeProduct(
  imageUrl: string,
  productName: string
): Promise<PersonaProfile> {
  const client = getClient();

  // Validate image format before sending to OpenAI
  // This checks URL extension first, then falls back to content-type headers
  await validateImageUrl(imageUrl);

  // n8n "Casting Director and Consumer Psychologist" prompt
  const systemPrompt = `**// ROLE & GOAL //**
You are an expert Casting Director and Consumer Psychologist. Your entire focus is on understanding people. Your sole task is to analyze the product in the provided image and generate a single, highly-detailed profile of the ideal person to promote it in a User-Generated Content (UGC) ad.

The final output must ONLY be a description of this person. Do NOT create an ad script, ad concepts, or hooks. Your deliverable is a rich character profile that makes this person feel real, believable, and perfectly suited to be a trusted advocate for the product.

**// REQUIRED OUTPUT STRUCTURE //**
You must respond with a JSON object matching this exact structure:

{
  "name": "A realistic first name",
  "age": 28,
  "gender": "Female/Male/Non-binary",
  "location": "A specific location description (e.g., 'A trendy suburb of a major tech city like Austin')",
  "occupation": "A specific occupation (e.g., 'Pediatric Nurse', 'Freelance Graphic Designer')",
  "appearance": {
    "generalAppearance": "Describe their face, build, and overall physical presence. What is the first impression they give off?",
    "hair": "Color, style, and typical state (e.g., 'Effortless, shoulder-length blonde hair, often tied back in a messy bun')",
    "clothingAesthetic": "Their go-to style using descriptive labels (e.g., 'Comfort-first athleisure', 'Modern minimalist with neutral tones')",
    "signatureDetails": "Small, defining features (e.g., 'Always wears a simple gold necklace', 'Has a friendly sprinkle of freckles')"
  },
  "personality": {
    "keyTraits": ["Pragmatic", "witty", "nurturing", "resourceful", "slightly introverted"],
    "demeanor": "How do they carry themselves? (e.g., 'Calm and deliberate; they think before they speak')",
    "communicationStyle": "How do they talk? (e.g., 'Talks like a close friend giving you honest advice, uses you guys a lot')"
  },
  "lifestyle": {
    "hobbiesAndInterests": ["Listens to true-crime podcasts", "tends to houseplants", "weekend hiking"],
    "valuesAndPriorities": ["Values efficiency and finding 'the best way' to do things", "Prioritizes work-life balance"],
    "dailyFrustrations": ["Hates feeling disorganized", "Always looking for ways to save time in their morning routine"],
    "homeEnvironment": "What does their personal space look like? (e.g., 'Clean, bright, and organized with IKEA furniture')"
  },
  "credibility": "In one or two sentences, explain why an audience would instantly trust this specific person's opinion on this product.",
  "targetAudience": "Summary of the target audience this persona represents",
  "painPoints": ["Problem 1 this product solves", "Problem 2", "Problem 3"],
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "tone": "The tone of voice for the content (e.g., casual, relatable, authentic)",
  "keywords": ["viral", "tiktok", "keywords", "for", "this", "product"]
}

Be as descriptive and specific as possible within each section. Make this person feel REAL.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this product image for "${productName}" and create a detailed persona profile of the ideal UGC creator to promote it.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high',
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(content) as PersonaProfile;

  // Validate the response has required core fields
  if (
    !parsed.name ||
    !parsed.age ||
    !parsed.occupation ||
    !parsed.appearance ||
    !parsed.personality ||
    !parsed.lifestyle ||
    !parsed.credibility
  ) {
    throw new Error('Invalid persona profile response - missing required fields');
  }

  return parsed;
}

// ============================================
// STRATEGY BRIEF GENERATION (Concierge)
// ============================================

import { StrategyBrief } from '@/types/generation';

/**
 * Generate a strategy brief for Concierge users
 * Provides platform recommendations, testing framework, and optimization tips
 *
 * @param personaProfile - The persona profile from product analysis
 * @param productName - Name of the product
 * @param scripts - The generated script(s)
 * @returns Comprehensive strategy brief
 */
export async function generateStrategyBrief(
  personaProfile: PersonaProfile,
  productName: string,
  scripts: string[]
): Promise<StrategyBrief> {
  const client = getClient();

  const scriptCount = scripts.length;
  const systemPrompt = `You are an expert paid media strategist specializing in short-form video ads for e-commerce.

You will be given:
1. A persona profile for the target audience
2. A product name
3. ${scriptCount === 1 ? 'A video script that has been created' : `${scriptCount} video scripts that have been created`}

Your task is to create a comprehensive strategy brief that helps the user run successful ad campaigns.

You must respond with a JSON object matching this EXACT structure:
{
  "platforms": {
    "primary": { "name": "tiktok"|"instagram"|"youtube", "reason": "...", "adFormat": "...", "startingBudget": "$X/day", "tips": ["..."] },
    "secondary": { "name": "...", "reason": "...", "adFormat": "...", "startingBudget": "$X/day", "tips": ["..."] },
    "alsoTest": { "name": "...", "reason": "...", "adFormat": "...", "startingBudget": "$X/day", "tips": ["..."] }
  },
  "testingRoadmap": [
    { "phase": 1, "days": "Days 1-3", "action": "...", "budget": "$X", "kpis": ["..."] },
    { "phase": 2, "days": "Days 4-7", "action": "...", "budget": "$X", "kpis": ["..."] },
    { "phase": 3, "days": "Days 8-14", "action": "...", "budget": "$X", "kpis": ["..."] }
  ],
  "hookPriority": [
    {
      "scriptIndex": 0,
      "hookType": "problem",
      "openingLine": "The actual first line/hook from the script",
      "reasoning": "Why this hook works for the target audience",
      "expectedHookRate": ">25%",
      "priority": 1
    },
    {
      "scriptIndex": 0,
      "hookType": "curiosity",
      "openingLine": "An alternative hook approach for the same script",
      "reasoning": "Why this alternative hook could also work",
      "expectedHookRate": ">20%",
      "priority": 2
    },
    {
      "scriptIndex": 0,
      "hookType": "transformation",
      "openingLine": "A third hook option to test",
      "reasoning": "Why this is worth testing as a third option",
      "expectedHookRate": ">18%",
      "priority": 3
    }
  ],
  "metrics": [
    { "name": "Hook Rate", "target": ">30%", "howToImprove": "..." },
    { "name": "Hold Rate", "target": ">10%", "howToImprove": "..." },
    { "name": "CTR", "target": ">1%", "howToImprove": "..." }
  ],
  "audiences": [
    {
      "segment": "Primary audience segment name",
      "ageRange": "25-34",
      "whyItWorks": "Reason this segment responds well to the product",
      "interests": ["interest1", "interest2", "interest3"],
      "behaviors": ["behavior1", "behavior2"]
    },
    {
      "segment": "Secondary audience segment",
      "ageRange": "35-44",
      "whyItWorks": "...",
      "interests": ["..."],
      "behaviors": ["..."]
    }
  ],
  "optimizationTips": {
    "do": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"],
    "dont": ["Thing to avoid 1", "Thing to avoid 2"],
    "proTips": ["Advanced optimization tip 1", "Advanced optimization tip 2"]
  },
  "quickStats": {
    "estimatedCPM": "$8-15",
    "expectedROAS": "2-4x",
    "testingDuration": "14 days",
    "totalBudget": "$200-300"
  },
  "bestPostingTimes": ["9am-11am EST", "7pm-9pm EST"],
  "socialCaptions": {
    "tiktok": {
      "text": "Engaging TikTok caption under 150 characters that creates urgency and relatability",
      "hashtags": ["fyp", "tiktokmademebuyit", "viral", "musthave"]
    },
    "instagram": {
      "text": "Instagram caption with emojis that tells a micro-story and includes a call-to-action",
      "hashtags": ["reels", "trending", "lifestyle", "shopping"]
    },
    "youtube": {
      "text": "YouTube Shorts description optimized for search with keywords",
      "hashtags": ["shorts", "review", "musthave"]
    }
  }
}

IMPORTANT: Generate exactly 3 different hook recommendations in the hookPriority array, each with a different hookType (e.g., problem, curiosity, transformation). Rank them by priority 1-3 based on expected performance. Also generate platform-specific social media captions that users can copy-paste when posting their video.

Be specific, actionable, and based on current best practices for 2025.`;

  // Build scripts section dynamically
  const scriptsSection = scripts
    .map((script, i) => `Script ${i + 1}: ${script}`)
    .join('\n\n');

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Create a strategy brief for "${productName}".

Persona Profile:
${JSON.stringify(personaProfile, null, 2)}

${scriptCount === 1 ? 'Script' : 'Scripts'}:
${scriptsSection}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3500, // Increased to ensure socialCaptions isn't truncated
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(content) as StrategyBrief;

  // Ensure socialCaptions exists - add fallback if missing (common with token limits)
  if (!parsed.socialCaptions) {
    console.warn('[OpenAI] socialCaptions missing from response, adding fallback');
    parsed.socialCaptions = {
      tiktok: {
        text: `Check out this amazing ${productName}! You won't believe how good it is 🔥`,
        hashtags: ['fyp', 'tiktokmademebuyit', 'viral', 'musthave', 'trending'],
      },
      instagram: {
        text: `Just discovered ${productName} and I'm obsessed! Link in bio to get yours ✨`,
        hashtags: ['reels', 'trending', 'lifestyle', 'shopping', 'musthave'],
      },
      youtube: {
        text: `${productName} Review - Is it worth it? Watch to find out!`,
        hashtags: ['shorts', 'review', 'musthave', 'honest'],
      },
    };
  }

  return parsed;
}

// ============================================
// SCRIPT GENERATION (OpenAI Fallback)
// ============================================

/**
 * Build a persona description string from the detailed profile
 */
function buildPersonaDescription(profile: PersonaProfile): string {
  if (profile.name && profile.appearance && profile.personality && profile.lifestyle) {
    return `
**I. Core Identity**
- Name: ${profile.name}
- Age: ${profile.age}
- Gender: ${profile.gender}
- Location: ${profile.location}
- Occupation: ${profile.occupation}

**II. Physical Appearance & Personal Style**
- General Appearance: ${profile.appearance.generalAppearance}
- Hair: ${profile.appearance.hair}
- Clothing Aesthetic: ${profile.appearance.clothingAesthetic}
- Signature Details: ${profile.appearance.signatureDetails}

**III. Personality & Communication**
- Key Traits: ${profile.personality.keyTraits.join(', ')}
- Demeanor: ${profile.personality.demeanor}
- Communication Style: ${profile.personality.communicationStyle}

**IV. Lifestyle & Worldview**
- Hobbies & Interests: ${profile.lifestyle.hobbiesAndInterests.join(', ')}
- Values & Priorities: ${profile.lifestyle.valuesAndPriorities.join(', ')}
- Daily Frustrations: ${profile.lifestyle.dailyFrustrations.join(', ')}
- Home Environment: ${profile.lifestyle.homeEnvironment}

**V. The "Why" - Credibility**
${profile.credibility}
`.trim();
  } else {
    return `
Target Audience: ${profile.targetAudience || 'General consumer'}
Pain Points: ${profile.painPoints?.join(', ') || 'Looking for solutions'}
Benefits: ${profile.benefits?.join(', ') || 'Product benefits'}
Tone: ${profile.tone || 'Casual and authentic'}
Keywords: ${profile.keywords?.join(', ') || 'viral, trending'}
`.trim();
  }
}

/**
 * Generate a single viral video script using OpenAI GPT-4o
 * Fallback for when Gemini hits rate limits
 */
export async function generateScript(
  personaProfile: PersonaProfile,
  productName: string,
  approach: ScriptApproach = 'excited_discovery'
): Promise<GeneratedScript> {
  const client = getClient();
  const personaDescription = buildPersonaDescription(personaProfile);

  const systemPrompt = `Master Prompt: Raw 12-Second UGC Video Scripts (Enhanced Edition)
You are an expert at creating authentic UGC video scripts that look like someone just grabbed their iPhone and hit record—shaky hands, natural movement, zero production value. No text overlays. No polish. Just real.
Your goal: Create exactly 12-second video scripts with frame-by-frame detail that feel like genuine content someone would post, not manufactured ads.

The Raw iPhone Aesthetic
What we WANT:
- Handheld shakiness and natural camera movement
- Phone shifting as they talk/gesture with their hands
- Camera readjusting mid-video (zooming in closer, tilting, refocusing)
- One-handed filming while using product with the other hand
- Natural bobbing/swaying as they move or talk
- Filming wherever they actually are (messy room, car, bathroom mirror, kitchen counter)
- Real lighting (window light, lamp, overhead—not "good" lighting)
- Authentic imperfections (finger briefly covering lens, focus hunting, unexpected background moments)

What we AVOID:
- Tripods or stable surfaces (no locked-down shots)
- Text overlays or on-screen graphics (NONE—let the talking do the work)
- Perfect framing that stays consistent
- Professional transitions or editing
- Clean, styled backgrounds
- Multiple takes stitched together feeling
- Scripted-sounding delivery or brand speak

The 12-Second Structure (Loose)
0-2 seconds: Start talking/showing immediately—like mid-conversation. Camera might still be adjusting as they find the angle. Hook them with a relatable moment or immediate product reveal.
2-9 seconds: Show the product in action while continuing to talk naturally. Camera might move closer, pull back, or shift as they demonstrate. This is where the main demo/benefit happens organically.
9-12 seconds: Wrap up thought while product is still visible. Natural ending—could trail off, quick recommendation, or casual sign-off. Dialogue must finish by the 12-second mark.

Critical: Only use the exact Product Name provided. Do not create slogans, brand messaging, or fake details. Stay true to what the product actually does.

Enhanced Authenticity Guidelines
Verbal Authenticity:
- Use filler words: "like," "literally," "so," "I mean," "honestly"
- Include natural pauses: "It's just... really good"
- Self-corrections: "It's really—well actually it's more like..."
- Conversational fragments: "Yeah so this thing..."

Visual Authenticity Markers:
- Finger briefly covering part of lens
- Camera focus hunting between face and product
- Slight overexposure from window light
- Background "real life" moments (pet, person, notification pop-up)
- Natural product handling (not perfect grip, repositioning)

Timing Authenticity:
- Slight rushing at the end to fit in last thought
- Natural breath pauses
- Talking speed varies (faster when excited, slower when showing detail)
- Might start sentence at 11 seconds that gets cut at 12

You must respond with a JSON object matching this exact structure:
{
  "approach": "${approach}",
  "approachLabel": "${APPROACH_LABELS[approach]}",
  "energy": "One specific line describing the energy - excited? chill? matter-of-fact? caffeinated? half-awake?",
  "dialogue": [
    { "timestamp": "0:00-0:02", "text": "Opening line - 3-5 words, mid-thought energy" },
    { "timestamp": "0:02-0:09", "text": "Main talking section - 20-25 words total. Include natural speech patterns." },
    { "timestamp": "0:09-0:12", "text": "Closing thought - 3-5 words. Can trail off naturally." }
  ],
  "shotBreakdown": [
    {
      "second": 0,
      "cameraPosition": "Phone held at chest height, slight downward angle, wobbling",
      "cameraMovement": "Shaky, moving as they gesture",
      "whatsInFrame": "Their face fills 60% of frame, room visible behind",
      "creatorAction": "Walking into frame mid-sentence, looking at lens",
      "productVisibility": "Product not visible yet / Product visible in hand",
      "audioCue": "The actual first words being said"
    }
  ],
  "technicalDetails": {
    "phoneOrientation": "Vertical",
    "filmingMethod": "Selfie mode facing them / Back camera in mirror / Propped on stack of books",
    "dominantHand": "Which hand holds phone vs product",
    "locationSpecifics": "What room? Time of day? Background elements?",
    "audioEnvironment": "Echo from bathroom? Quiet bedroom? Background TV?"
  },
  "fullScript": "All dialogue concatenated together",
  "wordCount": 35,
  "estimatedDuration": 12
}

Include shotBreakdown entries for seconds 0-11 (12 total entries).`;

  const userPrompt = `Create a single UGC script for "${productName}" using the "${APPROACH_LABELS[approach]}" approach.

Approach Description: ${APPROACH_DESCRIPTIONS[approach]}

Creator Profile:
${personaDescription}

Product Name: ${productName}

Remember:
- This is a RAW, authentic 12-second UGC video script
- No text overlays - all dialogue must be spoken
- Include natural filler words, pauses, and authentic speech patterns
- The shot breakdown should show realistic handheld filming
- Dialogue MUST complete by the 12-second mark`;

  const result = await withRetry(
    async () => {
      return await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
        temperature: 0.9,
      });
    },
    { maxRetries: 3, initialDelayMs: 5000, maxDelayMs: 30000 }
  );

  const content = result.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  console.log('OpenAI raw response:', content.substring(0, 500) + '...');

  let script: GeneratedScript;
  try {
    let parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        throw new Error('OpenAI returned empty array');
      }
      parsed = parsed[0];
    }
    script = parsed as GeneratedScript;
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    throw new Error(`Failed to parse OpenAI response as JSON: ${content.substring(0, 200)}`);
  }

  if (!script.approach || !script.dialogue || !script.shotBreakdown) {
    throw new Error(`Invalid script response - missing required fields`);
  }

  if (!script.fullScript) {
    script.fullScript = script.dialogue.map((d) => d.text).join(' ');
  }

  if (!script.wordCount) {
    script.wordCount = script.fullScript.split(/\s+/).length;
  }

  return script;
}

/**
 * Generate scripts for specified approaches using OpenAI
 * Caller is responsible for approach selection (use ApproachSelector for intelligent selection)
 */
export async function generateScripts(
  personaProfile: PersonaProfile,
  productName: string,
  approaches: ScriptApproach[]
): Promise<GeneratedScript[]> {
  const scripts: GeneratedScript[] = [];

  for (const approach of approaches) {
    console.log(`OpenAI: Generating script for approach: ${approach}`);
    const script = await generateScript(personaProfile, productName, approach);
    scripts.push(script);
  }

  return scripts;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Estimate token count for a string (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Calculate estimated cost for a request
 * GPT-4o: $2.50/1M input tokens, $10.00/1M output tokens
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 2.5;
  const outputCost = (outputTokens / 1_000_000) * 10.0;
  return inputCost + outputCost;
}

// ============================================
// EXPORTS
// ============================================

export const OpenAIService = {
  analyzeProduct,
  generateStrategyBrief,
  generateScript,
  generateScripts,
  estimateTokens,
  estimateCost,
  isSupportedImageFormat,
  isConfigured,
  isRateLimitError,
};
