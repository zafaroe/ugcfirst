import type { LatePlatform } from '@/lib/social/late';

// ============================================
// CONNECTED ACCOUNT TYPES
// ============================================

export interface ConnectedAccount {
  id: string;
  userId: string;
  platform: LatePlatform;
  lateAccountId: string;
  accountName: string | null;
  accountAvatarUrl: string | null;
  accountMetadata: Record<string, unknown>;
  isActive: boolean;
  lastUsedAt: string | null;
  connectedAt: string;
  updatedAt: string;
}

// ============================================
// DATABASE ROW TYPE (Supabase)
// ============================================

export interface ConnectedAccountRow {
  id: string;
  user_id: string;
  platform: string;
  late_account_id: string;
  account_name: string | null;
  account_avatar_url: string | null;
  account_metadata: Record<string, unknown>;
  is_active: boolean;
  last_used_at: string | null;
  connected_at: string;
  updated_at: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface GetConnectUrlRequest {
  platform: LatePlatform;
  redirectUrl?: string;
}

export interface GetConnectUrlResponse {
  success: boolean;
  authUrl?: string;
  error?: string;
}

export interface ListConnectedAccountsResponse {
  success: boolean;
  accounts: ConnectedAccount[];
  error?: string;
}

export interface DisconnectAccountResponse {
  success: boolean;
  error?: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Convert database row to ConnectedAccount type
 */
export function rowToConnectedAccount(row: ConnectedAccountRow): ConnectedAccount {
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform as LatePlatform,
    lateAccountId: row.late_account_id,
    accountName: row.account_name,
    accountAvatarUrl: row.account_avatar_url,
    accountMetadata: row.account_metadata,
    isActive: row.is_active,
    lastUsedAt: row.last_used_at,
    connectedAt: row.connected_at,
    updatedAt: row.updated_at,
  };
}
