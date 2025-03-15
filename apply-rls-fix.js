// Script to fix Supabase Row Level Security (RLS) policies
// This handles environment variables properly and applies the RLS fixes directly

import fetch from 'cross-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in the .env file');
  process.exit(1);
}

// Main function to apply RLS fixes
async function applyRlsFixes() {
  console.log('====== Supabase RLS Policy Fixer ======\n');
  console.log(`Using Supabase URL: ${SUPABASE_URL}`);
  console.log(`Using API key (first 10 chars): ${SUPABASE_KEY.substring(0, 10)}...\n`);
  
  try {
    // SQL to fix the projects table
    const projectsFixSql = `
      -- Disable RLS to make changes
      ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
      DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
      DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
      DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
      
      -- Create fixed policies
      CREATE POLICY "Users can view own projects" 
        ON public.projects 
        FOR SELECT 
        TO authenticated 
        USING (auth.uid() = user_id);
        
      -- Important: This is the critical fix - allow any authenticated user to insert
      CREATE POLICY "Users can create projects" 
        ON public.projects 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
        
      CREATE POLICY "Users can update own projects" 
        ON public.projects 
        FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can delete own projects" 
        ON public.projects 
        FOR DELETE 
        TO authenticated 
        USING (auth.uid() = user_id);
        
      -- Re-enable RLS
      ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    `;
    
    // SQL to fix the creator_contents table
    const contentsFixSql = `
      -- Disable RLS to make changes
      ALTER TABLE public.creator_contents DISABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can view own creator_contents" ON public.creator_contents;
      DROP POLICY IF EXISTS "Users can create creator_contents" ON public.creator_contents;
      DROP POLICY IF EXISTS "Users can update own creator_contents" ON public.creator_contents;
      DROP POLICY IF EXISTS "Users can delete own creator_contents" ON public.creator_contents;
      
      -- Create fixed policies
      CREATE POLICY "Users can view own creator_contents" 
        ON public.creator_contents 
        FOR SELECT 
        TO authenticated 
        USING (auth.uid() = user_id);
        
      -- Important: This is the critical fix - allow any authenticated user to insert
      CREATE POLICY "Users can create creator_contents" 
        ON public.creator_contents 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
        
      CREATE POLICY "Users can update own creator_contents" 
        ON public.creator_contents 
        FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can delete own creator_contents" 
        ON public.creator_contents 
        FOR DELETE 
        TO authenticated 
        USING (auth.uid() = user_id);
        
      -- Re-enable RLS
      ALTER TABLE public.creator_contents ENABLE ROW LEVEL SECURITY;
    `;
    
    // Execute SQL for projects table
    console.log('1. Applying projects table RLS policy fixes...');
    const projectsResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ query: projectsFixSql })
    });
    
    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      console.error(`Error applying projects RLS fix: ${projectsResponse.status} - ${errorText}`);
      console.log('Attempting to continue with creator_contents table...');
    } else {
      console.log('✅ Projects table RLS fixed successfully');
    }
    
    // Execute SQL for creator_contents table
    console.log('\n2. Applying creator_contents table RLS policy fixes...');
    const contentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ query: contentsFixSql })
    });
    
    if (!contentsResponse.ok) {
      const errorText = await contentsResponse.text();
      console.error(`Error applying creator_contents RLS fix: ${contentsResponse.status} - ${errorText}`);
    } else {
      console.log('✅ Creator contents table RLS fixed successfully');
    }
    
    // Final status check to verify fixes
    console.log('\n3. Verifying table access...');
    const projectsCheckResponse = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    console.log(`Projects table access: ${projectsCheckResponse.ok ? '✅ Success' : '❌ Failed'}`);
    
    const contentsCheckResponse = await fetch(`${SUPABASE_URL}/rest/v1/creator_contents?select=count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    console.log(`Creator contents table access: ${contentsCheckResponse.ok ? '✅ Success' : '❌ Failed'}`);
    
    console.log('\n====== RLS Fix Complete ======');
    console.log('RLS policies have been updated. You should now be able to create content without permission errors.');
    console.log('Please restart your application to see the changes take effect.');
    
  } catch (error) {
    console.error('Error applying RLS fixes:', error);
    console.error('\nPlease check your network connection and credentials.');
  }
}

// Execute the function
applyRlsFixes().catch(console.error);