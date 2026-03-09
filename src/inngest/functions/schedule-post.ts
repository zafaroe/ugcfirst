import { inngest } from '../client';
import { LateService } from '@/lib/social/late';
import { getAdminClient } from '@/lib/supabase';

// ============================================
// SCHEDULE POST FUNCTION
// ============================================

/**
 * Process a scheduled post
 *
 * This function:
 * 1. Maps platform names to Late account IDs via connected_accounts
 * 2. Calls Late API to create the post
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
      timezone,
    } = event.data;

    const supabase = getAdminClient();

    // Step 1: Validate Late API is configured
    await step.run('validate-config', async () => {
      if (!LateService.isConfigured()) {
        throw new Error('Late API is not configured (LATE_API_KEY missing)');
      }
    });

    // Step 2: Get connected accounts for the specified platforms
    const accountIds = await step.run('get-account-ids', async () => {
      // Fetch user's connected accounts that match the requested platforms
      const { data: connectedAccounts, error } = await supabase
        .from('connected_accounts')
        .select('late_account_id, platform')
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('platform', platforms);

      if (error) {
        throw new Error(`Failed to fetch connected accounts: ${error.message}`);
      }

      if (!connectedAccounts || connectedAccounts.length === 0) {
        throw new Error(
          `No connected accounts found for platforms: ${platforms.join(', ')}`
        );
      }

      // Map to Late account IDs
      return connectedAccounts.map((acc) => acc.late_account_id);
    });

    // Step 3: Call Late API to create the post
    const lateResponse = await step.run('call-late-api', async () => {
      return LateService.createPost({
        text: caption,
        accountIds,
        mediaUrls: [videoUrl],
        scheduledFor: scheduledFor || undefined,
        timezone: timezone || 'UTC', // Pass timezone for accurate scheduling
        publishNow: !scheduledFor, // Publish immediately if no scheduled time
      });
    });

    // Step 4: Update database with Late response
    await step.run('update-database', async () => {
      await supabase
        .from('scheduled_posts')
        .update({
          late_post_id: lateResponse.id,
          status: lateResponse.status === 'scheduled' ? 'scheduled' :
                  lateResponse.status === 'published' ? 'completed' : 'processing',
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

    // Step 2: Map Late status to our status
    const mappedStatus = (() => {
      switch (lateResponse.status) {
        case 'scheduled':
          return 'scheduled';
        case 'published':
          return 'completed';
        case 'failed':
          return 'failed';
        case 'processing':
        case 'partial':
          return 'processing';
        default:
          return 'pending';
      }
    })();

    // Step 3: Update database
    await step.run('update-database', async () => {
      await supabase
        .from('scheduled_posts')
        .update({
          status: mappedStatus,
          platform_results: lateResponse.platforms,
          published_at: lateResponse.publishedAt || null,
        })
        .eq('id', scheduledPostId);
    });

    return {
      success: true,
      scheduledPostId,
      status: mappedStatus,
    };
  }
);

// ============================================
// POLLING CRON FUNCTION
// ============================================

/**
 * Poll pending scheduled posts to sync their status from Late API
 *
 * Runs every 5 minutes to check posts that are:
 * - status = 'scheduled' (waiting to be published)
 * - status = 'processing' (being processed by Late)
 */
export const pollScheduledPosts = inngest.createFunction(
  {
    id: 'poll-scheduled-posts',
    name: 'Poll Scheduled Posts Status',
    retries: 1,
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    const supabase = getAdminClient();

    // Step 1: Validate Late API is configured
    await step.run('validate-config', async () => {
      if (!LateService.isConfigured()) {
        console.log('Late API not configured, skipping poll');
        return { skip: true };
      }
      return { skip: false };
    });

    // Step 2: Fetch posts that need status sync
    const postsToCheck = await step.run('fetch-pending-posts', async () => {
      const { data: posts, error } = await supabase
        .from('scheduled_posts')
        .select('id, late_post_id')
        .in('status', ['scheduled', 'processing'])
        .not('late_post_id', 'is', null)
        .limit(50); // Batch size to avoid rate limits

      if (error) {
        console.error('Failed to fetch pending posts:', error);
        return [];
      }

      return posts || [];
    });

    if (postsToCheck.length === 0) {
      return { success: true, checked: 0, message: 'No posts to check' };
    }

    // Step 3: Check each post's status (with delay to avoid rate limits)
    let updatedCount = 0;
    for (const post of postsToCheck) {
      try {
        const lateResponse = await step.run(`check-post-${post.id}`, async () => {
          return LateService.getPostStatus(post.late_post_id);
        });

        // Map Late status to our status
        const mappedStatus = (() => {
          switch (lateResponse.status) {
            case 'scheduled':
              return 'scheduled';
            case 'published':
              return 'completed';
            case 'failed':
              return 'failed';
            case 'processing':
            case 'partial':
              return 'processing';
            default:
              return 'pending';
          }
        })();

        // Update database
        await step.run(`update-post-${post.id}`, async () => {
          await supabase
            .from('scheduled_posts')
            .update({
              status: mappedStatus,
              platform_results: lateResponse.platforms,
              published_at: lateResponse.publishedAt || null,
            })
            .eq('id', post.id);
        });

        updatedCount++;
      } catch (error) {
        console.error(`Failed to check post ${post.id}:`, error);
        // Continue with next post
      }
    }

    return {
      success: true,
      checked: postsToCheck.length,
      updated: updatedCount,
    };
  }
);

// ============================================
// EXPORTS
// ============================================

export const scheduleFunctions = [schedulePost, checkScheduleStatus, pollScheduledPosts];
