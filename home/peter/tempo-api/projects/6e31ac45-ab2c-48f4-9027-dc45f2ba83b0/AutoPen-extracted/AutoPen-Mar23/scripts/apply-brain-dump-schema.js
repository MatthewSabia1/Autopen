/**
 * Script to apply the Brain Dump schema migration to a Supabase database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Main function to apply the brain dump schema
 */
async function applyBrainDumpSchema() {
  try {
    console.log('Starting brain dump schema migration...');

    // Try multiple possible paths to find the SQL file
    let filePath;
    const possiblePaths = [
      path.join(__dirname, '..', 'migrations', 'brain_dumps_schema.sql'),
      path.join(__dirname, '..', 'supabase', 'migrations', '20250321_brain_dumps_schema.sql')
    ];
    
    for (const potentialPath of possiblePaths) {
      if (fs.existsSync(potentialPath)) {
        filePath = potentialPath;
        break;
      }
    }
    
    if (!filePath) {
      throw new Error('Could not find brain_dumps_schema.sql in any of the expected locations');
    }
    
    console.log(`Reading SQL migration from: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Execute the SQL with direct query
    console.log('Executing SQL migration...');
    const { error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }

    console.log('Brain dump schema migration applied successfully!');
  } catch (error) {
    console.error('Error in migration process:', error);
    process.exit(1);
  }
}

// Execute the function if called directly
if (require.main === module) {
  applyBrainDumpSchema()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { applyBrainDumpSchema };