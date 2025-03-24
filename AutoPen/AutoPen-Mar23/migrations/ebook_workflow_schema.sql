-- Migration for eBook Workflow Schema
-- This script adds the necessary database schema extensions for the eBook workflow

-- Extend creator_contents table with eBook-specific fields
ALTER TABLE public.creator_contents
ADD COLUMN IF NOT EXISTS workflow_step TEXT,
ADD COLUMN IF NOT EXISTS generation_progress JSONB DEFAULT '{"current_step": null, "total_steps": null, "steps_completed": []}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_model_settings JSONB DEFAULT '{}'::jsonb;

-- Create table for eBook chapters
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

-- Create table for eBook versions
CREATE TABLE IF NOT EXISTS public.ebook_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  content_id UUID REFERENCES public.creator_contents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add appropriate indexes
CREATE INDEX IF NOT EXISTS ebook_chapters_content_id_idx ON public.ebook_chapters(content_id);
CREATE INDEX IF NOT EXISTS ebook_versions_content_id_idx ON public.ebook_versions(content_id);

-- Add RLS policies for the new tables
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ebook_chapters
CREATE POLICY ebook_chapters_select_policy
  ON public.ebook_chapters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_chapters.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_chapters_insert_policy
  ON public.ebook_chapters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_chapters.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_chapters_update_policy
  ON public.ebook_chapters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_chapters.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_chapters_delete_policy
  ON public.ebook_chapters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_chapters.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

-- Create RLS policies for ebook_versions
CREATE POLICY ebook_versions_select_policy
  ON public.ebook_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_versions.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_versions_insert_policy
  ON public.ebook_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_versions.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_versions_update_policy
  ON public.ebook_versions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_versions.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

CREATE POLICY ebook_versions_delete_policy
  ON public.ebook_versions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_contents 
      WHERE creator_contents.id = ebook_versions.content_id
      AND creator_contents.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at column
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