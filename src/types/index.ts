export type UserRole =
  | 'super_admin'
  | 'pastor'
  | 'church_admin'
  | 'accountant'
  | 'ministry_leader'
  | 'staff'
  | 'volunteer'
  | 'member';

export type MembershipStatus =
  | 'visitor'
  | 'new_member'
  | 'active'
  | 'inactive'
  | 'transferred'
  | 'deceased';

export type BaptismStatus = 'not_baptized' | 'baptized' | 'scheduled';

export type Gender = 'male' | 'female';

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated';

export interface Church {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  primary_color: string | null;
  founded_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  church_id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  church_id: string | null;
  branch_id: string | null;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  member_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  church_id: string;
  branch_id: string;
  member_code: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: Gender | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_contact_phone: string | null;
  occupation: string | null;
  marital_status: MaritalStatus | null;
  wedding_anniversary: string | null;
  date_joined: string;
  membership_status: MembershipStatus;
  baptism_status: BaptismStatus;
  baptism_date: string | null;
  salvation_date: string | null;
  hall_zone: string | null;
  profile_photo_url: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  branch?: Branch;
}

export interface Family {
  id: string;
  church_id: string;
  branch_id: string;
  family_name: string;
  head_member_id: string | null;
  address: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  head_member?: Member;
  family_members?: FamilyMember[];
}

export interface FamilyMember {
  id: string;
  family_id: string;
  member_id: string;
  relationship: string | null;
  is_head: boolean;
  created_at: string;
  member?: Member;
  family?: Family;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  record_id: string | null;
  record_type: string | null;
  description: string | null;
  previous_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrator',
  pastor: 'Pastor',
  church_admin: 'Church Administrator',
  accountant: 'Accountant',
  ministry_leader: 'Ministry Leader',
  staff: 'Staff',
  volunteer: 'Volunteer',
  member: 'Member',
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  visitor: 'Visitor',
  new_member: 'New Member',
  active: 'Active Member',
  inactive: 'Inactive Member',
  transferred: 'Transferred',
  deceased: 'Deceased',
};

export const BAPTISM_STATUS_LABELS: Record<BaptismStatus, string> = {
  not_baptized: 'Not Baptized',
  baptized: 'Baptized',
  scheduled: 'Scheduled',
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  single: 'Single',
  married: 'Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
  separated: 'Separated',
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
};

// ============================================================
// Phase 2 Types
// ============================================================

export type SessionType =
  | 'sunday_service' | 'midweek_service' | 'bible_study' | 'prayer_meeting'
  | 'youth_service' | 'children_service' | 'ministry_meeting' | 'special_event';

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export type VisitorJourneyStatus = 'first_visit' | 'follow_up' | 'second_visit' | 'new_member' | 'active_member';

export type FollowupStatus = 'pending' | 'in_progress' | 'completed' | 'unable_to_contact';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  sunday_service: 'Sunday Service',
  midweek_service: 'Midweek Service',
  bible_study: 'Bible Study',
  prayer_meeting: 'Prayer Meeting',
  youth_service: 'Youth Service',
  children_service: "Children's Service",
  ministry_meeting: 'Ministry Meeting',
  special_event: 'Special Event',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  excused: 'Excused',
  late: 'Late',
};

export const VISITOR_JOURNEY_LABELS: Record<VisitorJourneyStatus, string> = {
  first_visit: 'First Visit',
  follow_up: 'Follow-up',
  second_visit: 'Second Visit',
  new_member: 'New Member',
  active_member: 'Active Member',
};

export const FOLLOWUP_STATUS_LABELS: Record<FollowupStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  unable_to_contact: 'Unable to Contact',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export interface Ministry {
  id: string;
  church_id: string;
  branch_id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  assistant_leader_id: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  leader?: Member;
  assistant_leader?: Member;
  ministry_members?: MinistryMember[];
}

export interface MinistryMember {
  id: string;
  ministry_id: string;
  member_id: string;
  role: string;
  joined_date: string;
  created_at: string;
  member?: Member;
}

export interface ChurchEvent {
  id: string;
  church_id: string;
  branch_id: string;
  ministry_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  speaker: string | null;
  organizer: string | null;
  registration_required: boolean;
  registration_limit: number | null;
  registration_fee: number;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  ministry?: Ministry;
  registrations?: EventRegistration[];
}

export interface EventRegistration {
  id: string;
  event_id: string;
  member_id: string | null;
  visitor_name: string | null;
  visitor_phone: string | null;
  registered_at: string;
  checked_in: boolean;
  check_in_time: string | null;
  member?: Member;
}

export interface AttendanceSession {
  id: string;
  church_id: string;
  branch_id: string;
  ministry_id: string | null;
  event_id: string | null;
  session_type: SessionType;
  title: string;
  session_date: string;
  total_attendance: number;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  member_id: string;
  status: AttendanceStatus;
  check_in_method: string | null;
  check_in_time: string | null;
  created_at: string;
  member?: Member;
}

export interface Visitor {
  id: string;
  church_id: string;
  branch_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  date_of_visit: string;
  service_attended: string | null;
  how_heard: string | null;
  invited_by: string | null;
  notes: string | null;
  journey_status: VisitorJourneyStatus;
  converted_member_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Followup {
  id: string;
  church_id: string;
  branch_id: string;
  person_type: 'visitor' | 'member' | 'new_member';
  person_id: string | null;
  person_name: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  reason: string;
  due_date: string | null;
  status: FollowupStatus;
  contact_method: string | null;
  outcome: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
