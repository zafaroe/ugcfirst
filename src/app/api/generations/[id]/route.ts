import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { getPublicUrl, deleteGenerationFiles } from '@/lib/r2';
import { GenerationVideo, GenerationVideoWithUrls } from '@/types/generation';

// ============================================
// GET /api/generations/[id]
// Fetch a single generation by ID with signed video URLs
// ============================================

export async function GET(
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

    // Fetch generation from database
    const adminSupabase = getAdminClient();
    const { data: generation, error: fetchError } = await adminSupabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id) // Ensure user owns this generation
      .single();

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Generate public URLs for videos (no network calls - instant)
    let videosWithUrls: GenerationVideoWithUrls[] | null = null;

    if (generation.videos && generation.videos.length > 0) {
      videosWithUrls = generation.videos.map((video: GenerationVideo): GenerationVideoWithUrls => {
        // Use public URLs instead of signed URLs (much faster)
        const videoUrl = video.videoR2Key
          ? getPublicUrl(video.videoR2Key)
          : null;

        // Support both new and legacy field names (backward compat for old generations)
        const subtitledKey = video.videoSubtitledR2Key || video.videoCaptionedR2Key;
        const videoSubtitledUrl = subtitledKey
          ? getPublicUrl(subtitledKey)
          : null;

        return {
          ...video,
          videoUrl,
          videoSubtitledUrl,
          // Backward compatibility for old clients
          videoCaptionedUrl: videoSubtitledUrl,
        };
      });
    }

    return NextResponse.json({
      generation: {
        ...generation,
        videos: videosWithUrls,
      },
    });
  } catch (error) {
    console.error('Error fetching generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/generations/[id]
// Delete a generation and its associated files
// ============================================

export async function DELETE(
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

    // Fetch generation to verify ownership
    const adminSupabase = getAdminClient();
    const { data: generation, error: fetchError } = await adminSupabase
      .from('generations')
      .select('id, user_id')
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
        { error: 'You do not have permission to delete this generation' },
        { status: 403 }
      );
    }

    // Delete associated R2 files (videos, frames)
    try {
      await deleteGenerationFiles(generationId);
    } catch (r2Error) {
      console.error('Error deleting R2 files:', r2Error);
      // Continue with database deletion even if R2 cleanup fails
    }

    // Delete associated video_jobs
    await adminSupabase
      .from('video_jobs')
      .delete()
      .eq('generation_id', generationId);

    // Delete the generation from database
    const { error: deleteError } = await adminSupabase
      .from('generations')
      .delete()
      .eq('id', generationId);

    if (deleteError) {
      console.error('Error deleting generation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete generation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Generation deleted successfully',
    });
  } catch (error) {
    console.error('Error in delete generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
