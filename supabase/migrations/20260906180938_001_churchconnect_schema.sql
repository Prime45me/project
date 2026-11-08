/*
# ChurchConnect - Core Schema (Phase 1)

Creates the foundational database tables for the Church Management System.

## New Tables
1. **churches** - Top-level church organizations
2. **branches** - Individual church branches/campuses belonging to a church
3. **profiles** - User profiles extending auth.users with role, church, and branch assignments
4. **members** - Church member records with full personal, spiritual, and contact details
5. **families** - Household/family groupings of members
6. **family_members** - Join table linking members to families with relationships
7. **audit_logs** - Records of important system actions for accountability

## Security
- RLS enabled on all tables
- Helper functions for role/branch/church checks
- Policies enforce role-based and branch-level access control
- A trigger auto-creates a profile when a new auth user signs up
- A trigger auto-updates updated_at timestamps on row changes

## Roles (stored as text on profiles)
- super_admin, pastor, church_admin, accountant, ministry_leader, staff, volunteer, member
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  primary_color text DEFAULT '174 55% 41%',
  founded_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  address text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_branches_church_id ON branches(church_id);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id uuid REFERENCES churches(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'member',
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (
    role IN ('super_admin', 'pastor', 'church_admin', 'accountant',
             'ministry_leader', 'staff', 'volunteer', 'member')
  )
);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_church_id ON profiles(church_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  member_code text UNIQUE,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  gender text CHECK (gender IN ('male', 'female', NULL)),
  date_of_birth date,
  phone text,
  email text,
  address text,
  emergency_contact text,
  emergency_contact_phone text,
  occupation text,
  marital_status text CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated', NULL)),
  wedding_anniversary date,
  date_joined date DEFAULT CURRENT_DATE,
  membership_status text NOT NULL DEFAULT 'visitor' CHECK (
    membership_status IN ('visitor', 'new_member', 'active', 'inactive', 'transferred', 'deceased')
  ),
  baptism_status text NOT NULL DEFAULT 'not_baptized' CHECK (
    baptism_status IN ('not_baptized', 'baptized', 'scheduled')
  ),
  baptism_date date,
  salvation_date date,
  hall_zone text,
  profile_photo_url text,
  notes text,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_members_branch_id ON members(branch_id);
CREATE INDEX IF NOT EXISTS idx_members_church_id ON members(church_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(membership_status);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(first_name, last_name);

CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  family_name text NOT NULL,
  head_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  address text,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_families_branch_id ON families(branch_id);

CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  relationship text,
  is_head boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_member_id ON family_members(member_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  module text NOT NULL,
  record_id uuid,
  record_type text,
  description text,
  previous_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_church_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT church_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION can_manage_branch(target_branch uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT is_super_admin() OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND branch_id = target_branch
        AND role IN ('church_admin', 'pastor', 'staff')
    )
  );
$$;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
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

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS trg_churches_updated ON churches;
CREATE TRIGGER trg_churches_updated BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_branches_updated ON branches;
CREATE TRIGGER trg_branches_updated BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_members_updated ON members;
CREATE TRIGGER trg_members_updated BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_families_updated ON families;
CREATE TRIGGER trg_families_updated BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_churches" ON churches;
CREATE POLICY "select_churches" ON churches FOR SELECT
  TO authenticated USING (
    is_super_admin() OR id = get_user_church_id()
  );
DROP POLICY IF EXISTS "manage_churches" ON churches;
CREATE POLICY "manage_churches" ON churches FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_branches" ON branches;
CREATE POLICY "select_branches" ON branches FOR SELECT
  TO authenticated USING (
    is_super_admin() OR church_id = get_user_church_id()
  );
DROP POLICY IF EXISTS "insert_branches" ON branches;
CREATE POLICY "insert_branches" ON branches FOR INSERT
  TO authenticated WITH CHECK (
    is_super_admin() OR (
      church_id = get_user_church_id() AND get_user_role() IN ('church_admin', 'pastor')
    )
  );
DROP POLICY IF EXISTS "update_branches" ON branches;
CREATE POLICY "update_branches" ON branches FOR UPDATE
  TO authenticated USING (
    is_super_admin() OR (
      church_id = get_user_church_id() AND get_user_role() IN ('church_admin', 'pastor')
    )
  ) WITH CHECK (
    is_super_admin() OR (
      church_id = get_user_church_id() AND get_user_role() IN ('church_admin', 'pastor')
    )
  );
DROP POLICY IF EXISTS "delete_branches" ON branches;
CREATE POLICY "delete_branches" ON branches FOR DELETE
  TO authenticated USING (is_super_admin());

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    is_super_admin() OR
    id = auth.uid() OR
    (branch_id = get_user_branch_id() AND get_user_role() IN ('church_admin', 'pastor', 'staff', 'accountant'))
  );
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "update_profiles_admin" ON profiles;
CREATE POLICY "update_profiles_admin" ON profiles FOR UPDATE
  TO authenticated USING (is_super_admin())
  WITH CHECK (is_super_admin());
DROP POLICY IF EXISTS "insert_profiles" ON profiles;
CREATE POLICY "insert_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid() OR is_super_admin());

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_members" ON members;
CREATE POLICY "select_members" ON members FOR SELECT
  TO authenticated USING (
    is_super_admin() OR branch_id = get_user_branch_id()
  );
DROP POLICY IF EXISTS "insert_members" ON members;
CREATE POLICY "insert_members" ON members FOR INSERT
  TO authenticated WITH CHECK (
    is_super_admin() OR can_manage_branch(branch_id)
  );
DROP POLICY IF EXISTS "update_members" ON members;
CREATE POLICY "update_members" ON members FOR UPDATE
  TO authenticated USING (
    is_super_admin() OR can_manage_branch(branch_id)
  ) WITH CHECK (
    is_super_admin() OR can_manage_branch(branch_id)
  );
DROP POLICY IF EXISTS "delete_members" ON members;
CREATE POLICY "delete_members" ON members FOR DELETE
  TO authenticated USING (
    is_super_admin() OR can_manage_branch(branch_id)
  );

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_families" ON families;
CREATE POLICY "select_families" ON families FOR SELECT
  TO authenticated USING (
    is_super_admin() OR branch_id = get_user_branch_id()
  );
DROP POLICY IF EXISTS "insert_families" ON families;
CREATE POLICY "insert_families" ON families FOR INSERT
  TO authenticated WITH CHECK (
    is_super_admin() OR can_manage_branch(branch_id)
  );
DROP POLICY IF EXISTS "update_families" ON families;
CREATE POLICY "update_families" ON families FOR UPDATE
  TO authenticated USING (
    is_super_admin() OR can_manage_branch(branch_id)
  ) WITH CHECK (
    is_super_admin() OR can_manage_branch(branch_id)
  );
DROP POLICY IF EXISTS "delete_families" ON families;
CREATE POLICY "delete_families" ON families FOR DELETE
  TO authenticated USING (
    is_super_admin() OR can_manage_branch(branch_id)
  );

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_family_members" ON family_members;
CREATE POLICY "select_family_members" ON family_members FOR SELECT
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND f.branch_id = get_user_branch_id())
  );
DROP POLICY IF EXISTS "insert_family_members" ON family_members;
CREATE POLICY "insert_family_members" ON family_members FOR INSERT
  TO authenticated WITH CHECK (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND can_manage_branch(f.branch_id))
  );
DROP POLICY IF EXISTS "update_family_members" ON family_members;
CREATE POLICY "update_family_members" ON family_members FOR UPDATE
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND can_manage_branch(f.branch_id))
  ) WITH CHECK (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND can_manage_branch(f.branch_id))
  );
DROP POLICY IF EXISTS "delete_family_members" ON family_members;
CREATE POLICY "delete_family_members" ON family_members FOR DELETE
  TO authenticated USING (
    is_super_admin() OR
    EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND can_manage_branch(f.branch_id))
  );

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_audit_logs" ON audit_logs;
CREATE POLICY "select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (is_super_admin());
DROP POLICY IF EXISTS "insert_audit_logs" ON audit_logs;
CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);