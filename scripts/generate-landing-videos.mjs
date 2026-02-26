/**
 * Landing Page Video Generator
 *
 * Generates 5 UGC demo videos for the landing page using the full pipeline.
 *
 * Usage:
 *   node scripts/generate-landing-videos.mjs
 *
 * Prerequisites:
 *   - Environment variables configured (.env.local)
 *   - Kie.ai API credentials
 *   - Supabase service role key
 *   - Local Inngest dev server running (npx inngest-cli@latest dev)
 *   - Next.js dev server running (npm run dev)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}

// ============================================
// CONFIGURATION
// ============================================

// Products with high-quality Unsplash images
const PRODUCTS = [
  {
    name: 'GlowSerum Pro - Vitamin C Brightening Serum',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1080&q=80',
    category: 'beauty',
    outputFile: 'beauty-demo.mp4',
  },
  {
    name: 'TechFit Smart Watch Pro',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1080&q=80',
    category: 'tech',
    outputFile: 'tech-demo.mp4',
  },
  {
    name: 'BlendMaster Portable Blender',
    imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=1080&q=80',
    category: 'lifestyle',
    outputFile: 'lifestyle-demo.mp4',
  },
  {
    name: 'CloudWalk Ultra Running Sneakers',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&q=80',
    category: 'fashion',
    outputFile: 'fashion-demo.mp4',
  },
  {
    name: 'SoundPods Pro Wireless Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1080&q=80',
    category: 'audio',
    outputFile: 'audio-demo.mp4',
  },
];

// Generation settings
const GENERATION_MODE = 'diy'; // DIY mode for faster generation
const CAPTIONS_ENABLED = true;
const POLL_INTERVAL_MS = 10000; // 10 seconds
const MAX_WAIT_TIME_MS = 600000; // 10 minutes per generation

// User ID will be set dynamically
let TEST_USER_ID = null;

// ============================================
// SUPABASE CLIENT
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// R2 PUBLIC URL
// ============================================

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://videos.ugcfirst.com';

function getPublicUrl(key) {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getOrCreateTestUser() {
  console.log('🔍 Looking for existing test user...');

  // First, try to find an existing user using Supabase Admin API
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  // Look for the test user
  const testUser = users.users.find(u => u.email === 'test@ugcfirst.com');

  if (testUser) {
    console.log(`   ✅ Found test user: ${testUser.id}`);
    return testUser.id;
  }

  // Create a new test user if none exists
  console.log('   📝 Creating new test user...');
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'test@ugcfirst.com',
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: {
      name: 'Test User',
    },
  });

  if (createError) {
    throw new Error(`Failed to create test user: ${createError.message}`);
  }

  console.log(`   ✅ Created test user: ${newUser.user.id}`);

  // Also create user_credits record for this user
  const { error: creditsError } = await supabase
    .from('user_credits')
    .upsert({
      user_id: newUser.user.id,
      balance: 1000, // Give plenty of credits for demos
      held: 0,
    });

  if (creditsError) {
    console.log(`   ⚠️ Warning: Could not create credits: ${creditsError.message}`);
  } else {
    console.log(`   ✅ Added 1000 credits to test user`);
  }

  return newUser.user.id;
}

async function createGeneration(product) {
  console.log(`\n🎬 Creating generation for: ${product.name}`);

  // Calculate credit cost (DIY = 50, + 15 for captions)
  const creditCost = CAPTIONS_ENABLED ? 65 : 50;

  // Create generation record
  const { data: generation, error } = await supabase
    .from('generations')
    .insert({
      user_id: TEST_USER_ID,
      product_name: product.name,
      product_image_url: product.imageUrl,
      avatar_id: null,
      template_id: null,
      custom_script: null,
      captions_enabled: CAPTIONS_ENABLED,
      mode: GENERATION_MODE,
      credit_cost: creditCost,
      status: 'queued',
      current_step: 0,
      total_steps: 9,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create generation: ${error.message}`);
  }

  console.log(`   ✅ Created generation: ${generation.id}`);
  return generation.id;
}

async function triggerInngest(generationId, product) {
  console.log(`   📤 Triggering Inngest job...`);

  // Send event to local Inngest dev server
  const response = await fetch('http://127.0.0.1:8288/e/ugcfirst', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{
      id: `generation-${generationId}`,
      name: 'generation/start',
      data: {
        generationId,
        userId: TEST_USER_ID,
        productName: product.name,
        productImageUrl: product.imageUrl,
        captionsEnabled: CAPTIONS_ENABLED,
        mode: GENERATION_MODE,
        creditTransactionId: 'landing-demo',
      },
    }]),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to trigger Inngest: ${response.status} ${text}`);
  }

  console.log(`   ✅ Inngest job triggered`);
}

async function waitForCompletion(generationId) {
  console.log(`   ⏳ Waiting for generation to complete...`);

  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_TIME_MS) {
    const { data: generation, error } = await supabase
      .from('generations')
      .select('status, current_step, total_steps, videos, error_message')
      .eq('id', generationId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch generation status: ${error.message}`);
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`      Status: ${generation.status} (step ${generation.current_step}/${generation.total_steps}) - ${elapsed}s`);

    if (generation.status === 'completed') {
      console.log(`   ✅ Generation completed!`);
      return generation;
    }

    if (generation.status === 'failed') {
      throw new Error(`Generation failed: ${generation.error_message}`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('Generation timed out');
}

async function downloadVideo(videoUrl, outputPath) {
  console.log(`   📥 Downloading video to: ${outputPath}`);

  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);

  console.log(`   ✅ Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║       UGCFirst Landing Page Video Generator                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();

  // Get or create test user
  TEST_USER_ID = await getOrCreateTestUser();
  console.log();

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '..', 'public', 'videos', 'landing');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}\n`);
  }

  const results = [];

  for (let i = 0; i < PRODUCTS.length; i++) {
    const product = PRODUCTS[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Product ${i + 1}/${PRODUCTS.length}: ${product.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      // Step 1: Create generation record
      const generationId = await createGeneration(product);

      // Step 2: Trigger Inngest job
      await triggerInngest(generationId, product);

      // Step 3: Wait for completion
      const generation = await waitForCompletion(generationId);

      // Step 4: Get the best video (first one with subtitles)
      if (generation.videos && generation.videos.length > 0) {
        const video = generation.videos[0];
        const videoKey = video.videoSubtitledR2Key || video.videoR2Key;

        if (videoKey) {
          const videoUrl = getPublicUrl(videoKey);
          const outputPath = path.join(outputDir, product.outputFile);

          await downloadVideo(videoUrl, outputPath);

          results.push({
            product: product.name,
            category: product.category,
            file: product.outputFile,
            generationId,
            status: 'success',
          });
        } else {
          results.push({
            product: product.name,
            category: product.category,
            status: 'no_video_key',
            generationId,
          });
        }
      } else {
        results.push({
          product: product.name,
          category: product.category,
          status: 'no_videos',
          generationId,
        });
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        product: product.name,
        category: product.category,
        status: 'failed',
        error: error.message,
      });
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        SUMMARY                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');

  console.log(`✅ Successful: ${successful.length}/${PRODUCTS.length}`);
  if (successful.length > 0) {
    successful.forEach(r => {
      console.log(`   • ${r.category}: ${r.file}`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${PRODUCTS.length}`);
    failed.forEach(r => {
      console.log(`   • ${r.category}: ${r.status} - ${r.error || 'unknown'}`);
    });
  }

  console.log('\n📋 Next steps:');
  console.log('   1. Update src/components/ui/demo-gallery.tsx with new video paths');
  console.log('   2. Test videos on localhost');
  console.log('   3. Commit and push to staging/production');
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
