-- Enhancement Characters Junction Table
-- Links enhancements (AI-generated images) to the characters they depict
-- Enables character-based image browsing and consistency tracking

-- -----------------------------------------------------
-- Table: enhancement_characters
-- Purpose: Many-to-many relationship between enhancements and characters
-- Use Cases:
--   - Track which characters appear in each AI-generated image
--   - Enable "show all images featuring Alice" queries
--   - Support character consistency analytics and reporting
--   - Record provenance for character-based image generation
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS enhancement_characters (
  -- Foreign key to the enhancement (AI-generated image)
  enhancement_id uuid NOT NULL REFERENCES enhancements(id) ON DELETE CASCADE,

  -- Foreign key to the character appearing in the image
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

  -- Timestamp when this association was created
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Composite primary key ensures each character appears only once per enhancement
  PRIMARY KEY (enhancement_id, character_id)
);

COMMENT ON TABLE enhancement_characters IS 'Junction table linking enhancements to characters depicted in them. Supports character-based image queries and consistency tracking.';
COMMENT ON COLUMN enhancement_characters.enhancement_id IS 'The enhancement (AI-generated image) containing this character. Cascade deletes when enhancement is deleted.';
COMMENT ON COLUMN enhancement_characters.character_id IS 'The character appearing in this enhancement. Cascade deletes when character is deleted (prevents orphaned associations).';

-- -----------------------------------------------------
-- Indexes
-- -----------------------------------------------------

-- Index for querying all enhancements featuring a specific character
CREATE INDEX idx_enhancement_characters_character_id
  ON enhancement_characters(character_id);

-- Index for querying all characters in a specific enhancement
CREATE INDEX idx_enhancement_characters_enhancement_id
  ON enhancement_characters(enhancement_id);

-- -----------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------

ALTER TABLE enhancement_characters ENABLE ROW LEVEL SECURITY;

-- Users can manage character associations for enhancements in their stories
-- Permission flows through: enhancement -> chapter -> story -> user
CREATE POLICY "Users can manage enhancement_characters for their stories"
  ON enhancement_characters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM enhancements e
      JOIN chapters c ON e.chapter_id = c.id
      JOIN stories s ON c.story_id = s.id
      WHERE e.id = enhancement_id
        AND s.user_id = auth.uid()
    )
  );
