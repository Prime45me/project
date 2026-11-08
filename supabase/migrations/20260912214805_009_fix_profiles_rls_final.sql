/*
# Fix: Resolve recursive RLS on profiles table (corrected)

The previous attempt used an inline subquery on profiles which causes
the same recursion. The correct approach is to use SECURITY DEFINER
functions which bypass RLS entirely.

get_user_role() is SECURITY DEFINER, so it runs as the function owner
and bypasses RLS on profiles. Using it in the policy does NOT cause
recursion because the function's internal query is not subject to RLS.

The original issue was likely the missing function + mutable search_path,
both of which are now fixed. This policy restores the clean version.
*/

DROP POLICY IF EXISTS "select_profiles" ON profiles;

CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid()
    OR is_super_admin()
    OR (
      branch_id = get_user_branch_id()
      AND get_user_role() IN ('church_admin', 'pastor', 'staff', 'accountant')
    )
  );
