-- Migration to add missing ebook tables and columns

-- Add generation_progress column to creator_contents if it doesn't exist
ALTER TABLE public.creator_contents 
ADD COLUMN IF NOT EXISTS generation_progress JSONB DEFAULT '{}'::jsonb;

-- Add workflow_step column to creator_contents if it doesn't exist
ALTER TABLE public.creator_contents 
ADD COLUMN IF NOT EXISTS workflow_step TEXT DEFAULT NULL;

-- Create ebook_chapters table
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

-- Create indexes for ebook_chapters
CREATE INDEX IF NOT EXISTS ebook_chapters_content_id_idx ON public.ebook_chapters(content_id);
CREATE INDEX IF NOT EXISTS ebook_chapters_chapter_index_idx ON public.ebook_chapters(chapter_index);

-- Add RLS policies for ebook_chapters
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;

-- Policy for select: users can only view their own chapters (through content_id)
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

-- Create ebook_versions table
CREATE TABLE IF NOT EXISTS public.ebook_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  content_id UUID NOT NULL REFERENCES public.creator_contents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  pdf_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for ebook_versions
CREATE INDEX IF NOT EXISTS ebook_versions_content_id_idx ON public.ebook_versions(content_id);
CREATE INDEX IF NOT EXISTS ebook_versions_version_number_idx ON public.ebook_versions(version_number);

-- Add RLS policies for ebook_versions
ALTER TABLE public.ebook_versions ENABLE ROW LEVEL SECURITY;

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

-- Create trigger to update updated_at for ebook_chapters
DROP TRIGGER IF EXISTS update_ebook_chapters_updated_at ON public.ebook_chapters;
CREATE TRIGGER update_ebook_chapters_updated_at
  BEFORE UPDATE ON public.ebook_chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.ebook_chapters TO authenticated;
GRANT ALL ON public.ebook_versions TO authenticated;
GRANT ALL ON public.ebook_chapters TO service_role;
GRANT ALL ON public.ebook_versions TO service_role; 