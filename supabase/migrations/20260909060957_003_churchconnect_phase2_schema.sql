/*
# ChurchConnect - Phase 2 Schema

Creates tables for Ministries, Events, Attendance, Visitors, and Follow-ups.

## New Tables
1. **ministries** - Church ministries (Youth, Men's, Women's, Choir, etc.)
2. **ministry_members** - Join table linking members to ministries
3. **events** - Church events with registration support
4. **event_registrations** - Member registrations for events
5. **attendance_sessions** - Service/event sessions for which attendance is recorded
6. **attendance_records** - Individual attendance records per member per session
7. **visitors** - First-time and returning visitor records
8. **followups** - Follow-up tasks assigned to staff

## Security
- RLS enabled on all tables with role-based and branch-level access control
*/

-- ============================================================
-- MINISTRIES (created first, referenced by events & attendance)
-- ============================================================

CREATE TABLE IF NOT EXISTS ministries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  leader_id uuid REFERENCES members(id) ON DELETE SET NULL,
  assistant_leader_id uuid REFERENCES members(id) ON DELETE SET NULL,
  meeting_day text,
  meeting_time text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ministries_branch ON ministries(branch_id);

CREATE TABLE IF NOT EXISTS ministry_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ministry_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_min_members_ministry ON ministry_members(ministry_id);
CREATE INDEX IF NOT EXISTS idx_min_members_member ON ministry_members(member_id);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  ministry_id uuid REFERENCES ministries(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time text,
  end_time text,
  venue text,
  speaker text,
  organizer text,
  registration_required boolean DEFAULT false,
  registration_limit integer,
  registration_fee numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming' CHECK (
    status IN ('upcoming', 'ongoing', 'completed', 'cancelled')
  ),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_branch ON events(branch_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  visitor_name text,
  visitor_phone text,
  registered_at timestamptz DEFAULT now(),
  checked_in boolean DEFAULT false,
  check_in_time timestamptz,
  UNIQUE(event_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_event_reg_event ON event_registrations(event_id);

-- ============================================================
-- ATTENDANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  ministry_id uuid REFERENCES ministries(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  session_type text NOT NULL DEFAULT 'sunday_service' CHECK (
    session_type IN ('sunday_service', 'midweek_service', 'bible_study', 'prayer_meeting',
                     'youth_service', 'children_service', 'ministry_meeting', 'special_event')
  ),
  title text NOT NULL,
  session_date date NOT NULL,
  total_attendance integer DEFAULT 0,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_att_sessions_branch ON attendance_sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_att_sessions_date ON attendance_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_att_sessions_type ON attendance_sessions(session_type);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present' CHECK (
    status IN ('present', 'absent', 'excused', 'late')
  ),
  check_in_method text CHECK (check_in_method IN ('manual', 'qr', 'member_id', 'search')),
  check_in_time timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_att_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_att_records_member ON attendance_records(member_id);

-- ============================================================
-- VISITORS
-- ============================================================

CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  date_of_visit date NOT NULL DEFAULT CURRENT_DATE,
  service_attended text,
  how_heard text,
  invited_by text,
  notes text,
  journey_status text NOT NULL DEFAULT 'first_visit' CHECK (
    journey_status IN ('first_visit', 'follow_up', 'second_visit', 'new_member', 'active_member')
  ),
  converted_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visitors_branch ON visitors(branch_id);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(date_of_visit DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(journey_status);

-- ============================================================
-- FOLLOW-UPS
-- ============================================================

CREATE TABLE IF NOT EXISTS followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  person_type text NOT NULL DEFAULT 'visitor' CHECK (
    person_type IN ('visitor', 'member', 'new_member')
  ),
  person_id uuid,
  person_name text NOT NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name text,
  reason text NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'unable_to_contact')
  ),
  contact_method text CHECK (contact_method IN ('phone', 'visit', 'email', 'sms', 'whatsapp')),
  outcome text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_followups_branch ON followups(branch_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_assigned ON followups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_followups_due ON followups(due_date);

-- ============================================================
-- TRIGGERS for updated_at
-- ============================================================

DROP TRIGGER IF EXISTS trg_ministries_updated ON ministries;
CREATE TRIGGER trg_ministries_updated BEFORE UPDATE ON ministries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_events_updated ON events;
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_att_sessions_updated ON attendance_sessions;
CREATE TRIGGER trg_att_sessions_updated BEFORE UPDATE ON attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_visitors_updated ON visitors;
CREATE TRIGGER trg_visitors_updated BEFORE UPDATE ON visitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_followups_updated ON followups;
CREATE TRIGGER trg_followups_updated BEFORE UPDATE ON followups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Ministries
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_ministries" ON ministries;
CREATE POLICY "select_ministries" ON ministries FOR SELECT
  TO authenticated USING (is_super_admin() OR branch_id = get_user_branch_id());
DROP POLICY IF EXISTS "insert_ministries" ON ministries;
CREATE POLICY "insert_ministries" ON ministries FOR INSERT
  TO authenticated WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "update_ministries" ON ministries;
CREATE POLICY "update_ministries" ON ministries FOR UPDATE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id))
  WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "delete_ministries" ON ministries;
CREATE POLICY "delete_ministries" ON ministries FOR DELETE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id));

-- Ministry members
ALTER TABLE ministry_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_ministry_members" ON ministry_members;
CREATE POLICY "select_ministry_members" ON ministry_members FOR SELECT
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM ministries m WHERE m.id = ministry_id AND m.branch_id = get_user_branch_id())
  );
DROP POLICY IF EXISTS "insert_ministry_members" ON ministry_members;
CREATE POLICY "insert_ministry_members" ON ministry_members FOR INSERT
  TO authenticated WITH CHECK (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM ministries m WHERE m.id = ministry_id AND can_manage_branch(m.branch_id))
  );
DROP POLICY IF EXISTS "delete_ministry_members" ON ministry_members;
CREATE POLICY "delete_ministry_members" ON ministry_members FOR DELETE
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM ministries m WHERE m.id = ministry_id AND can_manage_branch(m.branch_id))
  );

-- Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_events" ON events;
CREATE POLICY "select_events" ON events FOR SELECT
  TO authenticated USING (is_super_admin() OR branch_id = get_user_branch_id());
DROP POLICY IF EXISTS "insert_events" ON events;
CREATE POLICY "insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "update_events" ON events;
CREATE POLICY "update_events" ON events FOR UPDATE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id))
  WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "delete_events" ON events;
CREATE POLICY "delete_events" ON events FOR DELETE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id));

-- Event registrations
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_event_reg" ON event_registrations;
CREATE POLICY "select_event_reg" ON event_registrations FOR SELECT
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.branch_id = get_user_branch_id())
  );
DROP POLICY IF EXISTS "insert_event_reg" ON event_registrations;
CREATE POLICY "insert_event_reg" ON event_registrations FOR INSERT
  TO authenticated WITH CHECK (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.branch_id = get_user_branch_id())
  );
DROP POLICY IF EXISTS "delete_event_reg" ON event_registrations;
CREATE POLICY "delete_event_reg" ON event_registrations FOR DELETE
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND can_manage_branch(e.branch_id))
  );

-- Attendance sessions
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_att_sessions" ON attendance_sessions;
CREATE POLICY "select_att_sessions" ON attendance_sessions FOR SELECT
  TO authenticated USING (is_super_admin() OR branch_id = get_user_branch_id());
DROP POLICY IF EXISTS "insert_att_sessions" ON attendance_sessions;
CREATE POLICY "insert_att_sessions" ON attendance_sessions FOR INSERT
  TO authenticated WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "update_att_sessions" ON attendance_sessions;
CREATE POLICY "update_att_sessions" ON attendance_sessions FOR UPDATE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id))
  WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "delete_att_sessions" ON attendance_sessions;
CREATE POLICY "delete_att_sessions" ON attendance_sessions FOR DELETE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id));

-- Attendance records
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_att_records" ON attendance_records;
CREATE POLICY "select_att_records" ON attendance_records FOR SELECT
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM attendance_sessions s WHERE s.id = session_id AND s.branch_id = get_user_branch_id())
  );
DROP POLICY IF EXISTS "insert_att_records" ON attendance_records;
CREATE POLICY "insert_att_records" ON attendance_records FOR INSERT
  TO authenticated WITH CHECK (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM attendance_sessions s WHERE s.id = session_id AND can_manage_branch(s.branch_id))
  );
DROP POLICY IF EXISTS "update_att_records" ON attendance_records;
CREATE POLICY "update_att_records" ON attendance_records FOR UPDATE
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM attendance_sessions s WHERE s.id = session_id AND can_manage_branch(s.branch_id))
  ) WITH CHECK (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM attendance_sessions s WHERE s.id = session_id AND can_manage_branch(s.branch_id))
  );
DROP POLICY IF EXISTS "delete_att_records" ON attendance_records;
CREATE POLICY "delete_att_records" ON attendance_records FOR DELETE
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM attendance_sessions s WHERE s.id = session_id AND can_manage_branch(s.branch_id))
  );

-- Visitors
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_visitors" ON visitors;
CREATE POLICY "select_visitors" ON visitors FOR SELECT
  TO authenticated USING (is_super_admin() OR branch_id = get_user_branch_id());
DROP POLICY IF EXISTS "insert_visitors" ON visitors;
CREATE POLICY "insert_visitors" ON visitors FOR INSERT
  TO authenticated WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "update_visitors" ON visitors;
CREATE POLICY "update_visitors" ON visitors FOR UPDATE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id))
  WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "delete_visitors" ON visitors;
CREATE POLICY "delete_visitors" ON visitors FOR DELETE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id));

-- Followups
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_followups" ON followups;
CREATE POLICY "select_followups" ON followups FOR SELECT
  TO authenticated USING (is_super_admin() OR branch_id = get_user_branch_id());
DROP POLICY IF EXISTS "insert_followups" ON followups;
CREATE POLICY "insert_followups" ON followups FOR INSERT
  TO authenticated WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "update_followups" ON followups;
CREATE POLICY "update_followups" ON followups FOR UPDATE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id))
  WITH CHECK (is_super_admin() OR can_manage_branch(branch_id));
DROP POLICY IF EXISTS "delete_followups" ON followups;
CREATE POLICY "delete_followups" ON followups FOR DELETE
  TO authenticated USING (is_super_admin() OR can_manage_branch(branch_id));
