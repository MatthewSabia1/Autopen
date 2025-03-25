-- Create creator_contents table for storing user-created content
CREATE TABLE IF NOT EXISTS creator_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB,
  version INTEGER DEFAULT 1,
  workflow_step TEXT,
  generation_progress INTEGER DEFAULT 0,
  ai_model_settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on creator_contents
ALTER TABLE creator_contents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write only their own content
CREATE POLICY "Users can CRUD their own creator_contents" ON creator_contents
  FOR ALL USING (auth.uid() = user_id);

-- Create ebook_versions table for tracking different versions of generated ebooks
CREATE TABLE IF NOT EXISTS ebook_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES creator_contents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  pdf_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on ebook_versions
ALTER TABLE ebook_versions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write only their own ebook versions
CREATE POLICY "Users can CRUD their own ebook_versions" ON ebook_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM creator_contents
      WHERE ebook_versions.content_id = creator_contents.id 
      AND creator_contents.user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at for creator_contents
CREATE TRIGGER update_creator_contents_updated_at
BEFORE UPDATE ON creator_contents
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();