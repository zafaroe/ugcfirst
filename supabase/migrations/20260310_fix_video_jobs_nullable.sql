-- ============================================
-- Make kie_job_id nullable on video_jobs
-- ============================================
-- Multiple pipeline modes (Spotlight, DIY) create video_jobs records
-- before the Kie.ai task is created. The NOT NULL constraint causes
-- these inserts to silently fail.

-- Drop the existing NOT NULL constraint
ALTER TABLE video_jobs ALTER COLUMN kie_job_id DROP NOT NULL;

-- Keep the unique constraint but allow NULLs (PostgreSQL unique allows multiple NULLs)
-- The existing UNIQUE index already handles this correctly in PostgreSQL.

-- Add comment
COMMENT ON COLUMN video_jobs.kie_job_id IS 'Kie.ai task ID. Nullable because some pipeline modes create the record before task creation.';
