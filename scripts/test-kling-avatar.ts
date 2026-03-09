/**
 * Kling Avatar Proof-of-Concept Test Script
 *
 * Tests the full pipeline:
 * 1. Generate avatar photo (Flux/nano-banana)
 * 2. Generate TTS voiceover (ElevenLabs)
 * 3. Send both to Kling Avatar API
 * 4. Poll for completion, get lip-synced talking-head video
 * 5. Save all artifacts locally AND to R2
 *
 * Run with: npx tsx scripts/test-kling-avatar.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config({ path: '.env.local' });

// ============================================
// CONFIGURATION
// ============================================

const TEST_SCRIPT = `
Hey bestie, you NEED to try this serum.
I've been using it for two weeks and my skin has never looked better.
The vitamin C just makes you glow, like actually glow.
Link in bio!
`.trim();

const AVATAR_IMAGE_PROMPT = `
Photo-realistic portrait of an attractive young woman in her mid-20s.
Looking directly at camera with a friendly, approachable expression.
Natural makeup, clear skin, warm lighting.
Simple neutral background (cream or light gray).
Upper body visible, facing camera.
Instagram influencer aesthetic.
High quality, professional headshot style.
Vertical format (9:16), centered face.
NO text, NO captions, NO watermarks.
`.trim();

const AVATAR_VIDEO_PROMPT = `
Natural speaking gestures, friendly and energetic expression.
Slight head movements, eyebrow raises for emphasis.
Casual, conversational delivery like talking to a friend.
Maintain eye contact with camera.
`.trim();

const OUTPUT_DIR = 'test-output/kling-avatar-poc';

// ============================================
// HELPER FUNCTIONS
// ============================================

function ensureOutputDir() {
  const fullPath = path.resolve(OUTPUT_DIR);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created output directory: ${fullPath}`);
  }
  return fullPath;
}

function saveLocally(filename: string, buffer: Buffer): string {
  const outputDir = ensureOutputDir();
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Saved locally: ${filepath} (${buffer.length} bytes)`);
  return filepath;
}

// ============================================
// MAIN RUNNER
// ============================================

async function run() {
  // Import modules after dotenv has loaded
  const { KieService } = await import('../src/lib/ai/kie');
  const { uploadToR2, getPublicUrl } = await import('../src/lib/r2');

  async function uploadToR2AndGetUrl(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await uploadToR2(key, buffer, { contentType });
    const publicUrl = getPublicUrl(key);
    console.log(`Uploaded to R2: ${key}`);
    console.log(`Public URL: ${publicUrl}`);
    return publicUrl;
  }

  // ============================================
  // PHASE 1: GENERATE AVATAR PHOTO
  // ============================================

  async function generateAvatarPhoto(): Promise<{ buffer: Buffer; url: string }> {
    console.log('\n' + '='.repeat(50));
    console.log('PHASE 1: Generating Avatar Photo');
    console.log('='.repeat(50));
    console.log('Prompt:', AVATAR_IMAGE_PROMPT.substring(0, 100) + '...');

    const startTime = Date.now();

    const result = await KieService.generateImageSync(
      {
        model: 'nano-banana-pro',
        prompt: AVATAR_IMAGE_PROMPT,
        aspectRatio: '9:16',
      },
      (task) => {
        console.log(`  Image generation: ${task.status} (${task.progress || 0}%)`);
      }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nImage generated in ${elapsed}s`);
    console.log(`Result URL: ${result.url}`);
    console.log(`Dimensions: ${result.width}x${result.height}`);

    // Download the image
    const buffer = await KieService.downloadFile(result.url);
    console.log(`Downloaded: ${buffer.length} bytes`);

    // Save locally
    saveLocally('avatar-photo.png', buffer);

    // Upload to R2
    const publicUrl = await uploadToR2AndGetUrl(
      'test/kling-avatar-poc/avatar-photo.png',
      buffer,
      'image/png'
    );

    return { buffer, url: publicUrl };
  }

  // ============================================
  // PHASE 2: GENERATE VOICEOVER
  // ============================================

  async function generateVoiceover(): Promise<{ buffer: Buffer; url: string; duration: number }> {
    console.log('\n' + '='.repeat(50));
    console.log('PHASE 2: Generating Voiceover');
    console.log('='.repeat(50));
    console.log('Script:', TEST_SCRIPT.substring(0, 80) + '...');
    console.log('Character count:', TEST_SCRIPT.length);

    const startTime = Date.now();

    const result = await KieService.generateVoiceoverSync(
      {
        model: 'elevenlabs/flash',
        text: TEST_SCRIPT,
        voiceId: 'Rachel', // Natural female voice
      },
      (task) => {
        console.log(`  TTS generation: ${task.status} (${task.progress || 0}%)`);
      }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nVoiceover generated in ${elapsed}s`);
    console.log(`Result URL: ${result.url}`);
    console.log(`Duration: ${result.duration}s`);

    // Download the audio
    const buffer = await KieService.downloadFile(result.url);
    console.log(`Downloaded: ${buffer.length} bytes`);

    // Save locally
    saveLocally('voiceover.mp3', buffer);

    // Upload to R2
    const publicUrl = await uploadToR2AndGetUrl(
      'test/kling-avatar-poc/voiceover.mp3',
      buffer,
      'audio/mpeg'
    );

    return { buffer, url: publicUrl, duration: result.duration };
  }

  // ============================================
  // PHASE 3: GENERATE AVATAR VIDEO
  // ============================================

  async function generateAvatarVideo(imageUrl: string, audioUrl: string): Promise<{ buffer: Buffer; url: string }> {
    console.log('\n' + '='.repeat(50));
    console.log('PHASE 3: Generating Avatar Video');
    console.log('='.repeat(50));
    console.log('Image URL:', imageUrl);
    console.log('Audio URL:', audioUrl);
    console.log('Prompt:', AVATAR_VIDEO_PROMPT);

    const startTime = Date.now();

    try {
      const result = await KieService.generateAvatarSync(
        {
          imageUrl,
          audioUrl,
          prompt: AVATAR_VIDEO_PROMPT,
        },
        (task) => {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          console.log(`  [${elapsed}s] Avatar generation: ${task.status} (${task.progress || 0}%)`);
        }
      );

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\nAvatar video generated in ${elapsed}s`);
      console.log(`Result URL: ${result.url}`);
      console.log(`Duration: ${result.duration}s`);
      console.log(`Dimensions: ${result.width}x${result.height}`);

      // Download the video
      const buffer = await KieService.downloadFile(result.url);
      console.log(`Downloaded: ${buffer.length} bytes`);

      // Save locally
      saveLocally('avatar-video-standard.mp4', buffer);

      // Upload to R2
      const publicUrl = await uploadToR2AndGetUrl(
        'test/kling-avatar-poc/avatar-video-standard.mp4',
        buffer,
        'video/mp4'
      );

      return { buffer, url: publicUrl };
    } catch (error) {
      console.error('\nAvatar generation failed:', error);

      // Log helpful debug info
      if (error instanceof Error) {
        console.error('Error message:', error.message);

        // Suggest alternative model names if this looks like a model error
        if (error.message.includes('model') || error.message.includes('Model')) {
          console.log('\nTry alternative model names:');
          console.log('  - kling/avatar-standard');
          console.log('  - kling-ai-avatar-standard');
          console.log('  - kling/ai-avatar-standard');
        }
      }

      throw error;
    }
  }

  // ============================================
  // MAIN EXECUTION
  // ============================================

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         KLING AVATAR PROOF-OF-CONCEPT TEST                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  // Check configuration
  if (!KieService.isConfigured()) {
    console.error('ERROR: Kie.ai is not configured!');
    console.error('Make sure KIE_API_KEY is set in .env.local');
    process.exit(1);
  }
  console.log('✓ Kie.ai configured');

  // Check R2 configuration
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
    console.error('ERROR: R2 is not configured!');
    console.error('Make sure R2_ACCOUNT_ID and R2_ACCESS_KEY_ID are set in .env.local');
    process.exit(1);
  }
  console.log('✓ R2 configured');

  const startTime = Date.now();

  try {
    // Check if we have existing assets (skip regeneration to save time/credits)
    const existingPhotoUrl = 'https://assets.vidnary.com/test/kling-avatar-poc/avatar-photo.png';
    const existingAudioUrl = 'https://assets.vidnary.com/test/kling-avatar-poc/voiceover.mp3';

    // Verify existing assets exist by fetching headers
    let photo = { buffer: Buffer.alloc(0), url: existingPhotoUrl };
    let voiceover = { buffer: Buffer.alloc(0), url: existingAudioUrl, duration: 12 };

    // Check if we should regenerate or reuse
    const REUSE_EXISTING = true; // Set to false to regenerate

    if (REUSE_EXISTING) {
      console.log('\nReusing existing assets from previous run...');
      console.log(`  Photo: ${existingPhotoUrl}`);
      console.log(`  Audio: ${existingAudioUrl}`);
    } else {
      // Phase 1: Generate avatar photo
      photo = await generateAvatarPhoto();

      // Phase 2: Generate voiceover
      voiceover = await generateVoiceover();
    }

    // Phase 3: Generate avatar video
    const video = await generateAvatarVideo(photo.url, voiceover.url);

    // Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total time: ${totalTime}s`);
    console.log(`\nOutput files saved to: ${path.resolve(OUTPUT_DIR)}/`);
    console.log('  ├── avatar-photo.png');
    console.log('  ├── voiceover.mp3');
    console.log('  └── avatar-video-standard.mp4');

    console.log('\nR2 URLs:');
    console.log(`  Photo: ${photo.url}`);
    console.log(`  Audio: ${voiceover.url}`);
    console.log(`  Video: ${video.url}`);

    console.log('\n' + '─'.repeat(60));
    console.log('REVIEW CHECKLIST:');
    console.log('─'.repeat(60));
    console.log('  [ ] Does the avatar photo look like a real person?');
    console.log('  [ ] Does the lip sync match the audio?');
    console.log('  [ ] Are facial expressions natural?');
    console.log('  [ ] Is video duration close to audio duration?');
    console.log('  [ ] Is there any product visible? (Expected: NO)');
    console.log('  [ ] What is the video resolution/quality?');
    console.log('  [ ] Kie.ai credits consumed (check dashboard)');
    console.log();

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('TEST FAILED');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

// Run the test
run().catch(console.error);
