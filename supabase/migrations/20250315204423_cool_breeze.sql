/*
  # Create creator_contents table for AI content generation

  1. New Tables
    - `creator_contents`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `title` (text)
      - `description` (text)
      - `content` (jsonb)
      - `type` (text - ebook, course, blog, video_script, etc.)
      - `status` (text)
      - `user_id` (uuid, foreign key)
      - `project_id` (uuid, foreign key, optional)
      - `metadata` (jsonb)
      - `version` (integer)
      
  2. Security
    - Enable RLS on `creator_contents` table
    - Add policies for authenticated users to read their own content
    - Add policies for authenticated users to create content
    - Add policies for authenticated users to update their own content
    - Add policies for authenticated users to delete their own content
*/

-- Create creator_contents table
CREATE TABLE IF NOT EXISTS creator_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  content jsonb DEFAULT '{}'::jsonb,
  type text NOT NULL CHECK (type IN ('ebook', 'course', 'blog', 'video_script', 'newsletter', 'social_media', 'other')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'published', 'archived')),
  user_id uuid REFERENCES auth.users NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  version integer DEFAULT 1
);

-- Enable row level security
ALTER TABLE creator_contents ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own content
CREATE POLICY "Users can view own creator_contents" 
  ON creator_contents 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow users to create content
CREATE POLICY "Users can create creator_contents" 
  ON creator_contents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own content
CREATE POLICY "Users can update own creator_contents" 
  ON creator_contents 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow users to delete their own content
CREATE POLICY "Users can delete own creator_contents" 
  ON creator_contents 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on record update
CREATE TRIGGER update_creator_contents_updated_at
BEFORE UPDATE ON creator_contents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create index on user_id for better query performance
CREATE INDEX creator_contents_user_id_idx ON creator_contents(user_id);

-- Create index on type for filtering
CREATE INDEX creator_contents_type_idx ON creator_contents(type);

-- Create index on status for filtering
CREATE INDEX creator_contents_status_idx ON creator_contents(status);