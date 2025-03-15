import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Get Supabase credentials from .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to migration file
const migrationPath = resolve(__dirname, '../supabase/migrations/20250316000001_fix_rls_policies.sql');

async function applyMigration() {
  try {
    // Read the SQL file
    const sql = readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration to fix RLS policies...');
    
    // Split by semi-colons to execute each statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        // Execute SQL statement
        const { error } = await supabase.rpc('pgmoon.query', { query: statement });
        
        if (error) {
          console.error(`Error executing statement: ${error.message}`);
          console.error('Statement:', statement);
        }
      } catch (err) {
        console.error('Statement execution error:', err);
      }
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Failed to apply migration:', error);
  }
}

applyMigration().catch(console.error);