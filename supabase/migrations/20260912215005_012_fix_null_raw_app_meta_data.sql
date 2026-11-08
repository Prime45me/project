/*
# Fix: Set NULL raw_app_meta_data to empty JSON in auth.users

The Supabase Auth service expects raw_app_meta_data to be a JSON object,
not NULL. When it encounters NULL, it throws "Database error querying schema"
during signInWithPassword. This happened because the demo users were created
via manual SQL inserts.
*/

UPDATE auth.users
SET raw_app_meta_data = '{}'::jsonb
WHERE raw_app_meta_data IS NULL;
