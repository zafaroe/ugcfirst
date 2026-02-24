import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { getSignedDownloadUrl } from '@/lib/r2';

/**
 * POST /api/media/signed-url
 * Generate a signed URL for accessing private media
 *
 * Request body:
 * - r2Key: string - The R2 storage key
 * - type: 'video' | 'frame' - Type of media
 * - expiresIn?: number - URL expiration in seconds (default: 1 hour for frames, 24 hours for videos)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    const body = await request.json();
    const { r2Key, type = 'video', expiresIn } = body;

    if (!r2Key) {
      return NextResponse.json(
        { success: false, error: 'r2Key is required' },
        { status: 400 }
      );
    }

    // Verify user owns this media by checking generation
    const generationId = extractGenerationId(r2Key);
    if (generationId) {
      const adminSupabase = getAdminClient();
      const { data: generation, error: genError } = await adminSupabase
        .from('generations')
        .select('user_id')
        .eq('id', generationId)
        .single();

      if (genError || !generation || generation.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Not authorized to access this media' },
          { status: 403 }
        );
      }
    }

    // Default expiration based on type
    const defaultExpiry = type === 'video' ? 86400 : 3600; // 24h for video, 1h for frames
    const expiry = expiresIn || defaultExpiry;

    const signedUrl = await getSignedDownloadUrl(r2Key, expiry);

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn: expiry,
    });
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}

/**
 * Batch endpoint for multiple URLs
 * POST /api/media/signed-url with { r2Keys: string[], type: 'video' | 'frame' }
 */

/**
 * Extract generation ID from R2 key
 * e.g., "videos/gen123/0.mp4" -> "gen123"
 */
function extractGenerationId(r2Key: string): string | null {
  const match = r2Key.match(/^(?:videos|frames)\/([^/]+)\//);
  return match ? match[1] : null;
}
