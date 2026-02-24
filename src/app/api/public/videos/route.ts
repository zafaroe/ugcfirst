import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { getPublicUrl } from '@/lib/r2';
import { GenerationVideo, GenerationVideoWithUrls } from '@/types/generation';

interface PublicGeneration {
  id: string;
  product_name: string;
  mode: 'diy' | 'concierge';
  created_at: string;
  visibility: string;
  videos: GenerationVideo[] | null;
  user_id: string;
}

// ============================================
// GET /api/public/videos
// Fetch public videos from all users (no auth required)
// Query params:
//   - limit: max number of results (default 12)
//   - offset: pagination offset (default 0)
//   - sort: 'recent' (default) or 'popular'
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50); // Max 50
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort = searchParams.get('sort') || 'recent';

    // Build query for public videos
    const adminSupabase = getAdminClient();
    let query = adminSupabase
      .from('generations')
      .select('id, product_name, mode, created_at, visibility, videos, user_id')
      .eq('visibility', 'public')
      .eq('status', 'completed')
      .range(offset, offset + limit - 1);

    // Apply sorting
    if (sort === 'recent') {
      query = query.order('created_at', { ascending: false });
    }
    // TODO: Add 'popular' sort when view counts are implemented

    const { data: generations, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching public videos:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: 500 }
      );
    }

    // Generate public URLs for videos (no network calls - instant)
    const videosWithUrls = (generations || []).map((gen: PublicGeneration) => {
      let processedVideos: GenerationVideoWithUrls[] | null = null;

      if (gen.videos && gen.videos.length > 0) {
        processedVideos = gen.videos.slice(0, 1).map((video: GenerationVideo): GenerationVideoWithUrls => {
          // Use public URLs instead of signed URLs (much faster)
          // Support both new and legacy field names (backward compat for old generations)
          const subtitledKey = video.videoSubtitledR2Key || video.videoCaptionedR2Key;
          const videoSubtitledUrl = subtitledKey
            ? getPublicUrl(subtitledKey)
            : null;

          const videoUrl = video.videoR2Key
            ? getPublicUrl(video.videoR2Key)
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

      // Return limited fields for public display
      return {
        id: gen.id,
        product_name: gen.product_name,
        mode: gen.mode,
        created_at: gen.created_at,
        thumbnail: null as string | null, // TODO: Generate thumbnail from video
        videoUrl: processedVideos?.[0]?.videoSubtitledUrl || processedVideos?.[0]?.videoUrl || null,
        duration: processedVideos?.[0]?.duration || 0,
      };
    });

    // Get total count for pagination
    const { count } = await adminSupabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'public')
      .eq('status', 'completed');

    return NextResponse.json({
      videos: videosWithUrls,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error in public videos API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
