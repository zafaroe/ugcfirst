import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { CreditService } from '@/services/credits';
import { inngest } from '@/inngest/client';
import { CREDIT_COSTS } from '@/types/credits';
import { Generation, PersonaProfile } from '@/types/generation';

// ============================================
// POST /api/generate/regenerate
// Regenerate a video with user feedback (half credit cost)
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    // Parse request body
    const body = await request.json();
    const { generationId, feedback, captionsEnabled = true } = body;

    // Validate required fields
    if (!generationId) {
      return NextResponse.json(
        { error: 'generationId is required' },
        { status: 400 }
      );
    }
    if (!feedback || feedback.trim().length === 0) {
      return NextResponse.json(
        { error: 'feedback is required' },
        { status: 400 }
      );
    }

    const adminSupabase = getAdminClient();

    // 1. Fetch the original generation (must be completed and owned by user)
    const { data: original, error: fetchError } = await adminSupabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !original) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    if (original.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only regenerate completed generations' },
        { status: 400 }
      );
    }

    // 2. Check credits (half cost - EDIT_FIX = 5)
    const creditCost = CREDIT_COSTS.EDIT_FIX;
    const creditCheck = await CreditService.checkBalance(user.id, creditCost);

    if (!creditCheck.hasEnough) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditCost,
          available: creditCheck.balance,
          deficit: creditCheck.deficit,
        },
        { status: 402 }
      );
    }

    // 3. Check free plan limits (same as generate/start)
    const { data: userCredits } = await adminSupabase
      .from('user_credits')
      .select('subscription_tier, has_paid')
      .eq('user_id', user.id)
      .single();

    const tier = userCredits?.subscription_tier || 'free';
    const hasPaid = userCredits?.has_paid || false;
    const isPureFree = tier === 'free' && !hasPaid;

    if (isPureFree) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count } = await adminSupabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart)
        .not('status', 'eq', 'failed');

      if ((count || 0) >= 1) {
        return NextResponse.json(
          {
            error: 'Monthly video limit reached',
            message: 'Free plan includes 1 video per month. Purchase credits or subscribe to create more.',
          },
          { status: 429 }
        );
      }
    }

    const applyWatermark = isPureFree;

    // 4. Build regeneration script with feedback
    const originalScript = original.custom_script ||
      (original.scripts && original.scripts[0]?.fullScript) || '';
    const regenerateScript = buildRegenerateScript(originalScript, feedback.trim());

    // 5. Create new generation record with reused persona
    const { data: newGeneration, error: createError } = await adminSupabase
      .from('generations')
      .insert({
        user_id: user.id,
        product_name: original.product_name,
        product_image_url: original.product_image_url,
        avatar_id: original.avatar_id,
        template_id: original.template_id,
        custom_script: regenerateScript,
        captions_enabled: captionsEnabled,
        mode: original.mode,
        credit_cost: creditCost,
        status: 'queued',
        current_step: 0,
        total_steps: 9,
        // Preserve the persona from the original (skip re-analysis)
        persona_profile: original.persona_profile,
        // Link to original for reference
        parent_generation_id: generationId,
      })
      .select('id')
      .single();

    if (createError || !newGeneration) {
      console.error('Failed to create regeneration:', createError);
      return NextResponse.json(
        { error: 'Failed to create regeneration' },
        { status: 500 }
      );
    }

    // 6. Hold credits
    const holdResult = await CreditService.holdCredits(
      user.id,
      creditCost,
      newGeneration.id
    );

    // Update generation with transaction ID
    await adminSupabase
      .from('generations')
      .update({ credit_transaction_id: holdResult.transactionId })
      .eq('id', newGeneration.id);

    // 7. Trigger generation pipeline with existingPersona to skip analysis
    // Note: Using timestamp in event ID to avoid deduplication issues on retries
    await inngest.send({
      id: `generation-${newGeneration.id}-${Date.now()}`,
      name: 'generation/start',
      data: {
        generationId: newGeneration.id,
        userId: user.id,
        productName: original.product_name,
        productImageUrl: original.product_image_url,
        avatarId: original.avatar_id,
        templateId: original.template_id,
        customScript: regenerateScript,
        captionsEnabled,
        mode: original.mode,
        creditTransactionId: holdResult.transactionId,
        applyWatermark,
        // Skip analysis - reuse persona from original
        existingPersona: original.persona_profile as PersonaProfile,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        generationId: newGeneration.id,
        originalGenerationId: generationId,
        status: 'queued',
        creditCost,
      },
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Build a script that incorporates user feedback
 * Prepends feedback as AI instructions before the original script
 */
function buildRegenerateScript(originalScript: string, feedback: string): string {
  return `[REGENERATION INSTRUCTIONS: The user wants changes to this video. Their feedback: "${feedback}". Please generate a NEW script that addresses this feedback while keeping the same product focus. Original script for reference: ${originalScript}]`;
}
