-- Automatic Storage File Cleanup
-- Created: 2025-10-04
-- Purpose: Automatically delete storage files when media records are deleted
--
-- When a media record is deleted, this trigger removes the corresponding file
-- from the Supabase Storage bucket by deleting its entry from storage.objects.
-- Deleting from storage.objects triggers Supabase's internal cleanup which
-- removes the actual file from S3/storage backend.

-- -----------------------------------------------------
-- Function to delete storage file when media is deleted
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION delete_storage_file_on_media_delete()
RETURNS trigger AS $$
BEGIN
  -- Delete from storage.objects table
  -- This removes both the metadata AND triggers Supabase to delete the actual S3 file
  DELETE FROM storage.objects
  WHERE bucket_id = 'enhancements'
    AND name = OLD.storage_path;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION delete_storage_file_on_media_delete IS 'Automatically deletes storage files when media records are deleted. Removes orphaned files from S3.';

-- -----------------------------------------------------
-- Trigger on media table to cleanup storage files
-- -----------------------------------------------------

DROP TRIGGER IF EXISTS cleanup_storage_file_on_media_delete ON media;

CREATE TRIGGER cleanup_storage_file_on_media_delete
  AFTER DELETE ON media
  FOR EACH ROW
  EXECUTE FUNCTION delete_storage_file_on_media_delete();

COMMENT ON TRIGGER cleanup_storage_file_on_media_delete ON media IS 'Automatically removes storage files when media records are deleted to prevent orphaned files';
