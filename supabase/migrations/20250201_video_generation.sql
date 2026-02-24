-- ============================================
-- VIDEO GENERATION PIPELINE - DATABASE SCHEMA
-- ============================================
-- Run this migration in Supabase SQL Editor
-- Creates tables for video generation, job tracking, and credit management

-- ============================================
-- GENERATIONS TABLE
-- Main table for video generation requests
-- ============================================
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID, -- Optional: can link to projects table later

  -- Input
  product_name TEXT NOT NULL,
  product_image_url TEXT NOT NULL,
  avatar_id TEXT,
  template_id TEXT,
  custom_script TEXT,
  captions_enabled BOOLEAN DEFAULT true,

  -- Processing state
  status TEXT DEFAULT 'queued' CHECK (status IN (
    'queued', 'analyzing', 'scripting', 'framing',
    'generating', 'trimming', 'captioning', 'uploading',
    'completed', 'failed'
  )),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 9,

  -- AI outputs
  persona_profile JSONB,
  scripts JSONB, -- Array of 3 scripts
  strategy_brief JSONB, -- Concierge only

  -- Results
  videos JSONB, -- Array of {script_index, frame_url, video_url, duration}

  -- Metadata
  mode TEXT DEFAULT 'diy' CHECK (mode IN ('diy', 'concierge')),
  credit_cost INTEGER DEFAULT 10,
  credit_transaction_id UUID,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIDEO JOBS TABLE
-- Tracks individual kie.ai video generation jobs
-- ============================================
CREATE TABLE IF NOT EXISTS video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  script_index INTEGER NOT NULL,
  kie_job_id TEXT NOT NULL UNIQUE,

  -- Job state
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed'
  )),

  -- Outputs
  frame_url TEXT,
  raw_video_url TEXT, -- Before trimming/captions
  video_url TEXT, -- Final processed video
  duration_seconds NUMERIC(5, 2),

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- USER CREDITS TABLE
-- Tracks user credit balances
-- ============================================
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,           -- Total available
  held INTEGER DEFAULT 0,              -- Reserved for pending jobs
  lifetime_purchased INTEGER DEFAULT 0,
  lifetime_used INTEGER DEFAULT 0,
  lifetime_refunded INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREDIT TRANSACTIONS TABLE
-- Full audit log of all credit movements
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction type
  type TEXT NOT NULL CHECK (type IN (
    'purchase',      -- Bought credits
    'subscription',  -- Monthly credits from subscription
    'usage',         -- Spent on generation
    'refund',        -- Refunded from failed generation
    'hold',          -- Reserved for pending generation
    'release',       -- Released from cancelled hold
    'bonus',         -- Promotional credits
    'adjustment'     -- Manual admin adjustment
  )),

  -- Amount and balance
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  held_before INTEGER DEFAULT 0,
  held_after INTEGER DEFAULT 0,

  -- References
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,

  -- Metadata
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN (
    'pending', 'completed', 'cancelled'
  )),
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Generations: User queries, status filtering
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_status ON generations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status) WHERE status NOT IN ('completed', 'failed');
CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at DESC);

-- Video Jobs: Webhook lookups, generation queries
CREATE INDEX IF NOT EXISTS idx_video_jobs_kie_id ON video_jobs(kie_job_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_generation ON video_jobs(generation_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON video_jobs(status) WHERE status = 'pending';

-- Credit Transactions: User history, pending transactions
CREATE INDEX IF NOT EXISTS idx_credit_txn_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_txn_pending ON credit_transactions(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_credit_txn_generation ON credit_transactions(generation_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Generations: Users can only see their own
CREATE POLICY "Users can view own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON generations
  FOR UPDATE USING (auth.uid() = user_id);

-- Video Jobs: Users can only see jobs for their generations
CREATE POLICY "Users can view own video jobs" ON video_jobs
  FOR SELECT USING (
    generation_id IN (
      SELECT id FROM generations WHERE user_id = auth.uid()
    )
  );

-- User Credits: Users can only see their own balance
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Credit Transactions: Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- SERVICE ROLE POLICIES
-- Allow backend to manage all records
-- ============================================

CREATE POLICY "Service role full access generations" ON generations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access video_jobs" ON video_jobs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access user_credits" ON user_credits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access credit_transactions" ON credit_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for generations
DROP TRIGGER IF EXISTS update_generations_updated_at ON generations;
CREATE TRIGGER update_generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_credits
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Function to initialize credits for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, held)
  VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create credit record for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE generations IS 'Video generation requests and their processing state';
COMMENT ON TABLE video_jobs IS 'Individual video jobs sent to kie.ai for processing';
COMMENT ON TABLE user_credits IS 'User credit balances with hold support';
COMMENT ON TABLE credit_transactions IS 'Full audit log of credit movements';

COMMENT ON COLUMN generations.status IS 'Current processing stage of the generation';
COMMENT ON COLUMN generations.videos IS 'Array of completed video objects with URLs';
COMMENT ON COLUMN user_credits.held IS 'Credits reserved for in-progress generations';
COMMENT ON COLUMN credit_transactions.type IS 'Type of credit movement for audit trail';
