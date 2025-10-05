-- Create storage bucket for enhancement images
-- Note: Bucket settings (public, file_size_limit, allowed_mime_types) are configured in config.toml
INSERT INTO storage.buckets (id, name)
VALUES ('enhancements', 'enhancements')
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own path
CREATE POLICY "Users can upload to own path"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'enhancements' AND
  (storage.foldername(name))[1] = 'enhancements'
);

-- Allow authenticated users to read all files
CREATE POLICY "Users can read all files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'enhancements');

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'enhancements')
WITH CHECK (bucket_id = 'enhancements');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'enhancements');
