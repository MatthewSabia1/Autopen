-- Migration to fix RLS policies for creator_contents table

-- First, disable RLS to ensure we can modify everything
ALTER TABLE public.creator_contents DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for creator_contents to start fresh
DROP POLICY IF EXISTS "Users can view own creator_contents" ON public.creator_contents;
DROP POLICY IF EXISTS "Users can create creator_contents" ON public.creator_contents;
DROP POLICY IF EXISTS "Users can update own creator_contents" ON public.creator_contents;
DROP POLICY IF EXISTS "Users can delete own creator_contents" ON public.creator_contents;
DROP POLICY IF EXISTS "Anyone can create creator_contents temporarily" ON public.creator_contents;
DROP POLICY IF EXISTS creator_contents_select_policy ON public.creator_contents;
DROP POLICY IF EXISTS creator_contents_insert_policy ON public.creator_contents;
DROP POLICY IF EXISTS creator_contents_update_policy ON public.creator_contents;
DROP POLICY IF EXISTS creator_contents_delete_policy ON public.creator_contents;

-- Grant necessary permissions explicitly
GRANT ALL ON public.creator_contents TO authenticated;
GRANT ALL ON public.creator_contents TO service_role;

-- Create proper policies
-- 1. SELECT policy - users can only see their own content
CREATE POLICY "Users can view own creator_contents" 
  ON public.creator_contents 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 2. INSERT policy - CRITICAL FIX: Allow any authenticated user to insert with true check
-- This is the key policy that was causing the 401 error
CREATE POLICY "Users can create creator_contents" 
  ON public.creator_contents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 3. UPDATE policy - users can only update their own content
CREATE POLICY "Users can update own creator_contents" 
  ON public.creator_contents 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. DELETE policy - users can only delete their own content
CREATE POLICY "Users can delete own creator_contents" 
  ON public.creator_contents 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Re-enable RLS with the corrected policies
ALTER TABLE public.creator_contents ENABLE ROW LEVEL SECURITY; 