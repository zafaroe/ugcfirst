-- ============================================
-- ADD has_paid FLAG TO USER_CREDITS
-- Tracks whether a user has ever made a real payment.
-- Once true, never resets — used for watermark/limit logic.
-- ============================================

ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS has_paid BOOLEAN NOT NULL DEFAULT false;

-- Index for quick lookups in generate/start
CREATE INDEX IF NOT EXISTS idx_user_credits_has_paid
ON public.user_credits (has_paid)
WHERE has_paid = false;

-- Backfill: Mark any user with a purchase or subscription transaction as has_paid
UPDATE public.user_credits uc
SET has_paid = true
WHERE EXISTS (
  SELECT 1 FROM public.credit_transactions ct
  WHERE ct.user_id = uc.user_id
  AND ct.type IN ('purchase', 'subscription')
  AND ct.status = 'completed'
);
