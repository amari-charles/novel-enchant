-- Restructure: Drop old temp chapters table, rename enhanced_copies to chapters

-- Step 1: Drop the old temp chapters table (not used by app)
DROP TABLE IF EXISTS chapters CASCADE;

-- Step 2: Rename enhanced_copies to chapters
ALTER TABLE enhanced_copies RENAME TO chapters;

-- Step 2: Add story_id column to chapters
ALTER TABLE chapters ADD COLUMN story_id uuid REFERENCES stories(id) ON DELETE CASCADE;

-- Step 3: Add content column to chapters (for raw chapter text)
ALTER TABLE chapters ADD COLUMN content text;

-- Step 4: Migrate existing data - create a story for each chapter and link them
DO $$
DECLARE
  chapter_record RECORD;
  new_story_id uuid;
BEGIN
  FOR chapter_record IN SELECT * FROM chapters WHERE story_id IS NULL LOOP
    -- Create a story for this chapter
    INSERT INTO stories (user_id, title, created_at)
    VALUES (
      chapter_record.user_id,
      chapter_record.title,
      chapter_record.created_at
    )
    RETURNING id INTO new_story_id;

    -- Link chapter to story
    UPDATE chapters
    SET story_id = new_story_id,
        content = chapter_record.original_content
    WHERE id = chapter_record.id;
  END LOOP;
END $$;

-- Step 5: Make story_id NOT NULL after migration
ALTER TABLE chapters ALTER COLUMN story_id SET NOT NULL;

-- Step 6: Drop original_content column (now in content)
ALTER TABLE chapters DROP COLUMN IF EXISTS original_content;

-- Step 7: Update RLS policies for renamed table
DROP POLICY IF EXISTS "Users can view own enhanced copies" ON chapters;
DROP POLICY IF EXISTS "Users can insert own enhanced copies" ON chapters;
DROP POLICY IF EXISTS "Users can update own enhanced copies" ON chapters;
DROP POLICY IF EXISTS "Users can delete own enhanced copies" ON chapters;

CREATE POLICY "Users can view own chapters" ON chapters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chapters" ON chapters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chapters" ON chapters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chapters" ON chapters FOR DELETE USING (auth.uid() = user_id);

-- Step 8: Update indexes
DROP INDEX IF EXISTS idx_enhanced_copies_user_id;
CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON chapters(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);

-- Step 9: Update stories table to add description and author
ALTER TABLE stories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
