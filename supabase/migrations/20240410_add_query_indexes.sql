-- Migration to add database indexes for improved query performance
-- This will significantly speed up the most common queries

-- Add indexes to creator_contents table for common query patterns
CREATE INDEX IF NOT EXISTS creator_contents_user_id_idx ON creator_contents (user_id);
CREATE INDEX IF NOT EXISTS creator_contents_updated_at_idx ON creator_contents (updated_at DESC);
CREATE INDEX IF NOT EXISTS creator_contents_type_idx ON creator_contents (type);
CREATE INDEX IF NOT EXISTS creator_contents_status_idx ON creator_contents (status);
CREATE INDEX IF NOT EXISTS creator_contents_user_id_updated_at_idx ON creator_contents (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS creator_contents_user_id_status_idx ON creator_contents (user_id, status);

-- Add indexes to projects table for common query patterns
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects (user_id);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects (updated_at DESC);
CREATE INDEX IF NOT EXISTS projects_user_id_updated_at_idx ON projects (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);
CREATE INDEX IF NOT EXISTS projects_user_id_status_idx ON projects (user_id, status);

-- Add a partial index for common filtered queries (only products with draft status)
CREATE INDEX IF NOT EXISTS creator_contents_user_id_draft_idx ON creator_contents (user_id) 
WHERE status = 'draft';

-- Add a partial index for completed products
CREATE INDEX IF NOT EXISTS creator_contents_user_id_completed_idx ON creator_contents (user_id) 
WHERE status = 'completed' OR status = 'published';

-- Add BRIN index for timestamp range queries (more efficient for large tables)
CREATE INDEX IF NOT EXISTS creator_contents_created_at_brin_idx ON creator_contents USING BRIN (created_at);
CREATE INDEX IF NOT EXISTS creator_contents_updated_at_brin_idx ON creator_contents USING BRIN (updated_at);

-- Optimize the project content relationship queries
CREATE INDEX IF NOT EXISTS creator_contents_project_id_idx ON creator_contents (project_id);

-- Add comment explaining the purpose of these indexes
COMMENT ON INDEX creator_contents_user_id_idx IS 'Speeds up queries filtering by user_id';
COMMENT ON INDEX creator_contents_updated_at_idx IS 'Speeds up sorting by updated_at';
COMMENT ON INDEX creator_contents_user_id_updated_at_idx IS 'Speeds up common query pattern: filter by user + sort by date';
COMMENT ON INDEX creator_contents_user_id_draft_idx IS 'Speeds up queries for draft products by user';
COMMENT ON INDEX creator_contents_user_id_completed_idx IS 'Speeds up queries for completed products by user'; 