-- Create creator_contents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.creator_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS creator_contents_user_id_idx ON public.creator_contents(user_id);
CREATE INDEX IF NOT EXISTS creator_contents_type_idx ON public.creator_contents(type);
CREATE INDEX IF NOT EXISTS creator_contents_status_idx ON public.creator_contents(status);

-- Add RLS policies to secure the table
ALTER TABLE public.creator_contents ENABLE ROW LEVEL SECURITY;

-- Policy for select: users can only view their own content
CREATE POLICY creator_contents_select_policy
  ON public.creator_contents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for insert: users can only insert their own content
CREATE POLICY creator_contents_insert_policy
  ON public.creator_contents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for update: users can only update their own content
CREATE POLICY creator_contents_update_policy
  ON public.creator_contents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for delete: users can only delete their own content
CREATE POLICY creator_contents_delete_policy
  ON public.creator_contents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a trigger to automatically update the updated_at field
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_creator_contents_updated_at ON public.creator_contents;
CREATE TRIGGER update_creator_contents_updated_at
  BEFORE UPDATE ON public.creator_contents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column(); 