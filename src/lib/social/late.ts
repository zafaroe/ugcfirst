/**
 * Late API Client (using official SDK)
 *
 * Late (getlate.dev) is a unified Social Media API that allows
 * scheduling posts across 13+ platforms including TikTok, Instagram,
 * YouTube, Twitter, LinkedIn, etc.
 *
 * Docs: https://docs.getlate.dev
 */

import Late from '@getlatedev/node';

// ============================================
// TYPES
// ============================================

export type LatePlatform =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'threads'
  | 'pinterest'
  | 'reddit'
  | 'bluesky'
  | 'telegram'
  | 'snapchat'
  | 'google_business';

export interface LatePlatformResult {
  platform: LatePlatform;
  postId?: string;
  url?: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
}

export interface LatePostResponse {
  id: string;
  status: 'scheduled' | 'published' | 'failed' | 'processing' | 'partial' | 'draft';
  scheduledFor?: string;
  publishedAt?: string;
  platforms: LatePlatformResult[];
  createdAt: string;
}

export interface LateConnectedAccount {
  id: string;
  platform: LatePlatform;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  profileId?: string;
  metadata?: Record<string, unknown>;
}

export interface LateProfile {
  id: string;
  name: string;
  description?: string;
}

export interface LateError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// CLIENT SINGLETON
// ============================================

let lateClient: Late | null = null;

function getClient(): Late {
  if (!lateClient) {
    const apiKey = process.env.LATE_API_KEY;
    if (!apiKey) {
      throw new Error('LATE_API_KEY is not configured');
    }
    lateClient = new Late({ apiKey });
  }
  return lateClient;
}

/**
 * Check if Late API is configured
 */
function isConfigured(): boolean {
  return !!process.env.LATE_API_KEY;
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * Create a new Late profile (container for social accounts)
 * Each UGCFirst user should have one profile
 */
async function createProfile(name: string, description?: string): Promise<LateProfile> {
  const client = getClient();
  const response = await client.profiles.createProfile({
    name,
    description: description || '',
  });
  return {
    id: response.profile._id,
    name: response.profile.name,
    description: response.profile.description,
  };
}

/**
 * List all profiles (usually just one per user)
 */
async function listProfiles(): Promise<LateProfile[]> {
  const client = getClient();
  const response = await client.profiles.listProfiles();
  return response.profiles.map((p: any) => ({
    id: p._id,
    name: p.name,
    description: p.description,
  }));
}

// ============================================
// OAUTH / ACCOUNT CONNECTION
// ============================================

/**
 * Get OAuth URL to connect a social media account
 * @param platform - The platform to connect (tiktok, instagram, etc.)
 * @param profileId - The Late profile ID to associate the account with
 * @param redirectUrl - URL to redirect after OAuth (optional, Late has defaults)
 */
async function getConnectUrl(
  platform: LatePlatform,
  profileId: string,
  redirectUrl?: string
): Promise<{ authUrl: string }> {
  const client = getClient();
  const response = await client.connect.getConnectUrl({
    platform,
    profileId,
    ...(redirectUrl && { redirectUrl }),
  });
  return { authUrl: response.authUrl };
}

/**
 * List all connected accounts
 * @param profileId - Optional profile ID to filter by
 */
async function listAccounts(profileId?: string): Promise<LateConnectedAccount[]> {
  const client = getClient();
  const response = await client.accounts.listAccounts(
    profileId ? { profileId } : undefined
  );
  return response.accounts.map((a: any) => ({
    id: a._id,
    platform: a.platform as LatePlatform,
    username: a.username,
    displayName: a.displayName || a.name,
    avatarUrl: a.avatarUrl || a.profilePicture,
    profileId: a.profileId,
    metadata: a.metadata,
  }));
}

/**
 * Get a single account by ID
 * Note: SDK doesn't have getAccount, so we filter from listAccounts
 */
async function getAccount(accountId: string): Promise<LateConnectedAccount | null> {
  try {
    const accounts = await listAccounts();
    const account = accounts.find((a) => a.id === accountId);
    return account || null;
  } catch (error) {
    return null;
  }
}

/**
 * Disconnect/revoke a connected account
 */
async function disconnectAccount(accountId: string): Promise<void> {
  const client = getClient();
  await client.accounts.deleteAccount({ accountId });
}

// ============================================
// POST SCHEDULING
// ============================================

/**
 * Create a post (scheduled or immediate)
 * @param params.text - Caption/text for the post
 * @param params.accountIds - Late account IDs to post to (NOT platform names!)
 * @param params.mediaUrls - Array of media URLs (videos, images)
 * @param params.scheduledFor - ISO 8601 timestamp for scheduling (optional)
 * @param params.timezone - Timezone for scheduling (optional, defaults to UTC)
 * @param params.publishNow - Set to true to publish immediately
 */
async function createPost(params: {
  text: string;
  accountIds: string[];
  mediaUrls?: string[];
  scheduledFor?: string;
  timezone?: string;
  publishNow?: boolean;
}): Promise<{ id: string; status: string }> {
  const client = getClient();
  const response = await client.posts.createPost({
    text: params.text,
    accountIds: params.accountIds,
    mediaUrls: params.mediaUrls || [],
    ...(params.scheduledFor && { scheduledFor: params.scheduledFor }),
    ...(params.timezone && { timezone: params.timezone }),
    ...(params.publishNow && { publishNow: params.publishNow }),
  });
  return {
    id: response.post._id,
    status: response.post.status,
  };
}

/**
 * Get the status of a post
 */
async function getPostStatus(postId: string): Promise<LatePostResponse> {
  const client = getClient();
  const response = await client.posts.getPost({ postId });
  const post = response.post;
  return {
    id: post._id,
    status: post.status,
    scheduledFor: post.scheduledFor,
    publishedAt: post.publishedAt,
    platforms: post.platformResults || [],
    createdAt: post.createdAt,
  };
}

/**
 * Delete/cancel a post
 */
async function deletePost(postId: string): Promise<void> {
  const client = getClient();
  await client.posts.deletePost({ postId });
}

/**
 * List posts with optional filters
 */
async function listPosts(options?: {
  status?: 'scheduled' | 'published' | 'failed' | 'draft';
  limit?: number;
  offset?: number;
}): Promise<{ posts: LatePostResponse[]; total: number }> {
  const client = getClient();
  const response = await client.posts.listPosts(options);
  return {
    posts: response.posts.map((post: any) => ({
      id: post._id,
      status: post.status,
      scheduledFor: post.scheduledFor,
      publishedAt: post.publishedAt,
      platforms: post.platformResults || [],
      createdAt: post.createdAt,
    })),
    total: response.pagination?.total || response.posts.length,
  };
}

/**
 * Retry failed platforms for a post
 */
async function retryPost(postId: string): Promise<void> {
  const client = getClient();
  await client.posts.retryPost({ postId });
}

// ============================================
// EXPORTS
// ============================================

export const LateService = {
  // Config
  isConfigured,

  // Profiles
  createProfile,
  listProfiles,

  // Accounts
  getConnectUrl,
  listAccounts,
  getAccount,
  disconnectAccount,

  // Posts
  createPost,
  getPostStatus,
  deletePost,
  listPosts,
  retryPost,
};
