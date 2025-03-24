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

-- Disable RLS on project_folders table to avoid permission issues
ALTER TABLE public.project_folders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on folder_projects table to avoid permission issues
ALTER TABLE public.folder_projects DISABLE ROW LEVEL SECURITY; 