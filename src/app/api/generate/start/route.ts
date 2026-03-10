import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { CreditService } from '@/services/credits';
import { inngest } from '@/inngest/client';
import { calculateCreditCost, calculateSpotlightCreditCost, type SpotlightDuration } from '@/types/credits';
import { StartGenerationRequest, StartGenerationResponse } from '@/types/generation';

// ============================================
// POST /api/generate/start
// Start a new video generation
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    // Parse request body
    const body: StartGenerationRequest = await request.json();
    const {
      productName,
      productImageUrl,
      avatarId,
      templateId,
      customScript,
      captionsEnabled,
      endScreenEnabled = false,
      endScreenCtaText,
      endScreenBrandText,
      mode,
      existingPersona, // Reuse persona from frontend (avoid double API calls)
      // Spotlight-specific fields
      spotlightCategoryId,
      spotlightStyleId,
      spotlightDuration = '5',
    } = body;

    // Validate required fields
    if (!productName || !productImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: productName, productImageUrl' },
        { status: 400 }
      );
    }

    // Spotlight-specific validation
    if (mode === 'spotlight') {
      if (!spotlightCategoryId || !spotlightStyleId) {
        return NextResponse.json(
          { error: 'Spotlight mode requires categoryId and styleId' },
          { status: 400 }
        );
      }
    }

    // Calculate credit cost (different for spotlight mode)
    const creditCost = mode === 'spotlight'
      ? calculateSpotlightCreditCost(spotlightDuration as SpotlightDuration)
      : calculateCreditCost({ mode, captionsEnabled, endScreenEnabled });

    // Check credit balance
    const creditCheck = await CreditService.checkBalance(user.id, creditCost);

    if (!creditCheck.hasEnough) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditCost,
          available: creditCheck.balance,
          deficit: creditCheck.deficit,
        },
        { status: 402 } // Payment Required
      );
    }

    const adminSupabase = getAdminClient();

    // ========================================
    // Free Plan Enforcement (has_paid approach)
    // ========================================
    const { data: userCredits } = await adminSupabase
      .from('user_credits')
      .select('subscription_tier, has_paid')
      .eq('user_id', user.id)
      .single();

    const tier = userCredits?.subscription_tier || 'free';
    const hasPaid = userCredits?.has_paid || false;

    // Determine if this is a "pure free" user (free tier + never paid)
    const isPureFree = tier === 'free' && !hasPaid;

    // Pure free users: enforce 1 video per calendar month
    if (isPureFree) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count: generationCount } = await adminSupabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart)
        .not('status', 'eq', 'failed');

      if ((generationCount || 0) >= 1) {
        return NextResponse.json(
          {
            error: 'Monthly video limit reached',
            limit: 1,
            used: generationCount,
            tier: 'free',
            message: 'Free plan includes 1 video per month. Purchase a credit pack or subscribe to create more.',
          },
          { status: 429 }
        );
      }
    }

    // Watermark ONLY for pure free users
    const applyWatermark = isPureFree;

    // Determine total steps based on mode
    // Spotlight: 3 steps (analyze, frame, animate)
    // DIY/Concierge: 9-10 steps
    const totalSteps = mode === 'spotlight' ? 3 : 9;

    // Create generation record
    const { data: generation, error: createError } = await adminSupabase
      .from('generations')
      .insert({
        user_id: user.id,
        product_name: productName,
        product_image_url: productImageUrl,
        avatar_id: avatarId || null,
        template_id: templateId || null,
        custom_script: customScript || null,
        captions_enabled: mode === 'spotlight' ? false : captionsEnabled, // No captions for spotlight
        mode,
        credit_cost: creditCost,
        status: 'queued',
        current_step: 0,
        total_steps: totalSteps,
        // Spotlight-specific columns (null for non-spotlight modes)
        spotlight_category_id: mode === 'spotlight' ? spotlightCategoryId : null,
        spotlight_style_id: mode === 'spotlight' ? spotlightStyleId : null,
        spotlight_duration: mode === 'spotlight' ? spotlightDuration : null,
      })
      .select('id')
      .single();

    if (createError || !generation) {
      console.error('Supabase create generation error:', createError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create generation record: ${createError?.message || 'Unknown database error'}`
        },
        { status: 500 }
      );
    }

    // Hold credits
    const holdResult = await CreditService.holdCredits(
      user.id,
      creditCost,
      generation.id
    );

    // Update generation with transaction ID
    await adminSupabase
      .from('generations')
      .update({ credit_transaction_id: holdResult.transactionId })
      .eq('id', generation.id);

    // Route spotlight to dedicated function for proper Inngest checkpointing
    if (mode === 'spotlight') {
      await inngest.send({
        id: `generation-${generation.id}`,
        name: 'generation/spotlight-start',
        data: {
          generationId: generation.id,
          userId: user.id,
          productName,
          productImageUrl,
          creditTransactionId: holdResult.transactionId,
          applyWatermark,
          spotlightCategoryId: spotlightCategoryId!,
          spotlightStyleId: spotlightStyleId!,
          spotlightDuration: spotlightDuration as '5' | '10',
        },
      });
    } else {
      // DIY / Concierge use the original function
      await inngest.send({
        id: `generation-${generation.id}`,
        name: 'generation/start',
        data: {
          generationId: generation.id,
          userId: user.id,
          productName,
          productImageUrl,
          avatarId,
          templateId,
          customScript,
          captionsEnabled: captionsEnabled ?? false,
          endScreenEnabled,
          endScreenCtaText,
          endScreenBrandText,
          mode,
          creditTransactionId: holdResult.transactionId,
          applyWatermark,
          existingPersona: existingPersona || undefined, // Reuse persona (avoid re-analysis)
        },
      });
    }

    // Estimate time based on mode
    // Spotlight: ~2 mins (1 image + 1 video)
    // DIY/Concierge with captions: ~4.5 mins
    // DIY/Concierge without captions: ~4 mins
    const estimatedTime = mode === 'spotlight'
      ? 120
      : (captionsEnabled ? 270 : 240);

    const response: StartGenerationResponse = {
      generationId: generation.id,
      status: 'queued',
      creditCost,
      estimatedTime,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error starting generation:', error);

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: `Failed to start generation: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}
