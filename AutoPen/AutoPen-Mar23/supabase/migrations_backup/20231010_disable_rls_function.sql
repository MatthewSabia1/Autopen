-- Create a function to disable RLS on a table
CREATE OR REPLACE FUNCTION public.disable_rls_on_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
END;
$$; 