/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `title` (text)
      - `description` (text)
      - `content` (jsonb)
      - `status` (text)
      - `user_id` (uuid, foreign key)
      - `progress` (integer)
      
  2. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users to read their own projects
    - Add policies for authenticated users to create projects
    - Add policies for authenticated users to update their own projects
    - Add policies for authenticated users to delete their own projects
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  content jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  user_id uuid REFERENCES auth.users NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)
);

-- Enable row level security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own projects
CREATE POLICY "Users can view own projects" 
  ON projects 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow users to create projects
CREATE POLICY "Users can create projects" 
  ON projects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own projects
CREATE POLICY "Users can update own projects" 
  ON projects 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete own projects" 
  ON projects 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Function to update the updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on record update
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();