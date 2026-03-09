-- ============================================
-- ADD SPOTLIGHT MODE TO GENERATIONS
-- ============================================
-- Adds 'spotlight' as an allowed generation mode

-- Drop the existing constraint
ALTER TABLE generations DROP CONSTRAINT IF EXISTS generations_mode_check;

-- Add new constraint with 'spotlight' included
ALTER TABLE generations ADD CONSTRAINT generations_mode_check
  CHECK (mode IN ('diy', 'concierge', 'spotlight'));

-- Add spotlight-specific columns if not exists
ALTER TABLE generations ADD COLUMN IF NOT EXISTS spotlight_category_id TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS spotlight_style_id TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS spotlight_duration TEXT DEFAULT '5';

-- Add comments
COMMENT ON COLUMN generations.spotlight_category_id IS 'Spotlight mode: category ID (beauty, fashion, food, tech, home, jewelry)';
COMMENT ON COLUMN generations.spotlight_style_id IS 'Spotlight mode: style ID within the category';
COMMENT ON COLUMN generations.spotlight_duration IS 'Spotlight mode: animation duration (5 or 10 seconds)';
