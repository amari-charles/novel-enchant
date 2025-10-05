-- Fix Storage RLS Policies for User-Based Folder Structure
--
-- Changes:
-- 1. Remove incorrect folder name check from INSERT policy
-- 2. Add proper user ownership checks to UPDATE/DELETE policies
-- 3. Use user-based folder structure: {userId}/{chapterId}/{filename}

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload to own path" ON storage.objects;
DROP POLICY IF EXISTS "Users can read all files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- INSERT: Users can only upload to folders starting with their user ID
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'enhancements' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: All authenticated users can read all files (public bucket)
CREATE POLICY "Authenticated users can read all files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'enhancements');

-- UPDATE: Users can only update files in their own folder
CREATE POLICY "Users can update own folder files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'enhancements' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'enhancements' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Users can only delete files in their own folder
CREATE POLICY "Users can delete own folder files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'enhancements' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
