/*
  # Update avatar storage bucket visibility

  1. Storage Visibility Changes
    - Make the `avatars` bucket public to ensure images are accessible
  2. Security
    - Maintain existing security policies for user data protection
    - Allow public read access while preserving authenticated write protection
*/

-- Update the avatars bucket to be public if it exists
UPDATE storage.buckets 
SET public = TRUE 
WHERE id = 'avatars';

-- Create a policy to allow public read access to images
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
);

-- Check if the RLS is enabled on the objects table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND rowsecurity = true
  ) THEN
    -- RLS is already enabled, don't need to do anything
    RAISE NOTICE 'RLS is already enabled on storage.objects';
  ELSE
    -- Enable RLS if not already enabled
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;