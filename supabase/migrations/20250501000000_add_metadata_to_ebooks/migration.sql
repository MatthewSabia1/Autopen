-- Add metadata column to ebooks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ebooks' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE ebooks ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$; 