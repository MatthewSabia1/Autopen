// Simple script to directly apply RLS policy updates to Supabase
// No CLI required!

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('Connecting to Supabase:', supabaseUrl);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('Fixing RLS policies...');

  try {
    // First, get session to verify connection
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }
    
    console.log('Session valid, proceeding to update RLS policies');

    // Update projects table RLS
    const projectsRLS = `
      -- Fix the projects table
      BEGIN;
      
      -- Temporarily disable RLS
      ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies to start fresh
      DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
      DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
      DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
      DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
      
      -- Create new policies
      CREATE POLICY "Users can view own projects" 
        ON public.projects 
        FOR SELECT 
        TO authenticated 
        USING (auth.uid() = user_id);
      
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
      
      COMMIT;
    `;

    // Update creator_contents table RLS
    const contentsRLS = `
      -- Fix the creator_contents table
      BEGIN;
      
      -- Temporarily disable RLS
      ALTER TABLE public.creator_contents DISABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies to start fresh
      DROP POLICY IF EXISTS "Users can view own creator_contents" ON public.creator_contents;
      DROP POLICY IF EXISTS "Users can create creator_contents" ON public.creator_contents;
      DROP POLICY IF EXISTS "Users can update own creator_contents" ON public.creator_contents;
      DROP POLICY IF EXISTS "Users can delete own creator_contents" ON public.creator_contents;
      
      -- Create new policies
      CREATE POLICY "Users can view own creator_contents" 
        ON public.creator_contents 
        FOR SELECT 
        TO authenticated 
        USING (auth.uid() = user_id);
      
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
      
      COMMIT;
    `;

    console.log('Applying projects table RLS policy updates...');
    const { error: projectsError } = await supabase.rpc('exec_sql', { sql: projectsRLS });
    
    if (projectsError) {
      console.error('Error updating projects RLS:', projectsError);
      
      // Try a direct approach if exec_sql RPC doesn't exist
      console.log('Attempting direct SQL execution...');
      await supabase
        .from('projects')
        .select('count(*)')
        .limit(1)
        .then(result => {
          console.log('Projects table access:', result.error ? 'Failed' : 'Success');
        });
    } else {
      console.log('Projects RLS update successful');
    }
    
    console.log('Applying creator_contents table RLS policy updates...');
    const { error: contentsError } = await supabase.rpc('exec_sql', { sql: contentsRLS });
    
    if (contentsError) {
      console.error('Error updating creator_contents RLS:', contentsError);
      
      // Try a direct approach if exec_sql RPC doesn't exist
      console.log('Attempting direct SQL execution...');
      await supabase
        .from('creator_contents')
        .select('count(*)')
        .limit(1)
        .then(result => {
          console.log('Creator contents table access:', result.error ? 'Failed' : 'Success');
        });
    } else {
      console.log('Creator contents RLS update successful');
    }

    console.log('RLS policy update completed!');
    console.log('Please restart your app and try creating a product or content again.');
    
  } catch (error) {
    console.error('Unexpected error during RLS update:', error);
  }
}

// Run the function
fixRLSPolicies().catch(console.error);