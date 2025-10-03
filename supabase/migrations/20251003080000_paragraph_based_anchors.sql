-- =====================================================
-- Paragraph-Based Anchoring Migration
-- Created: 2025-10-03
-- Purpose: Replace character position with paragraph index for stable anchoring
-- =====================================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_anchors_chapter_id_position;

-- Modify anchors table: replace position with after_paragraph_index
ALTER TABLE anchors DROP COLUMN position;
ALTER TABLE anchors ADD COLUMN after_paragraph_index integer NOT NULL DEFAULT 0 CHECK (after_paragraph_index >= 0);

-- Add new index for paragraph-based queries
CREATE INDEX idx_anchors_chapter_id_paragraph ON anchors(chapter_id, after_paragraph_index);

-- Update column comments
COMMENT ON COLUMN anchors.after_paragraph_index IS 'Paragraph index after which the enhancement appears. 0 = after first paragraph, 1 = after second paragraph, etc. Must be >= 0.';