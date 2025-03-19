-- Fix for get_folder_item_count function
-- Run this in Supabase SQL Editor

-- Drop the function if it exists with any signature
DROP FUNCTION IF EXISTS get_folder_item_count(uuid);

-- Create a proper function to get folder item count
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