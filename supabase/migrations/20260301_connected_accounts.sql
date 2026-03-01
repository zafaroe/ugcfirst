-- ============================================
-- CONNECTED ACCOUNTS TABLE
-- Stores user's connected social media accounts via Late API
-- ============================================

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Platform info
  platform TEXT NOT NULL
    CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'twitter', 'linkedin', 'facebook', 'threads', 'pinterest', 'reddit', 'bluesky')),

  -- Late API account info
  late_account_id TEXT NOT NULL,
  account_name TEXT, -- Display name (e.g., "@username" or "Page Name")
  account_avatar_url TEXT, -- Profile picture URL
  account_metadata JSONB DEFAULT '{}', -- Additional platform-specific data

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one account per platform per user (can be relaxed later for multiple pages)
  UNIQUE(user_id, platform, late_account_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_platform ON connected_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_active ON connected_accounts(user_id, is_active) WHERE is_active = true;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_connected_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS connected_accounts_updated_at ON connected_accounts;
CREATE TRIGGER connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_connected_accounts_updated_at();

-- RLS Policies
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own connected accounts
CREATE POLICY "Users can view own connected accounts"
  ON connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own connected accounts
CREATE POLICY "Users can create own connected accounts"
  ON connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own connected accounts
CREATE POLICY "Users can update own connected accounts"
  ON connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own connected accounts
CREATE POLICY "Users can delete own connected accounts"
  ON connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON connected_accounts TO authenticated;
