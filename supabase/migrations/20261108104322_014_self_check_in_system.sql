/*
# Self Check-In System (QR-based)

Enables members to check themselves into attendance sessions by scanning a QR code,
and visitors to check in with a simple 3-field form.

## Changes

### 1. profiles table — new column
- `member_id` (uuid, nullable, references members(id) ON DELETE SET NULL)
  Links a user's login profile to their church member record, so the system
  knows who they are when they scan the QR code for self check-in.

### 2. New SECURITY DEFINER functions

- `get_check_in_session(p_session_id)` — Returns public session info (title, date,
  church name, branch name, current count) for the check-in page. Callable by
  anyone (anon + authenticated) since the session ID is an unguessable UUID.

- `self_check_in(p_session_id)` — For logged-in members. Looks up the caller's
  member_id from their profile, checks they haven't already checked in, inserts
  an attendance_records row with check_in_method='qr', and increments the
  session's total_attendance. Returns success or error (already checked in,
  no linked member, session not found).

- `visitor_check_in(p_session_id, p_first_name, p_last_name, p_phone)` — For
  non-members / guests. Creates a member record with membership_status='visitor',
  creates a visitor record for follow-up tracking, and inserts the attendance
  record. Validates the session exists and is within ±1 day of today to prevent
  checking into old sessions. Callable by anon + authenticated.

- `check_in_status(p_session_id)` — For logged-in users. Returns whether the
  caller has a linked member record and whether they've already checked in for
  the given session. Used by the check-in page to show the right state.

- `auto_link_member()` — For logged-in users. If the profile's member_id is
  already set, returns the linked member name. Otherwise tries to find a member
  record matching the user's auth email or profile phone, and if found, links it
  automatically. Returns {linked: true/false, name, auto}.

### 3. Security
- All functions are SECURITY DEFINER with search_path set to public.
- EXECUTE revoked from PUBLIC/anon on self_check_in, check_in_status, auto_link_member
  (these require auth.uid()). Granted to authenticated only.
- get_check_in_session and visitor_check_in granted to anon + authenticated (public check-in).
- No changes to existing RLS policies or table grants.
*/

-- ============================================================
-- 1. Add member_id to profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES members(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON profiles(member_id);

-- ============================================================
-- 2. Functions
-- ============================================================

-- Get public session info for the check-in page (no auth required)
CREATE OR REPLACE FUNCTION get_check_in_session(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session attendance_sessions%ROWTYPE;
  v_church_name text;
  v_branch_name text;
BEGIN
  SELECT * INTO v_session FROM attendance_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Session not found');
  END IF;

  SELECT name INTO v_church_name FROM churches WHERE id = v_session.church_id;
  SELECT name INTO v_branch_name FROM branches WHERE id = v_session.branch_id;

  RETURN jsonb_build_object(
    'id', v_session.id,
    'title', v_session.title,
    'session_type', v_session.session_type,
    'session_date', v_session.session_date,
    'total_attendance', v_session.total_attendance,
    'church_name', v_church_name,
    'branch_name', v_branch_name
  );
END;
$$;

-- Self check-in for logged-in members
CREATE OR REPLACE FUNCTION self_check_in(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_session attendance_sessions%ROWTYPE;
  v_existing attendance_records%ROWTYPE;
  v_member_id uuid;
  v_member_name text;
BEGIN
  -- Get caller's profile
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  -- Must have a linked member record
  IF v_profile.member_id IS NULL THEN
    RETURN jsonb_build_object('error', 'no_linked_member');
  END IF;
  v_member_id := v_profile.member_id;

  -- Session must exist
  SELECT * INTO v_session FROM attendance_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Session not found');
  END IF;

  -- Check if already checked in
  SELECT * INTO v_existing FROM attendance_records
    WHERE session_id = p_session_id AND member_id = v_member_id;
  IF FOUND THEN
    SELECT (first_name || ' ' || last_name) INTO v_member_name
      FROM members WHERE id = v_member_id;
    RETURN jsonb_build_object('error', 'already_checked_in', 'name', v_member_name, 'check_in_time', v_existing.check_in_time);
  END IF;

  -- Insert attendance record
  INSERT INTO attendance_records (session_id, member_id, status, check_in_method, check_in_time)
    VALUES (p_session_id, v_member_id, 'present', 'qr', now());

  -- Increment session total
  UPDATE attendance_sessions SET total_attendance = total_attendance + 1 WHERE id = p_session_id;

  SELECT (first_name || ' ' || last_name) INTO v_member_name
    FROM members WHERE id = v_member_id;

  RETURN jsonb_build_object('success', true, 'name', v_member_name);
END;
$$;

-- Visitor self check-in (no auth required)
CREATE OR REPLACE FUNCTION visitor_check_in(
  p_session_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session attendance_sessions%ROWTYPE;
  v_member_id uuid;
  v_session_date date;
  v_today date := CURRENT_DATE;
BEGIN
  -- Validate inputs
  IF COALESCE(TRIM(p_first_name), '') = '' OR COALESCE(TRIM(p_last_name), '') = '' THEN
    RETURN jsonb_build_object('error', 'Name is required');
  END IF;

  -- Session must exist
  SELECT * INTO v_session FROM attendance_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Session not found');
  END IF;

  -- Session must be within ±1 day of today (prevents checking into old/future sessions)
  v_session_date := v_session.session_date;
  IF v_session_date < (v_today - 1) OR v_session_date > (v_today + 1) THEN
    RETURN jsonb_build_object('error', 'This session is not available for check-in today');
  END IF;

  -- Create a member record with visitor status
  INSERT INTO members (church_id, branch_id, first_name, last_name, phone, membership_status, baptism_status)
    VALUES (v_session.church_id, v_session.branch_id, TRIM(p_first_name), TRIM(p_last_name), TRIM(p_phone), 'visitor', 'not_baptized')
    RETURNING id INTO v_member_id;

  -- Create a visitor record for follow-up
  INSERT INTO visitors (church_id, branch_id, first_name, last_name, phone, date_of_visit, service_attended, journey_status)
    VALUES (v_session.church_id, v_session.branch_id, TRIM(p_first_name), TRIM(p_last_name), TRIM(p_phone), CURRENT_DATE, v_session.title, 'first_visit');

  -- Insert attendance record
  INSERT INTO attendance_records (session_id, member_id, status, check_in_method, check_in_time)
    VALUES (p_session_id, v_member_id, 'present', 'qr', now());

  -- Increment session total
  UPDATE attendance_sessions SET total_attendance = total_attendance + 1 WHERE id = p_session_id;

  RETURN jsonb_build_object('success', true, 'name', TRIM(p_first_name) || ' ' || TRIM(p_last_name));
END;
$$;

-- Check if the current user has already checked in for a session
CREATE OR REPLACE FUNCTION check_in_status(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_existing attendance_records%ROWTYPE;
  v_member_name text;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;

  IF v_profile.member_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', true, 'has_member', false, 'name', v_profile.first_name || ' ' || v_profile.last_name);
  END IF;

  SELECT * INTO v_existing FROM attendance_records
    WHERE session_id = p_session_id AND member_id = v_profile.member_id;

  SELECT (first_name || ' ' || last_name) INTO v_member_name
    FROM members WHERE id = v_profile.member_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'has_member', true,
      'checked_in', true,
      'name', v_member_name,
      'check_in_time', v_existing.check_in_time
    );
  ELSE
    RETURN jsonb_build_object(
      'authenticated', true,
      'has_member', true,
      'checked_in', false,
      'name', v_member_name
    );
  END IF;
END;
$$;

-- Auto-link the current user's profile to a member record by email or phone
CREATE OR REPLACE FUNCTION auto_link_member()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_member members%ROWTYPE;
  v_user_email text;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  -- Already linked
  IF v_profile.member_id IS NOT NULL THEN
    SELECT * INTO v_member FROM members WHERE id = v_profile.member_id;
    RETURN jsonb_build_object('linked', true, 'auto', false, 'name', v_member.first_name || ' ' || v_member.last_name);
  END IF;

  -- Get the auth email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- Try matching by email
  IF v_user_email IS NOT NULL THEN
    SELECT * INTO v_member FROM members
      WHERE email = v_user_email AND is_archived = false
      LIMIT 1;
    IF FOUND THEN
      UPDATE profiles SET member_id = v_member.id WHERE id = auth.uid();
      RETURN jsonb_build_object('linked', true, 'auto', true, 'name', v_member.first_name || ' ' || v_member.last_name);
    END IF;
  END IF;

  -- Try matching by phone
  IF v_profile.phone IS NOT NULL THEN
    SELECT * INTO v_member FROM members
      WHERE phone = v_profile.phone AND is_archived = false
      LIMIT 1;
    IF FOUND THEN
      UPDATE profiles SET member_id = v_member.id WHERE id = auth.uid();
      RETURN jsonb_build_object('linked', true, 'auto', true, 'name', v_member.first_name || ' ' || v_member.last_name);
    END IF;
  END IF;

  RETURN jsonb_build_object('linked', false);
END;
$$;

-- ============================================================
-- 3. Revoke and grant EXECUTE
-- ============================================================
REVOKE EXECUTE ON FUNCTION get_check_in_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_check_in_session(uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION visitor_check_in(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION visitor_check_in(uuid, text, text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION self_check_in(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION self_check_in(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION check_in_status(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION check_in_status(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION auto_link_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION auto_link_member() TO authenticated;
