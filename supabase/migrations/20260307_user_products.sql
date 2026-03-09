-- ============================================
-- User Products Library
-- ============================================

CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product data
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  images JSONB DEFAULT '[]',          -- All available images from extraction
  price TEXT,
  features JSONB DEFAULT '[]',        -- String array of features

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('url', 'manual')),
  source_url TEXT,                     -- Original URL if imported

  -- Usage tracking
  generation_count INTEGER DEFAULT 0,  -- How many videos made with this product
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_last_used ON user_products(user_id, last_used_at DESC NULLS LAST);

-- RLS
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON user_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON user_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON user_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON user_products FOR DELETE
  USING (auth.uid() = user_id);
