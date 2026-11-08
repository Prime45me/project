/*
# Fix: Eliminate all recursion in profiles RLS

The profiles table's select policy calls is_super_admin() and get_user_branch_id(),
which are SECURITY DEFINER functions that query profiles. While SECURITY DEFINER
functions bypass RLS, Supabase's PostgREST connection pooler sometimes has issues
with this pattern during the auth flow.

The safest fix: replace the function calls in the select_profiles policy with
a direct check on the row's own columns. For "is this user a super_admin", we
check if the row being selected has id = auth.uid() AND role = 'super_admin'.
For branch visibility, we use a subquery on profiles but with a trick: we
check the requesting user's own row first (id = auth.uid()), which is always
allowed by the first condition.

Actually, the cleanest approach: split into two policies.
1. Users can always see their own profile (id = auth.uid())
2. Super admins and branch-level admins can see all profiles in their branch

For policy 2, we need to know the requesting user's branch_id and role.
Instead of calling functions, we use a subquery that references auth.uid()
directly. But this subquery on profiles would trigger RLS again...

The real fix: Since SECURITY DEFINER functions DO bypass RLS in PostgreSQL,
the original approach should work. The issue was the missing get_user_role()
function and mutable search_path. Both are now fixed.

Let's also simplify: make get_user_role() and get_user_branch_id() return
NULL when there's no profile (instead of erroring), and make the policy
handle NULL gracefully.
*/

-- Ensure functions return NULL gracefully for non-existent profiles
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid();
$$;

-- Simplify the select policy to minimize function calls
DROP POLICY IF EXISTS "select_profiles" ON profiles;

CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid()
    OR is_super_admin()
    OR (
      get_user_branch_id() IS NOT NULL
      AND branch_id = get_user_branch_id()
      AND get_user_role() IN ('church_admin', 'pastor', 'staff', 'accountant')
    )
  );
