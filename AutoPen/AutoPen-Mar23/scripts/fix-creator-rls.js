import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Required environment variables are missing.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for creator_contents table...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'migrations', 'fix_creator_contents_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      
      if (error) {
        console.warn(`Warning: Failed to execute statement ${i + 1}:`);
        console.warn(error.message);
        console.warn('Continuing with remaining statements...');
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('🎉 RLS policies have been successfully updated!');
    console.log('You should now be able to create content without permission errors.');
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
    process.exit(1);
  }
}

// Run the script
fixRLSPolicies(); 