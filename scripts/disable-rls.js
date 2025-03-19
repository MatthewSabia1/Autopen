// Disable RLS for project_folders table
// Run this script with: node scripts/disable-rls.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL to disable RLS directly
const sqlDisableRLS = `
-- Disable RLS on project_folders table
ALTER TABLE public.project_folders DISABLE ROW LEVEL SECURITY;
-- Disable RLS on folder_projects table
ALTER TABLE public.folder_projects DISABLE ROW LEVEL SECURITY;
`;

const disableRLS = async () => {
  try {
    console.log('Attempting to disable RLS on tables...');
    
    // First try using the rpc function if it exists
    try {
      console.log('Trying RPC method...');
      const { data: disableFoldersRLS, error: disableFoldersError } = await supabase
        .rpc('disable_rls_on_table', { table_name: 'project_folders' });
      
      if (disableFoldersError) {
        console.error('Error disabling RLS on project_folders via RPC:', disableFoldersError);
      } else {
        console.log('Successfully disabled RLS on project_folders table via RPC');
      }

      const { data: disableFolderProjectsRLS, error: disableFolderProjectsError } = await supabase
        .rpc('disable_rls_on_table', { table_name: 'folder_projects' });
      
      if (disableFolderProjectsError) {
        console.error('Error disabling RLS on folder_projects via RPC:', disableFolderProjectsError);
      } else {
        console.log('Successfully disabled RLS on folder_projects table via RPC');
      }
    } catch (rpcError) {
      console.log('RPC method failed, falling back to direct SQL...');
    }

    // Fallback to direct SQL execution
    console.log('Executing direct SQL to disable RLS...');
    const { error: sqlError } = await supabase.sql(sqlDisableRLS);
    
    if (sqlError) {
      console.error('Error executing SQL to disable RLS:', sqlError);
    } else {
      console.log('Successfully executed SQL to disable RLS');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

disableRLS()
  .then(() => console.log('RLS disable operation complete'))
  .catch(err => console.error('Failed to execute RLS disable operation:', err)); 