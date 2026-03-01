/**
 * Late API Client
 *
 * Late (getlate.dev) is a unified Social Media API that allows
 * scheduling posts across 13+ platforms including TikTok, Instagram,
 * YouTube, Twitter, LinkedIn, etc.
 *
 * Docs: https://getlate.dev
 */

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
  | 'bluesky';

export interface LatePostRequest {
  /** Caption/text for the post */
  text: string;
  /** Platforms to post to */
  platforms: LatePlatform[];
  /** Media URLs (videos, images) */
  mediaUrls: string[];
  /** ISO 8601 timestamp for scheduled posting (optional - immediate if not set) */
  scheduledFor?: string;
  /** First comment to add after posting (supported on some platforms) */
  firstComment?: string;
}

export interface LatePlatformResult {
  platform: LatePlatform;
  postId?: string;
  url?: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
}

export interface LatePostResponse {
  id: string;
  status: 'scheduled' | 'published' | 'failed' | 'processing';
  scheduledFor?: string;
  publishedAt?: string;
  platforms: LatePlatformResult[];
  createdAt: string;
}

export interface LateError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// CONFIGURATION
// ============================================

const LATE_API_KEY = process.env.LATE_API_KEY;
const LATE_API_URL = process.env.LATE_API_URL || 'https://api.getlate.dev';

function getHeaders(): HeadersInit {
  if (!LATE_API_KEY) {
    throw new Error('LATE_API_KEY is not configured');
  }

  return {
    Authorization: `Bearer ${LATE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ============================================
// SERVICE METHODS
// ============================================

/**
 * Schedule or publish a post to social media platforms
 */
async function schedulePost(request: LatePostRequest): Promise<LatePostResponse> {
  const response = await fetch(`${LATE_API_URL}/posts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      text: request.text,
      platforms: request.platforms,
      mediaUrls: request.mediaUrls,
      scheduledFor: request.scheduledFor,
      firstComment: request.firstComment,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Late API error: ${response.status} - ${error.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get the status of a scheduled/published post
 */
async function getPostStatus(postId: string): Promise<LatePostResponse> {
  const response = await fetch(`${LATE_API_URL}/posts/${postId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Late API error: ${response.status} - ${error.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Cancel a scheduled post (before it's published)
 */
async function cancelPost(postId: string): Promise<void> {
  const response = await fetch(`${LATE_API_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Late API error: ${response.status} - ${error.message || response.statusText}`
    );
  }
}

/**
 * List all posts (with pagination)
 */
async function listPosts(options?: {
  status?: 'scheduled' | 'published' | 'failed';
  limit?: number;
  offset?: number;
}): Promise<{ posts: LatePostResponse[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));

  const url = `${LATE_API_URL}/posts${params.toString() ? `?${params}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Late API error: ${response.status} - ${error.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Check if Late API is configured
 */
function isConfigured(): boolean {
  return !!LATE_API_KEY;
}

// ============================================
// OAUTH / ACCOUNT CONNECTION
// ============================================

export interface LateConnectUrlRequest {
  platform: LatePlatform;
  redirectUrl: string;
  userId: string; // Used to associate the connection with the user
}

export interface LateConnectUrlResponse {
  authUrl: string;
  state: string; // Used to verify callback
}

export interface LateOAuthCallbackData {
  code: string;
  state: string;
}

export interface LateConnectedAccount {
  id: string;
  platform: LatePlatform;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get OAuth URL to connect a social media account
 */
async function getConnectUrl(request: LateConnectUrlRequest): Promise<LateConnectUrlResponse> {
  const response = await fetch(`${LATE_API_URL}/connect/auth-url`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      platform: request.platform,
      redirectUrl: request.redirectUrl,
      externalUserId: request.userId, // Late uses this to track the user
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Late API error: ${response.status} - ${error.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Complete OAuth flow and get connected account details
 */
async function handleOAuthCallback(data: LateOAuthCallbackData): Promise<LateConnectedAccount> {
  const response = await fetch(`${LATE_API_URL}/connect/callback`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      code: data.code,
      state: data.state,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Late API error: ${response.status} - ${error.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Disconnect/revoke a connected account
 */
async function disconnectAccount(accountId: string): Promise<void> {
  const response = await fetch(`${LATE_API_URL}/connect/accounts/${accountId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Late API error: ${response.status} - ${error.message || response.statusText}`
    );
  }
}

/**
 * List all connected accounts for a user
 */
async function listConnectedAccounts(userId: string): Promise<LateConnectedAccount[]> {
  const response = await fetch(`${LATE_API_URL}/connect/accounts?externalUserId=${userId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Late API error: ${response.status} - ${error.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data.accounts || [];
}

// ============================================
// EXPORTS
// ============================================

export const LateService = {
  // Posting
  schedulePost,
  getPostStatus,
  cancelPost,
  listPosts,
  // Account Connection
  getConnectUrl,
  handleOAuthCallback,
  disconnectAccount,
  listConnectedAccounts,
  // Config
  isConfigured,
};
