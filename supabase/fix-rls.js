// Direct SQL execution to fix RLS issues
// This script uses the SQL HTTP API directly to update RLS policies

import fetch from 'cross-fetch';

// Get credentials from env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function fixRLSPolicies() {
  console.log('Fixing RLS policies using direct SQL via REST API...');
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in environment variables');
    return;
  }
  
  try {
    // SQL statements to fix RLS policies
    const sql = `
    -- Projects table
    ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
    CREATE POLICY "Users can create projects" 
      ON public.projects 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    
    -- Creator contents table
    ALTER TABLE public.creator_contents DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can create creator_contents" ON public.creator_contents;
    CREATE POLICY "Users can create creator_contents" 
      ON public.creator_contents 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
    ALTER TABLE public.creator_contents ENABLE ROW LEVEL SECURITY;
    `;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    console.log('RLS policies updated successfully!');
    console.log('You can now create products and content without RLS errors.');
  } catch (error) {
    console.error('Failed to update RLS policies:', error);
  }
}

fixRLSPolicies();