import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { getPublicUrl } from '@/lib/r2';
import { Generation, GenerationStatus, GenerationVideo, GenerationVideoWithUrls } from '@/types/generation';

// ============================================
// GET /api/generations
// Fetch user's generations with optional filtering
// Query params:
//   - status: filter by status (completed, failed, etc.)
//   - limit: max number of results (default 20)
//   - offset: pagination offset (default 0)
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized');
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as GenerationStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query - select only needed columns for list view (avoid large JSONB)
    const adminSupabase = getAdminClient();
    let query = adminSupabase
      .from('generations')
      .select(`
        id,
        user_id,
        product_name,
        product_image_url,
        status,
        current_step,
        total_steps,
        mode,
        captions_enabled,
        credit_cost,
        visibility,
        videos,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: generations, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching generations:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch generations' },
        { status: 500 }
      );
    }

    // Generate public URLs for videos (no network calls - instant)
    // Note: We select a subset of columns, so cast as partial Generation
    const generationsWithUrls = (generations || []).map((gen) => {
      const generation = gen as Partial<Generation> & { videos?: GenerationVideo[] | null };
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

      return {
        ...gen,
        videos: videosWithUrls,
      };
    });

    // Get total count for pagination
    const { count } = await adminSupabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq(status ? 'status' : 'user_id', status || user.id);

    return NextResponse.json({
      generations: generationsWithUrls,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error in generations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
