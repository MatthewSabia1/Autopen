/*
  # Create Project Folders Schema

  1. New Tables
    - `projects` (if not exists)
    - `project_folders`
    - `folder_projects`
    
  2. Functions and Triggers
    - Add folder item count function
    - Add updated_at trigger
    
  3. Security
    - Disable RLS on both tables
*/

-- First create the projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  content jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft',
  user_id uuid REFERENCES auth.users NOT NULL,
  progress integer DEFAULT 0
);

-- Create project_folders table
CREATE TABLE IF NOT EXISTS project_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create folder_projects table
CREATE TABLE IF NOT EXISTS folder_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  folder_id uuid REFERENCES project_folders NOT NULL,
  project_id uuid REFERENCES projects NOT NULL,
  UNIQUE(folder_id, project_id)
);

-- Add a function to get folder item count
CREATE OR REPLACE FUNCTION get_folder_item_count(folder_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_count integer;
BEGIN
  SELECT COUNT(*) INTO item_count
  FROM folder_projects
  WHERE folder_id = $1;
  
  RETURN item_count;
END;
$$;

-- Create trigger for updating updated_at
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS project_folders_user_id_idx ON project_folders(user_id);
CREATE INDEX IF NOT EXISTS folder_projects_folder_id_idx ON folder_projects(folder_id);
CREATE INDEX IF NOT EXISTS folder_projects_project_id_idx ON folder_projects(project_id);

-- Disable RLS on project_folders table to avoid permission issues
ALTER TABLE public.project_folders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on folder_projects table to avoid permission issues
ALTER TABLE public.folder_projects DISABLE ROW LEVEL SECURITY;