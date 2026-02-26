-- =============================================
-- Waitlist Table Migration
-- =============================================

-- Create the waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runs)
DROP POLICY IF EXISTS "Allow public inserts" ON public.waitlist;
DROP POLICY IF EXISTS "Service role full access" ON public.waitlist;

-- Allow anyone to insert (for public waitlist signup)
CREATE POLICY "Allow public inserts" ON public.waitlist
  FOR INSERT
  WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.waitlist
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- Grant access to anon role for inserts
GRANT INSERT ON public.waitlist TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO service_role;
