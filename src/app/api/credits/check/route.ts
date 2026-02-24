import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/supabase';
import { CreditService } from '@/services/credits';

// ============================================
// POST /api/credits/check
// Checks if user has sufficient credits for an action
// ============================================

interface CheckCreditsRequest {
  required: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    // Parse request body
    const body: CheckCreditsRequest = await request.json();

    if (typeof body.required !== 'number' || body.required < 0) {
      return NextResponse.json(
        { error: 'Invalid required amount' },
        { status: 400 }
      );
    }

    // Check balance
    const result = await CreditService.checkBalance(user.id, body.required);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking credits:', error);
    return NextResponse.json(
      { error: 'Failed to check credits' },
      { status: 500 }
    );
  }
}
