-- Comprehensive fix for project folders tables
-- Run this in Supabase SQL Editor

-- Create project_folders table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create folder_projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS folder_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  folder_id uuid REFERENCES project_folders NOT NULL,
  project_id uuid REFERENCES projects NOT NULL,
  UNIQUE(folder_id, project_id)
);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_folder_item_count(uuid);

-- Re-create the function properly
CREATE OR REPLACE FUNCTION get_folder_item_count(folder_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_count integer;
BEGIN
  SELECT COUNT(*) INTO item_count
  FROM folder_projects
  WHERE folder_id = $1;
  
  RETURN COALESCE(item_count, 0);
END;
$$;

-- Make sure we have the folder update trigger
DROP TRIGGER IF EXISTS update_project_folders_updated_at ON project_folders;

CREATE OR REPLACE FUNCTION update_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_folders_updated_at
BEFORE UPDATE ON project_folders
FOR EACH ROW
EXECUTE FUNCTION update_folder_updated_at();

-- Disable RLS on both tables
ALTER TABLE public.project_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_projects DISABLE ROW LEVEL SECURITY; 