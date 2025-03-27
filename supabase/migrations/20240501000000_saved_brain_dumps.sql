-- Migration for saved brain dumps feature
-- Creates a table to store standalone brain dumps that users can save and reuse

-- Create saved brain dumps table
CREATE TABLE IF NOT EXISTS public.saved_brain_dumps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Untitled Brain Dump',
  description TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- Options: draft, analyzed, complete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB
);

-- Add RLS policies
ALTER TABLE public.saved_brain_dumps ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own brain dumps
CREATE POLICY "Users can view their own brain dumps" 
  ON public.saved_brain_dumps
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own brain dumps
CREATE POLICY "Users can insert their own brain dumps" 
  ON public.saved_brain_dumps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own brain dumps
CREATE POLICY "Users can update their own brain dumps" 
  ON public.saved_brain_dumps
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own brain dumps
CREATE POLICY "Users can delete their own brain dumps" 
  ON public.saved_brain_dumps
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS saved_brain_dumps_user_id_idx ON public.saved_brain_dumps(user_id);

-- Create an index on title for faster search
CREATE INDEX IF NOT EXISTS saved_brain_dumps_title_idx ON public.saved_brain_dumps(title);

-- Update trigger to automatically set the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.saved_brain_dumps;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.saved_brain_dumps
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 