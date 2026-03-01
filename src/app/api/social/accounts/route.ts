import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import {
  rowToConnectedAccount,
  type ConnectedAccountRow,
  type ListConnectedAccountsResponse,
} from '@/types/connected-account';

// ============================================
// GET /api/social/accounts
// List user's connected social media accounts
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ListConnectedAccountsResponse>> {
  try {
    // Verify auth
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, accounts: [], error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const adminSupabase = getAdminClient();

    // Fetch user's connected accounts
    const { data: rows, error: dbError } = await adminSupabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (dbError) {
      console.error('Failed to fetch connected accounts:', dbError);
      return NextResponse.json(
        { success: false, accounts: [], error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    const accounts = (rows as ConnectedAccountRow[]).map(rowToConnectedAccount);

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('List accounts error:', error);
    return NextResponse.json(
      {
        success: false,
        accounts: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
