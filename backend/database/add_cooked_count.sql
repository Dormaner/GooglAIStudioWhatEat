
-- Add cooked_count to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cooked_count INTEGER DEFAULT 0;
