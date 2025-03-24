-- COMPREHENSIVE FIX FOR CREATOR_CONTENTS PERMISSIONS
-- This script performs a complete reset of RLS policies
-- and implements proper permissions for the creator_contents table

-- STEP 1: Reset and verify the table structure
ALTER TABLE IF EXISTS public.creator_contents 
    ADD COLUMN IF NOT EXISTS workflow_progress JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS workflow_step TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS versions JSONB DEFAULT '[]'::jsonb;

-- STEP 2: Temporarily disable RLS completely 
ALTER TABLE public.creator_contents DISABLE ROW LEVEL SECURITY;

-- STEP 3: Drop ALL existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN (
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'creator_contents'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.creator_contents';
    END LOOP;
END
$$;

-- STEP 4: Grant full permissions to authenticated users and service role
GRANT ALL ON public.creator_contents TO authenticated;
GRANT ALL ON public.creator_contents TO service_role;
GRANT ALL ON public.creator_contents TO anon;

-- STEP 5: Create an extremely permissive INSERT policy
-- This policy allows ANY authenticated user to insert content
CREATE POLICY "creator_contents_insert_policy"
ON public.creator_contents
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (true);

-- STEP 6: Create a properly restrictive SELECT policy
CREATE POLICY "creator_contents_select_policy"
ON public.creator_contents
FOR SELECT
TO authenticated, anon, service_role
USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
);

-- STEP 7: Create a properly restrictive UPDATE policy
CREATE POLICY "creator_contents_update_policy"
ON public.creator_contents
FOR UPDATE
TO authenticated, service_role
USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
);

-- STEP 8: Create a properly restrictive DELETE policy
CREATE POLICY "creator_contents_delete_policy"
ON public.creator_contents
FOR DELETE
TO authenticated, service_role
USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
);

-- STEP 9: Create a debugging function to check auth status
CREATE OR REPLACE FUNCTION public.debug_auth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'uid', auth.uid(),
    'role', auth.role(),
    'email', current_setting('request.jwt.claims', true)::jsonb->'email',
    'app_metadata', current_setting('request.jwt.claims', true)::jsonb->'app_metadata',
    'user_metadata', current_setting('request.jwt.claims', true)::jsonb->'user_metadata',
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;

-- STEP 10: Create a better insert procedure that handles RLS issues
CREATE OR REPLACE FUNCTION public.insert_creator_content(content_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
    result JSONB;
    auth_id UUID;
    debug_info JSONB;
BEGIN
    -- Get current auth info for debugging
    debug_info := jsonb_build_object(
      'uid', auth.uid(),
      'role', auth.role(),
      'timestamp', NOW()
    );
    
    -- Get the authenticated user's ID
    auth_id := auth.uid();
    
    IF auth_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated. Debug: %', debug_info;
    END IF;
    
    -- Ensure user_id is set in the content data
    content_data := content_data || jsonb_build_object('user_id', auth_id);
    
    -- Insert the content
    INSERT INTO public.creator_contents (
        title,
        description,
        type,
        content,
        status,
        user_id,
        metadata,
        workflow_step,
        workflow_progress,
        versions
    )
    VALUES (
        content_data->>'title',
        content_data->>'description',
        content_data->>'type',
        COALESCE(content_data->'content', '{}'::jsonb),
        COALESCE(content_data->>'status', 'draft'),
        auth_id,
        COALESCE(content_data->'metadata', '{}'::jsonb),
        content_data->>'workflow_step',
        content_data->'workflow_progress',
        COALESCE(content_data->'versions', '[]'::jsonb)
    )
    RETURNING id INTO new_id;
    
    -- Get the complete record to return
    SELECT to_jsonb(c) INTO result
    FROM public.creator_contents c
    WHERE c.id = new_id;
    
    -- Add debug info
    result := result || jsonb_build_object('_debug', debug_info);
    
    RETURN result;
END;
$$;

-- STEP 11: Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.insert_creator_content(JSONB) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.debug_auth() TO authenticated, anon, service_role;

-- STEP 12: Re-enable RLS with the new policies
ALTER TABLE public.creator_contents ENABLE ROW LEVEL SECURITY; 