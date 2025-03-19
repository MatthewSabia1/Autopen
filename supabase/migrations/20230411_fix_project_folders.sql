-- Make sure tables have the correct structure with no RLS
-- This simplified approach avoids potential issues with existing tables

-- Ensure project_folders has correct structure
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_folders' AND column_name = 'user_id') THEN
    ALTER TABLE project_folders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_folders' AND column_name = 'name') THEN
    ALTER TABLE project_folders ADD COLUMN IF NOT EXISTS name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_folders' AND column_name = 'description') THEN
    ALTER TABLE project_folders ADD COLUMN IF NOT EXISTS description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_folders' AND column_name = 'created_at') THEN
    ALTER TABLE project_folders ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_folders' AND column_name = 'updated_at') THEN
    ALTER TABLE project_folders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
  END IF;
END
$$;

-- Make sure RLS is disabled on both tables
ALTER TABLE IF EXISTS public.project_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.folder_projects DISABLE ROW LEVEL SECURITY;

-- Fix any user_id values that might be null
UPDATE project_folders SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL; 