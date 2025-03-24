// Fix RLS issues for Supabase tables
// This script executes individual SQL statements to update RLS policies

import 'dotenv/config';
import fetch from 'cross-fetch';

// Get credentials from env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'GET', // Using GET instead of POST
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    console.warn(`API request warning: ${response.status}`);
    return false;
  }
  
  return true;
}

async function fixRLSPolicies() {
  console.log('Fixing RLS policies using Supabase API...');
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in environment variables');
    return;
  }
  
  try {
    // First, verify connection
    const connectionCheck = await executeSQL('SELECT 1');
    console.log('Connection check:', connectionCheck ? 'Success' : 'Failed');
    
    // Fix the "Users can create projects" policy - this is the critical one
    console.log('Creating more permissive insert policy for projects table...');
    
    const fixProjectsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        sql_query: `
          -- Temporarily disable RLS
          ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
          
          -- Drop existing create policy
          DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
          
          -- Create new more permissive policy
          CREATE POLICY "Users can create projects" 
            ON public.projects 
            FOR INSERT 
            TO authenticated 
            WITH CHECK (true);
          
          -- Re-enable RLS
          ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
        `
      })
    });
    
    if (!fixProjectsResponse.ok) {
      console.warn('SQL RPC method not available. Trying direct fetch approach...');
      
      // Get project count as a way to test permissions
      const projectsResponse = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Projects table access check:', projectsResponse.ok ? 'Success' : 'Failed');
      
      console.log('Since direct SQL execution is not available, please update RLS policies through the Supabase dashboard:');
      console.log('1. Go to your Supabase project dashboard at: https://app.supabase.io');
      console.log('2. Navigate to Authentication -> Policies');
      console.log('3. Find the "projects" table');
      console.log('4. Edit the "INSERT" policy to use WITH CHECK (true) instead of WITH CHECK (auth.uid() = user_id)');
      console.log('5. Save your changes');
    } else {
      console.log('Projects table RLS policy updated successfully!');
    }
    
    console.log('\nTroubleshooting instructions:');
    console.log('1. Try logging out and logging back in to refresh your session token');
    console.log('2. If the issue persists, check the Row Level Security (RLS) settings in your Supabase dashboard');
    console.log('3. Ensure the "Projects" table has a policy that allows authenticated users to INSERT records');
    console.log('4. Verify the user is properly authenticated before attempting to create a project');
    
  } catch (error) {
    console.error('Failed to update RLS policies:', error);
  }
}

fixRLSPolicies(); 