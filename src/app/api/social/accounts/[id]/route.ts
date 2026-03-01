import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { LateService } from '@/lib/social/late';
import type { DisconnectAccountResponse } from '@/types/connected-account';

// ============================================
// DELETE /api/social/accounts/[id]
// Disconnect a social media account
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DisconnectAccountResponse>> {
  try {
    // Verify auth
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const adminSupabase = getAdminClient();

    // Fetch the account to verify ownership and get Late account ID
    const { data: account, error: fetchError } = await adminSupabase
      .from('connected_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    // Try to disconnect from Late API (best effort - don't fail if this errors)
    try {
      if (LateService.isConfigured()) {
        await LateService.disconnectAccount(account.late_account_id);
      }
    } catch (lateError) {
      console.error('Late disconnect error (continuing anyway):', lateError);
    }

    // Soft delete - mark as inactive
    const { error: updateError } = await adminSupabase
      .from('connected_accounts')
      .update({ is_active: false })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to disconnect account:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to disconnect account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect account error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
