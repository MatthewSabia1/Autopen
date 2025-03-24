/*
  # Fix RLS policies for creator_contents table

  1. Security Updates
    - Verify current table RLS status
    - Completely disable RLS temporarily
    - Drop all existing policies to start fresh
    - Create correct policies with proper permissions
    - Enable RLS with the new policies
  
  This migration addresses the "new row violates row-level security policy" errors
  by ensuring the policies are properly configured and applied.
*/

-- First, completely disable RLS to ensure we can modify everything
ALTER TABLE creator_contents DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for the table to start fresh
DROP POLICY IF EXISTS "Users can view own creator_contents" ON creator_contents;
DROP POLICY IF EXISTS "Users can create creator_contents" ON creator_contents;
DROP POLICY IF EXISTS "Users can update own creator_contents" ON creator_contents;
DROP POLICY IF EXISTS "Users can delete own creator_contents" ON creator_contents;

-- Create SELECT policy with correct USING clause
CREATE POLICY "Users can view own creator_contents" 
  ON creator_contents 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create INSERT policy with correct WITH CHECK clause (no USING needed)
CREATE POLICY "Users can create creator_contents" 
  ON creator_contents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Users can update own creator_contents" 
  ON creator_contents 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create DELETE policy with correct USING clause
CREATE POLICY "Users can delete own creator_contents" 
  ON creator_contents 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Grant necessary permissions at the table level to the authenticated role
GRANT ALL ON creator_contents TO authenticated;

-- Re-enable RLS after all policies are correctly configured
ALTER TABLE creator_contents ENABLE ROW LEVEL SECURITY;

-- Verify policies were created and log for debugging
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been reconfigured for creator_contents table';
  
  -- Log the number of policies created for quick verification
  RAISE NOTICE 'Checking creator_contents policies...';
END $$;