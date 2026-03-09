-- Add Late profile ID to user_credits
-- Each user gets one Late profile to group their connected social accounts

ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS late_profile_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.user_credits.late_profile_id IS 'Late API profile ID - container for social accounts';
