const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check required env vars
if (\!process.env.SUPABASE_URL || \!process.env.SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.');
  console.error('These are required to connect to your Supabase instance.');
  process.exit(1);
}

// Create Supabase client with service key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Path to migration file
const migrationPath = path.join(
  __dirname, 
  '../supabase/migrations/20250325151918_add_metadata_to_projects/migration.sql'
);

// Main execution function
async function main() {
  console.log('Checking database schema and applying fixes...');
  
  try {
    // Read migration file
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('Loaded migration SQL file');
    
    // Execute the SQL directly using rpc
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If there's a function call error, try alternative approach
      console.warn('Could not execute using rpc, trying direct query:', error.message);
      
      // Use raw query as a fallback
      const { error: queryError } = await supabase.from('_exec_sql').select('*').eq('sql', migrationSQL);
      
      if (queryError) {
        console.error('Error executing SQL migration:', queryError);
        
        // One more fallback - try individually checking for column
        console.log('Checking if metadata column exists in projects table...');
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'projects');
        
        if (columnsError) {
          console.error('Error querying schema information:', columnsError);
          throw columnsError;
        }
        
        const hasMetadata = columns && columns.some(col => col.column_name === 'metadata');
        if (hasMetadata) {
          console.log('Metadata column already exists in projects table. No action needed.');
        } else {
          console.error('Could not verify column existence or add it automatically.');
          console.error('Please add the metadata column manually using the Supabase dashboard SQL editor:');
          console.error('ALTER TABLE projects ADD COLUMN metadata JSONB;');
        }
      } else {
        console.log('Successfully executed SQL to add metadata column');
      }
    } else {
      console.log('Successfully executed SQL to add metadata column');
    }
    
    // Verify the column was added
    console.log('Verifying metadata column was added to projects table...');
    const { data, error: verifyError } = await supabase
      .from('projects')
      .select('metadata')
      .limit(1);
    
    if (verifyError) {
      if (verifyError.code === '42703') {
        console.error('Verification failed: metadata column was not added correctly');
        console.error('Please add it manually using the Supabase dashboard SQL editor:');
        console.error('ALTER TABLE projects ADD COLUMN metadata JSONB;');
      } else {
        console.error('Error during verification:', verifyError);
      }
    } else {
      console.log('✅ Verification successful\! The metadata column is now available in the projects table.');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('Database schema check completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to complete database schema check:', err);
    process.exit(1);
  });
