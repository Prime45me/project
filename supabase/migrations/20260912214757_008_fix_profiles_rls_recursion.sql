/*
# Fix: Resolve recursive RLS on profiles table

The select_profiles policy calls get_user_role(), which queries the profiles
table, which triggers the select_profiles policy again — infinite recursion.
Postgres detects this and throws "Database error querying schema".

Fix: Replace get_user_role() in the policy with an inline subquery that reads
the role directly from profiles using auth.uid(). SECURITY DEFINER functions
already bypass RLS, but the policy expression itself is evaluated under RLS,
so calling a function that touches the same table causes recursion.

Solution: Rewrite the select_profiles policy to use an inline EXISTS check
instead of calling get_user_role().
*/

DROP POLICY IF EXISTS "select_profiles" ON profiles;

CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    id = auth.uid()
    OR is_super_admin()
    OR (
      branch_id = get_user_branch_id()
      AND EXISTS (
        SELECT 1 FROM profiles p2
        WHERE p2.id = auth.uid()
        AND p2.role IN ('church_admin', 'pastor', 'staff', 'accountant')
      )
    )
  );
