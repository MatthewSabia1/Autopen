-- This file can be run manually to set up the storage bucket for profile images
-- useful if running migrations is not an option or if the storage bucket needs to be recreated

-- Create the 'profile-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Update bucket configuration to include CORS settings
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 2097152, -- 2MB limit
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
WHERE id = 'profile-images';

-- Allow public reads for profile images (anyone can view profile images)
CREATE POLICY "Allow public read access to profile images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'profile-images')
ON CONFLICT DO NOTHING;

-- Allow users to upload their own profile images (to their own folder)
CREATE POLICY "Allow users to insert their own profile images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'profile-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  )
ON CONFLICT DO NOTHING;

-- Allow users to update their own profile images
CREATE POLICY "Allow users to update their own profile images" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'profile-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  )
ON CONFLICT DO NOTHING;

-- Allow users to delete their own profile images
CREATE POLICY "Allow users to delete their own profile images" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'profile-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  )
ON CONFLICT DO NOTHING;

-- You should also configure CORS in the Supabase dashboard:
-- 1. Go to Project Settings > API > CORS
-- 2. Add your application domain to the allowed origins
-- 3. Enable the following options:
--    * Allow credentials
--    * Expose content disposition header

-- Execute with:
-- psql -h <host> -p <port> -d <database> -U <user> -f setup_storage.sql 