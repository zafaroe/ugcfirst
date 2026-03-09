import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { LateService } from '@/lib/social/late';

// ============================================
// GET /api/social/callback
// Handle OAuth callback from Late after user authorizes
// ============================================

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle error from OAuth provider
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent(error)}`
      );
    }

    if (!state) {
      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('Missing OAuth state')}`
      );
    }

    const adminSupabase = getAdminClient();

    // Look up the pending record by state
    // We stored it as `pending_${state}` in late_account_id
    const { data: pendingRecord, error: lookupError } = await adminSupabase
      .from('connected_accounts')
      .select('id, user_id, platform, account_metadata')
      .eq('late_account_id', `pending_${state}`)
      .eq('is_active', false)
      .single();

    if (lookupError || !pendingRecord) {
      console.error('No pending OAuth record found for state:', state);
      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('OAuth session expired or invalid')}`
      );
    }

    // Get user's Late profile ID
    const { data: userCredits } = await adminSupabase
      .from('user_credits')
      .select('late_profile_id')
      .eq('user_id', pendingRecord.user_id)
      .single();

    if (!userCredits?.late_profile_id) {
      console.error('No Late profile for user:', pendingRecord.user_id);
      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('Profile not found')}`
      );
    }

    // Get accounts from Late for this profile
    const lateAccounts = await LateService.listAccounts(userCredits.late_profile_id);

    // Find the newly connected account for this platform
    // Get existing accounts for this user/platform to filter out
    const { data: existingAccounts } = await adminSupabase
      .from('connected_accounts')
      .select('late_account_id')
      .eq('user_id', pendingRecord.user_id)
      .eq('platform', pendingRecord.platform)
      .eq('is_active', true);

    const existingIds = new Set((existingAccounts || []).map((a) => a.late_account_id));

    // Find the new account (one that's not in our existing list)
    const newAccount = lateAccounts.find(
      (acc) =>
        acc.platform === pendingRecord.platform &&
        acc.profileId === userCredits.late_profile_id &&
        !existingIds.has(acc.id)
    );

    if (!newAccount) {
      // If we can't find a new account, Late might still be processing
      // Or the user cancelled - clean up the pending record
      await adminSupabase
        .from('connected_accounts')
        .delete()
        .eq('id', pendingRecord.id);

      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('Connection was cancelled or failed')}`
      );
    }

    // Update the pending record with real account info
    const { error: updateError } = await adminSupabase
      .from('connected_accounts')
      .update({
        late_account_id: newAccount.id,
        account_name: newAccount.displayName || newAccount.username || null,
        account_avatar_url: newAccount.avatarUrl || null,
        account_metadata: {
          ...((pendingRecord.account_metadata as Record<string, unknown>) || {}),
          username: newAccount.username,
          connected_at: new Date().toISOString(),
        },
        is_active: true,
      })
      .eq('id', pendingRecord.id);

    if (updateError) {
      console.error('Failed to update connected account:', updateError);
      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('Failed to save connection')}`
      );
    }

    // Success! Redirect with platform name
    const platformName = pendingRecord.platform.charAt(0).toUpperCase() + pendingRecord.platform.slice(1);
    return NextResponse.redirect(
      `${baseUrl}/settings?tab=accounts&success=${encodeURIComponent(`${platformName} connected successfully!`)}`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('Connection failed. Please try again.')}`
    );
  }
}
