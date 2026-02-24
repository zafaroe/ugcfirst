import { inngest } from '../client';
import { LateService } from '@/lib/social/late';
import { getAdminClient } from '@/lib/supabase';
import type { LatePlatform } from '@/lib/social/late';

// ============================================
// SCHEDULE POST FUNCTION
// ============================================

/**
 * Process a scheduled post
 *
 * This function:
 * 1. Fetches the scheduled post from database
 * 2. Calls Late API to schedule the post
 * 3. Updates the database with the Late post ID and status
 */
export const schedulePost = inngest.createFunction(
  {
    id: 'schedule-post',
    name: 'Schedule Social Post',
    retries: 3,
  },
  { event: 'schedule/post' },
  async ({ event, step }) => {
    const {
      scheduledPostId,
      userId,
      videoUrl,
      caption,
      platforms,
      scheduledFor,
    } = event.data;

    const supabase = getAdminClient();

    // Step 1: Validate Late API is configured
    await step.run('validate-config', async () => {
      if (!LateService.isConfigured()) {
        throw new Error('Late API is not configured (LATE_API_KEY missing)');
      }
    });

    // Step 2: Call Late API to schedule the post
    const lateResponse = await step.run('call-late-api', async () => {
      return LateService.schedulePost({
        text: caption,
        platforms: platforms as LatePlatform[],
        mediaUrls: [videoUrl],
        scheduledFor: scheduledFor,
      });
    });

    // Step 3: Update database with Late response
    await step.run('update-database', async () => {
      await supabase
        .from('scheduled_posts')
        .update({
          late_post_id: lateResponse.id,
          status: lateResponse.status,
          platform_results: lateResponse.platforms,
        })
        .eq('id', scheduledPostId);
    });

    return {
      success: true,
      scheduledPostId,
      latePostId: lateResponse.id,
      status: lateResponse.status,
    };
  }
);

// ============================================
// CHECK STATUS FUNCTION
// ============================================

/**
 * Check the status of a scheduled post in Late API
 *
 * This can be triggered periodically to sync status
 */
export const checkScheduleStatus = inngest.createFunction(
  {
    id: 'check-schedule-status',
    name: 'Check Schedule Status',
    retries: 2,
  },
  { event: 'schedule/check-status' },
  async ({ event, step }) => {
    const { scheduledPostId, latePostId } = event.data;

    const supabase = getAdminClient();

    // Step 1: Fetch status from Late API
    const lateResponse = await step.run('fetch-late-status', async () => {
      return LateService.getPostStatus(latePostId);
    });

    // Step 2: Update database
    await step.run('update-database', async () => {
      await supabase
        .from('scheduled_posts')
        .update({
          status: lateResponse.status,
          platform_results: lateResponse.platforms,
        })
        .eq('id', scheduledPostId);
    });

    return {
      success: true,
      scheduledPostId,
      status: lateResponse.status,
    };
  }
);

// ============================================
// EXPORTS
// ============================================

export const scheduleFunctions = [schedulePost, checkScheduleStatus];
