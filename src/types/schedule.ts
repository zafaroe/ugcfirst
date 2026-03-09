import type { LatePlatform, LatePlatformResult } from '@/lib/social/late';

// ============================================
// SCHEDULED POST TYPES
// ============================================

export type ScheduleStatus =
  | 'pending' // Saved but not sent to Late
  | 'scheduled' // Sent to Late, waiting for publish time
  | 'processing' // Late is publishing
  | 'published' // Successfully posted
  | 'failed' // Post failed
  | 'cancelled'; // User cancelled

export interface ScheduledPost {
  id: string;
  userId: string;
  generationId?: string;
  videoUrl: string;
  caption: string;
  platforms: LatePlatform[];
  scheduledFor?: string;
  latePostId?: string;
  status: ScheduleStatus;
  platformResults?: LatePlatformResult[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateScheduleRequest {
  generationId?: string;
  videoUrl: string;
  caption: string;
  platforms: LatePlatform[];
  scheduledFor?: string; // ISO 8601, optional for immediate post
  timezone?: string; // IANA timezone (e.g., "America/New_York")
}

export interface CreateScheduleResponse {
  success: boolean;
  scheduledPost?: ScheduledPost;
  error?: string;
}

export interface ListSchedulesResponse {
  success: boolean;
  scheduledPosts: ScheduledPost[];
  total: number;
  error?: string;
}

export interface GetScheduleResponse {
  success: boolean;
  scheduledPost?: ScheduledPost;
  error?: string;
}

export interface CancelScheduleResponse {
  success: boolean;
  error?: string;
}

// ============================================
// DATABASE ROW TYPE (Supabase)
// ============================================

export interface ScheduledPostRow {
  id: string;
  user_id: string;
  generation_id: string | null;
  video_url: string;
  caption: string;
  platforms: string[];
  scheduled_for: string | null;
  late_post_id: string | null;
  status: ScheduleStatus;
  platform_results: LatePlatformResult[] | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Convert database row to ScheduledPost type
 */
export function rowToScheduledPost(row: ScheduledPostRow): ScheduledPost {
  return {
    id: row.id,
    userId: row.user_id,
    generationId: row.generation_id ?? undefined,
    videoUrl: row.video_url,
    caption: row.caption,
    platforms: row.platforms as LatePlatform[],
    scheduledFor: row.scheduled_for ?? undefined,
    latePostId: row.late_post_id ?? undefined,
    status: row.status,
    platformResults: row.platform_results ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
