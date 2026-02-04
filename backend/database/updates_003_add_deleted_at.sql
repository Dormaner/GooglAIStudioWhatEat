-- Add deleted_at column to recipes table for soft delete support
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster filtering of non-deleted items
CREATE INDEX IF NOT EXISTS idx_recipes_deleted_at ON recipes(deleted_at);
