-- Drop existing tables if they exist (this will fix any issues with the current tables)
DROP TABLE IF EXISTS folder_projects CASCADE;
DROP TABLE IF EXISTS project_folders CASCADE;

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

-- Fix for database RPC functions
-- Run this in Supabase SQL Editor to fix the get_folder_item_count function

-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS get_folder_item_count(uuid);

-- Create a proper function to count items in a folder
CREATE OR REPLACE FUNCTION get_folder_item_count(folder_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM folder_projects
  WHERE folder_id = folder_id;
$$;

-- The problem with the function is that it's using the parameter name as both
-- parameter and column name, causing ambiguity. Let's fix that:

-- Drop the function again to replace it
DROP FUNCTION IF EXISTS get_folder_item_count(uuid);

-- Create the fixed function with a proper parameter reference
CREATE OR REPLACE FUNCTION get_folder_item_count(f_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM folder_projects
  WHERE folder_id = f_id;
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

-- IMPORTANT: Disable RLS on project_folders table to avoid permission issues
ALTER TABLE public.project_folders DISABLE ROW LEVEL SECURITY;

-- IMPORTANT: Disable RLS on folder_projects table to avoid permission issues
ALTER TABLE public.folder_projects DISABLE ROW LEVEL SECURITY; 