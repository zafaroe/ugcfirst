import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { CreditService } from '@/services/credits';
import { inngest } from '@/inngest/client';
import { calculateCreditCost } from '@/types/credits';
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
      mode,
    } = body;

    // Validate required fields
    if (!productName || !productImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: productName, productImageUrl' },
        { status: 400 }
      );
    }

    // Calculate credit cost
    const creditCost = calculateCreditCost({ mode, captionsEnabled });

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
        captions_enabled: captionsEnabled,
        mode,
        credit_cost: creditCost,
        status: 'queued',
        current_step: 0,
        total_steps: 9,
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

    // Trigger background job with idempotency key to prevent duplicates
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
        captionsEnabled,
        mode,
        creditTransactionId: holdResult.transactionId,
      },
    });

    const response: StartGenerationResponse = {
      generationId: generation.id,
      status: 'queued',
      creditCost,
      estimatedTime: captionsEnabled ? 270 : 240, // ~4-4.5 minutes
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
