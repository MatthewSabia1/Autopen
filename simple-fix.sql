-- Simplified fix for folder creation issue
-- Run this in the Supabase SQL Editor

-- 1. Disable RLS on both tables
ALTER TABLE public.project_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_projects DISABLE ROW LEVEL SECURITY;

-- 2. Make sure we can insert records without returning
ALTER TABLE public.project_folders ALTER COLUMN updated_at SET DEFAULT now();

-- 3. Create a function to check if a folder exists
CREATE OR REPLACE FUNCTION folder_exists(
  p_name text,
  p_user_id uuid
) RETURNS boolean AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM project_folders 
    WHERE name = p_name AND user_id = p_user_id
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql; 