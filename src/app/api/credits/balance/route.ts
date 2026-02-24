import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/supabase';
import { CreditService } from '@/services/credits';

// ============================================
// GET /api/credits/balance
// Returns user's current credit balance
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    // Get balance
    const balance = await CreditService.getBalance(user.id);

    return NextResponse.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error('Error getting credit balance:', error);
    return NextResponse.json(
      { error: 'Failed to get credit balance' },
      { status: 500 }
    );
  }
}
