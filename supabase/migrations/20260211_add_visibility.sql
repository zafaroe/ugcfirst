-- ============================================
-- ADD VISIBILITY TO GENERATIONS
-- ============================================
-- Adds public/private visibility toggle for video sharing
-- Enables public gallery feature (Explore page)

-- ============================================
-- ADD VISIBILITY COLUMN
-- ============================================
ALTER TABLE generations ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private';

-- Add check constraint for valid values
ALTER TABLE generations DROP CONSTRAINT IF EXISTS generations_visibility_check;
ALTER TABLE generations ADD CONSTRAINT generations_visibility_check
  CHECK (visibility IN ('private', 'public', 'unlisted'));

-- ============================================
-- ADD SHARE TOKEN FOR UNLISTED SHARING
-- ============================================
ALTER TABLE generations ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

-- Index for share token lookups
CREATE INDEX IF NOT EXISTS idx_generations_share_token ON generations(share_token) WHERE visibility = 'unlisted';

-- ============================================
-- INDEX FOR PUBLIC VIDEO QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_generations_visibility ON generations(visibility, created_at DESC) WHERE visibility = 'public';

-- ============================================
-- RLS POLICY FOR PUBLIC VIDEOS
-- ============================================

-- Anyone can view public videos (read-only)
CREATE POLICY "Public videos are viewable by everyone" ON generations
  FOR SELECT USING (visibility = 'public');

-- Anyone can view unlisted videos with the correct share token
-- (This is handled at the API level, not RLS, since share_token is in URL)

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN generations.visibility IS 'Video visibility: private (owner only), public (everyone), unlisted (share link)';
COMMENT ON COLUMN generations.share_token IS 'Unique token for unlisted video sharing';
