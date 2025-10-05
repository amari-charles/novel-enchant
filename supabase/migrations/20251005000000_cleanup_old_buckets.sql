-- Clean up old unused storage buckets from abandoned reader-enhance feature

-- Delete enhanced-copies bucket (old Spec 001 feature)
DELETE FROM storage.buckets WHERE id = 'enhanced-copies';

-- Delete generated-images bucket (no code references)
DELETE FROM storage.buckets WHERE id = 'generated-images';
