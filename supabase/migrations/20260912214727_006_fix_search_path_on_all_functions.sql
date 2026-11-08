/*
# Fix: Add search_path to all SECURITY DEFINER functions

The "Database error querying schema" on login is caused by mutable search_path
on SECURITY DEFINER functions. Supabase Auth calls these during the login flow
(via RLS policies on the profiles table), and without a fixed search_path the
functions fail.

This migration recreates all helper functions with SET search_path = public.
*/

-- is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin');
$$;

-- get_user_branch_id
CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid();
$$;

-- get_user_church_id
CREATE OR REPLACE FUNCTION get_user_church_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id FROM profiles WHERE id = auth.uid();
$$;

-- get_user_role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- can_manage_branch
CREATE OR REPLACE FUNCTION can_manage_branch(target_branch uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_super_admin() OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND branch_id = target_branch
      AND role IN ('church_admin', 'pastor', 'staff')
    )
  );
$$;

-- handle_new_user (trigger function)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_branch_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_church_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_branch(uuid) TO authenticated;
