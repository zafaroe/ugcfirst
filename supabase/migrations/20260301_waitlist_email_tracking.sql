-- Add email tracking columns to waitlist table
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS day3_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS day7_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS launch_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Index for the cron query (find unsent emails by signup date)
CREATE INDEX IF NOT EXISTS idx_waitlist_email_tracking
  ON public.waitlist(created_at)
  WHERE day3_sent_at IS NULL OR day7_sent_at IS NULL;
