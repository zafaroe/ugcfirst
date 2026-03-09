import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  PersonaProfile,
  GeneratedScript,
  ScriptApproach,
  DialogueLine,
  ShotBreakdown,
  TechnicalDetails,
} from '@/types/generation';

// ============================================
// GEMINI CLIENT CONFIGURATION
// ============================================

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.warn('GOOGLE_AI_API_KEY not configured. Gemini features will be disabled.');
}

const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null;

/**
 * Get a Gemini model instance
 */
function getModel(modelName: string): GenerativeModel {
  if (!genAI) {
    throw new Error('Gemini client not configured. Check GOOGLE_AI_API_KEY.');
  }
  return genAI.getGenerativeModel({ model: modelName });
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
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('429') ||
      message.includes('too many requests') ||
      message.includes('resource exhausted') ||
      message.includes('rate limit')
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
 * Specifically handles 429 rate limit errors
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 2000,
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

      // Only retry on rate limit errors
      if (!isRateLimitError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        console.error(`Max retries (${maxRetries}) exceeded for rate limit error`);
        throw new Error(
          `API rate limit exceeded. Please wait a moment and try again. (Attempted ${maxRetries + 1} times)`
        );
      }

      // Log retry attempt
      console.log(
        `Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay / 1000}s...`
      );

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
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
// TEMPLATE-SPECIFIC 8-SECOND SCRIPT PROMPTS
// ============================================

const TEMPLATE_PROMPTS: Record<string, string> = {
  'pas': `You are writing an 8-second Problem-Agitate-Solution UGC video script.

This format hooks viewers by naming their pain point, then positions the product as the solution.

Structure (EXACTLY 3 sections):
1. "Hook + Problem" (0-3s, ~7 words): Open with one punchy sentence that names a specific, relatable frustration. Use "I" statements. Example energy: "I was SO tired of..."
2. "Solution" (3-6s, ~9 words): Transition naturally to the product and ONE result. "Then I found this and..." — focus on outcome, not features.
3. "Call to Action" (6-8s, ~4 words): Direct, short. "Link in bio, trust me" or "Comment GLOW to get it."

Total: ~20 words. The script must feel like a real person venting about a problem then excitedly sharing what fixed it.`,

  'unboxing': `You are writing an 8-second Unboxing & First Impressions UGC video script.

This format leverages the #TikTokMadeMeBuyIt trend — pure excitement about receiving and opening a product.

Structure (EXACTLY 3 sections):
1. "Anticipation" (0-2s, ~6 words): Build excitement about what just arrived. Reference how long you waited or why you bought it. Example: "It's FINALLY here oh my god..."
2. "Reveal + Reaction" (2-6s, ~9 words): Show the product and share instant authentic reaction. Describe what you see, feel, or notice. Be specific — mention one detail (texture, weight, smell, packaging). "The quality is insane, look at this..."
3. "Call to Action" (6-8s, ~5 words): Direct viewers where to get it. Add urgency if genuine. "Link in bio before it sells out."

Total: ~20 words. The script must feel like genuine first-time excitement — the camera is shaking because you're that hyped.`,

  'testimonial': `You are writing an 8-second Testimonial & Review UGC video script.

This format builds trust through the skepticism-to-satisfaction journey. "I didn't believe it" converts 4x higher than direct claims.

Structure (EXACTLY 3 sections):
1. "Skepticism Hook" (0-3s, ~7 words): Acknowledge initial doubts honestly. This relatability IS the hook. "I didn't think this would actually work..." or "I was SO skeptical about this..."
2. "Results" (3-6s, ~9 words): Share what actually happened — be specific about the result. Mention a timeline if possible. "But after two weeks my skin is literally glowing. No filter."
3. "Recommendation" (6-8s, ~4 words): Your verdict + CTA. Enthusiastic but genuine. "10 out of 10, link in bio."

Total: ~20 words. The script must feel like an honest product review from someone who was genuinely surprised by the results.`,
};

// ============================================
// SCRIPT GENERATION (n8n Raw 12-Second UGC)
// ============================================

/**
 * Generate a single viral video script based on persona profile
 * Uses n8n "Master Prompt: Raw 12-Second UGC Video Scripts"
 *
 * @param personaProfile - Detailed persona profile from product analysis
 * @param productName - Product name
 * @param approach - Which script approach to use
 * @returns Single detailed generated script with shot breakdown
 */
export async function generateScript(
  personaProfile: PersonaProfile,
  productName: string,
  approach: ScriptApproach = 'excited_discovery',
  templateId?: string
): Promise<GeneratedScript> {
  const model = getModel('gemini-2.0-flash');

  // Build the persona description from the detailed profile
  const personaDescription = buildPersonaDescription(personaProfile);

  let systemPrompt: string;
  let prompt: string;

  if (templateId && TEMPLATE_PROMPTS[templateId]) {
    // ========================================
    // TEMPLATE-AWARE 8-SECOND SCRIPT (DIY)
    // ========================================
    systemPrompt = `${TEMPLATE_PROMPTS[templateId]}

Verbal Authenticity Rules:
- Use filler words naturally: "like," "literally," "so," "honestly"
- Include natural speech patterns: self-corrections, fragments, trailing off
- This should sound like a real person talking to their phone, not a scripted ad

You must respond with a JSON object matching this exact structure:
{
  "approach": "${approach}",
  "approachLabel": "${APPROACH_LABELS[approach]}",
  "energy": "One line describing the energy and vibe",
  "dialogue": [
    { "timestamp": "0:00-0:03", "text": "Section 1 dialogue" },
    { "timestamp": "0:03-0:06", "text": "Section 2 dialogue" },
    { "timestamp": "0:06-0:08", "text": "Section 3 dialogue" }
  ],
  "shotBreakdown": [],
  "technicalDetails": {
    "phoneOrientation": "Vertical",
    "filmingMethod": "Selfie mode",
    "dominantHand": "Right hand holds phone",
    "locationSpecifics": "Casual indoor setting",
    "audioEnvironment": "Quiet room"
  },
  "fullScript": "All dialogue concatenated",
  "wordCount": 20,
  "estimatedDuration": 8
}`;

    prompt = `Create a single 8-second UGC script for "${productName}" following the template structure above.

Creator Profile:
${personaDescription}

Product Name: ${productName}

CRITICAL RULES:
- EXACTLY 3 dialogue entries matching the template sections
- Total ~20 words (no more than 25)
- 8 seconds total, NOT 12
- No text overlays — all dialogue is spoken
- The script must clearly follow the ${APPROACH_LABELS[approach]} structure
- Each section must serve its specific purpose (don't blend them)
- Use natural, authentic speech patterns`;

  } else {
    // ========================================
    // GENERIC 12-SECOND SCRIPT (Concierge / freeform)
    // ========================================
    systemPrompt = `Master Prompt: Raw 12-Second UGC Video Scripts (Enhanced Edition)
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

    prompt = `Create a single UGC script for "${productName}" using the "${APPROACH_LABELS[approach]}" approach.

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
  }

  // Wrap API call with retry logic for rate limiting
  // Use fast retries (1 retry, 2s delay) to fail fast and fallback to OpenAI
  const result = await withRetry(
    async () => {
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
        },
      });
    },
    { maxRetries: 1, initialDelayMs: 2000, maxDelayMs: 5000 }
  );

  const responseText = result.response.text();
  console.log('Gemini raw response:', responseText.substring(0, 500) + '...');

  let script: GeneratedScript;
  try {
    let parsed = JSON.parse(responseText);

    // Handle array response from Gemini (sometimes wraps response in an array)
    if (Array.isArray(parsed)) {
      console.log('Gemini returned array, extracting first element');
      if (parsed.length === 0) {
        throw new Error('Gemini returned empty array');
      }
      parsed = parsed[0];
    }

    script = parsed as GeneratedScript;
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Raw response:', responseText);
    throw new Error(`Failed to parse Gemini response as JSON: ${responseText.substring(0, 200)}`);
  }

  // Validate required fields
  if (!script.approach || !script.dialogue || !script.shotBreakdown) {
    console.error('Missing required fields in script:', JSON.stringify(script, null, 2).substring(0, 500));
    throw new Error(`Invalid script response - missing required fields. Got: ${Object.keys(script).join(', ')}`);
  }

  // Compute fullScript if not provided
  if (!script.fullScript) {
    script.fullScript = script.dialogue.map((d) => d.text).join(' ');
  }

  // Compute wordCount if not provided
  if (!script.wordCount) {
    script.wordCount = script.fullScript.split(/\s+/).length;
  }

  return script;
}

/**
 * Build a persona description string from the detailed profile
 */
function buildPersonaDescription(profile: PersonaProfile): string {
  // Handle both new and legacy formats
  if (profile.name && profile.appearance && profile.personality && profile.lifestyle) {
    // New detailed format
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
    // Legacy format fallback
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
 * Generate scripts for specified approaches
 * Caller is responsible for approach selection (use ApproachSelector for intelligent selection)
 */
export async function generateScripts(
  personaProfile: PersonaProfile,
  productName: string,
  approaches: ScriptApproach[],
  templateId?: string
): Promise<GeneratedScript[]> {
  const scripts: GeneratedScript[] = [];

  for (const approach of approaches) {
    const script = await generateScript(personaProfile, productName, approach, templateId);
    scripts.push(script);
  }

  return scripts;
}

// ============================================
// FRAME GENERATION (Gemini 2.5 Flash)
// ============================================

export interface FramePrompt {
  description: string;
  cameraAngle: string;
  lighting: string;
  mood: string;
}

/**
 * Generate a frame/image prompt for video generation
 * Uses Gemini 2.5 Flash for fast, cost-effective generation
 *
 * @param productImageUrl - Product image URL
 * @param scriptIndex - Which script this frame is for
 * @param script - The script content
 * @returns Frame generation prompt
 */
export async function generateFramePrompt(
  productImageUrl: string,
  scriptIndex: number,
  script: string
): Promise<FramePrompt> {
  const model = getModel('gemini-2.0-flash');

  const prompt = `You are a professional video director creating a starting frame for a UGC video.

Given this product image URL and script, create a detailed prompt for generating the opening frame of the video.

Product Image: ${productImageUrl}

Script: ${script}

Create a frame prompt that:
1. Shows a realistic person (25-35 year old) in a natural setting
2. Has the product visible or implied in the scene
3. Matches the mood and energy of the script
4. Would work well as the starting frame for an AI-generated video

Respond with JSON:
{
  "description": "Detailed visual description of the frame",
  "cameraAngle": "e.g., medium shot, close-up, etc.",
  "lighting": "e.g., natural daylight, warm indoor, etc.",
  "mood": "e.g., excited, curious, frustrated, etc."
}`;

  let responseText: string;

  try {
    // Wrap API call with retry logic for rate limiting
    // Use fast retries to fail fast and let caller handle fallback
    const result = await withRetry(
      async () => {
        return await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            responseMimeType: 'application/json',
          },
        });
      },
      { maxRetries: 1, initialDelayMs: 2000, maxDelayMs: 5000 }
    );

    responseText = result.response.text();
  } catch (geminiError) {
    // Fallback: Generate rule-based frame prompt when Gemini fails (quota/rate limit)
    console.warn('[Gemini] generateFramePrompt failed, using rule-based fallback:', geminiError instanceof Error ? geminiError.message : 'Unknown error');

    // Analyze script to determine mood
    const scriptLower = script.toLowerCase();
    let mood = 'engaging';
    let cameraAngle = 'medium shot';
    let lighting = 'natural daylight';

    if (scriptLower.includes('excited') || scriptLower.includes('amazing') || scriptLower.includes('love')) {
      mood = 'excited';
    } else if (scriptLower.includes('problem') || scriptLower.includes('struggling') || scriptLower.includes('frustrated')) {
      mood = 'frustrated';
    } else if (scriptLower.includes('discover') || scriptLower.includes('found') || scriptLower.includes('secret')) {
      mood = 'curious';
    }

    // Hook-style openings often use close-ups
    if (scriptLower.startsWith('okay') || scriptLower.startsWith('wait') || scriptLower.startsWith('stop')) {
      cameraAngle = 'close-up';
    }

    return {
      description: `A 25-35 year old person in a casual home setting, looking directly at the camera with a ${mood} expression, about to share their experience with the product. Natural UGC style, authentic and relatable.`,
      cameraAngle,
      lighting,
      mood,
    };
  }

  // Strip markdown code blocks if present
  let cleanedResponse = responseText.trim();
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  let framePrompt: FramePrompt;
  try {
    framePrompt = JSON.parse(cleanedResponse) as FramePrompt;
  } catch (parseError) {
    console.error('[Gemini] JSON parse error in generateFramePrompt:', parseError);
    console.error('[Gemini] Raw response:', responseText.substring(0, 500));

    // Return fallback frame prompt
    framePrompt = {
      description: 'Person in casual setting looking at camera, about to discuss a product',
      cameraAngle: 'medium shot',
      lighting: 'natural daylight',
      mood: 'engaging'
    };
  }

  // Validate required fields and provide defaults
  if (!framePrompt.description || !framePrompt.cameraAngle) {
    console.warn('[Gemini] Missing fields in framePrompt, using defaults');
    framePrompt = {
      description: framePrompt.description || 'Person in casual UGC setting',
      cameraAngle: framePrompt.cameraAngle || 'medium shot',
      lighting: framePrompt.lighting || 'natural',
      mood: framePrompt.mood || 'engaging'
    };
  }

  return framePrompt;
}

/**
 * Generate an image using Gemini's image generation capabilities
 * Note: This may need to be replaced with a dedicated image generation API
 *
 * @param framePrompt - The frame prompt
 * @returns Base64 encoded image
 */
export async function generateFrameImage(
  framePrompt: FramePrompt
): Promise<string> {
  // Note: Gemini's native image generation capabilities may be limited
  // This is a placeholder that generates a descriptive prompt
  // In production, you might want to use DALL-E, Midjourney API, or similar

  const imagePrompt = `
Professional UGC video thumbnail:
${framePrompt.description}

Camera: ${framePrompt.cameraAngle}
Lighting: ${framePrompt.lighting}
Mood: ${framePrompt.mood}

Style: Realistic, high-quality, Instagram/TikTok aesthetic
Aspect Ratio: 9:16 (vertical video)
No text or watermarks.
`.trim();

  // For now, return the prompt as a placeholder
  // In production, this would call an actual image generation API
  console.log('Frame generation prompt:', imagePrompt);

  // Placeholder: Return a data URL indicating where the real implementation goes
  throw new Error('Image generation not implemented - integrate with DALL-E or similar');
}

// ============================================
// SCRIPT REFINEMENT
// ============================================

/**
 * Refine/improve an existing script
 *
 * @param originalScript - The script to refine
 * @param feedback - What to improve
 * @returns Refined script
 */
export async function refineScript(
  originalScript: string,
  feedback: string
): Promise<string> {
  const model = getModel('gemini-2.0-flash');

  const prompt = `You are an expert UGC scriptwriter. Refine this script based on the feedback.

Original Script:
${originalScript}

Feedback:
${feedback}

Keep the same general structure but improve based on the feedback.
Maintain the conversational, authentic UGC tone.
Return only the refined script text, nothing else.`;

  // Wrap API call with retry logic for rate limiting
  // Use fast retries to fail fast and let caller handle fallback
  const result = await withRetry(
    async () => {
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });
    },
    { maxRetries: 1, initialDelayMs: 2000, maxDelayMs: 5000 }
  );

  return result.response.text().trim();
}

// ============================================
// PRODUCT FRAME GENERATION (Gemini 2.5 Flash Image)
// ============================================

// Cache for the 9:16 template image
let templateBase64Cache: string | null = null;

/**
 * Get the 9:16 template image as base64
 * Cached after first load
 */
export async function getTemplateBase64(): Promise<string> {
  if (templateBase64Cache) {
    return templateBase64Cache;
  }

  const fs = await import('fs');
  const path = await import('path');

  // Template is in public/images/9x16-template.png
  const templatePath = path.join(process.cwd(), 'public', 'images', '9x16-template.png');
  const templateBuffer = fs.readFileSync(templatePath);
  templateBase64Cache = templateBuffer.toString('base64');

  return templateBase64Cache;
}

/**
 * Download an image from URL and return as base64
 * @param imageUrl - URL of the image to download
 * @returns Object with base64 data and MIME type
 */
export async function downloadImageAsBase64(
  imageUrl: string
): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');

  // Infer MIME type from content-type header or URL
  let mimeType = response.headers.get('content-type') || 'image/png';
  if (mimeType.includes(';')) {
    mimeType = mimeType.split(';')[0].trim();
  }

  return { base64, mimeType };
}

/**
 * Generate a product frame using Gemini 2.5 Flash Image model
 * Uses image-to-image transformation to adapt product into 9:16 format
 *
 * @param productImageUrl - URL of the product image
 * @returns Base64 encoded generated image
 */
export async function generateProductFrame(
  productImageUrl: string
): Promise<{ imageBase64: string; mimeType: string }> {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  // Download product image as base64
  console.log('[Gemini] Downloading product image:', productImageUrl);
  const productImage = await downloadImageAsBase64(productImageUrl);

  // Get the 9:16 template
  const templateBase64 = await getTemplateBase64();

  // Construct the prompt (exact n8n workflow prompt)
  const prompt = `Take the design, layout, and style of [Image A] exactly as it is, and seamlessly adapt it into the aspect ratio of [Image B]. Maintain all the visual elements, proportions, and composition of [Image A], but expand, crop, or extend the background naturally so that the final image perfectly matches the aspect ratio and dimensions of [Image B]. Do not distort or stretch any elements—use intelligent background extension, framing, or subtle composition adjustments to preserve the original design integrity while filling the new canvas size.`;

  // Call Gemini 2.5 Flash Image API (specialized for image adaptation)
  // Using the exact model from n8n workflow: gemini-2.5-flash-image
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_AI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: productImage.mimeType,
              data: productImage.base64,
            },
          },
          {
            inline_data: {
              mime_type: 'image/png',
              data: templateBase64,
            },
          },
        ],
      },
    ],
  };

  // Make the API call with retry logic
  const response = await withRetry(
    async () => {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Gemini] API error:', res.status, errorText);
        throw new Error(`Gemini API error: ${res.status} ${errorText}`);
      }

      return res.json();
    },
    { maxRetries: 3, initialDelayMs: 5000, maxDelayMs: 30000 }
  );

  // Extract the generated image from response
  // Response format: candidates[0].content.parts[].inlineData.data
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    console.error('[Gemini] No candidates in response:', JSON.stringify(response).substring(0, 500));
    throw new Error('Gemini returned no candidates');
  }

  const parts = candidates[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    console.error('[Gemini] No parts in response:', JSON.stringify(candidates[0]).substring(0, 500));
    throw new Error('Gemini returned no content parts');
  }

  // Find the image part
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      console.log('[Gemini] Successfully generated product frame');
      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
  }

  // If no image found, log what we got
  console.error('[Gemini] No image in response parts:', JSON.stringify(parts).substring(0, 500));
  throw new Error('Gemini response did not contain an image');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate estimated cost for Gemini requests
 * Gemini 2.5 Pro: ~$1.25/1M input, ~$5.00/1M output
 * Gemini 2.5 Flash: ~$0.075/1M input, ~$0.30/1M output
 */
export function estimateCost(
  model: 'pro' | 'flash',
  inputTokens: number,
  outputTokens: number
): number {
  const rates =
    model === 'pro'
      ? { input: 1.25, output: 5.0 }
      : { input: 0.075, output: 0.3 };

  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  return inputCost + outputCost;
}

// ============================================
// EXPORTS
// ============================================

export const GeminiService = {
  generateScript,
  generateScripts,
  generateFramePrompt,
  generateFrameImage,
  refineScript,
  estimateCost,
  generateProductFrame,
  getTemplateBase64,
  downloadImageAsBase64,
  APPROACH_LABELS,
  APPROACH_DESCRIPTIONS,
};
