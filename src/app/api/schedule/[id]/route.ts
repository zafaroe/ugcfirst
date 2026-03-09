import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase';
import { LateService } from '@/lib/social/late';
import {
  rowToScheduledPost,
  type GetScheduleResponse,
  type CancelScheduleResponse,
  type ScheduledPostRow,
} from '@/types/schedule';

// ============================================
// GET /api/schedule/[id]
// Get a single scheduled post
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetScheduleResponse>> {
  try {
    const { id } = await params;

    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized') as NextResponse<GetScheduleResponse>;
    }

    // Use admin client for database operations
    const adminSupabase = getAdminClient();

    // Fetch scheduled post
    const { data: row, error: selectError } = await adminSupabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (selectError || !row) {
      return NextResponse.json(
        { success: false, error: 'Scheduled post not found' },
        { status: 404 }
      );
    }

    const scheduledPost = rowToScheduledPost(row as ScheduledPostRow);

    // If we have a Late post ID, fetch latest status from Late
    if (scheduledPost.latePostId && LateService.isConfigured()) {
      try {
        const lateStatus = await LateService.getPostStatus(scheduledPost.latePostId);

        // Update local status if different
        if (lateStatus.status !== scheduledPost.status) {
          await adminSupabase
            .from('scheduled_posts')
            .update({
              status: lateStatus.status,
              platform_results: lateStatus.platforms,
            })
            .eq('id', id);

          scheduledPost.status = lateStatus.status as typeof scheduledPost.status;
          scheduledPost.platformResults = lateStatus.platforms;
        }
      } catch (error) {
        console.warn('Failed to fetch Late status:', error);
        // Continue with cached status
      }
    }

    return NextResponse.json({
      success: true,
      scheduledPost,
    });
  } catch (error) {
    console.error('Schedule fetch error:', error);
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
// DELETE /api/schedule/[id]
// Cancel a scheduled post
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CancelScheduleResponse>> {
  try {
    const { id } = await params;

    // Verify auth using singleton client
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || 'Unauthorized') as NextResponse<CancelScheduleResponse>;
    }

    // Use admin client for database operations
    const adminSupabase = getAdminClient();

    // Fetch scheduled post first
    const { data: row, error: selectError } = await adminSupabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (selectError || !row) {
      return NextResponse.json(
        { success: false, error: 'Scheduled post not found' },
        { status: 404 }
      );
    }

    const scheduledPost = rowToScheduledPost(row as ScheduledPostRow);

    // Can only cancel if pending or scheduled
    if (!['pending', 'scheduled'].includes(scheduledPost.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel post with status: ${scheduledPost.status}` },
        { status: 400 }
      );
    }

    // If we have a Late post ID, cancel in Late API
    if (scheduledPost.latePostId && LateService.isConfigured()) {
      try {
        await LateService.deletePost(scheduledPost.latePostId);
      } catch (error) {
        console.warn('Failed to cancel in Late:', error);
        // Continue with local cancellation
      }
    }

    // Update status to cancelled
    const { error: updateError } = await adminSupabase
      .from('scheduled_posts')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to cancel scheduled post:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to cancel scheduled post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Schedule cancel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
