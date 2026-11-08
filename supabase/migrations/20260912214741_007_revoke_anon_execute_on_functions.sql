/*
# Fix: Revoke anon execute on SECURITY DEFINER functions

These functions query profiles using auth.uid() which returns NULL for anon,
so they're safe functionally, but the advisor flags them. Revoke anon access.
*/

REVOKE EXECUTE ON FUNCTION is_super_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION get_user_branch_id() FROM anon;
REVOKE EXECUTE ON FUNCTION get_user_church_id() FROM anon;
REVOKE EXECUTE ON FUNCTION get_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION can_manage_branch(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon;
