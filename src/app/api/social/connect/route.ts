import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/supabase';
import { LateService, type LatePlatform } from '@/lib/social/late';

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

    // Build redirect URL (callback endpoint)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/api/social/callback`;

    // Get OAuth URL from Late
    const response = await LateService.getConnectUrl({
      platform,
      redirectUrl,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      authUrl: response.authUrl,
      state: response.state,
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
