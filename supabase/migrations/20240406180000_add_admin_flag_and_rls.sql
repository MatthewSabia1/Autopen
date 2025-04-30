-- Migration: Add admin flag and update RLS policies for profiles (Idempotent Column Add)

-- 1. Add the is_admin column to the profiles table IF IT DOES NOT EXIST
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
END $$;

-- Helper function to check if the current user is an admin
-- SECURITY DEFINER allows the function to bypass RLS for the internal check
CREATE OR REPLACE FUNCTION public.is_claims_admin()
RETURNS boolean
LANGUAGE sql
STABLE -- Function returns same result for same inputs within a transaction
SECURITY DEFINER -- Execute with function owner's privileges (bypass RLS for this check)
-- Set search_path to prevent hijacking: https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY
SET search_path = public 
AS $$
  SELECT coalesce(is_admin, false) -- Use coalesce to handle NULLs gracefully
  FROM public.profiles
  WHERE user_id = auth.uid()
$$;

-- Grant execute permission to authenticated users so RLS can call it
GRANT EXECUTE ON FUNCTION public.is_claims_admin() TO authenticated;


-- Pause replication on the table if using logical replication, if applicable
-- ALTER TABLE public.profiles DISABLE TRIGGER USER;

-- 2. Remove the insecure public read policy
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;

-- 3. Allow users to read their OWN profile
-- This replaces the old public read policy
-- Ensure policy doesn't already exist with the same name before creating
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated -- Changed from 'public' to 'authenticated'
USING (auth.uid() = user_id);

-- 4. Allow admins to read ANY profile (USING HELPER FUNCTION)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles; -- Drop old policy if exists
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_claims_admin() = TRUE); -- Use the helper function

-- 5. Keep the user's own update policy (already exists)
-- POLICY "Allow users to update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
-- Ensure the policy exists before attempting to alter it or handle appropriately
-- For simplicity, we assume it exists based on user's initial schema dump.

-- Add a policy allowing admins to update ANY profile (USING HELPER FUNCTION)
-- WARNING: As written, this allows admins to update *any* field on any profile.
-- Consider more granular control if needed (e.g., specific function for setting admin status).
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles; -- Drop old policy if exists
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_claims_admin() = TRUE) -- Use the helper function
WITH CHECK (public.is_claims_admin() = TRUE); -- Use the helper function


-- 6. Modify the insert policy to prevent users setting themselves as admin on signup/profile creation
-- Assuming "Allow users to insert their own profile" exists, alter it
-- If it might not exist, use CREATE OR REPLACE POLICY or handle appropriately
-- For safety, drop and recreate if altering might fail due to non-existence
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id AND is_admin = FALSE);


-- Re-enable replication triggers if they were disabled
-- ALTER TABLE public.profiles ENABLE TRIGGER USER; 