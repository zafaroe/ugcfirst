import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { inngest } from '@/inngest/client';
import {
  rowToScheduledPost,
  type CreateScheduleRequest,
  type CreateScheduleResponse,
  type ListSchedulesResponse,
  type ScheduledPostRow,
} from '@/types/schedule';
import { hasSchedulingAccess } from '@/config/pricing';
import { CREDIT_COSTS } from '@/types/credits';
import { CreditService } from '@/services/credits';

// ============================================
// POST /api/schedule
// Create a new scheduled post
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateScheduleResponse>> {
  try {
    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized') as NextResponse<CreateScheduleResponse>;
    }

    // Use admin client for database operations
    const adminSupabase = getAdminClient();

    // Parse request body
    const body: CreateScheduleRequest = await request.json();

    // Validate required fields
    if (!body.videoUrl) {
      return NextResponse.json(
        { success: false, error: 'videoUrl is required' },
        { status: 400 }
      );
    }

    if (!body.platforms || body.platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    // Get user's subscription tier
    const { data: userCredits, error: creditsError } = await adminSupabase
      .from('user_credits')
      .select('subscription_tier, balance, held')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !userCredits) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch user subscription' },
        { status: 500 }
      );
    }

    // Check tier - only Pro, Plus, Agency can schedule
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

    // Calculate credit cost (2 credits per scheduled post)
    const creditCost = CREDIT_COSTS.SCHEDULE_POST;
    const availableCredits = userCredits.balance - (userCredits.held || 0);

    if (availableCredits < creditCost) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient credits. You need ${creditCost} credits to schedule a post, but you only have ${availableCredits} available.`,
          insufficientCredits: true,
          required: creditCost,
          available: availableCredits,
        },
        { status: 402 }
      );
    }

    // Deduct credits
    await CreditService.deductCredits(
      user.id,
      creditCost,
      `Scheduled post to ${body.platforms.join(', ')}`,
      { platforms: body.platforms, videoUrl: body.videoUrl }
    );

    // Insert scheduled post into database
    const { data: row, error: insertError } = await adminSupabase
      .from('scheduled_posts')
      .insert({
        user_id: user.id,
        generation_id: body.generationId || null,
        video_url: body.videoUrl,
        caption: body.caption || '',
        platforms: body.platforms,
        scheduled_for: body.scheduledFor || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create scheduled post:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create scheduled post' },
        { status: 500 }
      );
    }

    const scheduledPost = rowToScheduledPost(row as ScheduledPostRow);

    // Send Inngest event to process the scheduling
    await inngest.send({
      name: 'schedule/post',
      data: {
        scheduledPostId: scheduledPost.id,
        userId: user.id,
        videoUrl: scheduledPost.videoUrl,
        caption: scheduledPost.caption,
        platforms: scheduledPost.platforms,
        scheduledFor: scheduledPost.scheduledFor,
        timezone: body.timezone || 'UTC', // Pass timezone for accurate scheduling
      },
    });

    return NextResponse.json({
      success: true,
      scheduledPost,
    });
  } catch (error) {
    console.error('Schedule creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/schedule
// List user's scheduled posts
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ListSchedulesResponse>> {
  try {
    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, scheduledPosts: [], total: 0, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client for database operations
    const adminSupabase = getAdminClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = adminSupabase
      .from('scheduled_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: rows, count, error: selectError } = await query;

    if (selectError) {
      console.error('Failed to fetch scheduled posts:', selectError);
      return NextResponse.json(
        { success: false, scheduledPosts: [], total: 0, error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      );
    }

    const scheduledPosts = (rows as ScheduledPostRow[]).map(rowToScheduledPost);

    return NextResponse.json({
      success: true,
      scheduledPosts,
      total: count || 0,
    });
  } catch (error) {
    console.error('Schedule list error:', error);
    return NextResponse.json(
      {
        success: false,
        scheduledPosts: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
