-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS) for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
-- Allow users to view any profile
CREATE POLICY "Allow public read access to profiles" 
  ON profiles 
  FOR SELECT 
  USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Allow users to update their own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" 
  ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Configure the bucket with appropriate settings
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 2097152, -- 2MB limit
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
WHERE id = 'profile-images';

-- Set up Row Level Security for storage
-- Allow users to view any profile image
CREATE POLICY "Allow public read access to profile images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'profile-images');

-- Allow users to insert their own profile images
CREATE POLICY "Allow users to insert their own profile images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'profile-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own profile images
CREATE POLICY "Allow users to update their own profile images" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'profile-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own profile images
CREATE POLICY "Allow users to delete their own profile images" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'profile-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  ); 