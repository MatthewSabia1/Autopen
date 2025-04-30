-- Migration: Add RPC functions for Admin Dashboard user fetching and editing

-- 1. Create function to get comprehensive user data for the admin dashboard
-- Requires admin privileges to execute.
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_users()
RETURNS TABLE (
    user_id uuid,
    display_name text,
    avatar_url text,
    email text,
    is_admin boolean,
    created_at timestamptz,
    subscription_status text -- Placeholder for actual subscription status from Stripe/Billing
)
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Bypasses RLS for the internal query but checks caller privileges
-- Set search_path to prevent hijacking
SET search_path = public
AS $$
BEGIN
    -- Ensure the caller is an admin before proceeding
    IF NOT public.is_claims_admin() THEN
        RAISE EXCEPTION 'Permission denied: You must be an admin to access this data.';
    END IF;

    -- Return user data by joining profiles and auth.users
    RETURN QUERY
    SELECT
        p.user_id,
        p.display_name,
        p.avatar_url,
        u.email,
        p.is_admin,
        u.created_at,
        'N/A'::text AS subscription_status -- Placeholder - Replace with actual logic joining subscription data
    FROM
        public.profiles p
    JOIN
        auth.users u ON p.user_id = u.id;
END;
$$;

-- Grant execute permission only to authenticated users.
-- The function itself checks for admin privileges.
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_users() TO authenticated;


-- 2. Create function for admins to update user profiles
-- Requires admin privileges to execute.
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
    target_user_id uuid,
    new_display_name text DEFAULT NULL, -- Allow selective updates
    new_is_admin boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS to update any profile but checks caller privileges
-- Set search_path to prevent hijacking
SET search_path = public
AS $$
BEGIN
    -- Ensure the caller is an admin
    IF NOT public.is_claims_admin() THEN
        RAISE EXCEPTION 'Permission denied: You must be an admin to perform this action.';
    END IF;

    -- Prevent admins from accidentally removing their own admin status via this function
    IF target_user_id = auth.uid() AND new_is_admin = FALSE THEN
        RAISE EXCEPTION 'Admins cannot remove their own admin status using this function.';
    END IF;

    -- Update the profile, only changing fields if new values are provided
    UPDATE public.profiles
    SET
        display_name = COALESCE(new_display_name, display_name),
        is_admin = COALESCE(new_is_admin, is_admin)
    WHERE
        user_id = target_user_id;

END;
$$;

-- Grant execute permission only to authenticated users.
-- The function itself checks for admin privileges.
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, text, boolean) TO authenticated;


-- Note: It's crucial that the `is_claims_admin()` function is correctly defined
-- and secured as shown in the previous migration (20240406180000_add_admin_flag_and_rls.sql). 