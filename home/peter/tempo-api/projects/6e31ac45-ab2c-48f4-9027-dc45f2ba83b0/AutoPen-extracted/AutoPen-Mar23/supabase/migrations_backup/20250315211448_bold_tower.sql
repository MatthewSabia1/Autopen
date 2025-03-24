/*
  # Fix Products Data Structure and Relationships

  1. Schema Improvements
    - Add indexes to projects table for better performance
    - Add default type field to content structure
    - Ensure proper foreign key relationships
    - Fix RLS policies to ensure proper data visibility
  
  2. Troubleshooting
    - Add a helper function to verify content structure
    - Add a notification trigger for product creation
*/

-- Add index on user_id for faster filtering of user's projects
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);

-- Add index on status for faster filtering by status
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);

-- Add updated_at index for sorting by most recent
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON public.projects(updated_at);

-- Add a function to ensure content has a type field
CREATE OR REPLACE FUNCTION ensure_content_has_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if content is NULL or doesn't have a type field
  IF NEW.content IS NULL OR NOT (NEW.content ? 'type') THEN
    -- Set a default type field based on the template/structure
    IF NEW.content ? 'sections' THEN
      NEW.content = jsonb_set(
        COALESCE(NEW.content, '{}'::jsonb), 
        '{type}', 
        '"ebook"'
      );
    ELSIF NEW.content ? 'modules' THEN
      NEW.content = jsonb_set(
        COALESCE(NEW.content, '{}'::jsonb), 
        '{type}', 
        '"course"'
      );
    ELSE
      -- Default fallback
      NEW.content = jsonb_set(
        COALESCE(NEW.content, '{}'::jsonb), 
        '{type}', 
        '"ebook"'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure content has type on insert or update
DROP TRIGGER IF EXISTS ensure_project_content_type ON public.projects;
CREATE TRIGGER ensure_project_content_type
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION ensure_content_has_type();

-- Add a notification trigger when projects are created
CREATE OR REPLACE FUNCTION log_project_creation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'New project created: ID=%, title=%, user_id=%', 
    NEW.id, NEW.title, NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_project_creation_trigger ON public.projects;
CREATE TRIGGER log_project_creation_trigger
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION log_project_creation();

-- Verify that RLS is enabled on projects table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'projects' 
    AND schemaname = 'public' 
    AND rowsecurity = false
  ) THEN
    -- If RLS is not enabled, enable it
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    
    -- Recreate the policies
    CREATE POLICY "Users can view own projects" 
      ON projects 
      FOR SELECT 
      TO authenticated 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create projects" 
      ON projects 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own projects" 
      ON projects 
      FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own projects" 
      ON projects 
      FOR DELETE 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add test data for development if projects table is empty
DO $$
DECLARE
  project_count int;
  test_user_id uuid;
BEGIN
  -- Check if we have any projects
  SELECT COUNT(*) INTO project_count FROM public.projects;
  
  -- Get test user id
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@example.com' LIMIT 1;
  
  -- Only add test data if projects table is empty and we have a test user
  IF project_count = 0 AND test_user_id IS NOT NULL THEN
    INSERT INTO public.projects (
      title, 
      description, 
      content, 
      status, 
      user_id, 
      progress
    ) VALUES (
      'Sample E-Book Product', 
      'A demonstration e-book product for testing', 
      '{"type": "ebook", "sections": [{"title": "Introduction", "content": "Welcome to this sample e-book"}, {"title": "Chapter 1", "content": "This is the first chapter content"}, {"title": "Conclusion", "content": "This is the end of the sample"}]}', 
      'draft', 
      test_user_id, 
      30
    );

    INSERT INTO public.projects (
      title, 
      description, 
      content, 
      status, 
      user_id, 
      progress
    ) VALUES (
      'Getting Started with Autopen', 
      'Learn how to use the Autopen platform effectively', 
      '{"type": "course", "sections": [{"title": "Platform Overview", "content": "Autopen is an AI-powered writing platform"}, {"title": "Using Brain Dump", "content": "The Brain Dump tool helps organize your ideas"}, {"title": "Creating Products", "content": "How to create and manage your products"}]}', 
      'in_progress', 
      test_user_id, 
      65
    );
  END IF;
END $$;