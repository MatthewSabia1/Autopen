-- Add metadata column to projects table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE projects ADD COLUMN metadata JSONB;
    END IF;
END $$;
