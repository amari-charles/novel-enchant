-- Add author column to stories table
-- This allows users to specify an author name separate from the user account

ALTER TABLE stories ADD COLUMN IF NOT EXISTS author text;

COMMENT ON COLUMN stories.author IS 'Optional author name for the story. Can be different from the user account name.';
