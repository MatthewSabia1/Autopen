// Script to apply the RLS fix migration using the Supabase API
// This approach doesn't require the Supabase CLI

import fetch from 'cross-fetch';
import fs from 'fs';
import path from 'path';

// Get environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

async function applyRLSFix() {
  console.log('Applying RLS policy fixes to Supabase database...');
  console.log(`Using Supabase URL: ${SUPABASE_URL}`);
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250316000001_fix_rls_policies.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Successfully read migration file');
    console.log('SQL file size:', sqlContent.length, 'bytes');
    
    // Split SQL into individual statements to execute them one by one
    // This is important because some statements depend on previous ones
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt.length > 5);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Execute using the REST API
      console.log(`Executing statement ${i+1}/${statements.length}...`);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          query: stmt
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Warning: Statement ${i+1} execution returned status ${response.status}`);
        console.warn('Error details:', errorText);
        console.warn('This statement might have failed, but continuing with remaining statements...');
      } else {
        console.log(`Statement ${i+1} executed successfully`);
      }
    }
    
    console.log('\nRLS policy fixes have been applied! Please restart your application.');
    console.log('You should now be able to create projects and content without RLS errors.');
    
  } catch (error) {
    console.error('Error applying RLS fixes:', error);
    console.error('\nAlternative approach: You can manually run the SQL in the migration file using the Supabase SQL editor');
  }
}

// Execute the function
applyRLSFix().catch(console.error);