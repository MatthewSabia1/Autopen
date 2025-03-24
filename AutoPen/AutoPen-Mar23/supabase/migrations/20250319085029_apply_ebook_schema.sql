-- eBook Workflow Schema Setup
-- Run this in the Supabase SQL editor

-- 1. Update creator_contents table
ALTER TABLE public.creator_contents
ADD COLUMN IF NOT EXISTS workflow_step TEXT,
ADD COLUMN IF NOT EXISTS generation_progress JSONB DEFAULT '{"current_step": null, "total_steps": null, "steps_completed": []}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_model_settings JSONB DEFAULT '{}'::jsonb;

-- 2. Create ebook_chapters table
CREATE TABLE IF NOT EXISTS public.ebook_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  content_id UUID REFERENCES public.creator_contents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  chapter_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS ebook_chapters_content_id_idx ON public.ebook_chapters(content_id);
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;

-- Policies for ebook_chapters
CREATE POLICY IF NOT EXISTS "Users can view own ebook_chapters" 
ON public.ebook_chapters
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_chapters.content_id
  AND creator_contents.user_id = auth.uid()
));

CREATE POLICY IF NOT EXISTS "Users can create ebook_chapters" 
ON public.ebook_chapters
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_chapters.content_id
  AND creator_contents.user_id = auth.uid()
));

CREATE POLICY IF NOT EXISTS "Users can update own ebook_chapters" 
ON public.ebook_chapters
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_chapters.content_id
  AND creator_contents.user_id = auth.uid()
));

CREATE POLICY IF NOT EXISTS "Users can delete own ebook_chapters" 
ON public.ebook_chapters
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_chapters.content_id
  AND creator_contents.user_id = auth.uid()
));

-- 3. Create ebook_versions table
CREATE TABLE IF NOT EXISTS public.ebook_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  content_id UUID REFERENCES public.creator_contents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS ebook_versions_content_id_idx ON public.ebook_versions(content_id);
ALTER TABLE public.ebook_versions ENABLE ROW LEVEL SECURITY;

-- Policies for ebook_versions
CREATE POLICY IF NOT EXISTS "Users can view own ebook_versions" 
ON public.ebook_versions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_versions.content_id
  AND creator_contents.user_id = auth.uid()
));

CREATE POLICY IF NOT EXISTS "Users can create ebook_versions" 
ON public.ebook_versions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_versions.content_id
  AND creator_contents.user_id = auth.uid()
));

CREATE POLICY IF NOT EXISTS "Users can update own ebook_versions" 
ON public.ebook_versions
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_versions.content_id
  AND creator_contents.user_id = auth.uid()
));

CREATE POLICY IF NOT EXISTS "Users can delete own ebook_versions" 
ON public.ebook_versions
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.creator_contents
  WHERE creator_contents.id = ebook_versions.content_id
  AND creator_contents.user_id = auth.uid()
));

-- 4. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ebook_chapters_updated_at ON public.ebook_chapters;
CREATE TRIGGER update_ebook_chapters_updated_at
  BEFORE UPDATE ON public.ebook_chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Fix RLS on creator_contents
-- Enable RLS on creator_contents
ALTER TABLE public.creator_contents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (ignoring errors)
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Users can view own creator_contents" ON public.creator_contents;
  EXCEPTION WHEN OTHERS THEN
    -- Do nothing
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can create creator_contents" ON public.creator_contents;
  EXCEPTION WHEN OTHERS THEN
    -- Do nothing
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can update own creator_contents" ON public.creator_contents;
  EXCEPTION WHEN OTHERS THEN
    -- Do nothing
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can delete own creator_contents" ON public.creator_contents;
  EXCEPTION WHEN OTHERS THEN
    -- Do nothing
  END;
END $$;

-- Create new policies
CREATE POLICY "Users can view own creator_contents" 
  ON public.creator_contents 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create creator_contents" 
  ON public.creator_contents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);
  
CREATE POLICY "Users can update own creator_contents" 
  ON public.creator_contents 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own creator_contents" 
  ON public.creator_contents 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.ebook_chapters TO authenticated;
GRANT ALL ON public.ebook_chapters TO service_role;
GRANT ALL ON public.ebook_versions TO authenticated;
GRANT ALL ON public.ebook_versions TO service_role;
GRANT ALL ON public.creator_contents TO authenticated;
GRANT ALL ON public.creator_contents TO service_role; 