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

// Main execution function
async function main() {
  console.log('Checking database schema and applying fixes...');
  
  try {
    // Simple SQL for adding the metadata column
    const migrationSQL = `
      -- Add metadata column to projects table if it doesn't exist
      ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS metadata JSONB;
    `;
    console.log('Executing SQL to add metadata column...');
    
    // Execute the raw SQL directly 
    const { error } = await supabase.rpc('pgSQL', { query: migrationSQL })
      .catch(() => ({ error: { message: 'RPC method not available' }}));
    
    if (error) {
      console.warn('Could not execute using RPC, trying direct database access:', error.message);
      console.log('Please run this SQL in your Supabase dashboard SQL editor:');
      console.log('-----------------------------------------------------------');
      console.log(migrationSQL);
      console.log('-----------------------------------------------------------');
    } else {
      console.log('Successfully executed SQL to add metadata column');
    }
    
    // Verify the column was added by simply querying for it
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
