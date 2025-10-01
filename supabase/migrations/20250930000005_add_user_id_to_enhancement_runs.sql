-- Add user_id to enhancement_runs for direct text enhancement
-- This allows enhancement runs without a chapter_id (direct text input)

ALTER TABLE enhancement_runs ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update RLS policies to check user_id OR chapter ownership
DROP POLICY IF EXISTS "Users can view runs of own chapters" ON enhancement_runs;
CREATE POLICY "Users can view runs of own chapters" ON enhancement_runs FOR SELECT USING (
  auth.role() = 'service_role' OR
  user_id = auth.uid() OR
  (chapter_id IS NOT NULL AND chapter_id IN (
    SELECT c.id FROM chapters c
    JOIN stories s ON c.story_id = s.id
    WHERE s.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can insert runs for own chapters" ON enhancement_runs;
CREATE POLICY "Users can insert runs for own chapters" ON enhancement_runs FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR
  user_id = auth.uid() OR
  (chapter_id IS NOT NULL AND chapter_id IN (
    SELECT c.id FROM chapters c
    JOIN stories s ON c.story_id = s.id
    WHERE s.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can update runs of own chapters" ON enhancement_runs;
CREATE POLICY "Users can update runs of own chapters" ON enhancement_runs FOR UPDATE USING (
  auth.role() = 'service_role' OR
  user_id = auth.uid() OR
  (chapter_id IS NOT NULL AND chapter_id IN (
    SELECT c.id FROM chapters c
    JOIN stories s ON c.story_id = s.id
    WHERE s.user_id = auth.uid()
  ))
);

-- Update scenes policies to check via user_id as well
DROP POLICY IF EXISTS "Users can view scenes of own runs" ON scenes;
CREATE POLICY "Users can view scenes of own runs" ON scenes FOR SELECT USING (
  auth.role() = 'service_role' OR
  enhancement_run_id IN (
    SELECT r.id FROM enhancement_runs r
    WHERE r.user_id = auth.uid()
      OR (r.chapter_id IS NOT NULL AND r.chapter_id IN (
        SELECT c.id FROM chapters c
        JOIN stories s ON c.story_id = s.id
        WHERE s.user_id = auth.uid()
      ))
  )
);

DROP POLICY IF EXISTS "Users can insert scenes to own runs" ON scenes;
CREATE POLICY "Users can insert scenes to own runs" ON scenes FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR
  enhancement_run_id IN (
    SELECT r.id FROM enhancement_runs r
    WHERE r.user_id = auth.uid()
      OR (r.chapter_id IS NOT NULL AND r.chapter_id IN (
        SELECT c.id FROM chapters c
        JOIN stories s ON c.story_id = s.id
        WHERE s.user_id = auth.uid()
      ))
  )
);

DROP POLICY IF EXISTS "Users can update scenes of own runs" ON scenes;
CREATE POLICY "Users can update scenes of own runs" ON scenes FOR UPDATE USING (
  auth.role() = 'service_role' OR
  enhancement_run_id IN (
    SELECT r.id FROM enhancement_runs r
    WHERE r.user_id = auth.uid()
      OR (r.chapter_id IS NOT NULL AND r.chapter_id IN (
        SELECT c.id FROM chapters c
        JOIN stories s ON c.story_id = s.id
        WHERE s.user_id = auth.uid()
      ))
  )
);
