import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { VideoVisibility } from '@/types/generation';

// ============================================
// PATCH /api/generations/[id]/visibility
// Update video visibility (private/public/unlisted)
// ============================================

interface UpdateVisibilityRequest {
  visibility: VideoVisibility;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: generationId } = await params;

    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    // Parse request body
    const body: UpdateVisibilityRequest = await request.json();
    const { visibility } = body;

    // Validate visibility value
    if (!visibility || !['private', 'public', 'unlisted'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value. Must be private, public, or unlisted.' },
        { status: 400 }
      );
    }

    // Get generation and verify ownership
    const adminSupabase = getAdminClient();
    const { data: generation, error: fetchError } = await adminSupabase
      .from('generations')
      .select('id, user_id, status, visibility, share_token')
      .eq('id', generationId)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Verify user owns this generation
    if (generation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not own this generation' },
        { status: 403 }
      );
    }

    // Only allow visibility change for completed generations
    if (generation.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only change visibility for completed generations' },
        { status: 400 }
      );
    }

    // Generate share_token for unlisted visibility if one doesn't exist
    let shareToken = generation.share_token;
    if (visibility === 'unlisted' && !shareToken) {
      shareToken = randomUUID();
    }

    // Update visibility (and share_token if needed)
    const { data: updated, error: updateError } = await adminSupabase
      .from('generations')
      .update({
        visibility,
        ...(visibility === 'unlisted' && shareToken ? { share_token: shareToken } : {}),
      })
      .eq('id', generationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating visibility:', updateError);
      return NextResponse.json(
        { error: 'Failed to update visibility' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        visibility: updated.visibility,
        share_token: updated.share_token,
      },
    });
  } catch (error) {
    console.error('Error updating visibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
