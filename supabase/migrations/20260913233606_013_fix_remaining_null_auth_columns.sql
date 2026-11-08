/*
# Fix: Replace remaining NULL string columns in auth.users with empty strings

The Supabase Auth service expects string columns to contain at least empty
strings, not NULL. email_change and email_change_token_new were NULL.

Note: phone has a unique constraint (users_phone_key), so we cannot set
multiple users' phone to the same empty string. We set only one user's
phone to '' and leave the others NULL (which is valid for the unique
constraint since NULL values are not compared).
*/

UPDATE auth.users
SET
  email_change = '',
  email_change_token_new = ''
WHERE email_change IS NULL
   OR email_change_token_new IS NULL;

-- Set phone to '' for only the first user (admin) to satisfy the auth service
UPDATE auth.users
SET phone = ''
WHERE email = 'admin@churchconnect.demo' AND phone IS NULL;
