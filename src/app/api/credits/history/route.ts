import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/supabase';
import { CreditService } from '@/services/credits';
import { CreditTransactionType } from '@/types/credits';

// ============================================
// GET /api/credits/history
// Returns user's credit transaction history
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const type = searchParams.get('type') as CreditTransactionType | null;

    // Get transaction history
    const history = await CreditService.getTransactionHistory(user.id, {
      limit: Math.min(limit, 100), // Cap at 100
      offset,
      type: type || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: history,
        pagination: {
          limit,
          offset,
          hasMore: history.length === limit,
        },
      },
    });
  } catch (error) {
    console.error('Error getting credit history:', error);
    return NextResponse.json(
      { error: 'Failed to get credit history' },
      { status: 500 }
    );
  }
}
