# Database Migration Instructions

## Option 1: Using the Supabase Dashboard (Recommended)

1. Log into your Supabase dashboard at https://supabase.com/dashboard
2. Navigate to your project (Autopen)
3. Go to the SQL Editor tab
4. Create a new query
5. Copy and paste the contents of the `combined_migration.sql` file 
6. Run the query

## Option 2: Using the Supabase CLI

If you have the Supabase CLI configured and connected to your project, you can run:

```bash
# Navigate to project directory
cd /Users/matthewsabia/Autopen

# Execute the migration
npx supabase sql 'cat migrations/combined_migration.sql'
```

## Option 3: Using the Supabase REST API

For a programmatic approach, you can execute SQL via the Supabase REST API:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load SQL file
const sqlContent = fs.readFileSync(path.join(__dirname, 'combined_migration.sql'), 'utf8');

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Execute the SQL
const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
```

## Verification Steps

After running the migration, verify the following:

1. The `creator_contents` table has the following new columns:
   - `workflow_step` (TEXT)
   - `generation_progress` (JSONB)
   - `ai_model_settings` (JSONB)

2. Two new tables exist:
   - `ebook_chapters`
   - `ebook_versions`

3. Check that the Row Level Security (RLS) policies are properly set up:
   - For `creator_contents`, verify that the INSERT policy allows authenticated users to create new content
   - For `ebook_chapters` and `ebook_versions`, verify that the policies only allow access to users who own the related content

## Troubleshooting

If you encounter any issues:

1. Check if the tables already exist before trying to create them
2. Look for error messages in the SQL editor output
3. Check the RLS policies if you're experiencing permission issues
4. If needed, run specific portions of the migration script separately

For specific sections of the migration, refer to the original SQL files:
- `ebook_workflow_schema.sql`
- `20250320_fix_missing_ebook_tables.sql`
- `fix_creator_contents_rls.sql`