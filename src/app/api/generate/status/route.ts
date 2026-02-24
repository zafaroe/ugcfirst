import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { getPublicUrl } from '@/lib/r2';
import { GenerationStatusResponse, Generation, GenerationVideo, GenerationVideoWithUrls } from '@/types/generation';

// ============================================
// GET /api/generate/status?id=<generationId>
// Get the status of a video generation
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    // Get generation ID from query params
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('id');

    if (!generationId) {
      return NextResponse.json(
        { error: 'Missing generation ID' },
        { status: 400 }
      );
    }

    // Get generation from database
    const adminSupabase = getAdminClient();
    const { data: generation, error: fetchError } = await adminSupabase
      .from('generations')
      .select('*')
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
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const gen = generation as Generation;

    // Generate public URLs for videos (no network calls - instant)
    let videosWithUrls: GenerationVideoWithUrls[] | null = null;
    if (gen.videos && gen.videos.length > 0) {
      videosWithUrls = gen.videos.map((video: GenerationVideo): GenerationVideoWithUrls => {
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

    // Sanitize error message to prevent JSON parsing issues
    // (error messages may contain newlines from stack traces)
    const sanitizedErrorMessage = gen.error_message
      ? gen.error_message.replace(/[\n\r\t]/g, ' ').trim()
      : null;

    const response: GenerationStatusResponse = {
      id: gen.id,
      status: gen.status,
      currentStep: gen.current_step,
      totalSteps: gen.total_steps,
      videos: videosWithUrls,
      strategyBrief: gen.strategy_brief,
      errorMessage: sanitizedErrorMessage,
      startedAt: gen.started_at,
      completedAt: gen.completed_at,
    };

    // Debug: Log response size to catch potential issues
    const jsonResponse = {
      success: true,
      data: response,
    };

    // Validate JSON can be stringified before sending
    try {
      JSON.stringify(jsonResponse);
    } catch (jsonError) {
      console.error('JSON serialization error:', jsonError);
      console.error('Response data:', JSON.stringify(response, (key, value) => {
        if (typeof value === 'string' && value.length > 100) {
          return value.substring(0, 100) + '...[truncated]';
        }
        return value;
      }, 2));
      return NextResponse.json({
        success: false,
        error: 'Response serialization failed',
      }, { status: 500 });
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error getting generation status:', error);
    return NextResponse.json(
      { error: 'Failed to get generation status' },
      { status: 500 }
    );
  }
}
