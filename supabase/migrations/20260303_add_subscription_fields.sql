-- ============================================
-- ADD SUBSCRIPTION TRACKING TO USER_CREDITS
-- Adds columns for Stripe integration and plan management
-- ============================================

-- Add subscription tracking columns
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS credits_reset_date TIMESTAMPTZ;

-- Index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_stripe_customer
  ON public.user_credits (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Index for subscription management
CREATE INDEX IF NOT EXISTS idx_user_credits_subscription
  ON public.user_credits (subscription_tier, subscription_status);

-- Add CHECK constraint for valid tiers
ALTER TABLE public.user_credits
  ADD CONSTRAINT valid_subscription_tier
  CHECK (subscription_tier IN ('free', 'starter', 'pro', 'plus', 'agency'));

-- Add CHECK constraint for valid statuses
ALTER TABLE public.user_credits
  ADD CONSTRAINT valid_subscription_status
  CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing', 'paused'));
