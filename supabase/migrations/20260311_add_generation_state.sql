-- ============================================
-- ADD GENERATION_STATE COLUMN
-- ============================================
-- Stores intermediate pipeline state for multi-step Inngest processing
-- Enables checkpoint recovery across Vercel function invocations

-- Add generation_state column for pipeline state persistence
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS generation_state JSONB DEFAULT '{}';

-- Add index for efficient queries on active generations with state
CREATE INDEX IF NOT EXISTS idx_generations_state_active
ON generations(id)
WHERE status NOT IN ('completed', 'failed')
AND generation_state != '{}';

-- Add comment explaining the column
COMMENT ON COLUMN generations.generation_state IS
'Intermediate pipeline state for multi-step Inngest processing. Contains persona, scripts, frameUrls, videoJobs, and completedVideos.';

-- Add current_tier column to video_jobs for fallback tracking
ALTER TABLE video_jobs
ADD COLUMN IF NOT EXISTS current_tier INTEGER DEFAULT 1;

ALTER TABLE video_jobs
ADD COLUMN IF NOT EXISTS model_used TEXT;

COMMENT ON COLUMN video_jobs.current_tier IS
'Current fallback tier (1-5) for video generation. 1=Sora2Stable, 2=Sora2, 3=Sora2Pro, 4=SoraDirect, 5=Veo3Fast';

COMMENT ON COLUMN video_jobs.model_used IS
'The AI model that successfully generated this video';
