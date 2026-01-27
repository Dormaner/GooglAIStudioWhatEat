-- Run this in Supabase SQL Editor

-- 1. Add 'link' column to recipes table to store original URL
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS link TEXT;

-- 2. Add 'insight' column if it's missing (just safely)
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS insight TEXT;

-- 3. Create a unique index on link to prevent duplicate recipes from same URL
-- (Optional but recommended for scraper idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_link ON recipes(link);

-- 4. Verify step columns (just to be safe, usually these exist)
-- recipe_steps table should have: id, recipe_id, title, description, image, step_order
