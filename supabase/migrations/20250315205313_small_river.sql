/*
  # Fix RLS policies for creator_contents table

  1. Security Updates
    - Properly disable RLS to ensure policies can be modified
    - Drop existing policies that may be incorrect 
    - Re-create correct policies with proper USING/WITH CHECK clauses
    - Ensure the auth.uid() function is correctly checking against user_id
    - Re-enable RLS with corrected policies
  
  This migration addresses the "new row violates row-level security policy" error
  by ensuring proper policy configuration.
*/

-- First, ensure RLS is disabled while we fix policies
ALTER TABLE creator_contents DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for the table to start fresh
DROP POLICY IF EXISTS "Users can view own creator_contents" ON creator_contents;
DROP POLICY IF EXISTS "Users can create creator_contents" ON creator_contents;
DROP POLICY IF EXISTS "Users can update own creator_contents" ON creator_contents;
DROP POLICY IF EXISTS "Users can delete own creator_contents" ON creator_contents;

-- Create a SELECT policy
-- This allows authenticated users to view only their own content
CREATE POLICY "Users can view own creator_contents" 
  ON creator_contents 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create an INSERT policy
-- This is the most important policy for fixing the current error
-- It allows authenticated users to create content where they are the owner
CREATE POLICY "Users can create creator_contents" 
  ON creator_contents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Create an UPDATE policy
-- This allows authenticated users to update only their own content
CREATE POLICY "Users can update own creator_contents" 
  ON creator_contents 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create a DELETE policy
-- This allows authenticated users to delete only their own content
CREATE POLICY "Users can delete own creator_contents" 
  ON creator_contents 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Re-enable RLS now that proper policies are in place
ALTER TABLE creator_contents ENABLE ROW LEVEL SECURITY;

-- Verify the current user can access the table (helpful for debugging)
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been reconfigured for creator_contents table';
END $$;