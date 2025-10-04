-- =====================================================
-- Polymorphic Media Ownership
-- Created: 2025-10-03
-- Purpose: Add polymorphic ownership tracking to media table
--          and automatic cleanup when owner is deleted
-- =====================================================

-- -----------------------------------------------------
-- Add ownership columns to media table
-- -----------------------------------------------------

-- Add owner_type to track what kind of entity owns this media
ALTER TABLE media
  ADD COLUMN owner_type text CHECK (owner_type IN ('enhancement', 'story_cover', 'avatar', 'user_upload'));

-- Add owner_id to track which specific entity owns this media
ALTER TABLE media
  ADD COLUMN owner_id uuid;

-- Add index for efficient owner lookups
CREATE INDEX idx_media_owner ON media(owner_type, owner_id);

-- Add comments
COMMENT ON COLUMN media.owner_type IS 'Type of entity that owns this media: enhancement, story_cover, avatar, or user_upload';
COMMENT ON COLUMN media.owner_id IS 'ID of the owning entity. References different tables based on owner_type';

-- -----------------------------------------------------
-- Fix FK constraint direction
-- -----------------------------------------------------

-- Drop existing FK that cascades wrong direction
ALTER TABLE enhancements DROP CONSTRAINT IF EXISTS enhancements_media_id_fkey;

-- Add new FK that prevents orphaning (RESTRICT prevents deleting media while in use)
ALTER TABLE enhancements
  ADD CONSTRAINT enhancements_media_id_fkey
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE RESTRICT;

-- -----------------------------------------------------
-- Trigger function to cleanup media when owner is deleted
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION delete_owned_media()
RETURNS trigger AS $$
BEGIN
  -- Delete media owned by the deleted enhancement
  DELETE FROM media
  WHERE owner_type = 'enhancement'
    AND owner_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION delete_owned_media IS 'Automatically deletes media records when their owning entity is deleted';

-- -----------------------------------------------------
-- Trigger on enhancements to cleanup media
-- -----------------------------------------------------

DROP TRIGGER IF EXISTS cleanup_media_on_enhancement_delete ON enhancements;

CREATE TRIGGER cleanup_media_on_enhancement_delete
  AFTER DELETE ON enhancements
  FOR EACH ROW
  EXECUTE FUNCTION delete_owned_media();

COMMENT ON TRIGGER cleanup_media_on_enhancement_delete ON enhancements IS 'Automatically cleans up orphaned media when enhancement is deleted';

-- -----------------------------------------------------
-- Migrate existing data
-- -----------------------------------------------------

-- Set owner_type and owner_id for existing media records
-- This finds media referenced by enhancements and marks them as owned
UPDATE media m
SET
  owner_type = 'enhancement',
  owner_id = e.id
FROM enhancements e
WHERE m.id = e.media_id
  AND m.owner_type IS NULL;

-- Any remaining media without an owner is marked as user_upload
UPDATE media
SET owner_type = 'user_upload'
WHERE owner_type IS NULL;
