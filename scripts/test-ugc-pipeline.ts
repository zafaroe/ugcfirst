/**
 * Full UGC Pipeline Proof-of-Concept
 *
 * Tests the complete AI UGC ad creation workflow:
 *
 * Phase 1: Generate AI actor photo (Nano Banana Pro)
 * Phase 2: Generate product image (Nano Banana Pro)
 * Phase 3: Generate product angle grid (Nano Banana Pro + reference)
 * Phase 4: Composite actor holding product (Nano Banana Pro + dual reference)
 * Phase 5: Animate with speech via Veo 3.1 (composite start frame + script + audio)
 * Phase 6: Product reveal end screen (Kling 2.6 motion graphics)
 * Phase 7: Log cost breakdown
 *
 * Run: npx tsx scripts/test-ugc-pipeline.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const OUTPUT_DIR = 'test-output/ugc-pipeline-poc';

// ============================================
// PROMPTS
// ============================================

const ACTOR_PROMPT = `
Photorealistic portrait of a young woman in her mid-20s.
Phone front camera selfie style, slightly above eye level angle.
Looking directly at camera with a friendly, warm smile.
Natural makeup, clear skin. Wearing a casual cream/beige t-shirt.
Soft natural window lighting from the left.
Simple bedroom/living room background slightly blurred.
Upper body and one hand visible, as if about to show something.
Authentic UGC influencer aesthetic, not studio-perfect.
9:16 vertical. 2K resolution.
NO text, NO watermarks, NO overlays.
`.trim();

const PRODUCT_PROMPT = `
Product photography of a premium vitamin C brightening serum.
Amber glass dropper bottle, approximately 30ml, with gold metallic cap.
Clean modern minimal label with "GlowSerum Pro" branding.
White background, professional studio lighting, sharp focus.
Product centered, full bottle visible with soft shadow beneath.
Commercial product shot quality.
16:9 landscape. NO text overlay, NO watermarks.
`.trim();

const PRODUCT_GRID_PROMPT = `
Create a 3x3 grid showing 9 different angles of this vitamin C serum bottle.
Row 1: front view, 3/4 angle left, 3/4 angle right.
Row 2: left side profile, back view, right side profile.
Row 3: top-down view looking at cap, close-up of dropper, bottle tilted 45 degrees.
White background, consistent professional studio lighting across all 9 angles.
Each angle clearly shows the bottle shape, label, and cap detail.
16:9 landscape layout. NO text, NO watermarks.
`.trim();

const COMPOSITE_PROMPT = `
Place the vitamin C serum bottle naturally in this woman's right hand.
She is holding the product up near her face, showing it to camera proudly.
Her left hand is slightly gesturing towards the product.
Match the lighting on the product precisely to the warm window light on her face.
The product should look naturally held, not floating or digitally pasted.
Maintain her exact face, expression, clothing, and background.
The product label should be facing the camera and readable.
Authentic UGC selfie style, as if she's showing her followers a new purchase.
9:16 vertical. 4K resolution for maximum quality.
NO text, NO captions, NO watermarks.
`.trim();

// Script that Veo 3.1 will speak natively (no TTS needed)
const SCRIPT_TEXT = `Hey bestie, you NEED to try this serum. I've been using it for two weeks and my skin has never looked better. The vitamin C just makes everything glow, like actually glow. I'm not even wearing foundation right now. Link in bio, trust me on this one.`;

const VEO3_ANIMATION_PROMPT = `
UGC style video of a young woman in her mid-20s walking slowly through her room while enthusiastically showing a vitamin C serum bottle to the camera. She holds the product up near her face, gestures naturally with her other hand for emphasis, and speaks directly to camera like she's talking to her best friend. Her energy is genuine and excited. She occasionally glances at the product then back at camera. Natural indoor lighting, casual bedroom setting. Authentic TikTok/Reels style content.

The woman speaks the following script naturally and conversationally:
"${SCRIPT_TEXT}"

Keep the product visible and in frame throughout the video. The serum bottle should be clearly recognizable as she holds it up.
`.trim();

const ENDSCREEN_IMAGE_PROMPT = `
Sleek product reveal motion design still frame of a vitamin C serum bottle.
Premium amber glass bottle floating in center of frame with soft glow effect.
Clean gradient background transitioning from warm gold to cream white.
Subtle light particles and bokeh effects around the product.
Professional commercial product reveal aesthetic.
Minimalist, luxurious feel. The bottle is the hero.
9:16 vertical format. NO text, NO watermarks.
`.trim();

const ENDSCREEN_MOTION_PROMPT = `
Slow cinematic product reveal animation. The serum bottle slowly rotates
with a subtle glow effect. Light particles drift upward gently.
Smooth, premium motion design feel. Luxurious and clean.
`.trim();

// ============================================
// HELPERS
// ============================================

function log(phase: string, msg: string) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${ts}] [${phase}] ${msg}`);
}

function ensureDir(dir: string) {
  const full = path.resolve(dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  return full;
}

function saveLocal(filename: string, buffer: Buffer): string {
  const dir = ensureDir(OUTPUT_DIR);
  const fp = path.join(dir, filename);
  fs.writeFileSync(fp, buffer);
  log('SAVE', `${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
  return fp;
}

// ============================================
// MAIN
// ============================================

async function main() {
  const { KieService } = await import('../src/lib/ai/kie');
  const { uploadToR2, getPublicUrl } = await import('../src/lib/r2');

  async function toR2(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await uploadToR2(key, buffer, { contentType });
    const url = getPublicUrl(key);
    log('R2', `Uploaded: ${key}`);
    return url;
  }

  console.log('');
  console.log('========================================================');
  console.log('     FULL UGC PIPELINE POC - Veo 3.1 + Kling 2.6       ');
  console.log('========================================================');
  console.log('');

  if (!KieService.isConfigured()) {
    console.error('ERROR: KIE_AI_API_KEY not set');
    process.exit(1);
  }
  if (!process.env.R2_ACCOUNT_ID) {
    console.error('ERROR: R2 not configured');
    process.exit(1);
  }

  const costs: { phase: string; description: string; model: string; startTime: number; endTime?: number }[] = [];
  const globalStart = Date.now();

  // Flag to reuse existing assets from previous run
  const REUSE_EXISTING = true;  // Set to false to regenerate all phases

  let actorUrl: string;
  let productUrl: string;
  let gridUrl: string;
  let compositeUrl: string;
  let phaseStart: number;

  if (REUSE_EXISTING) {
    log('REUSE', 'Reusing existing assets from previous run...');
    actorUrl = 'https://assets.vidnary.com/test/ugc-poc/1-actor-photo.png';
    productUrl = 'https://assets.vidnary.com/test/ugc-poc/2-product-base.png';
    gridUrl = 'https://assets.vidnary.com/test/ugc-poc/3-product-grid.png';
    compositeUrl = 'https://assets.vidnary.com/test/ugc-poc/4-composite-actor-product.png';
    log('REUSE', `Actor: ${actorUrl}`);
    log('REUSE', `Product: ${productUrl}`);
    log('REUSE', `Grid: ${gridUrl}`);
    log('REUSE', `Composite: ${compositeUrl}`);
  } else {
    // ========================================
    // PHASE 1: Generate AI Actor
    // ========================================
    log('PHASE 1', '=== Generating AI Actor Photo (Nano Banana Pro) ===');
    phaseStart = Date.now();

    const actorResult = await KieService.generateImageSync(
      { model: 'nano-banana-pro', prompt: ACTOR_PROMPT, aspectRatio: '9:16' },
      (task) => log('PHASE 1', `Status: ${task.status} (${task.progress || 0}%)`)
    );
    const actorBuffer = await KieService.downloadFile(actorResult.url);
    saveLocal('1-actor-photo.png', actorBuffer);
    actorUrl = await toR2('test/ugc-poc/1-actor-photo.png', actorBuffer, 'image/png');

    costs.push({ phase: 'Phase 1', description: 'Actor portrait', model: 'Nano Banana Pro', startTime: phaseStart, endTime: Date.now() });
    log('PHASE 1', `Done in ${((Date.now() - phaseStart) / 1000).toFixed(1)}s - ${actorUrl}`);

    // ========================================
    // PHASE 2: Generate Product Base Image
    // ========================================
    log('PHASE 2', '=== Generating Product Base Image (Nano Banana Pro) ===');
    phaseStart = Date.now();

    const productResult = await KieService.generateImageSync(
      { model: 'nano-banana-pro', prompt: PRODUCT_PROMPT, aspectRatio: '16:9' },
      (task) => log('PHASE 2', `Status: ${task.status} (${task.progress || 0}%)`)
    );
    const productBuffer = await KieService.downloadFile(productResult.url);
    saveLocal('2-product-base.png', productBuffer);
    productUrl = await toR2('test/ugc-poc/2-product-base.png', productBuffer, 'image/png');

    costs.push({ phase: 'Phase 2', description: 'Product base image', model: 'Nano Banana Pro', startTime: phaseStart, endTime: Date.now() });
    log('PHASE 2', `Done in ${((Date.now() - phaseStart) / 1000).toFixed(1)}s - ${productUrl}`);

    // ========================================
    // PHASE 3: Generate Product Angle Grid
    // ========================================
    log('PHASE 3', '=== Generating Product Angle Grid (Nano Banana Pro + Reference) ===');
    phaseStart = Date.now();

    const gridResult = await KieService.generateImageSync(
      {
        model: 'nano-banana-pro',
        prompt: PRODUCT_GRID_PROMPT,
        aspectRatio: '16:9',
        referenceImageUrls: [productUrl],  // Product as reference
      },
      (task) => log('PHASE 3', `Status: ${task.status} (${task.progress || 0}%)`)
    );
    const gridBuffer = await KieService.downloadFile(gridResult.url);
    saveLocal('3-product-grid.png', gridBuffer);
    gridUrl = await toR2('test/ugc-poc/3-product-grid.png', gridBuffer, 'image/png');

    costs.push({ phase: 'Phase 3', description: 'Product angle grid', model: 'Nano Banana Pro + ref', startTime: phaseStart, endTime: Date.now() });
    log('PHASE 3', `Done in ${((Date.now() - phaseStart) / 1000).toFixed(1)}s - ${gridUrl}`);

    // ========================================
    // PHASE 4: Composite Actor + Product
    // ========================================
    log('PHASE 4', '=== Compositing Actor + Product (Nano Banana Pro + Dual Reference) ===');
    phaseStart = Date.now();

    const compositeResult = await KieService.generateImageSync(
      {
        model: 'nano-banana-pro',
        prompt: COMPOSITE_PROMPT,
        aspectRatio: '9:16',
        referenceImageUrls: [actorUrl, gridUrl],  // DUAL reference: actor + product grid
      },
      (task) => log('PHASE 4', `Status: ${task.status} (${task.progress || 0}%)`)
    );
    const compositeBuffer = await KieService.downloadFile(compositeResult.url);
    saveLocal('4-composite-actor-product.png', compositeBuffer);
    compositeUrl = await toR2('test/ugc-poc/4-composite-actor-product.png', compositeBuffer, 'image/png');

    costs.push({ phase: 'Phase 4', description: 'Composite (actor + product)', model: 'Nano Banana Pro + dual ref', startTime: phaseStart, endTime: Date.now() });
    log('PHASE 4', `Done in ${((Date.now() - phaseStart) / 1000).toFixed(1)}s - ${compositeUrl}`);
  }

  // ========================================
  // PHASE 5: Animate with Veo 3.1
  // ========================================
  log('PHASE 5', '=== Animating with Veo 3.1 (Start Frame + Script + Audio ON) ===');
  log('PHASE 5', `Script: "${SCRIPT_TEXT.substring(0, 80)}..."`);
  log('PHASE 5', `Script words: ${SCRIPT_TEXT.split(/\s+/).length}`);
  phaseStart = Date.now();

  const veoResult = await KieService.generateVeo3VideoSync(
    {
      model: 'veo3_fast',             // Fast for testing; use veo3_quality for production
      prompt: VEO3_ANIMATION_PROMPT,
      imageUrls: [compositeUrl],      // Composite as start frame
      aspectRatio: '9:16',
      sound: true,                    // CRITICAL: enables native speech generation
      duration: '8',                  // 8 seconds
    },
    (task) => {
      const elapsed = ((Date.now() - phaseStart) / 1000).toFixed(0);
      log('PHASE 5', `[${elapsed}s] Status: ${task.status} (${task.progress || 0}%)`);
    }
  );
  const veoBuffer = await KieService.downloadFile(veoResult.url);
  saveLocal('5-ugc-video-veo3.mp4', veoBuffer);
  const veoVideoUrl = await toR2('test/ugc-poc/5-ugc-video-veo3.mp4', veoBuffer, 'video/mp4');

  costs.push({ phase: 'Phase 5', description: 'Veo 3.1 animation + speech', model: 'Veo 3.1 Fast', startTime: phaseStart, endTime: Date.now() });
  log('PHASE 5', `Done in ${((Date.now() - phaseStart) / 1000).toFixed(1)}s`);
  log('PHASE 5', `Duration: ${veoResult.duration}s | Resolution: ${veoResult.width}x${veoResult.height}`);
  log('PHASE 5', `URL: ${veoVideoUrl}`);

  // ========================================
  // PHASE 6: Product End Screen (Kling 2.6)
  // ========================================
  log('PHASE 6', '=== Product End Screen (Nano Banana frame -> Kling 2.6 animation) ===');
  phaseStart = Date.now();

  // 6a: Generate end screen still frame (use grid for product consistency)
  log('PHASE 6', 'Generating end screen frame (using product grid as reference)...');
  const endFrameResult = await KieService.generateImageSync(
    {
      model: 'nano-banana-pro',
      prompt: ENDSCREEN_IMAGE_PROMPT,
      aspectRatio: '9:16',
      referenceImageUrls: [productUrl, gridUrl],  // Product + grid for better 3D understanding
    },
    (task) => log('PHASE 6', `Frame: ${task.status} (${task.progress || 0}%)`)
  );
  const endFrameBuffer = await KieService.downloadFile(endFrameResult.url);
  saveLocal('6a-endscreen-frame.png', endFrameBuffer);
  const endFrameUrl = await toR2('test/ugc-poc/6a-endscreen-frame.png', endFrameBuffer, 'image/png');

  // 6b: Animate end screen frame with Kling 2.6
  // Note: Grid is used as reference for generating the end frame (6a), but Kling animates the single-product frame
  log('PHASE 6', 'Animating end screen with Kling 2.6...');
  const klingResult = await KieService.generateKling26VideoSync(
    {
      prompt: ENDSCREEN_MOTION_PROMPT,
      imageUrls: [endFrameUrl],  // Single product frame (grid was used as reference when generating this)
      duration: '5',
      sound: false,  // Product animation - no speech needed
    },
    (task) => {
      const elapsed = ((Date.now() - phaseStart) / 1000).toFixed(0);
      log('PHASE 6', `[${elapsed}s] Kling 2.6: ${task.status} (${task.progress || 0}%)`);
    }
  );
  const klingBuffer = await KieService.downloadFile(klingResult.url);
  saveLocal('6b-endscreen-video.mp4', klingBuffer);
  const endscreenUrl = await toR2('test/ugc-poc/6b-endscreen-video.mp4', klingBuffer, 'video/mp4');

  costs.push({ phase: 'Phase 6', description: 'End screen (frame + Kling 2.6)', model: 'Nano Banana + Kling 2.6', startTime: phaseStart, endTime: Date.now() });
  log('PHASE 6', `Done in ${((Date.now() - phaseStart) / 1000).toFixed(1)}s - ${endscreenUrl}`);

  // ========================================
  // SUMMARY
  // ========================================
  const totalTime = ((Date.now() - globalStart) / 1000).toFixed(1);

  console.log('');
  console.log('========================================================');
  console.log(' PIPELINE COMPLETE');
  console.log('========================================================');
  console.log(`Total time: ${totalTime}s`);
  console.log('');
  console.log(`Output: ${path.resolve(OUTPUT_DIR)}/`);
  console.log('  |-- 1-actor-photo.png              - AI-generated actor face');
  console.log('  |-- 2-product-base.png              - Product studio shot');
  console.log('  |-- 3-product-grid.png              - 3x3 product angles');
  console.log('  |-- 4-composite-actor-product.png   - Actor holding product');
  console.log('  |-- 5-ugc-video-veo3.mp4            - Veo 3.1 animated UGC with speech');
  console.log('  |-- 6a-endscreen-frame.png          - End screen still');
  console.log('  |-- 6b-endscreen-video.mp4          - Kling 2.6 product reveal');
  console.log('');

  // Cost breakdown
  console.log('========================================================');
  console.log(' COST & TIMING BREAKDOWN');
  console.log('========================================================');
  console.log('');
  console.log('API Calls Made:');
  console.log('  Phase 1: 1x Nano Banana Pro (actor portrait)');
  console.log('  Phase 2: 1x Nano Banana Pro (product shot)');
  console.log('  Phase 3: 1x Nano Banana Pro + 1 reference (product grid)');
  console.log('  Phase 4: 1x Nano Banana Pro + 2 references (composite)');
  console.log('  Phase 5: 1x Veo 3.1 Fast (8s video + native speech)');
  console.log('  Phase 6: 1x Nano Banana Pro + 1x Kling 2.6 (end screen)');
  console.log('  --------------------------------------------------------');
  console.log('  TOTAL: 5 image gens + 1 Veo 3.1 + 1 Kling 2.6 = 7 API calls');
  console.log('');

  for (const cost of costs) {
    const elapsed = cost.endTime ? ((cost.endTime - cost.startTime) / 1000).toFixed(1) : '?';
    console.log(`  ${cost.phase}: ${cost.description} [${cost.model}] - ${elapsed}s`);
  }
  console.log('');
  console.log('  >>> CHECK KIE.AI DASHBOARD FOR EXACT CREDIT COSTS <<<');
  console.log('  >>> We need this to calculate UGCFirst credit pricing <<<');
  console.log('');

  // Review checklist
  console.log('========================================================');
  console.log(' REVIEW CHECKLIST');
  console.log('========================================================');
  console.log('');
  console.log('  1-actor-photo.png:');
  console.log('    [ ] Looks like a real person (not AI-obvious)?');
  console.log('    [ ] Selfie style / UGC aesthetic?');
  console.log('');
  console.log('  2-product-base.png:');
  console.log('    [ ] Clean product shot?');
  console.log('    [ ] Recognizable bottle shape?');
  console.log('');
  console.log('  3-product-grid.png:');
  console.log('    [ ] Shows multiple distinct angles?');
  console.log('    [ ] Consistent product identity across angles?');
  console.log('');
  console.log('  4-composite-actor-product.png (CRITICAL):');
  console.log('    [ ] Product naturally in hand (not floating)?');
  console.log('    [ ] Lighting matches between person and product?');
  console.log('    [ ] Same face as Phase 1 actor?');
  console.log('    [ ] Product label visible?');
  console.log('');
  console.log('  5-ugc-video-veo3.mp4 (MOST CRITICAL):');
  console.log('    [ ] Person is speaking - audio present?');
  console.log('    [ ] Lip sync looks natural?');
  console.log('    [ ] PRODUCT VISIBLE throughout video?');
  console.log('    [ ] Product stays in hand / doesn\'t morph?');
  console.log('    [ ] Natural gestures and movement?');
  console.log('    [ ] Speech matches the script we provided?');
  console.log('    [ ] UGC authentic feel (not commercial)?');
  console.log('    [ ] Video duration? ___s');
  console.log('    [ ] Audio quality (1-10)? ___');
  console.log('');
  console.log('  6b-endscreen-video.mp4:');
  console.log('    [ ] Smooth product reveal animation?');
  console.log('    [ ] Premium / professional feel?');
  console.log('    [ ] Would work as ad end card?');
  console.log('');
}

main().catch((err) => {
  console.error('');
  console.error('PIPELINE FAILED:', err);
  process.exit(1);
});
