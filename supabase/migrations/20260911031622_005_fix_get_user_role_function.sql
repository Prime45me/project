/*
# Fix: Create missing get_user_role() function

The select_profiles RLS policy references get_user_role() but this function
was never created, causing "Database error querying schema" on login.
*/

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
