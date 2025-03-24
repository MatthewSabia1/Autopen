-- Migration for Brain Dumps Schema
-- Creates and configures the table for storing user brain dumps

-- Create brain_dumps table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.brain_dumps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL
);

-- Add appropriate indexes
CREATE INDEX IF NOT EXISTS brain_dumps_user_id_idx ON public.brain_dumps(user_id);
CREATE INDEX IF NOT EXISTS brain_dumps_project_id_idx ON public.brain_dumps(project_id);

-- Add auto-update for updated_at column
DROP TRIGGER IF EXISTS update_brain_dumps_updated_at ON public.brain_dumps;
CREATE TRIGGER update_brain_dumps_updated_at
  BEFORE UPDATE ON public.brain_dumps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.brain_dumps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brain_dumps
CREATE POLICY brain_dumps_select_policy
  ON public.brain_dumps
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY brain_dumps_insert_policy
  ON public.brain_dumps
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY brain_dumps_update_policy
  ON public.brain_dumps
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY brain_dumps_delete_policy
  ON public.brain_dumps
  FOR DELETE
  USING (user_id = auth.uid());