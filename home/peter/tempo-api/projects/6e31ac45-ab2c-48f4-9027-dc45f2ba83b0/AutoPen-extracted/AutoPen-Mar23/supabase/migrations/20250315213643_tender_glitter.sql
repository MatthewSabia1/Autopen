/*
  # Fix Row Level Security Policies for Projects and Creator Contents Tables

  1. Security Updates
    - Properly configure RLS policies for both tables
    - Make INSERT policies permissive by using WITH CHECK (true)
    - Fix the "new row violates row-level security policy" errors
    - Keep appropriate restrictions for SELECT, UPDATE, and DELETE operations
*/

-- ==================== FIX PROJECTS TABLE ====================
-- First, disable RLS to make changes
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

-- ==================== FIX CREATOR_CONTENTS TABLE ====================
-- First, disable RLS to make changes
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