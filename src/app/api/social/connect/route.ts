import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { LateService, type LatePlatform } from '@/lib/social/late';
import { hasSchedulingAccess, getAccountLimit } from '@/config/pricing';
import { randomUUID } from 'crypto';

// ============================================
// GET /api/social/connect
// Get OAuth URL to connect a social media account
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Verify auth
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    // Check if Late is configured
    if (!LateService.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Social media integration not configured' },
        { status: 503 }
      );
    }

    const adminSupabase = getAdminClient();

    // Get user's subscription tier
    const { data: userCredits, error: creditsError } = await adminSupabase
      .from('user_credits')
      .select('subscription_tier, late_profile_id')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !userCredits) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch user subscription' },
        { status: 500 }
      );
    }

    // Check tier - only Pro, Plus, Agency can connect accounts
    if (!hasSchedulingAccess(userCredits.subscription_tier)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Social scheduling is available on Pro and above. Upgrade to unlock.',
          requiresUpgrade: true,
        },
        { status: 403 }
      );
    }

    // Check account limit
    const accountLimit = getAccountLimit(userCredits.subscription_tier);
    const { count: existingCount } = await adminSupabase
      .from('connected_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if ((existingCount || 0) >= accountLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `You've reached the ${accountLimit} account limit for your ${userCredits.subscription_tier} plan. Upgrade to connect more accounts.`,
          requiresUpgrade: true,
        },
        { status: 403 }
      );
    }

    // Get platform from query params
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as LatePlatform;

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms: LatePlatform[] = [
      'tiktok', 'instagram', 'youtube', 'twitter',
      'linkedin', 'facebook', 'threads', 'pinterest', 'reddit', 'bluesky'
    ];

    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform: ${platform}` },
        { status: 400 }
      );
    }

    // Get or create Late profile
    let profileId = userCredits.late_profile_id;

    if (!profileId) {
      // Create a new Late profile for this user
      const profile = await LateService.createProfile(
        user.email || `User ${user.id}`,
        `UGCFirst user ${user.id}`
      );
      profileId = profile.id;

      // Save profile ID to user_credits
      await adminSupabase
        .from('user_credits')
        .update({ late_profile_id: profileId })
        .eq('user_id', user.id);
    }

    // Generate a unique state for tracking this OAuth flow
    const state = randomUUID();

    // Store state → userId mapping in a pending connected_accounts record
    // This allows us to look up the user when the callback comes in
    await adminSupabase
      .from('connected_accounts')
      .insert({
        user_id: user.id,
        platform,
        late_account_id: `pending_${state}`, // Will be updated on callback
        account_name: null,
        is_active: false, // Pending until callback completes
        account_metadata: { oauth_state: state, initiated_at: new Date().toISOString() },
      });

    // Build redirect URL (callback endpoint)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/api/social/callback?state=${state}`;

    // Get OAuth URL from Late
    const response = await LateService.getConnectUrl(platform, profileId, redirectUrl);

    return NextResponse.json({
      success: true,
      authUrl: response.authUrl,
      state,
    });
  } catch (error) {
    console.error('Get connect URL error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get connect URL',
      },
      { status: 500 }
    );
  }
}
