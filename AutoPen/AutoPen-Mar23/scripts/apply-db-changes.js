// Script to apply database changes using the Supabase client
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Create a Supabase client with the service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration files to apply in order
const migrationFiles = [
  '../migrations/ebook_workflow_schema.sql',
  '../supabase/migrations/20250320_fix_missing_ebook_tables.sql',
  '../migrations/fix_creator_contents_rls.sql',
];

// Function to execute a SQL file
async function executeSqlFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    console.log(`Processing migration file: ${fullPath}`);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`Migration file not found: ${fullPath}`);
      return false;
    }
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(fullPath, 'utf8');

    // Split the SQL into individual statements
    // Improve SQL parsing to handle comments and complex statements
    const sqlStatements = sqlContent
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//gm, '') // Remove multi-line comments
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Found ${sqlStatements.length} SQL statements to execute in ${path.basename(filePath)}`);

    // Execute each SQL statement
    let successCount = 0;
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      
      try {
        const { error } = await supabase.rpc('pgexecute', { 
          query: statement 
        });
        
        if (error) {
          // If it's a "relation already exists" error, consider it a success
          if (error.message && (
            error.message.includes('already exists') || 
            error.message.includes('policy already exists')
          )) {
            console.log(`Statement ${i + 1} skipped: ${error.message}`);
            successCount++;
          } else {
            console.error(`Error executing statement ${i + 1}:`, error);
            console.warn('Statement:', statement);
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (statementError) {
        console.error(`Exception executing statement ${i + 1}:`, statementError);
      }
    }

    console.log(`Migration file ${path.basename(filePath)} completed. ${successCount}/${sqlStatements.length} statements succeeded.`);
    return true;
  } catch (error) {
    console.error(`Error processing migration file ${filePath}:`, error);
    return false;
  }
}

// Function to apply all migrations
async function applyAllMigrations() {
  console.log('Starting database migrations for eBook workflow...');
  
  // Apply each migration file in sequence
  for (const file of migrationFiles) {
    console.log(`\nApplying migration: ${file}`);
    const success = await executeSqlFile(file);
    
    if (!success) {
      console.warn(`Warning: Migration ${file} may not have applied correctly.`);
    }
  }
  
  console.log('\nAll database migrations completed.');
  console.log('If you encountered any errors, please review the logs above.');
}

// Execute all migrations
console.log('===== AUTOPEN EBOOK WORKFLOW DATABASE SETUP =====');
applyAllMigrations()
  .then(() => {
    console.log('Database migration process completed.');
  })
  .catch(error => {
    console.error('Fatal error during migration process:', error);
    process.exit(1);
  }); 