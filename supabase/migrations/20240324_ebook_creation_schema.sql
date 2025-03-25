-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write only their own projects
CREATE POLICY "Users can CRUD their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Create brain_dumps table
CREATE TABLE IF NOT EXISTS brain_dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  raw_content TEXT,
  analyzed_content JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on brain_dumps
ALTER TABLE brain_dumps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write only their own brain_dumps
CREATE POLICY "Users can CRUD their own brain_dumps" ON brain_dumps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = brain_dumps.project_id AND projects.user_id = auth.uid()
    )
  );

-- Create brain_dump_files table
CREATE TABLE IF NOT EXISTS brain_dump_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_dump_id UUID NOT NULL REFERENCES brain_dumps(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on brain_dump_files
ALTER TABLE brain_dump_files ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write only their own brain_dump_files
CREATE POLICY "Users can CRUD their own brain_dump_files" ON brain_dump_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brain_dumps
      JOIN projects ON brain_dumps.project_id = projects.id
      WHERE brain_dump_files.brain_dump_id = brain_dumps.id AND projects.user_id = auth.uid()
    )
  );

-- Create brain_dump_links table
CREATE TABLE IF NOT EXISTS brain_dump_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_dump_id UUID NOT NULL REFERENCES brain_dumps(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  link_type TEXT NOT NULL,
  transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on brain_dump_links
ALTER TABLE brain_dump_links ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write only their own brain_dump_links
CREATE POLICY "Users can CRUD their own brain_dump_links" ON brain_dump_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brain_dumps
      JOIN projects ON brain_dumps.project_id = projects.id
      WHERE brain_dump_links.brain_dump_id = brain_dumps.id AND projects.user_id = auth.uid()
    )
  );

-- Create ebook_ideas table
CREATE TABLE IF NOT EXISTS ebook_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_dump_id UUID NOT NULL REFERENCES brain_dumps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on ebook_ideas
ALTER TABLE ebook_ideas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write only their own ebook_ideas
CREATE POLICY "Users can CRUD their own ebook_ideas" ON ebook_ideas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brain_dumps
      JOIN projects ON brain_dumps.project_id = projects.id
      WHERE ebook_ideas.brain_dump_id = brain_dumps.id AND projects.user_id = auth.uid()
    )
  );

-- Create ebooks table
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'generating',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on ebooks
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write only their own ebooks
CREATE POLICY "Users can CRUD their own ebooks" ON ebooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE ebooks.project_id = projects.id AND projects.user_id = auth.uid()
    )
  );

-- Create ebook_chapters table
CREATE TABLE IF NOT EXISTS ebook_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on ebook_chapters
ALTER TABLE ebook_chapters ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write only their own ebook_chapters
CREATE POLICY "Users can CRUD their own ebook_chapters" ON ebook_chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ebooks
      JOIN projects ON ebooks.project_id = projects.id
      WHERE ebook_chapters.ebook_id = ebooks.id AND projects.user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables with updated_at column
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_brain_dumps_updated_at
BEFORE UPDATE ON brain_dumps
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ebooks_updated_at
BEFORE UPDATE ON ebooks
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ebook_chapters_updated_at
BEFORE UPDATE ON ebook_chapters
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 