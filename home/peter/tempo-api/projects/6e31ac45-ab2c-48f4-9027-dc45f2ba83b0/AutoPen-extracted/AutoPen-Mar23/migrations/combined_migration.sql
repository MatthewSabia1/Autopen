-- Combined Migration Script for Autopen eBook Workflow
-- Run this in Supabase SQL Editor

-- Part 1: Add columns to creator_contents
ALTER TABLE public.creator_contents
ADD COLUMN IF NOT EXISTS workflow_step TEXT,
ADD COLUMN IF NOT EXISTS generation_progress JSONB DEFAULT '{"current_step": null, "total_steps": null, "steps_completed": []}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_model_settings JSONB DEFAULT '{}'::jsonb;

-- Part 2: Create ebook_chapters table
CREATE TABLE IF NOT EXISTS public.ebook_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  content_id UUID NOT NULL REFERENCES public.creator_contents(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Part 3: Create ebook_versions table
CREATE TABLE IF NOT EXISTS public.ebook_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  content_id UUID NOT NULL REFERENCES public.creator_contents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  pdf_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Part 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS ebook_chapters_content_id_idx ON public.ebook_chapters(content_id);
CREATE INDEX IF NOT EXISTS ebook_chapters_chapter_index_idx ON public.ebook_chapters(chapter_index);
CREATE INDEX IF NOT EXISTS ebook_versions_content_id_idx ON public.ebook_versions(content_id);
CREATE INDEX IF NOT EXISTS ebook_versions_version_number_idx ON public.ebook_versions(version_number);

-- Part 5: Enable RLS for security
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_versions ENABLE ROW LEVEL SECURITY;

-- Part a: Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Part 6: Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_ebook_chapters_updated_at ON public.ebook_chapters;
CREATE TRIGGER update_ebook_chapters_updated_at
  BEFORE UPDATE ON public.ebook_chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Part 7: Create RLS policies for ebook_chapters
-- Policy for select: users can only view their own chapters
CREATE POLICY "Users can view own ebook_chapters" 
ON public.ebook_chapters
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_chapters.content_id
  AND creator_contents.user_id = auth.uid()
));

-- Policy for insert: users can only insert chapters for their own content
CREATE POLICY "Users can create ebook_chapters" 
ON public.ebook_chapters
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_chapters.content_id
  AND creator_contents.user_id = auth.uid()
));

-- Policy for update: users can only update their own chapters
CREATE POLICY "Users can update own ebook_chapters" 
ON public.ebook_chapters
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_chapters.content_id
  AND creator_contents.user_id = auth.uid()
));

-- Policy for delete: users can only delete their own chapters
CREATE POLICY "Users can delete own ebook_chapters" 
ON public.ebook_chapters
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_chapters.content_id
  AND creator_contents.user_id = auth.uid()
));

-- Part 8: Create RLS policies for ebook_versions
-- Policy for select: users can only view their own versions
CREATE POLICY "Users can view own ebook_versions" 
ON public.ebook_versions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_versions.content_id
  AND creator_contents.user_id = auth.uid()
));

-- Policy for insert: users can only insert versions for their own content
CREATE POLICY "Users can create ebook_versions" 
ON public.ebook_versions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_versions.content_id
  AND creator_contents.user_id = auth.uid()
));

-- Policy for update: users can only update their own versions
CREATE POLICY "Users can update own ebook_versions" 
ON public.ebook_versions
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_versions.content_id
  AND creator_contents.user_id = auth.uid()
));

-- Policy for delete: users can only delete their own versions
CREATE POLICY "Users can delete own ebook_versions" 
ON public.ebook_versions
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_versions.content_id
  AND creator_contents.user_id = auth.uid()
));

-- Part 9: Grant permissions
GRANT ALL ON public.ebook_chapters TO authenticated;
GRANT ALL ON public.ebook_versions TO authenticated;
GRANT ALL ON public.ebook_chapters TO service_role;
GRANT ALL ON public.ebook_versions TO service_role;

-- Part 10: Fix creator_contents RLS policies
-- First, disable RLS to ensure we can modify everything
ALTER TABLE public.creator_contents DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for creator_contents to start fresh
DROP POLICY IF EXISTS "Users can view own creator_contents" ON public.creator_contents;
DROP POLICY IF EXISTS "Users can create creator_contents" ON public.creator_contents;
DROP POLICY IF EXISTS "Users can update own creator_contents" ON public.creator_contents;
DROP POLICY IF EXISTS "Users can delete own creator_contents" ON public.creator_contents;
DROP POLICY IF EXISTS "Anyone can create creator_contents temporarily" ON public.creator_contents;
DROP POLICY IF EXISTS creator_contents_select_policy ON public.creator_contents;
DROP POLICY IF EXISTS creator_contents_insert_policy ON public.creator_contents;
DROP POLICY IF EXISTS creator_contents_update_policy ON public.creator_contents;
DROP POLICY IF EXISTS creator_contents_delete_policy ON public.creator_contents;

-- Grant necessary permissions explicitly
GRANT ALL ON public.creator_contents TO authenticated;
GRANT ALL ON public.creator_contents TO service_role;

-- Create proper policies
-- 1. SELECT policy - users can only see their own content
CREATE POLICY "Users can view own creator_contents" 
  ON public.creator_contents 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 2. INSERT policy - CRITICAL FIX: Allow any authenticated user to insert with true check
-- This is the key policy that was causing the 401 error
CREATE POLICY "Users can create creator_contents" 
  ON public.creator_contents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 3. UPDATE policy - users can only update their own content
CREATE POLICY "Users can update own creator_contents" 
  ON public.creator_contents 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. DELETE policy - users can only delete their own content
CREATE POLICY "Users can delete own creator_contents" 
  ON public.creator_contents 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Re-enable RLS with the corrected policies
ALTER TABLE public.creator_contents ENABLE ROW LEVEL SECURITY;