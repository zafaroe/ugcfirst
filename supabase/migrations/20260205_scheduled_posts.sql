-- ============================================
-- SCHEDULED POSTS TABLE
-- Stores social media post schedules for generated videos
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID, -- Optional reference to generations table (no FK constraint)

  -- Post content
  video_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  platforms TEXT[] NOT NULL DEFAULT '{}',

  -- Scheduling
  scheduled_for TIMESTAMPTZ,

  -- Late API integration
  late_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scheduled', 'processing', 'published', 'failed', 'cancelled')),
  platform_results JSONB,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_generation_id ON scheduled_posts(generation_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_scheduled_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scheduled_posts_updated_at ON scheduled_posts;
CREATE TRIGGER scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_posts_updated_at();

-- RLS Policies
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scheduled posts
CREATE POLICY "Users can view own scheduled posts"
  ON scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own scheduled posts
CREATE POLICY "Users can create own scheduled posts"
  ON scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scheduled posts
CREATE POLICY "Users can update own scheduled posts"
  ON scheduled_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own scheduled posts
CREATE POLICY "Users can delete own scheduled posts"
  ON scheduled_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_posts TO authenticated;
