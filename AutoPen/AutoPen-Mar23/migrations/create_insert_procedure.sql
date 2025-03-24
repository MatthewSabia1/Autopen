-- Create a stored procedure that can bypass RLS policies
CREATE OR REPLACE FUNCTION public.insert_creator_content(content_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with the privileges of the user who created it
AS $$
DECLARE
    new_id UUID;
    result JSONB;
    user_id UUID;
BEGIN
    -- Get the authenticated user's ID
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Ensure user_id is set in the content data
    content_data := content_data || jsonb_build_object('user_id', user_id);
    
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
        user_id,
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
    
    RETURN result;
END;
$$;

-- Grant execute permission on this function to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_creator_content(JSONB) TO authenticated;

-- By having this as a security definer function, it will run with the privileges
-- of the function creator (typically the database owner) rather than the caller,
-- effectively bypassing RLS policies for the specific operation of inserting content. 