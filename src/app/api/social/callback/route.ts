import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { LateService } from '@/lib/social/late';

// ============================================
// GET /api/social/callback
// Handle OAuth callback from Late after user authorizes
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Build redirect URL for success/error
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Handle error from OAuth provider
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('Missing OAuth parameters')}`
      );
    }

    // Complete OAuth flow with Late
    const connectedAccount = await LateService.handleOAuthCallback({
      code,
      state,
    });

    // The state contains the user ID (set by Late based on externalUserId)
    // We need to extract it - Late typically includes it in the callback
    // For now, we'll get the user from the state or the account response

    // Store the connected account in our database
    const adminSupabase = getAdminClient();

    // Try to extract userId from state (format depends on Late's implementation)
    // For simplicity, we'll use the metadata from Late's response
    const userId = connectedAccount.metadata?.externalUserId as string;

    if (!userId) {
      console.error('No user ID in OAuth callback');
      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('Could not identify user')}`
      );
    }

    // Upsert the connected account
    const { error: dbError } = await adminSupabase
      .from('connected_accounts')
      .upsert(
        {
          user_id: userId,
          platform: connectedAccount.platform,
          late_account_id: connectedAccount.id,
          account_name: connectedAccount.displayName || connectedAccount.username || null,
          account_avatar_url: connectedAccount.avatarUrl || null,
          account_metadata: connectedAccount.metadata || {},
          is_active: true,
        },
        {
          onConflict: 'user_id,platform,late_account_id',
        }
      );

    if (dbError) {
      console.error('Failed to save connected account:', dbError);
      return NextResponse.redirect(
        `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('Failed to save connection')}`
      );
    }

    // Redirect to settings with success message
    return NextResponse.redirect(
      `${baseUrl}/settings?tab=accounts&success=${encodeURIComponent(`${connectedAccount.platform} connected successfully!`)}`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/settings?tab=accounts&error=${encodeURIComponent('Connection failed. Please try again.')}`
    );
  }
}
