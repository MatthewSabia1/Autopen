/*
  # Fix RLS policies for creator_contents table

  1. Security Updates
    - Temporarily disable RLS to ensure policies can be modified
    - Drop existing policies that may be incorrect
    - Re-create correct policies with proper USING/WITH CHECK clauses
    - Re-enable RLS with corrected policies
*/

-- Temporarily disable RLS on the table to modify policies
ALTER TABLE creator_contents DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that may be causing the issue
DROP POLICY IF EXISTS "Users can view own creator_contents" ON creator_contents;
DROP POLICY IF EXISTS "Users can create creator_contents" ON creator_contents;
DROP POLICY IF EXISTS "Users can update own creator_contents" ON creator_contents;
DROP POLICY IF EXISTS "Users can delete own creator_contents" ON creator_contents;

-- Re-create policies with correct syntax and permissions
-- Select policy
CREATE POLICY "Users can view own creator_contents" 
  ON creator_contents 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Insert policy - USING clause is not needed for INSERT policies, only WITH CHECK
CREATE POLICY "Users can create creator_contents" 
  ON creator_contents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Update policy
CREATE POLICY "Users can update own creator_contents" 
  ON creator_contents 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Delete policy
CREATE POLICY "Users can delete own creator_contents" 
  ON creator_contents 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Re-enable RLS with corrected policies
ALTER TABLE creator_contents ENABLE ROW LEVEL SECURITY;