-- ============================================
-- Add cached persona profile to user_products
-- Eliminates repeated OpenAI Vision calls for the same product
-- ============================================

ALTER TABLE user_products
ADD COLUMN IF NOT EXISTS persona_profile JSONB;

COMMENT ON COLUMN user_products.persona_profile IS 'Cached PersonaProfile from OpenAI Vision analysis. Stored on first extraction to skip re-analysis on repeat use.';

